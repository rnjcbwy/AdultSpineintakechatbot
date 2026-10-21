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
 * The rules differ by service (lib/service.js): the spine set looks for
 * dermatomes, the myelopathy screen and cauda equina; the bone-and-joint set
 * names joints, the median and ulnar patterns, the hip patterns and the calf.
 * Each service's painMapTriggers runs against its own scenarios below.
 *
 * The modules are ESM inside a CommonJS package, so they are copied to .mjs
 * siblings (with the import between them rewritten) and removed afterwards.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const TMP_MAP = path.resolve('lib/__bodyMap.test.mjs');
const SPECIALTIES = ['spine', 'ortho'];
const tmpTrig = (specialty) => path.resolve(`lib/__triggers.${specialty}.test.mjs`);

fs.writeFileSync(TMP_MAP, fs.readFileSync(path.resolve('lib/bodyMap.js'), 'utf8'));
for (const specialty of SPECIALTIES) {
  fs.writeFileSync(
    tmpTrig(specialty),
    fs.readFileSync(path.resolve(`lib/services/${specialty}/painMapTriggers.js`), 'utf8')
      .replace("from '../../bodyMap'", "from './__bodyMap.test.mjs'")
  );
}

let bodyMap;
const triggers = {};
try {
  bodyMap = await import(pathToFileURL(TMP_MAP).href);
  for (const specialty of SPECIALTIES) triggers[specialty] = await import(pathToFileURL(tmpTrig(specialty)).href);
} finally {
  fs.unlinkSync(TMP_MAP);
  for (const specialty of SPECIALTIES) fs.unlinkSync(tmpTrig(specialty));
}

const { zoneAt, VIEW_BOX, EMPTY_PAIN_MAP } = bodyMap;
const W = VIEW_BOX.width;
const H = VIEW_BOX.height;

/** Build a pain map from viewBox-unit taps (and radiation paths), the way the UI does. */
function draw(taps, paths = []) {
  const map = JSON.parse(JSON.stringify(EMPTY_PAIN_MAP));
  taps.forEach(([view, x, y, type = 'ache'], i) => {
    map[view].marks.push({
      id: `t${i}`, x: x / W, y: y / H, type,
      zone: zoneAt(x / W, y / H, view),
    });
  });
  paths.forEach(([view, x1, y1, x2, y2, type = 'sharp'], i) => {
    map[view].paths.push({
      id: `p${i}`, type,
      fromZone: zoneAt(x1 / W, y1 / H, view), toZone: zoneAt(x2 / W, y2 / H, view),
      points: [{ x: x1 / W, y: y1 / H }, { x: x2 / W, y: y2 / H }],
    });
  });
  return map;
}

// name, taps, ids that MUST fire, ids that must NOT fire, [paths]
const SPINE_CASES = [
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

const ORTHO_CASES = [
  [
    'A knee mark names the knee (viewer left = patient right on the front)',
    [['anterior', 95, 400]],
    ['joints_marked'],
    ['spine_marked', 'no_limb'],
  ],
  [
    'Both knees ask the arthritis set',
    [['anterior', 95, 400], ['anterior', 185, 400]],
    ['bilateral_knees', 'joints_marked'],
    ['no_limb'],
  ],
  [
    'Median pattern: numbness on the thumb / index without the forearm',
    [['anterior', 20, 310, 'numbness']],
    ['pattern_median', 'autofill_sensory'],
    ['pattern_c6'],
  ],
  [
    'C6 vs median: lateral forearm plus thumb, same side',
    [['anterior', 25, 280, 'numbness'], ['anterior', 20, 310, 'numbness']],
    ['pattern_c6'],
    ['pattern_median', 'pattern_c8'],
  ],
  [
    'Ulnar pattern: numbness on the ring / little finger alone',
    [['anterior', 50, 310, 'tingling']],
    ['pattern_ulnar'],
    ['pattern_c8'],
  ],
  [
    'C8 vs ulnar: medial forearm plus little finger, same side',
    [['anterior', 55, 280, 'numbness'], ['anterior', 50, 310, 'numbness']],
    ['pattern_c8'],
    ['pattern_ulnar'],
  ],
  [
    'Groin mark raises the intra-articular hip pattern',
    [['anterior', 110, 280]],
    ['pattern_groin_hip'],
    ['cauda_equina'],
  ],
  [
    'Saddle mark still raises cauda equina',
    [['posterior', 140, 296]],
    ['cauda_equina'],
    [],
  ],
  [
    'Low back only points at the spine intake and finds no limb',
    [['posterior', 140, 225]],
    ['spine_marked', 'no_limb'],
    ['joints_marked', 'pattern_lateral_hip'],
  ],
  [
    'Lateral hip without back marks raises the trochanteric pattern',
    [['left', 130, 300]],
    ['pattern_lateral_hip', 'joints_marked'],
    ['spine_marked'],
  ],
  [
    'Calf pain asks the clot screen',
    [['posterior', 175, 450]],
    ['calf_marked', 'joints_marked'],
    [],
  ],
  [
    'Calf numbness alone does not ask the clot screen',
    [['posterior', 175, 450, 'numbness']],
    ['autofill_sensory'],
    ['calf_marked'],
  ],
  [
    'Weakness marker pre-answers the weakness question',
    [['anterior', 190, 120, 'weakness']],
    ['autofill_weakness', 'joints_marked'],
    [],
  ],
  [
    'A path from the buttock to the calf is a radicular pattern',
    [],
    ['pattern_radicular_leg'],
    [],
    [['posterior', 175, 280, 175, 450]],
  ],
  [
    'Shoulder mark names the shoulder',
    [['anterior', 80, 120]],
    ['joints_marked'],
    ['no_limb', 'bilateral_knees'],
  ],
];

const CASES = [
  ...SPINE_CASES.map((c) => ['spine', ...c]),
  ...ORTHO_CASES.map((c) => ['ortho', ...c]),
];

let pass = 0;
const fails = [];
for (const [specialty, name, taps, must, mustNot, paths = []] of CASES) {
  const map = draw(taps, paths);
  const fired = triggers[specialty].evaluatePainMap(map).map((f) => f.id);
  const missing = must.filter((id) => !fired.includes(id));
  const extra = mustNot.filter((id) => fired.includes(id));
  if (!missing.length && !extra.length) {
    pass++;
  } else {
    fails.push(
      `  [${specialty}] ${name}\n` +
      `     zones:   ${taps.map(([v, x, y]) => zoneAt(x / W, y / H, v)).join(' | ')}\n` +
      `     fired:   ${fired.join(', ') || '(nothing)'}\n` +
      (missing.length ? `     MISSING: ${missing.join(', ')}\n` : '') +
      (extra.length ? `     UNWANTED: ${extra.join(', ')}\n` : '')
    );
  }
}

console.log(`painMapTriggers: ${pass}/${CASES.length} scenarios pass (${SPINE_CASES.length} spine, ${ORTHO_CASES.length} ortho)`);
if (fails.length) {
  console.log('\nFAILURES:');
  console.log(fails.join('\n'));
  process.exit(1);
}
