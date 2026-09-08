/**
 * Checks on the review of systems and the red flags it feeds.
 *
 *   node scripts/test-ros.mjs
 *
 * The red-flag checks matter most. Those rules previously read
 * reviewOfSystems.unexplainedWeightLoss, which was never a real path — the
 * answer lives under the body system that asks it — so they resolved to
 * undefined and could only ever fire from free text. That failed silently,
 * which is the worst way for a safety check to fail.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const COPIES = [
  ['lib/rosSystems.js', 'lib/__ros.test.mjs', (t) => t],
  ['lib/redFlags.js', 'lib/__flags.test.mjs', (t) => t.replace("from './rosSystems'", "from './__ros.test.mjs'")],
];
for (const [src, dst, transform] of COPIES) {
  fs.writeFileSync(path.resolve(dst), transform(fs.readFileSync(path.resolve(src), 'utf8')));
}

let ros, flags;
try {
  ros = await import(pathToFileURL(path.resolve('lib/__ros.test.mjs')).href);
  flags = await import(pathToFileURL(path.resolve('lib/__flags.test.mjs')).href);
} finally {
  for (const [, dst] of COPIES) fs.unlinkSync(path.resolve(dst));
}

const {
  ROS_SECTIONS, COMPLETE_ROS_THRESHOLD, emptyROS, countReviewedSystems,
  rosAnswer, migrateROS, rosPositives,
} = ros;
const { detectRedFlags } = flags;

let pass = 0;
const fails = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else fails.push(`  ${name}${detail ? `\n     ${detail}` : ''}`);
};

// ---- coverage --------------------------------------------------------------
check(
  'covers all 14 recognised body systems',
  ROS_SECTIONS.length === 14,
  `got ${ROS_SECTIONS.length}`
);
check('threshold for a complete ROS is 10', COMPLETE_ROS_THRESHOLD === 10);
check(
  'no duplicate section ids',
  new Set(ROS_SECTIONS.map((s) => s.id)).size === ROS_SECTIONS.length
);
check(
  'every section has a formal system name and at least two questions',
  ROS_SECTIONS.every((s) => s.system && s.questions.length >= 2)
);
check(
  'no section is named both "general" and "constitutional"',
  !ROS_SECTIONS.some((s) => s.id === 'general'),
  'the catch-all duplicated Constitutional and was not a recognised system'
);
// Question ids must be unique across ALL systems, because rosAnswer() and the
// red-flag rules look them up by id alone.
const allQ = ROS_SECTIONS.flatMap((s) => s.questions.map((q) => q.id));
check('question ids are unique across systems', new Set(allQ).size === allQ.length,
  `dupes: ${allQ.filter((q, i) => allQ.indexOf(q) !== i).join(', ')}`);

// ---- counting --------------------------------------------------------------
const blank = emptyROS();
check('a blank form counts zero systems reviewed', countReviewedSystems(blank) === 0);

const partial = emptyROS();
partial.constitutional.fevers = 'no';
check(
  'a partly answered system does not count as reviewed',
  countReviewedSystems(partial) === 0,
  'counting partials would overstate what was documented'
);

const oneDone = emptyROS();
for (const q of ROS_SECTIONS[0].questions) oneDone[ROS_SECTIONS[0].id][q.id] = 'no';
check('a fully answered system counts once', countReviewedSystems(oneDone) === 1);

const allDone = emptyROS();
for (const s of ROS_SECTIONS) for (const q of s.questions) allDone[s.id][q.id] = 'no';
check('answering everything reaches 14', countReviewedSystems(allDone) === 14);
check('answering everything clears the complete-ROS bar', countReviewedSystems(allDone) >= COMPLETE_ROS_THRESHOLD);

// ---- lookup ----------------------------------------------------------------
const withWeightLoss = emptyROS();
withWeightLoss.constitutional.unexplainedWeightLoss = 'yes';
check(
  'rosAnswer finds an answer without knowing its system',
  rosAnswer(withWeightLoss, 'unexplainedWeightLoss') === 'yes'
);
check('rosAnswer returns undefined for an unknown question', rosAnswer(withWeightLoss, 'nope') === undefined);

// ---- red flags: the regression this suite exists for -----------------------
check(
  'weight loss answered YES raises the weight-loss flag',
  detectRedFlags({ reviewOfSystems: withWeightLoss }).some((f) => f.id === 'weight_loss'),
  'this is the check that was silently dead'
);
check(
  'weight loss answered NO raises nothing',
  !detectRedFlags({ reviewOfSystems: { ...emptyROS(), constitutional: { ...emptyROS().constitutional, unexplainedWeightLoss: 'no' } } })
    .some((f) => f.id === 'weight_loss')
);

const bladder = emptyROS();
bladder.genitourinary.bladderChanges = 'yes';
check(
  'bladder change raises the cauda equina flag',
  detectRedFlags({ reviewOfSystems: bladder }).some((f) => f.id === 'cauda_equina_bowel_bladder')
);

const cancer = emptyROS();
cancer.hematologic.cancerHistory = 'yes';
check(
  'cancer history raises its flag from its NEW system',
  detectRedFlags({ reviewOfSystems: cancer }).some((f) => f.id === 'cancer_history_new_pain'),
  'cancerHistory moved out of the retired catch-all group'
);

const fever = emptyROS();
fever.constitutional.fevers = 'yes';
check(
  'fever raises the fever flag',
  detectRedFlags({ reviewOfSystems: fever }).some((f) => f.id === 'fever_back_pain')
);
check('an empty ROS raises no flags', detectRedFlags({ reviewOfSystems: emptyROS() }).length === 0);

// ---- migration -------------------------------------------------------------
const legacy = {
  constitutional: { fevers: 'no', nightSweats: 'no' },
  general: { recentInfections: 'yes', woundIssues: 'no', cancerHistory: 'yes' },
  additionalNotes: 'my back hurts',
};
const migrated = migrateROS(legacy);
check('migration keeps answers that did not move', migrated.constitutional.fevers === 'no');
check('migration keeps free text', migrated.additionalNotes === 'my back hurts');
check('migration rehomes cancer history to Hematologic', migrated.hematologic.cancerHistory === 'yes');
check('migration rehomes infections to Immunologic', migrated.immunologic.recentInfections === 'yes');
check('migration rehomes wounds to Integumentary', migrated.integumentary.woundIssues === 'no');
check(
  'migration adds systems that did not exist in the saved draft',
  migrated.eyes && 'visionChanges' in migrated.eyes,
  'a resumed draft must not be missing new systems'
);
check(
  'a rehomed answer still reaches the red flags',
  detectRedFlags({ reviewOfSystems: migrated }).some((f) => f.id === 'cancer_history_new_pain')
);
check('migration survives junk input', !!migrateROS(null).constitutional);

// ---- note output -----------------------------------------------------------
const mixed = emptyROS();
mixed.constitutional.fevers = 'yes';
mixed.neurological.balanceProblems = 'yes';
mixed.eyes.visionChanges = 'no';
const pos = rosPositives(mixed);
check('positives are grouped under formal system names',
  pos.some((p) => p.system === 'Constitutional') && pos.some((p) => p.system === 'Neurological'));
check('systems with no positives are omitted', !pos.some((p) => p.system === 'Eyes'));

console.log(`reviewOfSystems: ${pass}/${pass + fails.length} checks pass`);
if (fails.length) {
  console.log('\nFAILURES:');
  console.log(fails.join('\n'));
  process.exit(1);
}
