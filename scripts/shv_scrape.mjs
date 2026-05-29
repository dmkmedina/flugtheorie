// SHV elearning scraper — supports both --lang En and --lang De passes.
// English outputs land in data/shv_questions.json, German in
// data/shv_questions.de.json.
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
  { id: 'S1', label_en: 'Aerodynamics',     label_de: 'Aerodynamik' },
  { id: 'S2', label_en: 'Weather',          label_de: 'Wetter' },
  { id: 'S3', label_en: 'Legislation',      label_de: 'Luftrecht' },
  { id: 'S4', label_en: 'Materials',        label_de: 'Material' },
  { id: 'S5', label_en: 'Practical Flying', label_de: 'Flugpraxis' },
];
const labelFor = (subj) => subj[`label_${LANG.toLowerCase()}`] || subj.label_en;

const args = process.argv.slice(2);
const ONLY_SUBJECT = args.includes('--subject') ? args[args.indexOf('--subject') + 1] : null;
const LANG = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : 'En';  // 'En' | 'De' | 'Fr' | 'It'
const OUT = LANG === 'En'
  ? '/home/user/flugtheorie/data/shv_questions.json'
  : `/home/user/flugtheorie/data/shv_questions.${LANG.toLowerCase()}.json`;

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
  await page.locator(`label[for="lng${LANG}"]`).click({ force: true });
  await Promise.all([page.waitForLoadState('networkidle').catch(() => {}), page.locator('button[type="submit"]').click()]);
  await page.waitForTimeout(2500);
}

async function setCheckbox(page, idAttr, want) {
  const cb = page.locator(`input[id="${idAttr}"]`);
  if (!(await cb.count())) return;
  if ((await cb.isChecked()) === want) return;
  const label = page.locator(`label[for="${idAttr}"]`);
  if (await label.count()) await label.click({ force: true });
  else await cb.click({ force: true });
  await page.waitForTimeout(250);
}

async function selectOnlySubject(page, subjectId) {
  // Wait for Blazor to wire up the dashboard checkboxes. The previous failure
  // mode: setCheckbox ran while the inputs hadn't rendered yet, so every
  // input.checked read returned null, every click was a no-op, and the quiz
  // started with the default (Aerodynamics) selected.
  await page.locator('input[id="subject[S1, True]"]').waitFor({ state: 'attached', timeout: 30_000 });
  // Also wait until at least one checkbox reports a real boolean value.
  await page.waitForFunction(() => {
    const el = document.querySelector('input[id="subject[S1, True]"]');
    return el && typeof el.checked === 'boolean';
  }, { timeout: 10_000 }).catch(() => {});

  // Subject checkbox ids contain `[`, `,`, ` `, `]` — use attribute selectors.
  for (const s of SUBJECTS) {
    await setCheckbox(page, `subject[${s.id}, True]`, s.id === subjectId);
  }
  // Ensure Show solutions is ON (required for the back-navigation green/red reveal).
  await setCheckbox(page, 'optionShowAnswer', true);
  await setCheckbox(page, 'optionRandom', true);
  // Verify
  const states = await page.evaluate((subjects) => {
    const get = (id) => document.querySelector(`input[id="${id}"]`)?.checked ?? null;
    return {
      subjects: subjects.map(s => ({ id: s.id, checked: get(`subject[${s.id}, True]`) })),
      showAnswer: get('optionShowAnswer'),
      random: get('optionRandom'),
    };
  }, SUBJECTS);
  console.error(`  config: ${JSON.stringify(states)}`);
  await page.waitForTimeout(500);
}

async function readState(page) {
  return await page.evaluate(() => {
    const text = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const bodyText = text(document.body.innerText);
    // "From" (en) | "Von" (de) | "Sur" (fr) | "Da" (it)
    const posMatch = bodyText.match(/([A-ZÄÖÜ][A-Za-zÄÖÜäöüß ]+?)\s*(\d+)\s+(?:From|Von|Sur|Da)\s+(\d+)/);
    // "Question no." (en) | "Frage Nr." (de) | "Question no" (fr) | "Domanda n." (it)
    const idMatch = bodyText.match(/(?:Question no\.|Frage Nr\.|Question no|Domanda n\.)\s*(\d+)/);
    const skipBtnLabels = new Set([
      '<', '>', '>>',
      'Cancel', 'Reload', 'Start...', 'Log out',
      'Abbrechen', 'Aktualisieren', 'Beenden', 'Abmelden',
      'Annuler', 'Recharger', 'Démarrer...', 'Déconnexion',
      'Annulla', 'Ricarica', 'Avvia...', 'Logout',
    ]);
    const optionBtns = [...document.querySelectorAll('button')].filter(b => {
      const t = text(b.textContent);
      return t && !skipBtnLabels.has(t);
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
        t = t.replace(/[A-ZÄÖÜ][A-Za-zÄÖÜäöüß ]+?\s*\d+\s+(?:From|Von|Sur|Da)\s+\d+/, '')
             .replace(/<\s*>\s*>>/, '')
             .replace(/(?:Question no\.|Frage Nr\.|Question no|Domanda n\.)\s*\d+/, '')
             .replace(/(?:Correct|Richtig|Correct|Corretto)\s*\d+x.*?(?:Incorrect|Falsch|Incorrect|Errato)\s*\d+x/, '')
             .replace(/Cancel|Abbrechen|Annuler|Annulla/g, '')
             .replace(/Log out|Abmelden|Déconnexion|Logout/g, '')
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

async function startNewSession(targetSubject) {
  // Fresh browser context = fresh login = the platform forgets which
  // questions we've already "answered" in this session, so we get a
  // new random batch of unanswered ones.
  const freshCtx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
  const page = await freshCtx.newPage();
  await login(page);
  await selectOnlySubject(page, targetSubject.id);
  await page.locator('button:has-text("Start")').first().click();
  await page.waitForTimeout(2500);
  return { ctx: freshCtx, page };
}

async function scrapeOneSubject(targetSubject) {
  console.error(`\n=== Scraping ${labelFor(targetSubject)} (subject ${targetSubject.id}) ===`);
  let { ctx: freshCtx, page } = await startNewSession(targetSubject);

  let consecutiveDupes = 0;
  let captured = 0;
  let sessionsUsed = 1;
  let lastSave = Date.now();

  for (let step = 0; step < 10000; step++) {
    let s = await readState(page);
    if (!s.qid || !s.topic) {
      await page.waitForTimeout(1000);
      continue;
    }
    if (s.topic !== labelFor(targetSubject) && step > 5) {
      console.error(`[${labelFor(targetSubject)}] topic flipped to ${s.topic} unexpectedly — stopping`);
      break;
    }
    const key = `${s.topic}#${s.qid}`;
    if (seenKeys.has(key)) {
      consecutiveDupes++;
      if (consecutiveDupes >= 35) {
        // This SHV session has shown us everything new it has. Stop
        // here if we've captured all questions for the topic, otherwise
        // open a fresh session (logout + relogin) which resets the
        // "already answered" state and serves the questions we haven't
        // seen yet.
        const haveForTopic = Object.values(dataset.questions).filter(q => q.topic === labelFor(targetSubject)).length;
        const totalForTopic = dataset.topics[labelFor(targetSubject)];
        console.error(`[${labelFor(targetSubject)}] session ${sessionsUsed} exhausted: have ${haveForTopic}/${totalForTopic} after +${captured}`);
        if (totalForTopic && haveForTopic >= totalForTopic) {
          console.error(`[${labelFor(targetSubject)}] full coverage reached`);
          break;
        }
        if (sessionsUsed >= 12) {
          console.error(`[${labelFor(targetSubject)}] 12 sessions used — giving up (${haveForTopic}/${totalForTopic})`);
          break;
        }
        await page.close().catch(() => {});
        await freshCtx.close().catch(() => {});
        ({ ctx: freshCtx, page } = await startNewSession(targetSubject));
        sessionsUsed++;
        consecutiveDupes = 0;
        captured = 0;  // reset per-session counter for clarity
        console.error(`[${labelFor(targetSubject)}] opened session ${sessionsUsed}`);
        continue;
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
      console.error(`[${labelFor(targetSubject)}] qid=${s.qid}: no green — recording unknown, attempting to advance`);
      const stuckQid = s.qid;
      dataset.questions[`${s.topic}_${s.qid}`] = {
        qid: s.qid, topic: s.topic, pos: s.pos, total_in_topic: s.total,
        text: s.qText, options: s.options.map(o => o.text), correct: null,
      };
      seenKeys.add(`${s.topic}#${s.qid}`);

      // Try a sequence of escape moves to leave this question:
      // (a) plain `>`, (b) click option then `>`, (c) `>>` skip, (d) cancel + new Start
      const escapes = [
        async () => { await pressForward(page); },
        async () => { await clickOption0(page); await page.waitForTimeout(300); await pressForward(page); },
        async () => {
          const skip = page.locator('button:has-text(">>")').first();
          if (await skip.count()) { await skip.click(); await page.waitForTimeout(800); }
        },
        async () => {
          const cancel = page.locator('button:has-text("Cancel"), button:has-text("Abbrechen"), button:has-text("Annuler"), button:has-text("Annulla")').first();
          if (await cancel.count()) { await cancel.click(); await page.waitForTimeout(2000); }
          const start = page.locator('button:has-text("Start")').first();
          if (await start.count()) { await start.click(); await page.waitForTimeout(2500); }
        },
      ];
      let escaped = false;
      for (let attempt = 0; attempt < escapes.length; attempt++) {
        await escapes[attempt]();
        const after = await readState(page);
        if (after.qid && after.qid !== stuckQid) { escaped = true; break; }
        console.error(`  escape ${attempt + 1} did not change qid (still ${after.qid})`);
      }
      if (!escaped) {
        console.error(`[${labelFor(targetSubject)}] all escapes failed past qid=${stuckQid} — bailing`);
        break;
      }
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
      console.error(`[${labelFor(targetSubject)}] +${captured} new · pos=${s.pos}/${s.total} · qid=${s.qid} correct=${correctIdx}`);
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
  await freshCtx.close();
}

// --- Main loop
const toScrape = ONLY_SUBJECT
  ? SUBJECTS.filter(s => s.label_en === ONLY_SUBJECT || s.label_de === ONLY_SUBJECT)
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
