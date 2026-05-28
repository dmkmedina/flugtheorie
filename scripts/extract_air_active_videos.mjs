// Renders the Air Active "airACTIVE Academy" page (Wix password-protected),
// authenticates with the shared academy password, then walks the two Wix
// pro-galleries on the page ("Flugpraxis Videos" and "Vorträge") and clicks
// each video item so the player resolves the MP4 src. Maps every captured
// media request to its gallery item title.
//
// Usage: node scripts/extract_air_active_videos.mjs
// Output: data/air_active_videos.json

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const PAGE_URL = 'https://www.air-active.ch/academy';
const PASSWORD = 'airAcademy2024';
const OUT = resolve('data/air_active_videos.json');

const mediaHits = [];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  viewport: { width: 1280, height: 900 },
  ignoreHTTPSErrors: true,
});
const page = await ctx.newPage();

page.on('request', (req) => {
  const u = req.url();
  if (/\.(mp4|m3u8)(\?|$)/i.test(u) || /video\.wixstatic\.com\/.*\/(mp4|video)\//i.test(u)) {
    mediaHits.push({ url: u, method: req.method(), tsMs: Date.now() });
  }
});
page.on('response', (res) => {
  const u = res.url();
  const ct = res.headers()['content-type'] || '';
  if (ct.includes('video/') || ct.includes('application/vnd.apple.mpegurl')) {
    mediaHits.push({ url: u, contentType: ct, status: res.status(), tsMs: Date.now() });
  }
});

console.error('Loading page…');
await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
await page.waitForTimeout(2500);

// Wix password protection
async function tryPasswordLogin() {
  const pwInput = page.locator('input[type="password"]').first();
  if (await pwInput.count()) {
    await pwInput.fill(PASSWORD);
    await pwInput.press('Enter');
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    return true;
  }
  return false;
}
const loggedIn = await tryPasswordLogin();
console.error(`Password login: ${loggedIn}`);
await page.waitForTimeout(3000);

// Scroll to trigger lazy loading of galleries
for (let i = 0; i < 30; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * 500);
  await page.waitForTimeout(500);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1000);

// Enumerate the two Wix pro-galleries and their items in DOM order.
// Each gallery has data-id'd items with a title in `.info-element-title span`.
const galleryItems = await page.evaluate(() => {
  const galleries = [...document.querySelectorAll('[id^="pro-gallery-comp-"]')];
  const all = [];
  for (const g of galleries) {
    const galleryId = g.id.replace('pro-gallery-comp-', '');
    // Find nearest section heading for context
    let cur = g;
    let section = null;
    for (let i = 0; i < 30 && cur; i++) {
      const h = cur.querySelector?.('h1, h2, h3');
      if (h && h.textContent?.trim()) { section = h.textContent.trim(); break; }
      cur = cur.parentElement;
    }
    const items = [...g.querySelectorAll('[data-hook="item-container"]')];
    items.forEach((item, idx) => {
      const titleNode = item.querySelector('[data-hook="item-title"] span');
      const title = titleNode?.textContent?.trim() || null;
      const dataId = item.getAttribute('data-id') || item.getAttribute('data-hash');
      const poster = item.querySelector('img')?.getAttribute('src') || null;
      all.push({ galleryId, section, idx, title, dataId, poster });
    });
  }
  return all;
});
console.error(`Found ${galleryItems.length} gallery items:`);
for (const g of galleryItems) console.error(`  [${g.galleryId}] ${g.idx}: "${g.title}" (${g.dataId})`);

// For each gallery item, click it to open the Wix video player dialog,
// capture which MP4 loads, then close the dialog.
const itemMediaMap = []; // { item: ..., mediaUrls: [...] }

for (const item of galleryItems) {
  const before = mediaHits.length;
  const beforeUrls = new Set(mediaHits.map((m) => m.url));

  // Click the item-action button for this data-id
  const selector = `[data-id="${item.dataId}"] [data-hook="item-action"], #item-action-${item.dataId}`;
  const action = page.locator(selector).first();
  try {
    if (!(await action.count())) {
      console.error(`  (no action for ${item.title})`);
      continue;
    }
    await action.scrollIntoViewIfNeeded({ timeout: 2000 });
    await action.click({ timeout: 5000, force: true });
  } catch (e) {
    console.error(`  click failed for ${item.title}: ${e.message}`);
    continue;
  }

  // Wait for the dialog/player to load the video. The Wix pro-gallery fullscreen
  // dialog loads MP4 on play; some galleries autoplay, others require an
  // additional click on the play button inside the dialog.
  await page.waitForTimeout(2000);
  // Try to find a play button inside any newly-opened dialog and click it
  try {
    const playInDialog = page.locator(
      '[role="dialog"] video, [role="dialog"] [aria-label*="play" i], [role="dialog"] button:has-text("Play"), [data-hook="play-button"], video'
    );
    const count = await playInDialog.count();
    for (let i = 0; i < count; i++) {
      try {
        const el = playInDialog.nth(i);
        await el.scrollIntoViewIfNeeded({ timeout: 1000 });
        await el.click({ timeout: 1500, force: true });
        await page.waitForTimeout(800);
      } catch (_) {}
    }
  } catch (_) {}

  // Wait for any mp4 to be requested
  await page.waitForTimeout(4500);

  const newUrls = mediaHits
    .map((m) => m.url)
    .filter((u) => !beforeUrls.has(u));
  itemMediaMap.push({ ...item, mediaUrls: [...new Set(newUrls)] });
  console.error(`  -> "${item.title}" captured ${newUrls.length} url(s)`);

  // Close dialog (Escape) to allow next item to be clicked
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(800);
  // Some Wix dialogs use a close button
  try {
    const close = page.locator(
      '[role="dialog"] [aria-label*="close" i], [aria-label*="Close" i], [data-hook="close-button"]'
    ).first();
    if (await close.count()) await close.click({ timeout: 1500, force: true });
  } catch (_) {}
  await page.waitForTimeout(800);
}

// Final fallback: do another full scroll-and-click pass on any generic
// video/play surfaces (in case pro-gallery missed something).
const generic = await page
  .locator('video, [data-testid="videoPlayer"], [data-mesh-id*="VideoPlayer"], wix-video')
  .all();
for (const p of generic) {
  try {
    await p.scrollIntoViewIfNeeded({ timeout: 1500 });
    await p.click({ timeout: 2000, force: true });
    await page.waitForTimeout(1500);
  } catch (_) {}
}
await page.waitForTimeout(3000);

// Build final video list: prefer the per-item map; if a real MP4 was
// captured, pair it with the title.
const MP4_RE = /\.mp4(\?|$)/i;
const isVideoUrl = (u) => MP4_RE.test(u) || /video\.wixstatic\.com\/.*\/(mp4|video)\//i.test(u);

const videos = [];
for (const entry of itemMediaMap) {
  const mp4s = entry.mediaUrls.filter(isVideoUrl);
  // Prefer the highest-quality stream (looks like .../1080p/mp4/file.mp4)
  const chosen =
    mp4s.find((u) => /1080p/i.test(u)) ||
    mp4s.find((u) => /720p/i.test(u)) ||
    mp4s.find((u) => /480p/i.test(u)) ||
    mp4s[0] ||
    null;
  videos.push({
    tag: 'video',
    heading: entry.title,
    src: chosen,
    section: entry.section,
    galleryId: entry.galleryId,
    galleryIndex: entry.idx,
    dataId: entry.dataId,
    poster: entry.poster,
    allCapturedUrls: entry.mediaUrls,
  });
}

// Gather sections (page headings) in order
const sections = await page.evaluate(() =>
  [...document.querySelectorAll('h1, h2, h3')].map((h) => h.textContent?.trim()).filter(Boolean)
);

// Capture cookies for the transcribe step (Wix free-text-protected pages set
// a `_wixSession`/`_wixUIDX`/`SmSession` style cookie that may be required
// to fetch the MP4 from video.wixstatic.com).
const cookies = await ctx.cookies();

await browser.close();

// Dedupe mediaHits
const seen = new Set();
const media = mediaHits.filter((m) => (seen.has(m.url) ? false : (seen.add(m.url), true)));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify(
    {
      fetchedAt: new Date().toISOString(),
      source: PAGE_URL,
      auth: {
        type: 'wix-password-protected',
        password: PASSWORD,
        note:
          'video.wixstatic.com URLs are public CDN — fetching the MP4 does NOT require the cookie. The password only gates the HTML page. Cookies are included for completeness.',
        cookies,
      },
      domVideos: { videos, sections },
      mediaRequests: media,
    },
    null,
    2
  )
);

console.error(`Wrote ${media.length} media requests + ${videos.length} mapped videos → ${OUT}`);
