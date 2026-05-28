// Confirm the commit mechanic: select option 0 → click `>` → see if Correct/
// Incorrect counter increments. Also probe what Cancel does (review screen?).
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const recon = { steps: [] };
function note(o) { recon.steps.push({ ts: Date.now(), ...o }); console.error(JSON.stringify(o).slice(0, 360)); }
async function snap(n) { await page.screenshot({ path: `/tmp/shv_step_${n}.png`, fullPage: false }); }

await page.goto('https://elearning.shv-fsvl.ch/', { waitUntil: 'networkidle' });
await page.locator('input#shv').fill('72627');
await page.locator('input#password').fill('3tDWqKYVDxHW');
await page.locator('label[for="typeParaglider"]').click({ force: true });
await page.locator('label[for="lngEn"]').click({ force: true });
await Promise.all([page.waitForLoadState('networkidle').catch(() => {}), page.locator('button[type="submit"]').click()]);
await page.waitForTimeout(2000);
await page.locator('button:has-text("Start")').first().click();
await page.waitForTimeout(2500);

// Read counter values
async function counters() {
  return await page.evaluate(() => {
    const text = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const all = text(document.body.innerText);
    const m = all.match(/Question no\.\s*(\d+).*?Correct\s+(\d+)x.*?Incorrect\s+(\d+)x/);
    return m ? { question_id: +m[1], correct: +m[2], incorrect: +m[3] } : null;
  });
}

// Read the current position + topic
async function position() {
  return await page.evaluate(() => {
    const text = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const all = text(document.body.innerText);
    // Look for "Topic NUMBER From TOTAL"
    const m = all.match(/(Aerodynamics|Meteorology|Materials|Air Law|Flight Practice|Aerodynamik|Meteo|Material|Luftrecht|Flugpraxis)\s*(\d+)\s+From\s+(\d+)/);
    return m ? { topic: m[1], idx: +m[2], total: +m[3] } : null;
  });
}

// Helper to click option N (0..3) by re-querying each time
async function clickOption(n) {
  await page.evaluate((i) => {
    const buttons = [...document.querySelectorAll('button')].filter(b => {
      const t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      return t && !['<', '>', '>>', 'Cancel', 'Reload', 'Start...', 'Log out'].includes(t);
    });
    if (buttons[i]) buttons[i].click();
  }, n);
}

note({ before_any_click: { counter: await counters(), pos: await position() } });

// Select option 0, then click `>` to commit
await clickOption(0);
await page.waitForTimeout(800);
await page.locator('button:has-text(">"):not(:has-text(">>"))').first().click();
await page.waitForTimeout(1500);
await snap('after-commit-option-0');
note({ after_commit_0: { counter: await counters(), pos: await position() } });

// Try option 1 on the new question and commit
await clickOption(1);
await page.waitForTimeout(800);
await page.locator('button:has-text(">"):not(:has-text(">>"))').first().click();
await page.waitForTimeout(1500);
note({ after_commit_1: { counter: await counters(), pos: await position() } });

// Try option 2 + commit
await clickOption(2);
await page.waitForTimeout(800);
await page.locator('button:has-text(">"):not(:has-text(">>"))').first().click();
await page.waitForTimeout(1500);
note({ after_commit_2: { counter: await counters(), pos: await position() } });

// Try option 3 + commit
await clickOption(3);
await page.waitForTimeout(800);
await page.locator('button:has-text(">"):not(:has-text(">>"))').first().click();
await page.waitForTimeout(1500);
note({ after_commit_3: { counter: await counters(), pos: await position() } });

// Navigate back with `<` — does it un-commit? Does the previous question show its answer?
await page.locator('button:has-text("<")').first().click();
await page.waitForTimeout(1500);
await snap('after-back');
note({ after_back: { counter: await counters(), pos: await position() } });
// What does the page look like after going back? Are options now coloured (red/green)?
const optionStateAfterBack = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')].filter(b => {
    const t = (b.textContent || '').replace(/\s+/g, ' ').trim();
    return t && !['<', '>', '>>', 'Cancel', 'Reload', 'Start...', 'Log out'].includes(t);
  });
  return buttons.map(b => ({ text: (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60), cls: b.className }));
});
note({ option_state_after_back: optionStateAfterBack });

// Try Cancel — maybe shows a summary?
await page.locator('button:has-text("Cancel")').first().click().catch(() => {});
await page.waitForTimeout(2000);
await snap('after-cancel');
note({ after_cancel: { url: page.url(), counter: await counters(), pos: await position() } });

await browser.close();
writeFileSync('/tmp/shv_recon.json', JSON.stringify(recon, null, 2));
