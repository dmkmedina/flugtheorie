// SHV elearning scraper — iterates the 5 paraglider subjects on the
// dashboard, scoping each quiz to a single subject by toggling the
// dashboard checkboxes before clicking Start. For each question:
// select option 0, click `>` to commit, click `<` to read the
// btn-success / btn-danger colours, record the correct option, then `>`
// again to advance. Bails on a topic after 30 consecutive duplicate
// qids.
//
// Output: data/shv_questions.json (merged across runs).
// Authorized for personal study use only.
//
// Usage:
//   node scripts/shv_scrape.mjs                       # all 5 subjects
//   node scripts/shv_scrape.mjs --subject Weather     # one subject
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const SUBJECTS = [
  { id: 'S1', label: 'Aerodynamics' },
  { id: 'S2', label: 'Weather' },
  { id: 'S3', label: 'Legislation' },
  { id: 'S4', label: 'Materials' },
  { id: 'S5', label: 'Practical Flying' },
];

const args = process.argv.slice(2);
const ONLY_SUBJECT = args.includes('--subject') ? args[args.indexOf('--subject') + 1] : null;
const OUT = '/home/user/flugtheorie/data/shv_questions.json';

let dataset = existsSync(OUT)
  ? JSON.parse(readFileSync(OUT, 'utf8'))
  : { fetchedAt: null, questions: {}, topics: {} };
// qid is not globally unique across topics — namespace by topic
const seenKeys = new Set();
for (const q of Object.values(dataset.questions)) seenKeys.add(`${q.topic}#${q.qid}`);
console.error(`[init] resuming with ${seenKeys.size} questions already captured`);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });

// Helpers reused across scopes
async function login(page) {
  await page.goto('https://elearning.shv-fsvl.ch/', { waitUntil: 'networkidle' });
  await page.locator('input#shv').fill('72627');
  await page.locator('input#password').fill('3tDWqKYVDxHW');
  await page.locator('label[for="typeParaglider"]').click({ force: true });
  await page.locator('label[for="lngEn"]').click({ force: true });
  await Promise.all([page.waitForLoadState('networkidle').catch(() => {}), page.locator('button[type="submit"]').click()]);
  await page.waitForTimeout(2500);
}

async function selectOnlySubject(page, subjectId) {
  // Subject checkbox ids look like `subject[S1, True]`
  for (const s of SUBJECTS) {
    const cssId = `subject\\[${s.id}\\, True\\]`;
    const want = s.id === subjectId;
    const cb = page.locator(`#${cssId}`);
    if (!(await cb.count())) continue;
    const isChecked = await cb.isChecked();
    if (isChecked !== want) {
      // Click the label (Blazor sometimes ignores raw checkbox clicks)
      const label = page.locator(`label[for="subject[${s.id}, True]"]`);
      if (await label.count()) await label.click({ force: true });
      else await cb.click({ force: true });
      await page.waitForTimeout(200);
    }
  }
  await page.waitForTimeout(500);
}

async function readState(page) {
  return await page.evaluate(() => {
    const text = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const bodyText = text(document.body.innerText);
    const posMatch = bodyText.match(/([A-Z][A-Za-z ]+?)\s*(\d+)\s+From\s+(\d+)/);
    const idMatch = bodyText.match(/Question no\.\s*(\d+)/);
    const optionBtns = [...document.querySelectorAll('button')].filter(b => {
      const t = text(b.textContent);
      return t && !['<', '>', '>>', 'Cancel', 'Reload', 'Start...', 'Log out'].includes(t);
    });
    return {
      topic: posMatch ? posMatch[1].trim() : null,
      pos: posMatch ? +posMatch[2] : null,
      total: posMatch ? +posMatch[3] : null,
      qid: idMatch ? +idMatch[1] : null,
      options: optionBtns.map(b => ({
        text: text(b.textContent),
        isCorrect: b.classList.contains('btn-success'),
        isWrong: b.classList.contains('btn-danger'),
      })),
      qText: (() => {
        let t = bodyText;
        for (const b of optionBtns) t = t.replace(text(b.textContent), '');
        t = t.replace(/[A-Z][A-Za-z ]+?\s*\d+\s+From\s+\d+/, '')
             .replace(/<\s*>\s*>>/, '')
             .replace(/Question no\.\s*\d+/, '')
             .replace(/Correct \d+x.*?Incorrect \d+x/, '')
             .replace(/Cancel/g, '')
             .replace(/Log out/g, '')
             .replace(/Daniel Medina/g, '')
             .replace(/SHV E-Learning.*$/s, '')
             .replace(/\s+/g, ' ').trim();
        return t;
      })(),
    };
  });
}

async function clickOption0(page) {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].filter(b => {
      const t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      return t && !['<', '>', '>>', 'Cancel', 'Reload', 'Start...', 'Log out'].includes(t);
    })[0];
    if (b) b.click();
  });
}
async function pressForward(page) {
  await page.locator('button:has-text(">"):not(:has-text(">>"))').first().click();
  await page.waitForTimeout(700);
}
async function pressBack(page) {
  await page.locator('button:has-text("<")').first().click();
  await page.waitForTimeout(700);
}

async function scrapeOneSubject(targetSubject) {
  const page = await ctx.newPage();
  console.error(`\n=== Scraping ${targetSubject.label} (subject ${targetSubject.id}) ===`);
  await login(page);
  await selectOnlySubject(page, targetSubject.id);
  await page.locator('button:has-text("Start")').first().click();
  await page.waitForTimeout(2500);

  let consecutiveDupes = 0;
  let captured = 0;
  let lastSave = Date.now();

  for (let step = 0; step < 10000; step++) {
    let s = await readState(page);
    if (!s.qid || !s.topic) {
      await page.waitForTimeout(1000);
      continue;
    }
    if (s.topic !== targetSubject.label && step > 5) {
      console.error(`[${targetSubject.label}] topic flipped to ${s.topic} unexpectedly — stopping`);
      break;
    }
    const key = `${s.topic}#${s.qid}`;
    if (seenKeys.has(key)) {
      consecutiveDupes++;
      if (consecutiveDupes >= 35) {
        console.error(`[${targetSubject.label}] 35 dupes in a row → topic exhausted (${captured} new captured this run)`);
        break;
      }
      await pressForward(page);
      continue;
    }
    consecutiveDupes = 0;

    const alreadyAnswered = s.options.some(o => o.isCorrect || o.isWrong);
    if (!alreadyAnswered) {
      await clickOption0(page);
      await page.waitForTimeout(300);
      await pressForward(page);
      await pressBack(page);
      s = await readState(page);
    }
    const correctIdx = s.options.findIndex(o => o.isCorrect);
    if (correctIdx === -1) {
      console.error(`[${targetSubject.label}] qid=${s.qid}: no green option — skipping`);
      await pressForward(page);
      continue;
    }

    dataset.questions[`${s.topic}_${s.qid}`] = {
      qid: s.qid,
      topic: s.topic,
      pos: s.pos,
      total_in_topic: s.total,
      text: s.qText,
      options: s.options.map(o => o.text),
      correct: correctIdx,
    };
    dataset.topics[s.topic] = s.total;
    seenKeys.add(key);
    captured++;

    if (captured % 5 === 0) {
      console.error(`[${targetSubject.label}] +${captured} new · pos=${s.pos}/${s.total} · qid=${s.qid} correct=${correctIdx}`);
    }
    if (Date.now() - lastSave > 30_000) {
      dataset.fetchedAt = new Date().toISOString();
      writeFileSync(OUT, JSON.stringify(dataset, null, 2));
      lastSave = Date.now();
    }
    await pressForward(page);
  }
  // Final save
  dataset.fetchedAt = new Date().toISOString();
  writeFileSync(OUT, JSON.stringify(dataset, null, 2));
  await page.close();
}

// --- Main loop
const toScrape = ONLY_SUBJECT
  ? SUBJECTS.filter(s => s.label === ONLY_SUBJECT)
  : SUBJECTS;

for (const subj of toScrape) {
  // Skip if already fully captured (heuristic: topic total in dataset.topics matches count)
  const totalKnown = dataset.topics[subj.label];
  const alreadyCount = Object.values(dataset.questions).filter(q => q.topic === subj.label).length;
  if (totalKnown && alreadyCount >= totalKnown) {
    console.error(`[skip] ${subj.label} already complete: ${alreadyCount}/${totalKnown}`);
    continue;
  }
  await scrapeOneSubject(subj);
}

console.error('\n=== ALL DONE ===');
console.error('Topic totals:', dataset.topics);
console.error('Captured per topic:');
const perTopic = {};
for (const q of Object.values(dataset.questions)) perTopic[q.topic] = (perTopic[q.topic] || 0) + 1;
console.error(perTopic);

await browser.close();
