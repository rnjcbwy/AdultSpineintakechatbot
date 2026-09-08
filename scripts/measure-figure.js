/**
 * Measure the traced figure so anatomical zones can be derived from the real
 * artwork instead of guessed.
 *
 *   node scripts/measure-figure.js public/figures/pain-map.png --crop-top=45
 *
 * The drawing is line art with a WHITE interior, so scanning a row naively
 * returns outline-stroke crossings rather than body extent. Instead the
 * background is flood-filled inward from the border; whatever the fill cannot
 * reach is body. Row-wise runs of that mask give true limb and torso bounds —
 * at chest height an arms-apart figure reads as three runs (arm, torso, arm),
 * which is exactly the boundary the medial/lateral zones need.
 */

const { Jimp } = require('jimp');

const args = process.argv.slice(2);
const src = args.find((a) => !a.startsWith('--')) || 'public/figures/pain-map.png';
const num = (f, d) => {
  const a = args.find((x) => x.startsWith(`--${f}=`));
  return a ? Number(a.split('=')[1]) : d;
};
const cropTop = num('crop-top', 45);
const threshold = num('threshold', 170);
// Outline thickening before the flood. 0 is truthful; 1 closes hairline breaks
// in a scanned outline but can also seal a narrow real gap (the crotch), so it
// is per-run rather than automatic.
const dilate = num('dilate', 0);

/** true where the pixel is part of the body (ink, or enclosed by ink). */
function bodyMask(img, dilate = 1) {
  const { width, height, data } = img.bitmap;
  let ink = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < width * height; i++, p += 4) {
    ink[i] = (data[p] + data[p + 1] + data[p + 2]) / 3 < threshold ? 1 : 0;
  }

  // Thicken the outline before flooding. Anti-aliased line art often has
  // hairline breaks; a single leak lets the background fill the whole body and
  // the mask comes back empty — which is exactly what the back view did.
  for (let d = 0; d < dilate; d++) {
    const next = new Uint8Array(ink);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (ink[i]) continue;
        if ((x > 0 && ink[i - 1]) || (x < width - 1 && ink[i + 1]) ||
            (y > 0 && ink[i - width]) || (y < height - 1 && ink[i + width])) next[i] = 1;
      }
    }
    ink = next;
  }

  const outside = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (outside[i] || ink[i]) return;
    outside[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }
  while (stack.length) {
    const i = stack.pop();
    const x = i % width, y = (i / width) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  const body = new Uint8Array(width * height);
  for (let i = 0; i < body.length; i++) body[i] = outside[i] ? 0 : 1;
  return { body, width, height };
}

function runs({ body, width }, y, minRun = 4) {
  const out = [];
  let start = -1;
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

(async () => {
  const img = await Jimp.read(src);
  img.crop({ x: 0, y: cropTop, w: img.bitmap.width, h: img.bitmap.height - cropTop });
  const w = img.bitmap.width;

  const halves = [
    { name: 'FRONT', img: img.clone().crop({ x: 0, y: 0, w: Math.floor(w / 2), h: img.bitmap.height }) },
    { name: 'BACK', img: img.clone().crop({ x: Math.floor(w / 2), y: 0, w: Math.ceil(w / 2), h: img.bitmap.height }) },
  ];

  for (const { name, img: half } of halves) {
    half.autocrop();
    const mask = bodyMask(half, dilate);
    const { width, height } = mask;
    console.log(`\n===== ${name}  ${width} x ${height}  (midline x = ${Math.round(width / 2)}) =====`);
    console.log('  y    %ht   segments (x-ranges of body)');
    for (let pct = 1; pct <= 99; pct += 3) {
      const y = Math.min(height - 1, Math.round((pct / 100) * height));
      const r = runs(mask, y);
      console.log(
        `${String(y).padStart(4)}  ${String(pct).padStart(3)}%   ${r.length}: ` +
        r.map(([a, b]) => `[${a}-${b}]`).join(' ')
      );
    }
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
