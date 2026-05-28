// Image-only re-scrape of the SHV elearning question pool.
//
// Strategy: walk each subject in fresh sessions, decode and save any
// inline base64 <img> attached to questions we already have in
// data/shv_questions.json. We don't need to commit answers — just
// advance with `>`. Stops a subject when 2 consecutive sessions
// yield zero new images.
//
// Output:
//   assets/shv_images/<topic>_<qid>.jpg  — one decoded JPEG per image
//   data/shv_questions.json              — patched with has_image + image_path
//
// Authorized for personal study use only.

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const SUBJECTS = [
  { id: 'S1', label: 'Aerodynamics' },
  { id: 'S2', label: 'Weather' },
  { id: 'S3', label: 'Legislation' },
  { id: 'S4', label: 'Materials' },
  { id: 'S5', label: 'Practical Flying' },
];

const args = process.argv.slice(2);
const ONLY_SUBJECT = args.includes('--subject') ? args[args.indexOf('--subject') + 1] : null;

const ROOT = '/home/user/flugtheorie';
const QUESTIONS_PATH = `${ROOT}/data/shv_questions.json`;
const IMAGES_DIR = `${ROOT}/assets/shv_images`;
mkdirSync(IMAGES_DIR, { recursive: true });

const dataset = JSON.parse(readFileSync(QUESTIONS_PATH, 'utf8'));

// Slug-safe topic name for filenames
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

// Pre-scan: which qids per topic already have an image file on disk?
const haveImage = new Set();  // "<topic>#<qid>"
for (const q of Object.values(dataset.questions)) {
  const p = `${IMAGES_DIR}/${slug(q.topic)}_${q.qid}.jpg`;
  if (existsSync(p)) haveImage.add(`${q.topic}#${q.qid}`);
}
console.error(`[init] already have images for ${haveImage.size}/${Object.keys(dataset.questions).length} questions`);

const browser = await chromium.launch({ headless: true });

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
  for (const s of SUBJECTS) {
    const idAttr = `subject[${s.id}, True]`;
    const cb = page.locator(`input[id="${idAttr}"]`);
    if (!(await cb.count())) continue;
    const isChecked = await cb.isChecked();
    const want = s.id === subjectId;
    if (isChecked !== want) {
      const label = page.locator(`label[for="${idAttr}"]`);
      if (await label.count()) await label.click({ force: true });
      else await cb.click({ force: true });
      await page.waitForTimeout(200);
    }
  }
  await page.waitForTimeout(400);
}

async function readQuestionAndImage(page) {
  return await page.evaluate(() => {
    const bodyText = document.body.innerText.replace(/\s+/g, ' ').trim();
    const idM = bodyText.match(/Question no\.\s*(\d+)/);
    const posM = bodyText.match(/([A-Z][A-Za-z ]+?)\s*(\d+)\s+From\s+(\d+)/);
    // Find an <img> with base64 data url inside the visible content area
    let imgSrc = null;
    let imgSize = null;
    for (const im of document.querySelectorAll('img')) {
      const src = im.getAttribute('src') || '';
      if (src.startsWith('data:image/')) {
        imgSrc = src;
        imgSize = { w: im.naturalWidth || im.width, h: im.naturalHeight || im.height };
        break;
      }
    }
    return {
      qid: idM ? +idM[1] : null,
      topic: posM ? posM[1].trim() : null,
      pos: posM ? +posM[2] : null,
      total: posM ? +posM[3] : null,
      imgSrc,
      imgSize,
    };
  });
}

async function scrapeSubject(targetSubject) {
  console.error(`\n=== ${targetSubject.label} (subject ${targetSubject.id}) ===`);
  let sessions = 0;
  let consecutiveZeroSessions = 0;

  while (sessions < 6 && consecutiveZeroSessions < 2) {
    sessions++;
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await login(page);
    await selectOnlySubject(page, targetSubject.id);
    await page.locator('button:has-text("Start")').first().click();
    await page.waitForTimeout(2500);

    let captured = 0;
    let seenInThisSession = new Set();

    for (let step = 0; step < 600; step++) {
      const s = await readQuestionAndImage(page);
      if (!s.qid || !s.topic) {
        await page.waitForTimeout(800);
        continue;
      }
      if (s.topic !== targetSubject.label) {
        console.error(`  topic flipped to ${s.topic} — bailing session`);
        break;
      }
      const key = `${s.topic}#${s.qid}`;
      if (s.imgSrc && !haveImage.has(key)) {
        // Decode + save
        const m = s.imgSrc.match(/^data:image\/(\w+);base64,(.+)$/);
        if (m) {
          const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
          const filePath = `${IMAGES_DIR}/${slug(s.topic)}_${s.qid}.${ext}`;
          writeFileSync(filePath, Buffer.from(m[2], 'base64'));
          haveImage.add(key);
          captured++;
          if (captured % 5 === 0) {
            console.error(`  +${captured} new images · ${s.topic} pos=${s.pos}/${s.total} qid=${s.qid} (${s.imgSize.w}x${s.imgSize.h})`);
          }
        }
      }
      seenInThisSession.add(key);
      // Bail if we've gone through enough of the topic without finding new
      if (seenInThisSession.size > Math.min(200, (s.total || 200) + 30)) {
        break;
      }
      // Advance — just press `>` (no commit needed since we already have answers)
      await page.locator('button:has-text(">"):not(:has-text(">>"))').first().click().catch(() => {});
      await page.waitForTimeout(450);
    }

    console.error(`  session ${sessions}: +${captured} images, ${seenInThisSession.size} qids seen`);
    if (captured === 0) consecutiveZeroSessions++;
    else consecutiveZeroSessions = 0;

    await page.close().catch(() => {});
    await ctx.close().catch(() => {});
  }
}

const toScrape = ONLY_SUBJECT
  ? SUBJECTS.filter(s => s.label === ONLY_SUBJECT)
  : SUBJECTS;

for (const subj of toScrape) await scrapeSubject(subj);

// Patch the questions manifest with image refs
let patched = 0;
for (const [key, q] of Object.entries(dataset.questions)) {
  const filePath = `${IMAGES_DIR}/${slug(q.topic)}_${q.qid}.jpg`;
  if (existsSync(filePath)) {
    q.has_image = true;
    q.image_path = `assets/shv_images/${slug(q.topic)}_${q.qid}.jpg`;
    patched++;
  } else {
    delete q.has_image;
    delete q.image_path;
  }
}
writeFileSync(QUESTIONS_PATH, JSON.stringify(dataset, null, 2));

console.error(`\n=== ALL DONE ===`);
console.error(`Total questions with images: ${patched}/${Object.keys(dataset.questions).length}`);

await browser.close();
