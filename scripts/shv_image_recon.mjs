// Investigate how SHV elearning renders the question images:
// (a) <img> tags inside the question container, (b) data URLs, (c) canvas,
// (d) inline SVG. Walk to a known image-based question (e.g., Aero qid 1
// = vector-addition figure) and dump the question pane's HTML.
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
await page.waitForTimeout(3000);

// Limit to Aerodynamics only so we land on Aero questions quickly
const subjects = ['S1', 'S2', 'S3', 'S4', 'S5'];
for (const s of subjects) {
  const want = s === 'S1';
  const cb = page.locator(`input[id="subject[${s}, True]"]`);
  if (!(await cb.count())) continue;
  if ((await cb.isChecked()) !== want) {
    const label = page.locator(`label[for="subject[${s}, True]"]`);
    if (await label.count()) await label.click({ force: true });
    else await cb.click({ force: true });
    await page.waitForTimeout(150);
  }
}
await page.locator('button:has-text("Start")').first().click();
await page.waitForTimeout(2500);

// Cycle through up to ~25 questions, dumping each that contains an image
// (img tag, canvas, or inline svg with width > 100px).
const findings = [];
for (let i = 0; i < 25; i++) {
  const dom = await page.evaluate(() => {
    // Find the most likely question container — the one with both a long
    // text and the option buttons as siblings.
    const isOptionBtn = (el) => {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      return el.tagName === 'BUTTON' && t && !['<','>','>>','Cancel','Reload','Start...','Log out'].includes(t);
    };
    const optionBtns = [...document.querySelectorAll('button')].filter(isOptionBtn);
    if (!optionBtns.length) return null;
    // Walk up from first option to find a container that ALSO contains the
    // question text.
    let cur = optionBtns[0].parentElement;
    for (let k = 0; k < 6 && cur; k++) {
      const txt = (cur.textContent || '').replace(/\s+/g, ' ');
      if (txt.length > 200 && /From\s+\d+/.test(txt)) break;
      cur = cur.parentElement;
    }
    const html = cur ? cur.outerHTML : document.body.outerHTML;
    return {
      qid: (document.body.innerText.match(/Question no\.\s*(\d+)/) || [])[1],
      pos: (document.body.innerText.match(/(\d+)\s+From\s+\d+/) || [])[1],
      html_size: html.length,
      img_count: (html.match(/<img\b/gi) || []).length,
      svg_count: (html.match(/<svg\b/gi) || []).length,
      canvas_count: (html.match(/<canvas\b/gi) || []).length,
      sample_imgs: [...(cur || document.body).querySelectorAll('img')].slice(0, 4).map(im => ({
        src_start: (im.getAttribute('src') || '').slice(0, 80),
        srcset_start: (im.getAttribute('srcset') || '').slice(0, 80),
        alt: im.getAttribute('alt'),
        width: im.naturalWidth || im.width,
        height: im.naturalHeight || im.height,
      })),
      sample_svgs: [...(cur || document.body).querySelectorAll('svg')].slice(0, 2).map(sv => ({
        viewBox: sv.getAttribute('viewBox'),
        outerLen: sv.outerHTML.length,
      })),
      // If any img is found, also dump the full container HTML to file
      full_html: html.slice(0, 3000),
    };
  });
  if (dom && (dom.img_count > 0 || dom.svg_count > 1 || dom.canvas_count > 0)) {
    findings.push(dom);
    console.error(`qid=${dom.qid} pos=${dom.pos}: imgs=${dom.img_count}, svgs=${dom.svg_count}, canvas=${dom.canvas_count}`);
    if (findings.length >= 5) break;
  }
  // advance
  await page.locator('button:has-text(">"):not(:has-text(">>"))').first().click().catch(() => {});
  await page.waitForTimeout(700);
}

await browser.close();
writeFileSync('/tmp/shv_image_recon.json', JSON.stringify(findings, null, 2));
console.error(`Done. ${findings.length} image-containing questions captured. Output: /tmp/shv_image_recon.json`);
