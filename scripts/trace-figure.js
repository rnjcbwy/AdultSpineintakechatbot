/**
 * Convert a raster body-map drawing into SVG paths the app can use.
 *
 *   node scripts/trace-figure.js public/figures/pain-map.png
 *
 * The source is expected to hold BOTH views side by side (front on the left,
 * back on the right), which is how these forms are normally drawn. It is split
 * down the middle, each half is traced, and the result is written as two SVGs
 * plus a JSON note of the traced dimensions so zone boxes can be fitted to the
 * real artwork rather than guessed.
 *
 * Flags:
 *   --single       the image holds ONE view; do not split
 *   --threshold=N  black/white cutoff, 0-255 (default 180). Raise it if thin
 *                  lines drop out, lower it if scanner grey turns into blobs.
 *   --crop-top=N    drop N pixels off the top before tracing. These forms carry
 *                  a printed title ("Mark your Pain Point") that would
 *                  otherwise be traced into the artwork as paths.
 *   --crop-bottom=N likewise for a footer.
 *   --autocrop     trim uniform whitespace around the drawing afterwards.
 */

const fs = require('fs');
const path = require('path');
const potrace = require('potrace');
const { Jimp } = require('jimp');

const args = process.argv.slice(2);
const src = args.find((a) => !a.startsWith('--'));
const single = args.includes('--single');
const autocrop = args.includes('--autocrop');
const num = (flag, dflt) => {
  const a = args.find((x) => x.startsWith(`--${flag}=`));
  return a ? Number(a.split('=')[1]) : dflt;
};
const threshold = num('threshold', 180);
const cropTop = num('crop-top', 0);
const cropBottom = num('crop-bottom', 0);

if (!src) {
  console.error(
    'Usage: node scripts/trace-figure.js <image> [--single] [--threshold=180] [--crop-top=N] [--crop-bottom=N] [--autocrop]'
  );
  process.exit(1);
}

const OUT_DIR = path.join(process.cwd(), 'public', 'figures');

function trace(buffer, label) {
  return new Promise((resolve, reject) => {
    const tracer = new potrace.Potrace({
      threshold,
      color: '#1F2937',
      background: 'transparent',
      turdSize: 2,        // drop specks this small; keeps scanner dust out
      optCurve: true,
      alphaMax: 1,
    });
    tracer.loadImage(buffer, (err) => {
      if (err) return reject(err);
      resolve(tracer.getSVG());
    });
  });
}

/** Pull viewBox / width / height out of the SVG potrace emits. */
function dimsOf(svg) {
  const w = /width="(\d+(?:\.\d+)?)"/.exec(svg);
  const h = /height="(\d+(?:\.\d+)?)"/.exec(svg);
  return { width: w ? Number(w[1]) : null, height: h ? Number(h[1]) : null };
}

(async () => {
  const img = await Jimp.read(src);
  console.log(`Source: ${src}  ${img.bitmap.width}x${img.bitmap.height}`);

  // Strip printed headers/footers BEFORE tracing, or the title text becomes
  // part of the artwork as vector paths.
  if (cropTop || cropBottom) {
    const h = img.bitmap.height - cropTop - cropBottom;
    if (h <= 0) throw new Error('crop-top + crop-bottom removes the whole image');
    img.crop({ x: 0, y: cropTop, w: img.bitmap.width, h });
    console.log(`  cropped ${cropTop}px top / ${cropBottom}px bottom -> ${img.bitmap.width}x${img.bitmap.height}`);
  }
  const { width, height } = img.bitmap;
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const halves = single
    ? [{ name: 'figure', img }]
    : [
        { name: 'front', img: img.clone().crop({ x: 0, y: 0, w: Math.floor(width / 2), h: height }) },
        { name: 'back', img: img.clone().crop({ x: Math.floor(width / 2), y: 0, w: Math.ceil(width / 2), h: height }) },
      ];

  const manifest = { source: path.basename(src), threshold, traced: [] };

  for (const { name, img: part } of halves) {
    // Autocrop AFTER splitting. Trimming the whole sheet first would move the
    // midpoint the split relies on, and each figure should fill its own
    // viewBox anyway so the two render at a matching scale.
    if (autocrop) {
      part.autocrop();
      console.log(`  ${name}: autocropped -> ${part.bitmap.width}x${part.bitmap.height}`);
    }
    const buf = await part.getBuffer('image/png');
    const svg = await trace(buf, name);
    const file = path.join(OUT_DIR, `${name}.svg`);
    fs.writeFileSync(file, svg, 'utf8');

    const d = dimsOf(svg);
    const paths = (svg.match(/<path/g) || []).length;
    manifest.traced.push({ name, file: `public/figures/${name}.svg`, ...d, paths });
    console.log(`  ${name}: ${d.width}x${d.height}, ${paths} path(s) -> ${file}`);
  }

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('\nWrote public/figures/manifest.json');
  console.log('Next: the zone boxes get refitted to these dimensions, with an overlay to check them.');
})().catch((e) => {
  console.error('Trace failed:', e.message);
  process.exit(1);
});
