// Verify Materials really is pure-text. Walks the Materials-only quiz and
// dumps any candidate image element: <img> (data: or URL), inline <svg>,
// <canvas>, and elements with CSS background-image.
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('https://elearning.shv-fsvl.ch/', { waitUntil: 'networkidle' });
await page.locator('input#shv').fill('72627');
await page.locator('input#password').fill('3tDWqKYVDxHW');
await page.locator('label[for="typeParaglider"]').click({ force: true });
await page.locator('label[for="lngEn"]').click({ force: true });
await Promise.all([page.waitForLoadState('networkidle').catch(() => {}), page.locator('button[type="submit"]').click()]);
await page.waitForTimeout(2500);

// Materials only
for (const s of ['S1', 'S2', 'S3', 'S4', 'S5']) {
  const idAttr = `subject[${s}, True]`;
  const cb = page.locator(`input[id="${idAttr}"]`);
  if (!(await cb.count())) continue;
  const want = s === 'S4';
  if ((await cb.isChecked()) !== want) {
    const label = page.locator(`label[for="${idAttr}"]`);
    if (await label.count()) await label.click({ force: true });
    else await cb.click({ force: true });
    await page.waitForTimeout(150);
  }
}
await page.locator('button:has-text("Start")').first().click();
await page.waitForTimeout(2500);

let totalChecked = 0;
let anyVisual = 0;
const samples = [];
for (let i = 0; i < 60; i++) {
  const r = await page.evaluate(() => {
    const bodyText = document.body.innerText.replace(/\s+/g, ' ').trim();
    const idM = bodyText.match(/Question no\.\s*(\d+)/);
    const posM = bodyText.match(/([A-Z][A-Za-z ]+?)\s*(\d+)\s+From\s+(\d+)/);

    // Find the question container area (not the layout chrome)
    const optionBtns = [...document.querySelectorAll('button')].filter(b => {
      const t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      return t && !['<','>','>>','Cancel','Reload','Start...','Log out'].includes(t);
    });
    let scope = optionBtns[0]?.parentElement;
    for (let k = 0; k < 6 && scope; k++) {
      if (/From\s+\d+/.test(scope.textContent || '')) break;
      scope = scope.parentElement;
    }
    scope ||= document.body;

    const imgs = [...scope.querySelectorAll('img')].map(im => ({
      src_kind: (im.getAttribute('src') || '').startsWith('data:') ? 'data' : (im.getAttribute('src') || '').slice(0, 60),
      width: im.naturalWidth || im.width || 0,
      height: im.naturalHeight || im.height || 0,
      visible: im.offsetParent !== null,
    }));
    const svgs = [...scope.querySelectorAll('svg')].map(sv => ({
      viewBox: sv.getAttribute('viewBox'),
      width: sv.clientWidth,
      height: sv.clientHeight,
    })).filter(s => s.width > 30 || s.height > 30);
    const canvases = [...scope.querySelectorAll('canvas')].map(c => ({ w: c.width, h: c.height }));
    // CSS background-image scan on big-enough nodes
    const bgImg = [];
    for (const el of scope.querySelectorAll('div, section, span')) {
      if (el.clientWidth < 100 && el.clientHeight < 100) continue;
      const style = getComputedStyle(el);
      if (style.backgroundImage && style.backgroundImage !== 'none' && style.backgroundImage !== '' && !style.backgroundImage.includes('gradient')) {
        bgImg.push({ tag: el.tagName.toLowerCase(), bg: style.backgroundImage.slice(0, 80) });
      }
    }
    return {
      qid: idM ? +idM[1] : null,
      topic: posM ? posM[1].trim() : null,
      pos: posM ? +posM[2] : null,
      imgs, svgs, canvases, bgImg,
    };
  });
  if (!r.qid || r.topic !== 'Materials') {
    if (r.topic && r.topic !== 'Materials') {
      console.error(`step ${i}: topic flipped to ${r.topic} — stopping`);
      break;
    }
    await page.waitForTimeout(800);
    continue;
  }
  totalChecked++;
  const visualCount = r.imgs.length + r.svgs.length + r.canvases.length + r.bgImg.length;
  if (visualCount > 0) {
    anyVisual++;
    samples.push(r);
    console.error(`qid=${r.qid} pos=${r.pos}: imgs=${r.imgs.length} svgs=${r.svgs.length} canvas=${r.canvases.length} bg=${r.bgImg.length}`);
    if (r.imgs.length) console.error(`  imgs: ${JSON.stringify(r.imgs)}`);
    if (r.svgs.length) console.error(`  svgs: ${JSON.stringify(r.svgs)}`);
    if (r.bgImg.length) console.error(`  bg: ${JSON.stringify(r.bgImg.slice(0, 3))}`);
  }
  await page.locator('button:has-text(">"):not(:has-text(">>"))').first().click().catch(() => {});
  await page.waitForTimeout(450);
  if (totalChecked >= 50) break;
}

console.error(`\n=== MATERIALS RECON ===`);
console.error(`Checked ${totalChecked} Materials questions`);
console.error(`Questions with any visual element: ${anyVisual}`);
if (anyVisual === 0) console.error(`CONFIRMED: Materials is pure-text.`);
else console.error(`FOUND ${anyVisual} questions with visuals — image scraper needs updating.`);

await browser.close();
