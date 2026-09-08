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
 *   --single      the image holds ONE view; do not split
 *   --threshold N black/white cutoff, 0-255 (default 180). Raise it if thin
 *                 lines drop out, lower it if scanner grey turns into blobs.
 */

const fs = require('fs');
const path = require('path');
const potrace = require('potrace');
const { Jimp } = require('jimp');

const args = process.argv.slice(2);
const src = args.find((a) => !a.startsWith('--'));
const single = args.includes('--single');
const thrArg = args.find((a) => a.startsWith('--threshold'));
const threshold = thrArg ? Number(thrArg.split('=')[1] ?? 180) : 180;

if (!src) {
  console.error('Usage: node scripts/trace-figure.js <image> [--single] [--threshold=180]');
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
  const { width, height } = img.bitmap;
  console.log(`Source: ${src}  ${width}x${height}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const halves = single
    ? [{ name: 'figure', img }]
    : [
        { name: 'front', img: img.clone().crop({ x: 0, y: 0, w: Math.floor(width / 2), h: height }) },
        { name: 'back', img: img.clone().crop({ x: Math.floor(width / 2), y: 0, w: Math.ceil(width / 2), h: height }) },
      ];

  const manifest = { source: path.basename(src), threshold, traced: [] };

  for (const { name, img: part } of halves) {
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
