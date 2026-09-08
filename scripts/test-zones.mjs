/**
 * Check that zoneAt() resolves anatomy correctly on the traced figure.
 *
 *   node scripts/test-zones.mjs
 *
 * Points are given in viewBox units read off the gridded artwork
 * (public/figures/grid.html), so a failure here means a zone box does not
 * match the drawing — the exact class of bug that once resolved a mark on the
 * flank to "left elbow".
 *
 * lib/bodyMap.js is ESM inside a CommonJS package, so it is copied to a .mjs
 * sibling to be importable; the copy is removed afterwards.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const TMP = path.resolve('lib/__bodyMap.test.mjs');
fs.writeFileSync(TMP, fs.readFileSync(path.resolve('lib/bodyMap.js'), 'utf8'));

let mod;
try {
  mod = await import(pathToFileURL(TMP).href);
} finally {
  fs.unlinkSync(TMP);
}
const { zoneAt, VIEW_BOX } = mod;

const W = VIEW_BOX.width;
const H = VIEW_BOX.height;
const at = (x, y, view) => zoneAt(x / W, y / H, view);

// [x, y, view, expected substring, what it is]
const CASES = [
  // --- midline structures: these must beat the wider paired zones ----------
  [140, 40, 'anterior', 'head', 'crown'],
  [140, 86, 'anterior', 'neck', 'front of neck'],
  [140, 150, 'anterior', 'chest', 'sternum'],
  [140, 230, 'anterior', 'abdomen', 'umbilicus'],
  [140, 292, 'anterior', 'perineum', 'pubis / perineum'],
  [140, 88, 'posterior', 'cervical spine', 'back of neck'],
  [140, 160, 'posterior', 'thoracic spine', 'mid back'],
  [140, 225, 'posterior', 'lumbar spine', 'low back'],
  [140, 265, 'posterior', 'sacrum', 'tailbone'],
  [140, 296, 'posterior', 'perineum / saddle', 'SADDLE — cauda equina trigger'],

  // --- the bug that started all this: flank must not read as an arm -------
  [104, 220, 'posterior', 'flank', 'flank, viewer left'],
  [176, 220, 'posterior', 'flank', 'flank, viewer right'],
  [110, 270, 'posterior', 'buttock', 'buttock'],

  // --- laterality. Anterior is mirrored; posterior is not. ----------------
  // Seen from BEHIND the sides match: the patient's left hand is on your left.
  [104, 220, 'posterior', 'left', 'posterior viewer-left = patient LEFT'],
  [176, 220, 'posterior', 'right', 'posterior viewer-right = patient RIGHT'],
  // Facing the patient the sides swap.
  [110, 340, 'anterior', 'right', 'anterior viewer-left = patient RIGHT'],
  [170, 340, 'anterior', 'left', 'anterior viewer-right = patient LEFT'],

  // --- upper limb, medial vs lateral (C6 vs C8) --------------------------
  [50, 200, 'anterior', 'lateral upper arm', 'outer upper arm'],
  [85, 200, 'anterior', 'medial upper arm', 'inner upper arm'],
  [25, 280, 'anterior', 'lateral forearm', 'outer forearm — C6 route'],
  [55, 280, 'anterior', 'medial forearm', 'inner forearm — C8 route'],
  [20, 310, 'anterior', 'thumb / index', 'thumb — completes C6'],
  [50, 310, 'anterior', 'ring / little', 'little finger — completes C8'],
  [80, 120, 'anterior', 'shoulder', 'shoulder cap'],

  // --- lower limb, the L4 / L5 / S1 surfaces -----------------------------
  [95, 340, 'anterior', 'lateral thigh', 'outer thigh'],
  [130, 340, 'anterior', 'medial thigh', 'inner thigh'],
  [125, 400, 'anterior', 'knee', 'kneecap'],
  [95, 450, 'anterior', 'lateral shin', 'outer shin — L5 route'],
  [130, 450, 'anterior', 'medial shin', 'inner shin — L4 route'],
  [95, 450, 'posterior', 'lateral calf', 'outer calf — S1 route'],
  [130, 495, 'anterior', 'ankle', 'ankle'],
  [138, 530, 'anterior', 'great toe / inner foot', 'great toe — completes L5'],
  [110, 530, 'anterior', 'outer foot / little toe', 'little toe — completes S1'],

  // --- lateral views keep working after the +10 recentring ---------------
  [140, 230, 'left', 'flank', 'lateral flank'],
  [140, 290, 'left', 'hip / buttock', 'lateral hip'],
  [120, 470, 'right', 'lateral calf', 'lateral calf, right view'],
  [175, 540, 'right', 'dorsum of the foot', 'dorsum — L5 on the side view'],
  [110, 540, 'right', 'heel', 'heel'],
];

let pass = 0;
const fails = [];
for (const [x, y, view, expect, what] of CASES) {
  const got = at(x, y, view);
  if (got.includes(expect)) pass++;
  else fails.push(`  ${view} (${x},${y}) ${what}\n     expected ~"${expect}"\n     got       "${got}"`);
}

console.log(`zoneAt: ${pass}/${CASES.length} checks pass`);
if (fails.length) {
  console.log('\nFAILURES:');
  console.log(fails.join('\n'));
  process.exit(1);
}
