// Pinpoint the dashboard's Subject checkboxes + Options toggles, so the
// scraper can iterate one subject at a time and (if available) flip on
// "Show solutions" to read answers without the back-navigation trick.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('https://elearning.shv-fsvl.ch/', { waitUntil: 'networkidle' });
await page.locator('input#shv').fill('72627');
await page.locator('input#password').fill('3tDWqKYVDxHW');
await page.locator('label[for="typeParaglider"]').click({ force: true });
await page.locator('label[for="lngEn"]').click({ force: true });
await Promise.all([page.waitForLoadState('networkidle').catch(() => {}), page.locator('button[type="submit"]').click()]);
await page.waitForTimeout(3500);
await page.screenshot({ path: '/tmp/shv_step_dashboard.png', fullPage: true });

// Dump every form-control and its label on the dashboard
const form = await page.evaluate(() => {
  const text = (s) => (s || '').replace(/\s+/g, ' ').trim();
  // Walk the body in DOM order, capturing input/label pairs and visible labels
  const out = { inputs: [], labels: [], nearbyText: [] };
  const inputs = [...document.querySelectorAll('input, select, textarea')];
  for (const el of inputs) {
    const lbl = el.id ? document.querySelector(`label[for="${el.id}"]`) : null;
    out.inputs.push({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type'),
      id: el.id,
      name: el.getAttribute('name'),
      checked: el.checked,
      value: el.value?.slice?.(0, 40),
      label: lbl ? text(lbl.textContent) : null,
      // Find the closest visible text by walking up siblings/parents
      nearText: text(el.parentElement?.textContent || '').slice(0, 80),
    });
  }
  const labels = [...document.querySelectorAll('label')];
  for (const l of labels) {
    out.labels.push({
      forId: l.getAttribute('for'),
      text: text(l.textContent),
      cls: l.className?.slice?.(0, 40),
    });
  }
  return out;
});
writeFileSync('/tmp/shv_form_dump.json', JSON.stringify(form, null, 2));
console.log('Total inputs:', form.inputs.length, '· total labels:', form.labels.length);
for (const i of form.inputs.slice(0, 60)) {
  console.log(`  ${i.type || i.tag} id="${i.id || '-'}" name="${i.name || '-'}" checked=${i.checked} label="${i.label || '-'}"`);
}

await browser.close();
