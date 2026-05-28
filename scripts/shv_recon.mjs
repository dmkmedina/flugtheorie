// Discover how to reach the other 4 topics. The "Start..." button only enters
// Aerodynamics. Hypotheses to check: (1) Cancel from in-quiz reveals a topic
// picker, (2) the dashboard updates after we've "done" a topic, (3) there's
// a hidden nav menu, (4) clicking "Start..." from a fresh session offers a
// dropdown we didn't see.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const recon = { steps: [] };
function note(o) { recon.steps.push({ ts: Date.now(), ...o }); console.error(JSON.stringify(o).slice(0, 400)); }
async function snap(n) { await page.screenshot({ path: `/tmp/shv_step_${n}.png`, fullPage: true }); }

await page.goto('https://elearning.shv-fsvl.ch/', { waitUntil: 'networkidle' });
await page.locator('input#shv').fill('72627');
await page.locator('input#password').fill('3tDWqKYVDxHW');
await page.locator('label[for="typeParaglider"]').click({ force: true });
await page.locator('label[for="lngEn"]').click({ force: true });
await Promise.all([page.waitForLoadState('networkidle').catch(() => {}), page.locator('button[type="submit"]').click()]);
await page.waitForTimeout(3000);
await snap('dash');

// Dump EVERYTHING on the dashboard
const dashFull = await page.evaluate(() => {
  const text = (s) => (s || '').replace(/\s+/g, ' ').trim();
  return {
    bodyText: text(document.body.innerText),
    allButtons: [...document.querySelectorAll('button, a, [role="button"]')].map(b => ({
      tag: b.tagName.toLowerCase(),
      text: text(b.textContent).slice(0, 100),
      cls: (b.className || '').slice(0, 80),
      visible: b.offsetParent !== null,
    })),
    selects: [...document.querySelectorAll('select')].map(s => ({
      name: s.name, id: s.id,
      options: [...s.options].map(o => o.textContent),
    })),
    dropdowns: [...document.querySelectorAll('[class*="dropdown"], [class*="menu"], details, summary')].map(d => ({
      tag: d.tagName.toLowerCase(),
      cls: (d.className || '').slice(0, 80),
      text: text(d.textContent).slice(0, 100),
    })),
  };
});
note({ dashboard_full: dashFull });

// Try clicking the user name / header — might open a menu
const userNameEl = page.locator('text="Daniel Medina"').first();
if (await userNameEl.count()) {
  await userNameEl.click().catch(() => {});
  await page.waitForTimeout(800);
  await snap('after-username-click');
  note({ after_username_click: { body: (await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))).slice(0, 400) } });
}

// Try hovering / clicking the SHV E-Learning brand
const brand = page.locator('text="SHV E-Learning"').first();
if (await brand.count()) {
  await brand.click().catch(() => {});
  await page.waitForTimeout(800);
}

// Start the quiz, then Cancel, see what dashboard shows post-cancel
await page.locator('button:has-text("Start")').first().click();
await page.waitForTimeout(2000);
await snap('in-quiz');
await page.locator('button:has-text("Cancel")').first().click().catch(() => {});
await page.waitForTimeout(2000);
await snap('after-cancel');
const afterCancel = await page.evaluate(() => {
  const text = (s) => (s || '').replace(/\s+/g, ' ').trim();
  return {
    bodyText: text(document.body.innerText),
    buttons: [...document.querySelectorAll('button, a')].map(b => ({
      text: text(b.textContent).slice(0, 80),
      cls: (b.className || '').slice(0, 80),
    })),
  };
});
note({ after_cancel: afterCancel });

// Logout + relogin with each language to see if topic changes
const logout = page.locator('button:has-text("Log out")').first();
if (await logout.count()) {
  await logout.click().catch(() => {});
  await page.waitForTimeout(2000);
}

// Re-login but try German this time
await page.locator('input#shv').fill('72627').catch(() => {});
await page.locator('input#password').fill('3tDWqKYVDxHW').catch(() => {});
await page.locator('label[for="typeParaglider"]').click({ force: true }).catch(() => {});
await page.locator('label[for="lngDe"]').click({ force: true }).catch(() => {});
await Promise.all([page.waitForLoadState('networkidle').catch(() => {}), page.locator('button[type="submit"]').click().catch(() => {})]);
await page.waitForTimeout(3000);
await page.locator('button:has-text("Start")').first().click().catch(() => {});
await page.waitForTimeout(2500);
await snap('after-german-login');
const germanFirst = await page.evaluate(() => {
  const text = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const bodyText = text(document.body.innerText);
  const m = bodyText.match(/([A-Z][A-Za-z ]+?)\s*(\d+)\s+From\s+(\d+)/);
  return m ? { topic: m[1].trim(), pos: +m[2], total: +m[3], bodySnippet: bodyText.slice(0, 200) } : null;
});
note({ german_login_first_question: germanFirst });

await browser.close();
writeFileSync('/tmp/shv_topic_recon.json', JSON.stringify(recon, null, 2));
