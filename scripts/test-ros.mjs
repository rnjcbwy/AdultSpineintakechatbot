/**
 * Checks on the review of systems and the red flags it feeds, for every
 * service.
 *
 *   node scripts/test-ros.mjs
 *
 * The red-flag checks matter most. Those rules previously read
 * reviewOfSystems.unexplainedWeightLoss, which was never a real path — the
 * answer lives under the body system that asks it — so they resolved to
 * undefined and could only ever fire from free text. That failed silently,
 * which is the worst way for a safety check to fail.
 *
 * The spine and ortho modules must also expose the same shape, so the one
 * review-of-systems step (components/steps/ReviewOfSystems.js) can serve
 * both; the flags each service raises from the review differ and are
 * checked separately below.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// The service modules import each other by extensionless path, which the
// app's bundler resolves and Node's ESM loader does not, so each pair is
// copied beside itself with the import rewritten.
async function load(service) {
  const dir = `lib/services/${service}`;
  const COPIES = [
    [`${dir}/rosSystems.js`, `${dir}/__ros.test.mjs`, (t) => t],
    [`${dir}/redFlags.js`, `${dir}/__flags.test.mjs`, (t) => t.replace("from './rosSystems'", "from './__ros.test.mjs'")],
  ];
  for (const [src, dst, transform] of COPIES) {
    fs.writeFileSync(path.resolve(dst), transform(fs.readFileSync(path.resolve(src), 'utf8')));
  }
  try {
    const ros = await import(pathToFileURL(path.resolve(`${dir}/__ros.test.mjs`)).href);
    const flags = await import(pathToFileURL(path.resolve(`${dir}/__flags.test.mjs`)).href);
    return { ros, flags };
  } finally {
    for (const [, dst] of COPIES) fs.unlinkSync(path.resolve(dst));
  }
}
const spine = await load('spine');
const ortho = await load('ortho');

let pass = 0;
const fails = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else fails.push(`  ${name}${detail ? `\n     ${detail}` : ''}`);
};

// ============================================================================
// The shape both services share. components/steps/ReviewOfSystems.js reads
// the rosSystems names through useService(); the red-flag names are read by
// the submit route, the worker and the final review.
// ============================================================================
const SHARED_ROS = {
  ROS_SECTIONS: 'object', ROS_SCREEN: 'object', COMPLETE_ROS_THRESHOLD: 'number', TRANSLATIONS: 'object',
  rosSectionOf: 'function', emptyROS: 'function', isSectionComplete: 'function', countReviewedSystems: 'function',
  rosPositives: 'function', rosAnswer: 'function', migrateROS: 'function',
};
const SHARED_FLAGS = { RED_FLAG_DEFINITIONS: 'object', detectRedFlags: 'function' };

for (const [name, svc] of [['spine', spine], ['ortho', ortho]]) {
  for (const [k, type] of Object.entries(SHARED_ROS)) check(`${name} rosSystems exports ${k}`, typeof svc.ros[k] === type);
  for (const [k, type] of Object.entries(SHARED_FLAGS)) check(`${name} redFlags exports ${k}`, typeof svc.flags[k] === type);

  const {
    ROS_SECTIONS, ROS_SCREEN, COMPLETE_ROS_THRESHOLD, TRANSLATIONS, rosSectionOf,
    emptyROS, countReviewedSystems, rosAnswer, migrateROS, rosPositives,
  } = svc.ros;
  const { RED_FLAG_DEFINITIONS, detectRedFlags } = svc.flags;
  const p = (n) => `${name}: ${n}`;

  // ---- coverage --------------------------------------------------------------
  check(p('covers all 14 recognised body systems'), ROS_SECTIONS.length === 14, `got ${ROS_SECTIONS.length}`);
  check(p('threshold for a complete ROS is 10'), COMPLETE_ROS_THRESHOLD === 10);
  check(p('no duplicate section ids'), new Set(ROS_SECTIONS.map((s) => s.id)).size === ROS_SECTIONS.length);
  check(p('every section has a formal system name and at least two questions'),
    ROS_SECTIONS.every((s) => s.system && s.questions.length >= 2));
  check(p('no section is named both "general" and "constitutional"'),
    !ROS_SECTIONS.some((s) => s.id === 'general'),
    'the catch-all duplicated Constitutional and was not a recognised system');
  // Question ids must be unique across ALL systems, because rosAnswer() and the
  // red-flag rules look them up by id alone.
  const allQ = ROS_SECTIONS.flatMap((s) => s.questions.map((q) => q.id));
  check(p('question ids are unique across systems'), new Set(allQ).size === allQ.length,
    `dupes: ${allQ.filter((q, i) => allQ.indexOf(q) !== i).join(', ')}`);
  check(p('every short-list item is one of the full review\'s questions'),
    ROS_SCREEN.every((q) => rosSectionOf(q.id)),
    ROS_SCREEN.filter((q) => !rosSectionOf(q.id)).map((q) => q.id).join(', '));

  // ---- translations: every word the patient reads has es and zh --------------
  const strings = [...ROS_SECTIONS.flatMap((s) => [s.title, ...s.questions.map((q) => q.label)]), ...ROS_SCREEN.map((q) => q.label)];
  const untranslated = strings.filter((s) => !TRANSLATIONS[s]?.es || !TRANSLATIONS[s]?.zh);
  check(p('every heading, question and short-list item has es and zh'), untranslated.length === 0, untranslated.slice(0, 3).join(' | '));

  // ---- counting --------------------------------------------------------------
  const blank = emptyROS();
  check(p('a blank form counts zero systems reviewed'), countReviewedSystems(blank) === 0);

  const partial = emptyROS();
  partial.constitutional.fevers = 'no';
  check(p('a partly answered system does not count as reviewed'), countReviewedSystems(partial) === 0,
    'counting partials would overstate what was documented');

  const oneDone = emptyROS();
  for (const q of ROS_SECTIONS[0].questions) oneDone[ROS_SECTIONS[0].id][q.id] = 'no';
  check(p('a fully answered system counts once'), countReviewedSystems(oneDone) === 1);

  const allDone = emptyROS();
  for (const s of ROS_SECTIONS) for (const q of s.questions) allDone[s.id][q.id] = 'no';
  check(p('answering everything reaches 14'), countReviewedSystems(allDone) === 14);
  check(p('answering everything clears the complete-ROS bar'), countReviewedSystems(allDone) >= COMPLETE_ROS_THRESHOLD);

  // ---- lookup ----------------------------------------------------------------
  const withWeightLoss = emptyROS();
  withWeightLoss.constitutional.unexplainedWeightLoss = 'yes';
  check(p('rosAnswer finds an answer without knowing its system'), rosAnswer(withWeightLoss, 'unexplainedWeightLoss') === 'yes');
  check(p('rosAnswer returns undefined for an unknown question'), rosAnswer(withWeightLoss, 'nope') === undefined);

  // ---- red flags shared by every service --------------------------------------
  check(p('every red flag has an id, label, severity and a patient message'),
    RED_FLAG_DEFINITIONS.every((f) => f.id && f.label && f.severity && f.patientMessage));
  check(p('red flag ids are unique'), new Set(RED_FLAG_DEFINITIONS.map((f) => f.id)).size === RED_FLAG_DEFINITIONS.length);
  check(p('weight loss answered YES raises the weight-loss flag'),
    detectRedFlags({ reviewOfSystems: withWeightLoss }).some((f) => f.id === 'weight_loss'),
    'this is the check that was silently dead');
  check(p('weight loss answered NO raises nothing'),
    !detectRedFlags({ reviewOfSystems: { ...emptyROS(), constitutional: { ...emptyROS().constitutional, unexplainedWeightLoss: 'no' } } })
      .some((f) => f.id === 'weight_loss'));

  const cancer = emptyROS();
  cancer.hematologic.cancerHistory = 'yes';
  check(p('cancer history raises its flag from its NEW system'),
    detectRedFlags({ reviewOfSystems: cancer }).some((f) => f.id === 'cancer_history_new_pain'),
    'cancerHistory moved out of the retired catch-all group');
  check(p('an empty ROS raises no flags'), detectRedFlags({ reviewOfSystems: emptyROS() }).length === 0);

  // ---- migration -------------------------------------------------------------
  const legacy = {
    constitutional: { fevers: 'no', nightSweats: 'no' },
    general: { recentInfections: 'yes', woundIssues: 'no', cancerHistory: 'yes' },
    additionalNotes: 'my back hurts',
  };
  const migrated = migrateROS(legacy);
  check(p('migration keeps answers that did not move'), migrated.constitutional.fevers === 'no');
  check(p('migration keeps free text'), migrated.additionalNotes === 'my back hurts');
  check(p('migration rehomes cancer history to Hematologic'), migrated.hematologic.cancerHistory === 'yes');
  check(p('migration rehomes infections to Immunologic'), migrated.immunologic.recentInfections === 'yes');
  check(p('migration rehomes wounds to Integumentary'), migrated.integumentary.woundIssues === 'no');
  check(p('migration adds systems that did not exist in the saved draft'),
    migrated.eyes && 'visionChanges' in migrated.eyes,
    'a resumed draft must not be missing new systems');
  check(p('a rehomed answer still reaches the red flags'),
    detectRedFlags({ reviewOfSystems: migrated }).some((f) => f.id === 'cancer_history_new_pain'));
  check(p('migration survives junk input'), !!migrateROS(null).constitutional);

  // ---- note output -----------------------------------------------------------
  const mixed = emptyROS();
  mixed.constitutional.fevers = 'yes';
  mixed.neurological.balanceProblems = 'yes';
  mixed.eyes.visionChanges = 'no';
  const pos = rosPositives(mixed);
  check(p('positives are grouped under formal system names'),
    pos.some((x) => x.system === 'Constitutional') && pos.some((x) => x.system === 'Neurological'));
  check(p('systems with no positives are omitted'), !pos.some((x) => x.system === 'Eyes'));
}

// ============================================================================
// Spine: the flags a spine review raises
// ============================================================================
{
  const { emptyROS } = spine.ros;
  const { detectRedFlags } = spine.flags;

  const bladder = emptyROS();
  bladder.genitourinary.bladderChanges = 'yes';
  check('spine: bladder change raises the cauda equina flag',
    detectRedFlags({ reviewOfSystems: bladder }).some((f) => f.id === 'cauda_equina_bowel_bladder'));

  const fever = emptyROS();
  fever.constitutional.fevers = 'yes';
  check('spine: fever raises the fever flag',
    detectRedFlags({ reviewOfSystems: fever }).some((f) => f.id === 'fever_back_pain'));
}

// ============================================================================
// Ortho: the flags a bone-and-joint review raises
// ============================================================================
{
  const { emptyROS } = ortho.ros;
  const { detectRedFlags } = ortho.flags;

  const hot = emptyROS();
  hot.musculoskeletal.hotSwollenJoint = 'yes';
  check('ortho: a hot swollen joint raises the septic joint flag',
    detectRedFlags({ reviewOfSystems: hot }).some((f) => f.id === 'septic_joint'));

  const calf = emptyROS();
  calf.cardiovascular.calfSwelling = 'yes';
  check('ortho: a swollen calf raises the clot flag',
    detectRedFlags({ reviewOfSystems: calf }).some((f) => f.id === 'dvt_pe'));

  const fever = emptyROS();
  fever.constitutional.fevers = 'yes';
  check('ortho: fever alone raises nothing (a hot joint is the orthopaedic flag)',
    !detectRedFlags({ reviewOfSystems: fever }).some((f) => f.id === 'septic_joint'));
}

console.log(`reviewOfSystems: ${pass}/${pass + fails.length} checks pass`);
if (fails.length) {
  console.log('\nFAILURES:');
  console.log(fails.join('\n'));
  process.exit(1);
}
