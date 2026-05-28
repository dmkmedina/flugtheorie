// SHV elearning scraper: walks the entire question pool by picking option 0
// on each question, advancing, going back to read which option turned green
// (correct), recording the result, then advancing again.
//
// Output: /home/user/flugtheorie/data/shv_questions.json — one entry per
// distinct question, deduped by the question_id the platform exposes.
//
// Authorized for personal study use only.
//
// Usage:
//   node scripts/shv_scrape.mjs                  # scrape full pool
//   node scripts/shv_scrape.mjs --limit 50       # stop after 50 captures
//   node scripts/shv_scrape.mjs --resume         # skip questions already in data file
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const args = process.argv.slice(2);
const LIMIT = args.includes('--limit') ? +args[args.indexOf('--limit') + 1] : Infinity;
const RESUME = args.includes('--resume');
const OUT = '/home/user/flugtheorie/data/shv_questions.json';

// Load existing data (for resume)
let dataset = { fetchedAt: null, questions: {}, topics: {} };
if (RESUME && existsSync(OUT)) {
  dataset = JSON.parse(readFileSync(OUT, 'utf8'));
  console.error(`[resume] starting with ${Object.keys(dataset.questions).length} questions already captured`);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// --- Login
await page.goto('https://elearning.shv-fsvl.ch/', { waitUntil: 'networkidle' });
await page.locator('input#shv').fill('72627');
await page.locator('input#password').fill('3tDWqKYVDxHW');
await page.locator('label[for="typeParaglider"]').click({ force: true });
await page.locator('label[for="lngEn"]').click({ force: true });
await Promise.all([page.waitForLoadState('networkidle').catch(() => {}), page.locator('button[type="submit"]').click()]);
await page.waitForTimeout(2000);
await page.locator('button:has-text("Start")').first().click();
await page.waitForTimeout(2500);
console.error('[login] logged in, quiz started');

// --- Helpers
async function readState() {
  return await page.evaluate(() => {
    const text = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const bodyText = text(document.body.innerText);

    // Topic + position: "Aerodynamics 1 From 152"
    const posMatch = bodyText.match(/([A-Z][A-Za-z ]+?)\s*(\d+)\s+From\s+(\d+)/);
    const topic = posMatch ? posMatch[1].trim() : null;
    const pos = posMatch ? +posMatch[2] : null;
    const total = posMatch ? +posMatch[3] : null;

    // Question ID: "Question no. 100"
    const idMatch = bodyText.match(/Question no\.\s*(\d+)/);
    const qid = idMatch ? +idMatch[1] : null;

    // Counter
    const cntMatch = bodyText.match(/Correct\s+(\d+)x.*?Incorrect\s+(\d+)x/);
    const counter = cntMatch ? { correct: +cntMatch[1], incorrect: +cntMatch[2] } : null;

    // Option buttons (excluding nav)
    const optionBtns = [...document.querySelectorAll('button')].filter(b => {
      const t = text(b.textContent);
      return t && !['<', '>', '>>', 'Cancel', 'Reload', 'Start...', 'Log out'].includes(t);
    });
    const options = optionBtns.map(b => ({
      text: text(b.textContent),
      isCorrect: b.classList.contains('btn-success'),
      isWrong: b.classList.contains('btn-danger'),
      isSelected: b.classList.contains('btn-info'),
    }));

    // Question text: the longest leaf-ish element that isn't a button or the position line
    const candidates = [...document.querySelectorAll('p, div, span')]
      .map(el => ({ t: text(el.textContent), c: el.children.length, tag: el.tagName }))
      .filter(x => x.t.length > 30 && x.c < 3 && !/From\s+\d+/.test(x.t) && !/Question no\./.test(x.t))
      .sort((a, b) => b.t.length - a.t.length);

    // Question text usually = body minus options minus nav lines
    // Strip option texts from body to isolate
    let qText = bodyText;
    for (const o of options) qText = qText.replace(o.text, '');
    qText = qText.replace(/[A-Z][A-Za-z ]+?\s*\d+\s+From\s+\d+/, '')
                  .replace(/<\s*>\s*>>/, '')
                  .replace(/Question no\.\s*\d+/, '')
                  .replace(/Correct \d+x.*?Incorrect \d+x/, '')
                  .replace(/Cancel/, '')
                  .replace(/SHV E-Learning.*$/s, '')
                  .replace(/Daniel Medina/g, '')
                  .replace(/Log out/g, '')
                  .replace(/\s+/g, ' ')
                  .trim();

    return { topic, pos, total, qid, counter, options, questionText: qText };
  });
}

async function clickOption(idx) {
  await page.evaluate((i) => {
    const buttons = [...document.querySelectorAll('button')].filter(b => {
      const t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      return t && !['<', '>', '>>', 'Cancel', 'Reload', 'Start...', 'Log out'].includes(t);
    });
    if (buttons[i]) buttons[i].click();
  }, idx);
}

async function pressForward() {
  await page.locator('button:has-text(">"):not(:has-text(">>"))').first().click();
  await page.waitForTimeout(900);
}

async function pressBack() {
  await page.locator('button:has-text("<")').first().click();
  await page.waitForTimeout(900);
}

// --- Scrape loop
let lastSaveAt = Date.now();
let consecutiveDupes = 0;
const seenQids = new Set(Object.keys(dataset.questions).map(Number));

console.error(`[scrape] starting loop · target ≤ ${LIMIT === Infinity ? 'all' : LIMIT}`);

for (let step = 0; step < 5000; step++) {
  let s = await readState();
  if (!s.qid) {
    console.error(`[step ${step}] no qid yet, sleeping`);
    await page.waitForTimeout(1000);
    continue;
  }

  if (seenQids.has(s.qid)) {
    consecutiveDupes++;
    if (consecutiveDupes >= 30) {
      console.error(`[done] ${consecutiveDupes} consecutive duplicate qids → assumed pool exhausted`);
      break;
    }
    await pressForward();
    continue;
  }
  consecutiveDupes = 0;

  // Make sure no option is pre-selected; if so we may be on an answered question
  const alreadyAnswered = s.options.some(o => o.isCorrect || o.isWrong);
  if (!alreadyAnswered) {
    // Pick option 0, commit (forward), then back to read the result
    await clickOption(0);
    await page.waitForTimeout(400);
    await pressForward();
    await pressBack();
    s = await readState();
  }

  // Identify correct option
  const correctIdx = s.options.findIndex(o => o.isCorrect);
  if (correctIdx === -1) {
    console.error(`[step ${step}] qid=${s.qid}: no green option after probe — skipping`);
    await pressForward();
    continue;
  }

  dataset.questions[s.qid] = {
    qid: s.qid,
    topic: s.topic,
    pos: s.pos,
    total_in_topic: s.total,
    text: s.questionText,
    options: s.options.map(o => o.text),
    correct: correctIdx,
  };
  dataset.topics[s.topic] = s.total;
  seenQids.add(s.qid);

  if (Object.keys(dataset.questions).length % 5 === 0) {
    console.error(`[scrape] captured ${Object.keys(dataset.questions).length} questions · topic=${s.topic} ${s.pos}/${s.total} · qid=${s.qid} correct=${correctIdx}`);
  }
  if (Object.keys(dataset.questions).length >= LIMIT) {
    console.error('[scrape] LIMIT reached');
    break;
  }

  // Persist every 30s
  if (Date.now() - lastSaveAt > 30_000) {
    dataset.fetchedAt = new Date().toISOString();
    writeFileSync(OUT, JSON.stringify(dataset, null, 2));
    lastSaveAt = Date.now();
  }

  // Advance to next question
  await pressForward();
}

dataset.fetchedAt = new Date().toISOString();
writeFileSync(OUT, JSON.stringify(dataset, null, 2));
console.error(`[done] saved ${Object.keys(dataset.questions).length} questions across ${Object.keys(dataset.topics).length} topics to ${OUT}`);
console.error('topics:', dataset.topics);

await browser.close();
