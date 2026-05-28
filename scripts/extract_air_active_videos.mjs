// Renders the Air Active "airACTIVE Academy" page (Wix password-protected),
// authenticates with the shared academy password, then walks both Wix
// pro-galleries on the page ("Flugpraxis Videos" and "Vorträge").
//
// Each gallery item is a Wix pro-gallery video tile whose poster lives at
// https://static.wixstatic.com/media/<f2f7a2_HEX>f003.jpg. The Wix gallery
// stores the matching MP4 at https://video.wixstatic.com/video/<f2f7a2_HEX>/
// 720p/mp4/file.mp4 — i.e. the media ID is the same. We derive each item's
// MP4 URL from the poster ID, then probe with ffprobe to confirm and extract
// duration.
//
// We also click items to trigger the player and capture any MP4 the page
// actually loads — that's our ground truth and verifies the derivation
// strategy.
//
// Usage: node scripts/extract_air_active_videos.mjs
// Output: data/air_active_videos.json

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

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

// Scroll fully so all gallery items render
for (let i = 0; i < 40; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * 400);
  await page.waitForTimeout(400);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1000);

// Enumerate the Wix pro-galleries and their items.
// Section detection: Wix lays out the academy page as a stack of <section>s,
// each with its own H1 (e.g. "Flugpraxis Videos", "Vorträge"). The gallery
// for that section comes AFTER the H1 in document order — so we look at the
// previous H1 that appears earlier in the DOM than the gallery.
const galleryItems = await page.evaluate(() => {
  const allHeadings = [...document.querySelectorAll('h1, h2')];
  const galleries = [...document.querySelectorAll('[id^="pro-gallery-comp-"]')];
  const all = [];
  for (const g of galleries) {
    const galleryId = g.id.replace('pro-gallery-comp-', '');
    // Find the last heading that comes before this gallery in document order
    let section = null;
    for (const h of allHeadings) {
      if (h.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING) {
        const t = h.textContent?.trim();
        if (t) section = t;
      } else {
        break;
      }
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
console.error(`Found ${galleryItems.length} gallery items across ${new Set(galleryItems.map((g) => g.galleryId)).size} galleries`);

// Derive Wix media ID from poster URL.
// Poster URL pattern: .../media/<prefix>_<32hex>f003.jpg/...
// MP4 URL pattern:    https://video.wixstatic.com/video/<prefix>_<32hex>/720p/mp4/file.mp4
function deriveMp4FromPoster(posterUrl) {
  if (!posterUrl) return null;
  const m = posterUrl.match(/\/media\/([a-f0-9]{6}_[a-f0-9]{32})(?:f\d{3})?\.[a-z]+/i);
  if (!m) return null;
  return `https://video.wixstatic.com/video/${m[1]}/720p/mp4/file.mp4`;
}

// Click items to verify and capture MP4 requests as ground-truth.
// Strategy: click first item to open dialog; the Wix gallery's dialog
// usually has next/prev arrows or responds to ArrowRight. We try clicking
// each item-action individually after ensuring no dialog is open.
async function closeAnyDialog() {
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(500);
  try {
    const close = page
      .locator(
        '[role="dialog"] [aria-label*="close" i], [aria-label="Close" i], [data-hook="close-button"], [data-testid*="close" i]'
      )
      .first();
    if ((await close.count()) && (await close.isVisible())) {
      await close.click({ timeout: 1500, force: true });
      await page.waitForTimeout(500);
    }
  } catch (_) {}
}

for (const item of galleryItems) {
  await closeAnyDialog();
  const before = new Set(mediaHits.map((m) => m.url));
  const selector = `#item-action-${item.dataId}`;
  try {
    const action = page.locator(selector).first();
    if (!(await action.count())) continue;
    // Use evaluate-based click as fallback — the dialog overlay can intercept
    await action.scrollIntoViewIfNeeded({ timeout: 2000 });
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.scrollIntoView({ block: 'center' });
        el.click();
      }
    }, selector);
    await page.waitForTimeout(2500);
    // Click any play button inside the now-open dialog
    try {
      const playables = await page.locator('[role="dialog"] video, [role="dialog"] [data-hook="play-button"], [role="dialog"] button[aria-label*="play" i]').all();
      for (const p of playables) {
        try { await p.click({ timeout: 1200, force: true }); await page.waitForTimeout(600); } catch (_) {}
      }
    } catch (_) {}
    await page.waitForTimeout(2500);
    const newUrls = mediaHits.map((m) => m.url).filter((u) => !before.has(u));
    if (newUrls.length) console.error(`  ${item.title}: captured ${newUrls.length}`);
  } catch (e) {
    // ignore — we'll fall back to poster derivation
  }
}
await closeAnyDialog();

// Final mediaHits set
const capturedUrls = new Set(mediaHits.map((m) => m.url));

// Probe an MP4 URL with ffprobe to confirm it exists and get duration.
function ffprobe(url) {
  const res = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration,size', '-of', 'json', url],
    { encoding: 'utf8', timeout: 30_000 }
  );
  if (res.status !== 0) return { ok: false, error: (res.stderr || '').trim() };
  try {
    const j = JSON.parse(res.stdout);
    return {
      ok: true,
      durationSec: j.format?.duration ? Number(j.format.duration) : null,
      sizeBytes: j.format?.size ? Number(j.format.size) : null,
    };
  } catch {
    return { ok: false, error: 'parse failed' };
  }
}

// Build final video records. Prefer captured URL; if absent, derive from poster.
const videos = [];
for (const item of galleryItems) {
  const derived = deriveMp4FromPoster(item.poster);
  // captured URLs whose media ID matches this item's derived ID
  const matchingCaptured = derived
    ? [...capturedUrls].filter((u) => {
        const m = derived.match(/video\/([a-f0-9_]+)\//i);
        return m && u.includes(m[1]);
      })
    : [];
  const src = matchingCaptured.find((u) => /720p/i.test(u)) || derived;
  let probe = null;
  if (src) {
    console.error(`  probing ${item.title}: ${src}`);
    probe = ffprobe(src);
  }
  videos.push({
    tag: 'video',
    heading: item.title,
    src,
    section: item.section,
    galleryId: item.galleryId,
    galleryIndex: item.idx,
    dataId: item.dataId,
    poster: item.poster,
    derivedMediaId: src ? src.match(/video\/([a-f0-9_]+)\//i)?.[1] : null,
    durationSec: probe?.ok ? probe.durationSec : null,
    sizeBytes: probe?.ok ? probe.sizeBytes : null,
    probeOk: probe?.ok ?? false,
    probeError: probe?.ok ? null : probe?.error,
    capturedDuringLoad: matchingCaptured.length > 0,
  });
}

const sections = await page.evaluate(() =>
  [...document.querySelectorAll('h1, h2, h3')].map((h) => h.textContent?.trim()).filter(Boolean)
);

const cookies = await ctx.cookies();
await browser.close();

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
          'The password gates only the HTML page. Once you have the MP4 URL, video.wixstatic.com serves it publicly without auth (CORS: *).',
        cookies,
      },
      domVideos: { videos, sections },
      mediaRequests: media,
    },
    null,
    2
  )
);

const okCount = videos.filter((v) => v.probeOk).length;
const totalDur = videos.reduce((s, v) => s + (v.durationSec || 0), 0);
console.error(
  `Wrote ${videos.length} videos (${okCount} probed OK) + ${media.length} media requests → ${OUT}`
);
console.error(`Total duration: ${(totalDur / 60).toFixed(1)} min`);
