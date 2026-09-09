/**
 * PROM answers must reach the note as words, not as answer codes.
 *
 *   node scripts/test-proms.mjs
 *
 * The questionnaires store an answer as its numeric option value. That was
 * handed to the note generator raw, so "walking: 4" arrived with no option
 * list and the model could only echo the score — every item the patient
 * answered was collected and then dropped. These check it comes back as the
 * sentence the patient actually chose.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const COPIES = [
  ['lib/questionnaires.js', 'lib/__q.test.mjs', (t) => t],
  ['lib/promSummary.js', 'lib/__ps.test.mjs', (t) => t.replace("from './questionnaires'", "from './__q.test.mjs'")],
];
for (const [src, dst, tr] of COPIES) fs.writeFileSync(path.resolve(dst), tr(fs.readFileSync(path.resolve(src), 'utf8')));
let ps, q;
try {
  q = await import(pathToFileURL(path.resolve('lib/__q.test.mjs')).href);
  ps = await import(pathToFileURL(path.resolve('lib/__ps.test.mjs')).href);
} finally { for (const [, dst] of COPIES) fs.unlinkSync(path.resolve(dst)); }

const { promDetail, summarizePROMsForPrompt, promHeadlines } = ps;
const { ODI, MJOA } = q;

let pass = 0; const fails = [];
const check = (n, c, d = '') => { if (c) pass++; else fails.push(`  ${n}${d ? `\n     ${d}` : ''}`); };

// ---- ODI: answers resolve to the patient's chosen sentence ----------------
const odiAnswers = { pain_intensity: 3, walking: 4, sleeping: 2, personal_care: 1 };
const proms = { odi: { answers: odiAnswers, score: null } };
const [odi] = promDetail(proms);

check('the instrument is identified', odi && odi.shortName === 'ODI');
check('a score is computed even when none was stored', odi.score && typeof odi.score.percentage === 'number',
  JSON.stringify(odi.score));
check('every answered item comes back', odi.items.length === 4, `got ${odi.items.length}`);
check('items carry their section title', odi.items.some((i) => i.title === 'Walking'));

const walking = odi.items.find((i) => i.id === 'walking');
const expectedWalking = ODI.sections.find((s) => s.id === 'walking').options.find((o) => o.score === 4).label;
check('the answer is the exact option the patient picked',
  walking.answer === expectedWalking,
  `got "${walking.answer}"`);
check('an unanswered item is omitted rather than guessed',
  !odi.items.some((i) => i.id === 'lifting'));

// ---- the prompt block ------------------------------------------------------
const block = summarizePROMsForPrompt(proms);
check('the prompt block names the instrument', /Oswestry Disability Index/.test(block));
check('the prompt block carries the score and interpretation',
  /\d+% — (Minimal|Moderate|Severe|Crippled|Bed-bound)/.test(block), block);
check('the prompt block quotes the item wording', block.includes(expectedWalking), block);
check('the prompt block contains no bare answer codes',
  !/^\s*-\s*\w+:\s*\d+\s*$/m.test(block),
  'a raw "walking: 4" line is exactly the failure being fixed');
check('nothing completed says so plainly', summarizePROMsForPrompt({}) === 'None completed.');
check('an empty answer set is skipped', promDetail({ odi: { answers: {} } }).length === 0);

// ---- mJOA is flagged as history, and its scale runs the other way ---------
const mjoa = { mjoa: { answers: { upper_extremity_motor: 3, lower_extremity_motor: 5, sphincter: 3 } } };
const [mj] = promDetail(mjoa);
check('mJOA items are marked as findings, not just scores', mj.itemsAreFindings === true);
check('mJOA resolves its items too', mj.items.length === 3);
check('mJOA prompt block says to report the items in the history',
  /myelopathy history/i.test(summarizePROMsForPrompt(mjoa)));
const dex = mj.items.find((i) => i.id === 'upper_extremity_motor');
const expectedDex = MJOA.sections.find((s) => s.id === 'upper_extremity_motor').options.find((o) => o.score === 3).label;
check('mJOA hand-function wording is exact', dex.answer === expectedDex, `got "${dex.answer}"`);
check('mJOA headline reports out of 18', /of 18/.test(mj.headline), mj.headline);

// "worst" must respect each scale's direction: ODI counts up, mJOA counts down.
check('worst is flagged on the bad end of an ascending scale (ODI)',
  promDetail({ odi: { answers: { walking: 5 } } })[0].items[0].worst === true);
check('worst is NOT flagged on a good ODI answer',
  promDetail({ odi: { answers: { walking: 0 } } })[0].items[0].worst === false);
check('worst is flagged on the bad end of a descending scale (mJOA)',
  promDetail({ mjoa: { answers: { upper_extremity_motor: 0 } } })[0].items[0].worst === true,
  'mJOA 0 is the worst; treating high as bad would invert the flag');
check('worst is NOT flagged on a normal mJOA answer',
  promDetail({ mjoa: { answers: { upper_extremity_motor: 5 } } })[0].items[0].worst === false);

// ---- robustness ------------------------------------------------------------
check('unknown instruments are ignored', promDetail({ nonsense: { answers: { a: 1 } } }).length === 0);
check('a null proms object is safe', promDetail(null).length === 0 && promHeadlines(null).length === 0);
check('an answer code with no matching option is dropped, not rendered blank',
  promDetail({ odi: { answers: { walking: 99 } } })[0]?.items.length === 0);

console.log(`PROMs as history: ${pass}/${pass + fails.length} checks pass`);
if (fails.length) { console.log('\nFAILURES:'); console.log(fails.join('\n')); process.exit(1); }
