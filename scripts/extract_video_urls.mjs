// Renders the Free Wings SHV theory course page and captures every video
// MP4/HLS request made by the Wix player, mapping each to the nearest
// section heading on the page so we can label them by topic.
//
// Usage: node scripts/extract_video_urls.mjs
// Output: data/videos.json

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const PAGE_URL = 'https://www.freewings.ch/shv-theoriekurs';
const OUT = resolve('data/videos.json');

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
    mediaHits.push({ url: u, method: req.method() });
  }
});
page.on('response', (res) => {
  const u = res.url();
  const ct = res.headers()['content-type'] || '';
  if (ct.includes('video/') || ct.includes('application/vnd.apple.mpegurl')) {
    mediaHits.push({ url: u, contentType: ct, status: res.status() });
  }
});

console.error('Loading page…');
await page.goto(PAGE_URL, { waitUntil: 'networkidle', timeout: 60_000 });

// Scroll to trigger lazy loading
for (let i = 0; i < 12; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * 600);
  await page.waitForTimeout(800);
}

// Try clicking every play button so the player resolves the real src
const players = await page.locator('[data-testid="videoPlayer"], [data-mesh-id*="VideoPlayer"], button[aria-label*="play" i], .PlayableCover847694237__playButton').all();
console.error(`Found ${players.length} play surfaces`);
for (const p of players) {
  try {
    await p.scrollIntoViewIfNeeded({ timeout: 1500 });
    await p.click({ timeout: 2000, force: true });
    await page.waitForTimeout(1500);
  } catch (e) {
    // ignore — many of these aren't actually clickable
  }
}

// Wait a bit more for any deferred media requests
await page.waitForTimeout(4000);

// Pull DOM context: section headings + the video posters/iframes near them
const domVideos = await page.evaluate(() => {
  const out = [];
  const videoNodes = document.querySelectorAll('video, iframe[src*="video"], [data-mesh-id*="VideoPlayer"], wix-video');
  for (const n of videoNodes) {
    // Walk up to find a nearby heading
    let cur = n;
    let heading = null;
    for (let i = 0; i < 25 && cur; i++) {
      const h = cur.querySelector?.('h1, h2, h3, h4');
      if (h && h.textContent?.trim()) { heading = h.textContent.trim(); break; }
      cur = cur.parentElement;
    }
    const src = n.tagName === 'VIDEO'
      ? (n.currentSrc || n.src || (n.querySelector('source')?.src ?? null))
      : (n.getAttribute('src') || null);
    out.push({
      tag: n.tagName.toLowerCase(),
      heading,
      id: n.id || null,
      src,
      poster: n.getAttribute?.('poster') || null,
      rect: (() => { const r = n.getBoundingClientRect(); return { top: Math.round(r.top), left: Math.round(r.left) }; })(),
    });
  }
  // Also grab the visible H2/H3 list so we have all sections in order
  const sections = [...document.querySelectorAll('h1, h2, h3')]
    .map((h) => h.textContent?.trim())
    .filter(Boolean);
  return { videos: out, sections };
});

await browser.close();

// Dedupe mediaHits
const seen = new Set();
const media = mediaHits.filter((m) => (seen.has(m.url) ? false : (seen.add(m.url), true)));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({
  fetchedAt: new Date().toISOString(),
  source: PAGE_URL,
  domVideos,
  mediaRequests: media,
}, null, 2));

console.error(`Wrote ${media.length} media requests + ${domVideos.videos.length} DOM video nodes → ${OUT}`);
