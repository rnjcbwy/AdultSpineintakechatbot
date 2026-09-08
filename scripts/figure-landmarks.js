/**
 * Reduce the traced figure to normalised anatomical landmarks.
 *
 *   node scripts/figure-landmarks.js
 *
 * measure-figure.js prints a sampled table for eyeballing; this walks EVERY row
 * and reports the transitions that actually bound a zone — where the arms leave
 * the torso, where the hands end, where the legs divide, where the ankles are.
 * Values come out normalised 0..1 so lib/bodyMap.js can be fitted to the real
 * drawing instead of to guessed proportions.
 *
 * The front silhouette closes cleanly; the back's outline has a hairline break
 * that lets the background flood inside, so it is measured with --dilate=1.
 * That thickening also seals the narrow crotch channel, so on the back the two
 * legs read as one run and are split at the midline — which the front
 * measurement confirms is where the gap actually sits.
 */
const fs = require('fs');
const { Jimp } = require('jimp');

const THRESHOLD = 170;
const CROP_TOP = 45;

function flood(ink, width, height, seeds) {
  const outside = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (outside[i] || ink[i]) return;
    outside[i] = 1; stack.push(i);
  };
  seeds(push);
  while (stack.length) {
    const i = stack.pop(), x = i % width, y = (i / width) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  return outside;
}

function dilateInk(ink, width, height, times) {
  for (let d = 0; d < times; d++) {
    const next = new Uint8Array(ink);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (ink[i]) continue;
      if ((x > 0 && ink[i - 1]) || (x < width - 1 && ink[i + 1]) ||
          (y > 0 && ink[i - width]) || (y < height - 1 && ink[i + width])) next[i] = 1;
    }
    ink = next;
  }
  return ink;
}

/**
 * Body = everything the background flood cannot reach.
 *
 * `dilate` thickens the outline first so a hairline break cannot let the
 * background pour into the figure — which is what emptied the back view. The
 * cost is that thickening also seals the narrow crotch channel, fusing the two
 * legs into one run, so the medial leg edge has to come from crotchGap().
 */
function bodyMask(img, dilate) {
  const { width, height, data } = img.bitmap;
  const raw = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < width * height; i++, p += 4) {
    raw[i] = (data[p] + data[p + 1] + data[p + 2]) / 3 < THRESHOLD ? 1 : 0;
  }
  const thick = dilateInk(raw, width, height, dilate);
  const outside = flood(thick, width, height, (push) => {
    for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
    for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }
  });

  const body = new Uint8Array(width * height);
  for (let i = 0; i < body.length; i++) body[i] = outside[i] ? 0 : 1;
  return { body, ink: thick, width, height };
}

/**
 * Locate the gap between the legs as an enclosed hole.
 *
 * In the back drawing the legs touch again near the ankles, so the crotch
 * channel is sealed top AND bottom — no flood from the border can ever enter
 * it. Measured with the raw outline it therefore survives as the tallest
 * enclosed region straddling the midline, which is exactly what is wanted:
 * its top row is the crotch and its x-range is the medial edge of each thigh.
 */
function crotchGap(img) {
  // Search ENCLOSED BACKGROUND, not body. The outline strokes count as body,
  // so every interior pocket is joined to every other one through the ink and
  // the whole figure collapses into a single component.
  const { body, ink, width, height } = bodyMask(img, 0);
  const enclosed = new Uint8Array(width * height);
  for (let i = 0; i < enclosed.length; i++) enclosed[i] = body[i] && !ink[i] ? 1 : 0;
  const mid = Math.round(width / 2);
  const seen = new Uint8Array(width * height);
  let best = null;
  for (let y0 = 0; y0 < height; y0++) for (let x0 = 0; x0 < width; x0++) {
    const i0 = y0 * width + x0;
    if (seen[i0] || !enclosed[i0]) continue;
    const stack = [i0]; seen[i0] = 1;
    let minX = x0, maxX = x0, minY = y0, maxY = y0, n = 0;
    while (stack.length) {
      const i = stack.pop(), x = i % width, y = (i / width) | 0;
      n++;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const j = ny * width + nx;
        if (!seen[j] && enclosed[j]) { seen[j] = 1; stack.push(j); }
      }
    }
    const tall = maxY - minY;
    if (process.env.DEBUG_HOLES && tall > height * 0.05) {
      console.log(`  hole: y ${minY}-${maxY} (tall ${tall}) x ${minX}-${maxX} px ${n}`);
    }
    const straddles = minX <= mid + 25 && maxX >= mid - 25;
    const narrow = maxX - minX < width * 0.2;
    if (straddles && narrow && tall > height * 0.1 && (!best || tall > best.tall)) {
      best = { top: minY, bottom: maxY, left: minX, right: maxX, tall, n };
    }
  }
  return best;
}

function runs({ body, width }, y, minRun = 5) {
  const out = []; let start = -1;
  for (let x = 0; x < width; x++) {
    const on = body[y * width + x] === 1;
    if (on && start === -1) start = x;
    if ((!on || x === width - 1) && start !== -1) {
      const end = on ? x : x - 1;
      if (end - start + 1 >= minRun) out.push([start, end]);
      start = -1;
    }
  }
  return out;
}

function analyse(name, img, dilate) {
  const gap = dilate > 0 ? crotchGap(img) : null;
  const mask = bodyMask(img, dilate);
  const { width, height } = mask;
  const mid = Math.round(width / 2);
  const rows = [];
  for (let y = 0; y < height; y++) rows.push(runs(mask, y));

  // The trunk is the run containing the midline; on every row it is the torso,
  // the head, or (below the crotch) the merged legs.
  const trunk = (y) => rows[y].find(([a, b]) => a <= mid && b >= mid) || null;
  const widthAt = (y) => { const t = trunk(y); return t ? t[1] - t[0] + 1 : 0; };

  const firstBody = rows.findIndex((r) => r.length);
  let lastBody = height - 1;
  while (lastBody > 0 && !rows[lastBody].length) lastBody--;

  // Neck: narrowest trunk row in the top quarter, below the widest head row.
  // The neck is the narrowest trunk row above the shoulders. Searching the top
  // quarter of the image overshoots into the spread arms, so the window stops
  // at 18% — below the chin, above the deltoids.
  const headZone = Math.round(height * 0.18);
  let neck = firstBody, nw = Infinity;
  for (let y = Math.round(height * 0.06); y < headZone; y++) {
    const w = widthAt(y);
    if (w && w < nw) { nw = w; neck = y; }
  }
  let headWidest = firstBody, hw = 0;
  for (let y = firstBody; y < neck; y++) if (widthAt(y) > hw) { hw = widthAt(y); headWidest = y; }

  // Armpit: first row where the arms stand clear of the torso as separate runs.
  const armpit = rows.findIndex((r, y) => y > neck && r.length >= 3);
  // Hands end: last row that still has 3+ runs.
  let handsEnd = armpit;
  for (let y = armpit; y < height; y++) if (rows[y].length >= 3) handsEnd = y;

  // Crotch: where the trunk divides into two legs. When the outline had to be
  // thickened the channel is sealed, so it comes from the hole measured on the
  // raw outline instead.
  let crotch = -1;
  for (let y = Math.round(height * 0.5); y < Math.round(height * 0.7); y++) {
    if (rows[y].length === 2 && !trunk(y)) { crotch = y; break; }
  }
  if (crotch === -1 && gap) crotch = gap.top;

  // Shoulder line: the first row below the neck where the trunk has flared to
  // twice the neck's width. Taking the WIDEST row instead lands on the axilla,
  // because by then the arms already hang clear of the body and read as part of
  // the same run.
  const neckW = widthAt(neck);
  let shoulder = neck;
  for (let y = neck; y <= armpit; y++) if (widthAt(y) > neckW * 2) { shoulder = y; break; }
  // Waist: narrowest trunk row between armpit and the halfway point to crotch.
  // Waist: narrowest trunk row between the armpit and the crotch. Skip the last
  // stretch above the crotch so the pinch of the sealed channel cannot win.
  let waist = armpit, ww = Infinity;
  for (let y = armpit; y < Math.round(armpit + (crotch - armpit) * 0.75); y++) {
    const w = widthAt(y);
    if (w && w < ww) { ww = w; waist = y; }
  }

  // Ankles: below the crotch the two legs are separate runs; the ankle is where
  // each is narrowest before the foot flares back out.
  // Ankle: narrowest total leg width before the feet flare out again.
  let ankle = lastBody, aw = Infinity;
  for (let y = Math.round(height * 0.85); y < lastBody - 8; y++) {
    const r = rows[y];
    if (!r.length) continue;
    const w = r.reduce((s, [a, b]) => s + (b - a + 1), 0);
    if (w && w < aw) { aw = w; ankle = y; }
  }

  const n = (y) => +((y - firstBody) / (lastBody - firstBody)).toFixed(4);
  const marks = { top: firstBody, headWidest, neck, shoulder, armpit, waist, handsEnd, crotch, ankle, bottom: lastBody };

  console.log(`\n===== ${name}  ${width} x ${height}  midline=${mid}  dilate=${dilate} =====`);
  console.log('landmark      y     norm    trunk x-range      trunk width');
  for (const [k, y] of Object.entries(marks)) {
    if (y < 0 || y >= height) { console.log(`${k.padEnd(12)}  (not found)`); continue; }
    const t = trunk(y);
    console.log(
      `${k.padEnd(12)} ${String(y).padStart(4)}  ${n(y).toFixed(4)}   ` +
      `${t ? `[${t[0]}-${t[1]}]`.padEnd(16) : '(split)'.padEnd(16)}  ${widthAt(y)}`
    );
  }
  if (gap) {
    console.log(`  crotch gap (measured on the raw outline): rows ${gap.top}-${gap.bottom}, ` +
      `x ${gap.left}-${gap.right} (norm ${(gap.left / width).toFixed(3)}-${(gap.right / width).toFixed(3)}), ` +
      `top at norm y ${n(gap.top).toFixed(4)}`);
  }
  console.log('  normalised x of trunk edges (0..1 across the viewBox):');
  for (const [k, y] of Object.entries(marks)) {
    const r = y >= 0 && y < height ? rows[y] : [];
    if (!r.length) continue;
    console.log(`    ${k.padEnd(12)} ${r.map(([a, b]) => `${(a / width).toFixed(3)}-${(b / width).toFixed(3)}`).join('  ')}`);
  }
  // A profile every 2% of body height; zone boxes get fitted to this rather
  // than to guessed proportions.
  const profile = [];
  for (let pct = 0; pct <= 100; pct += 2) {
    const y = Math.min(lastBody, firstBody + Math.round((pct / 100) * (lastBody - firstBody)));
    profile.push({
      t: +(pct / 100).toFixed(2),
      runs: rows[y].map(([a, b]) => [+(a / width).toFixed(4), +(b / width).toFixed(4)]),
    });
  }
  const landmarks = {};
  for (const [k, y] of Object.entries(marks)) {
    if (y < 0 || y >= height) continue;
    landmarks[k] = {
      t: n(y),
      runs: rows[y].map(([a, b]) => [+(a / width).toFixed(4), +(b / width).toFixed(4)]),
    };
  }
  return {
    width, height, mid: +(mid / width).toFixed(4),
    top: firstBody, bottom: lastBody, landmarks, profile,
    crotchGap: gap && {
      t: n(gap.top),
      x: [+(gap.left / width).toFixed(4), +(gap.right / width).toFixed(4)],
    },
  };
}

(async () => {
  const img = await Jimp.read('public/figures/pain-map.png');
  img.crop({ x: 0, y: CROP_TOP, w: img.bitmap.width, h: img.bitmap.height - CROP_TOP });
  const w = img.bitmap.width;
  const front = img.clone().crop({ x: 0, y: 0, w: Math.floor(w / 2), h: img.bitmap.height });
  const back = img.clone().crop({ x: Math.floor(w / 2), y: 0, w: Math.ceil(w / 2), h: img.bitmap.height });
  front.autocrop(); back.autocrop();
  const out = {
    note: 'Normalised 0..1. y is a fraction of the body span (crown to sole); x is a fraction of the traced half width.',
    front: analyse('FRONT', front, 0),
    back: analyse('BACK', back, 1),
  };
  fs.writeFileSync('public/figures/landmarks.json', JSON.stringify(out, null, 2));
  console.log('\nWrote public/figures/landmarks.json');
})().catch((e) => { console.error(e); process.exit(1); });
