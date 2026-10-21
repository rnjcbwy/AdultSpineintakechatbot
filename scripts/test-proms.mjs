/**
 * PROM answers must reach the note as words, not as answer codes — for every
 * service.
 *
 *   node scripts/test-proms.mjs
 *
 * The questionnaires store an answer as its numeric option value. That was
 * handed to the note generator raw, so "walking: 4" arrived with no option
 * list and the model could only echo the score — every item the patient
 * answered was collected and then dropped. These check it comes back as the
 * sentence the patient actually chose, that each instrument is scored as
 * published (ODI percentage; mJOA out of 18; QuickDASH formula; LEFS sum;
 * HOOS JR / KOOS JR raw sum, reported honestly until the interval table is
 * loaded), and that the spine and ortho modules expose the same shape, so the
 * one PROMs step (components/steps/PROMs.js) can serve both.
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
    [`${dir}/questionnaires.js`, `${dir}/__q.test.mjs`, (t) => t],
    [`${dir}/promSummary.js`, `${dir}/__ps.test.mjs`, (t) => t.replace("from './questionnaires'", "from './__q.test.mjs'")],
  ];
  for (const [src, dst, tr] of COPIES) fs.writeFileSync(path.resolve(dst), tr(fs.readFileSync(path.resolve(src), 'utf8')));
  try {
    const q = await import(pathToFileURL(path.resolve(`${dir}/__q.test.mjs`)).href);
    const ps = await import(pathToFileURL(path.resolve(`${dir}/__ps.test.mjs`)).href);
    return { q, ps };
  } finally {
    for (const [, dst] of COPIES) fs.unlinkSync(path.resolve(dst));
  }
}
const spine = await load('spine');
const ortho = await load('ortho');

let pass = 0; const fails = [];
const check = (n, c, d = '') => { if (c) pass++; else fails.push(`  ${n}${d ? `\n     ${d}` : ''}`); };

// ============================================================================
// The shape both services share. components/steps/PROMs.js reads exactly
// these names through useService(); an instrument-specific export (ODI,
// QUICKDASH) may exist on one side only, but nothing shared may.
// ============================================================================
const SHARED_Q = { QUESTIONNAIRES: 'object', scoreQuestionnaire: 'function', getApplicableQuestionnaires: 'function', TRANSLATIONS: 'object' };
const SHARED_PS = { headline: 'function', promDetail: 'function', summarizePROMsForPrompt: 'function', promHeadlines: 'function', scorePreview: 'function' };
const EVERY_REGION = ['low-back', 'neck', 'posture-deformity', 'balance', 'right-knee', 'left-hip', 'right-shoulder', 'left-foot'];

for (const [name, svc] of [['spine', spine], ['ortho', ortho]]) {
  for (const [k, type] of Object.entries(SHARED_Q)) check(`${name} questionnaires exports ${k}`, typeof svc.q[k] === type);
  for (const [k, type] of Object.entries(SHARED_PS)) check(`${name} promSummary exports ${k}`, typeof svc.ps[k] === type);
  const { QUESTIONNAIRES: Q, TRANSLATIONS: TR, scoreQuestionnaire, getApplicableQuestionnaires } = svc.q;
  const { scorePreview, promDetail } = svc.ps;
  check(`${name} offers at least one instrument`, Object.keys(Q).length > 0);

  for (const [id, q] of Object.entries(Q)) {
    const items = q.questions || q.sections;
    check(`${name} ${id}: id matches its key`, q.id === id);
    check(`${name} ${id}: has a name, short name, description and items`,
      !!(q.name && q.shortName && q.description && Array.isArray(items) && items.length));
    check(`${name} ${id}: every item has an id, wording and scored options`,
      items.every((s) => s.id !== undefined && (s.title || s.text) && Array.isArray(s.options) && s.options.length
        && s.options.every((o) => typeof o.score === 'number' && o.label)));

    // Every word the patient reads is translated beside its definition.
    const strings = [q.name, q.description,
      ...items.flatMap((s) => [s.title || s.text, s.subtitle, ...s.options.map((o) => o.label)]),
      ...(q.domains || []).map((d) => d.name)].filter(Boolean);
    const untranslated = strings.filter((s) => !TR[s]?.es || !TR[s]?.zh);
    check(`${name} ${id}: every patient-facing string has es and zh`, untranslated.length === 0, untranslated.slice(0, 3).join(' | '));

    // A fully answered instrument scores, previews and resolves to words.
    const full = Object.fromEntries(items.map((s) => [s.id, s.options[0].score]));
    const score = scoreQuestionnaire(id, full);
    check(`${name} ${id}: a full answer set scores`, !!score);
    const view = scorePreview(id, score, (s) => `<${s}>`);
    check(`${name} ${id}: the preview has a headline figure`, !!view && typeof view.big === 'string' && view.big.length > 0, JSON.stringify(view));
    check(`${name} ${id}: the preview's tone is named, not a class`, !view?.tone || /^[a-z]+$/.test(view.tone), view?.tone);
    check(`${name} ${id}: a preview interpretation is translated`,
      !view?.interpretation || !!TR[view.interpretation] || /^\d+% of maximal function$/.test(view.interpretation), view?.interpretation);
    const [detail] = promDetail({ [id]: { answers: full } });
    // An instrument of titled sections resolves every item to its wording; one
    // laid out as numbered questions (SRS-22r) is scored by domain instead.
    check(`${name} ${id}: every answered item resolves to its option wording, or the domains are scored`,
      !!detail && (q.sections
        ? detail.items.length === items.length && detail.items.every((i) => typeof i.answer === 'string')
        : !!detail.domainScores && Object.keys(detail.domainScores).length > 0));
    check(`${name} ${id}: the headline is a string`, typeof detail?.headline === 'string' && detail.headline.length > 0);

    check(`${name} ${id}: an empty answer set does not score`, scoreQuestionnaire(id, {}) === null);
    check(`${name} ${id}: nothing to preview without a score`, scorePreview(id, null) === null);
  }
  check(`${name}: an unknown instrument does not score`, scoreQuestionnaire('nonsense', { a: 1 }) === null);
  check(`${name}: no symptoms select no questionnaire`, getApplicableQuestionnaires({}).length === 0);
  const picked = getApplicableQuestionnaires({ chiefComplaint: { symptomRegions: EVERY_REGION } });
  check(`${name}: whatever is selected is an instrument this service has`, picked.length > 0 && picked.every((id) => Q[id]), picked.join());
}

// ============================================================================
// Spine
// ============================================================================
{
  const { promDetail, summarizePROMsForPrompt, promHeadlines, scorePreview } = spine.ps;
  const { ODI, MJOA, scoreQuestionnaire } = spine.q;

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

  // ---- the score preview reads as the spine form always has ----------------
  const t = (s) => ({ of: 'de', sections: 'secciones', 'overall mean': 'media general' }[s] || s);
  const odiView = scorePreview('odi', scoreQuestionnaire('odi', odiAnswers), t);
  check('ODI previews as a percentage with the sections answered',
    odiView.big === '50%' && odiView.count === '(4 de 10 secciones)' && !odiView.small, JSON.stringify(odiView));
  check('ODI preview carries the interpretation and a tone',
    odiView.interpretation === 'Severe disability' && odiView.tone === 'orange', JSON.stringify(odiView));
  const mjView = scorePreview('mjoa', scoreQuestionnaire('mjoa', mjoa.mjoa.answers), t);
  check('mJOA previews as a total out of 18', mjView.big === '11' && mjView.small === '/ 18' && !mjView.count, JSON.stringify(mjView));
  check('mJOA preview tone follows the interpretation', mjView.interpretation === 'Severe myelopathy' && mjView.tone === 'red');
  const srsView = scorePreview('srs22r', scoreQuestionnaire('srs22r', { 1: 5, 2: 4, 5: 3 }), t);
  check('SRS-22r previews the overall mean and its domains',
    srsView.big === '3.75' && srsView.small === '/ 5.0 media general' && srsView.domains.length === 2 && !srsView.interpretation,
    JSON.stringify(srsView));

  // ---- robustness ------------------------------------------------------------
  check('unknown instruments are ignored', promDetail({ nonsense: { answers: { a: 1 } } }).length === 0);
  check('a null proms object is safe', promDetail(null).length === 0 && promHeadlines(null).length === 0);
  check('an answer code with no matching option is dropped, not rendered blank',
    promDetail({ odi: { answers: { walking: 99 } } })[0]?.items.length === 0);
}

// ============================================================================
// Ortho
// ============================================================================
{
  const { promDetail, summarizePROMsForPrompt, scorePreview, headline } = ortho.ps;
  const { QUICKDASH, KOOS_JR, LEFS, scoreQuickDash, scoreLefs, scoreQuestionnaire, getApplicableQuestionnaires } = ortho.q;

  // ---- KOOS JR: answers resolve to the patient's chosen sentence --------------
  const koosAnswers = { stiffness: 2, pain_stairs: 3, fn_rising: 1, pain_twisting: 4 };
  const proms = { koos_jr: { answers: koosAnswers, score: null } };
  const [koos] = promDetail(proms);

  check('the instrument is identified', koos && koos.shortName === 'KOOS JR');
  check('a score is computed even when none was stored', koos.score && typeof koos.score.rawScore === 'number',
    JSON.stringify(koos.score));
  check('every answered item comes back', koos.items.length === 4, `got ${koos.items.length}`);
  check('items carry their section title', koos.items.some((i) => /stairs/i.test(i.title)));

  const stairs = koos.items.find((i) => i.id === 'pain_stairs');
  const expectedStairs = KOOS_JR.sections.find((s) => s.id === 'pain_stairs').options.find((o) => o.score === 3).label;
  check('the answer is the exact option the patient picked',
    stairs.answer === expectedStairs,
    `got "${stairs.answer}"`);
  check('an unanswered item is omitted rather than guessed',
    !koos.items.some((i) => i.id === 'fn_bending'));
  check('an incomplete KOOS JR is marked incomplete, not converted', koos.score.incomplete === true && koos.score.interval === null);

  // ---- the prompt block ------------------------------------------------------
  const block = summarizePROMsForPrompt(proms);
  check('the prompt block names the instrument', /KOOS JR/.test(block));
  check('the prompt block carries the raw score honestly', /raw 10 of 28/.test(block), block);
  check('the prompt block quotes the item wording', block.includes(expectedStairs), block);
  check('the prompt block tells the writer not to convert the raw sum', /do not convert/.test(block));
  check('the prompt block contains no bare answer codes',
    !/^\s*-\s*\w+:\s*\d+\s*$/m.test(block),
    'a raw "stairs: 3" line is exactly the failure being fixed');
  check('an empty answer set is skipped', promDetail({ koos_jr: { answers: {} } }).length === 0);

  // ---- QuickDASH scoring: ((sum / n) - 1) x 25 --------------------------------
  const allOnes = Object.fromEntries(QUICKDASH.sections.map((s) => [s.id, 1]));
  check('QuickDASH with every item at 1 scores 0', scoreQuickDash(allOnes).score === 0);
  const allFives = Object.fromEntries(QUICKDASH.sections.map((s) => [s.id, 5]));
  check('QuickDASH with every item at 5 scores 100', scoreQuickDash(allFives).score === 100);
  const tenOfEleven = { ...allFives }; delete tenOfEleven.sleep;
  check('QuickDASH is valid with 10 of 11 answered', scoreQuickDash(tenOfEleven).incomplete === false);
  const nineOfEleven = { ...tenOfEleven }; delete nineOfEleven.tingling;
  check('QuickDASH with 9 answered is flagged incomplete', scoreQuickDash(nineOfEleven).incomplete === true);
  const mixed = { ...allOnes, jar: 3, carry: 3 }; // sum 15 over 11 -> (15/11 - 1) * 25 = 9.09 -> 9
  check('QuickDASH formula matches the published one', scoreQuickDash(mixed).score === 9, `got ${scoreQuickDash(mixed).score}`);
  check('QuickDASH headline reports out of 100', /of 100/.test(promDetail({ quickdash: { answers: allFives } })[0].headline));

  // ---- LEFS: higher is better ------------------------------------------------
  const lefsPerfect = Object.fromEntries(LEFS.sections.map((s) => [s.id, 4]));
  check('LEFS perfect function scores 80', scoreLefs(lefsPerfect).totalScore === 80 && scoreLefs(lefsPerfect).percentOfMaximal === 100);
  check('LEFS headline reports out of 80', /of 80/.test(promDetail({ lefs: { answers: lefsPerfect } })[0].headline));

  // "worst" must respect each scale's direction: KOOS JR counts up, LEFS counts down.
  check('worst is flagged on the bad end of an ascending scale (KOOS JR)',
    promDetail({ koos_jr: { answers: { pain_stairs: 4 } } })[0].items[0].worst === true);
  check('worst is NOT flagged on a good KOOS JR answer',
    promDetail({ koos_jr: { answers: { pain_stairs: 0 } } })[0].items[0].worst === false);
  check('worst is flagged on the bad end of a descending scale (LEFS)',
    promDetail({ lefs: { answers: { squat: 0 } } })[0].items[0].worst === true,
    'LEFS 0 is the worst; treating high as bad would invert the flag');
  check('worst is NOT flagged on a normal LEFS answer',
    promDetail({ lefs: { answers: { squat: 4 } } })[0].items[0].worst === false);

  // ---- selection by joint ----------------------------------------------------
  const pick = (regions) => getApplicableQuestionnaires({ chiefComplaint: { symptomRegions: regions } });
  check('a shoulder selects QuickDASH', pick(['right-shoulder']).join() === 'quickdash');
  check('a hand selects QuickDASH, once', pick(['right-hand', 'left-hand']).join() === 'quickdash');
  check('the upper arm, forearm and wrist select QuickDASH', ['right-arm', 'left-forearm', 'right-wrist'].every((r) => pick([r]).join() === 'quickdash'));
  check('a hip selects HOOS JR', pick(['left-hip']).join() === 'hoos_jr');
  check('a knee selects KOOS JR', pick(['right-knee']).join() === 'koos_jr');
  check('an ankle selects LEFS', pick(['left-ankle']).join() === 'lefs');
  check('a foot selects LEFS', pick(['left-foot']).join() === 'lefs');
  check('the thigh, lower leg, pelvis, tailbone and SI joint select LEFS', ['right-thigh', 'left-leg', 'pelvis', 'tailbone', 'right-si'].every((r) => pick([r]).join() === 'lefs'));
  check('a knee with an ankle selects KOOS JR and LEFS', pick(['right-knee', 'right-ankle']).join() === 'koos_jr,lefs');
  check('neck or back alone selects nothing', pick(['neck-back']).length === 0);
  check('ride-along chips select nothing on their own', pick(['swelling', 'trauma']).length === 0);

  // ---- the score preview reads as the ortho form always has ----------------
  const t = (s) => ({ of: 'de', items: 'preguntas', answered: 'respondidas' }[s] || s);
  const qdView = scorePreview('quickdash', scoreQuestionnaire('quickdash', mixed), t);
  check('QuickDASH previews out of 100 with the items answered',
    qdView.big === '9' && qdView.small === '/ 100' && qdView.count === '(11 de 11 preguntas respondidas)' && qdView.tone === 'teal',
    JSON.stringify(qdView));
  check('the preview reads out the same headline the note gets', qdView.srText === headline('quickdash', scoreQuestionnaire('quickdash', mixed)));
  const koosView = scorePreview('koos_jr', koos.score, t);
  check('an incomplete KOOS JR previews its raw sum, muted',
    koosView.big === '10' && koosView.small === '/ 28' && koosView.tone === 'muted' && koosView.interpretation === 'Incomplete', JSON.stringify(koosView));
  const lefsView = scorePreview('lefs', scoreLefs(lefsPerfect), t);
  check('LEFS previews out of 80 in green', lefsView.big === '80' && lefsView.small === '/ 80' && lefsView.tone === 'green', JSON.stringify(lefsView));

  // ---- robustness ------------------------------------------------------------
  check('an answer code with no matching option is dropped, not rendered blank',
    promDetail({ koos_jr: { answers: { pain_stairs: 99 } } })[0]?.items.length === 0);
}

console.log(`PROMs as history: ${pass}/${pass + fails.length} checks pass`);
if (fails.length) { console.log('\nFAILURES:'); console.log(fails.join('\n')); process.exit(1); }
