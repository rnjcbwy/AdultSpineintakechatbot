/**
 * End-to-end check: a drawing on the traced figure fires the right triggers.
 *
 *   node scripts/test-triggers.mjs
 *
 * test-zones.mjs proves a tap resolves to the right anatomical label. This
 * proves those labels still drive the rules — which is a separate failure.
 * The first run of this pair caught one: the feet nearly touch on this figure,
 * so the great-toe zones sat inside bodySide()'s midline dead-zone and came
 * back unqualified. Every label looked right, and L5 and S1 quietly stopped
 * firing, because the pattern rules need proximal and distal on the SAME side.
 *
 * Both modules are ESM inside a CommonJS package, so they are copied to .mjs
 * siblings (with the import between them rewritten) and removed afterwards.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const TMP_MAP = path.resolve('lib/__bodyMap.test.mjs');
const TMP_TRIG = path.resolve('lib/__triggers.test.mjs');

fs.writeFileSync(TMP_MAP, fs.readFileSync(path.resolve('lib/bodyMap.js'), 'utf8'));
fs.writeFileSync(
  TMP_TRIG,
  fs.readFileSync(path.resolve('lib/painMapTriggers.js'), 'utf8')
    .replace("from './bodyMap'", "from './__bodyMap.test.mjs'")
);

let bodyMap, triggers;
try {
  bodyMap = await import(pathToFileURL(TMP_MAP).href);
  triggers = await import(pathToFileURL(TMP_TRIG).href);
} finally {
  fs.unlinkSync(TMP_MAP);
  fs.unlinkSync(TMP_TRIG);
}

const { zoneAt, VIEW_BOX, EMPTY_PAIN_MAP } = bodyMap;
const { evaluatePainMap } = triggers;
const W = VIEW_BOX.width;
const H = VIEW_BOX.height;

/** Build a pain map from viewBox-unit taps, the way the UI does. */
function draw(taps) {
  const map = JSON.parse(JSON.stringify(EMPTY_PAIN_MAP));
  taps.forEach(([view, x, y, type = 'ache'], i) => {
    map[view].marks.push({
      id: `t${i}`, x: x / W, y: y / H, type,
      zone: zoneAt(x / W, y / H, view),
    });
  });
  return map;
}

// name, taps, ids that MUST fire, ids that must NOT fire
const CASES = [
  [
    'L5 stripe on the right (lateral shin + great toe, viewer left = patient right)',
    [['anterior', 95, 450], ['anterior', 138, 530]],
    ['pattern_l5', 'below_knee'],
    ['axial_only', 'cauda_equina'],
  ],
  [
    'S1 stripe on the left (posterior calf + little toe, same side)',
    [['posterior', 175, 450], ['posterior', 180, 530]],
    ['pattern_s1', 'below_knee'],
    ['axial_only'],
  ],
  [
    'Split sides must NOT complete a dermatome',
    [['anterior', 95, 450], ['anterior', 180, 530]],
    ['below_knee'],
    ['pattern_l5', 'pattern_s1'],
  ],
  [
    'Saddle mark raises cauda equina',
    [['posterior', 140, 296]],
    ['cauda_equina', 'axial_only'],
    [],
  ],
  [
    'Low back only shortens the form',
    [['posterior', 140, 225]],
    ['axial_only'],
    ['below_knee', 'cauda_equina', 'pattern_l5'],
  ],
  [
    'Neck plus hand runs the myelopathy screen',
    [['posterior', 140, 88], ['anterior', 20, 310]],
    ['myelopathy'],
    ['axial_only'],
  ],
  [
    'C6: lateral forearm plus thumb, same side',
    [['anterior', 25, 280], ['anterior', 20, 310]],
    ['pattern_c6'],
    ['pattern_c8'],
  ],
  [
    'C8: medial forearm plus little finger, same side',
    [['anterior', 55, 280], ['anterior', 50, 310]],
    ['pattern_c8'],
    ['pattern_c6'],
  ],
  [
    'Both legs asks the claudication set',
    [['anterior', 95, 340], ['anterior', 185, 340]],
    ['bilateral_legs'],
    ['axial_only'],
  ],
  [
    'Weakness in the foot asks about foot drop',
    [['anterior', 138, 530, 'weakness']],
    ['foot_drop', 'below_knee'],
    [],
  ],
  [
    'Numbness marker pre-answers the sensory questions',
    [['anterior', 95, 450, 'numbness']],
    ['autofill_sensory'],
    [],
  ],
];

let pass = 0;
const fails = [];
for (const [name, taps, must, mustNot] of CASES) {
  const map = draw(taps);
  const fired = evaluatePainMap(map).map((f) => f.id);
  const missing = must.filter((id) => !fired.includes(id));
  const extra = mustNot.filter((id) => fired.includes(id));
  if (!missing.length && !extra.length) {
    pass++;
  } else {
    fails.push(
      `  ${name}\n` +
      `     zones:   ${taps.map(([v, x, y]) => zoneAt(x / W, y / H, v)).join(' | ')}\n` +
      `     fired:   ${fired.join(', ') || '(nothing)'}\n` +
      (missing.length ? `     MISSING: ${missing.join(', ')}\n` : '') +
      (extra.length ? `     UNWANTED: ${extra.join(', ')}\n` : '')
    );
  }
}

console.log(`painMapTriggers: ${pass}/${CASES.length} scenarios pass`);
if (fails.length) {
  console.log('\nFAILURES:');
  console.log(fails.join('\n'));
  process.exit(1);
}
