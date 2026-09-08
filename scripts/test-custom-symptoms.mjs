/**
 * Patient-defined symptom types, and the fingerprint that keeps the note honest.
 *
 *   node scripts/test-custom-symptoms.mjs
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const COPIES = [
  ['lib/bodyMap.js', 'lib/__bm2.test.mjs', (t) => t],
  ['lib/noteFingerprint.js', 'lib/__fp.test.mjs', (t) => t],
];
for (const [src, dst, tr] of COPIES) fs.writeFileSync(path.resolve(dst), tr(fs.readFileSync(path.resolve(src), 'utf8')));
let bm, fp;
try {
  bm = await import(pathToFileURL(path.resolve('lib/__bm2.test.mjs')).href);
  fp = await import(pathToFileURL(path.resolve('lib/__fp.test.mjs')).href);
} finally { for (const [, dst] of COPIES) fs.unlinkSync(path.resolve(dst)); }

const { SYMPTOM_TYPES, CUSTOM_MARKER_STYLES, MAX_CUSTOM_TYPES, allTypes, customTypes, getType, summarizePainMap, EMPTY_PAIN_MAP } = bm;
const { fingerprintAnswers, isNoteStale } = fp;

let pass = 0; const fails = [];
const check = (n, c, d = '') => { if (c) pass++; else fails.push(`  ${n}${d ? `\n     ${d}` : ''}`); };

// ---- marker styles ---------------------------------------------------------
check('four custom marker styles are offered', CUSTOM_MARKER_STYLES.length === 4 && MAX_CUSTOM_TYPES === 4);
check('every custom style has a unique shape',
  new Set(CUSTOM_MARKER_STYLES.map((s) => s.shape)).size === 4,
  'shape must carry the distinction on a black-and-white printout');
check('every custom style has a unique colour',
  new Set(CUSTOM_MARKER_STYLES.map((s) => s.color)).size === 4);
check('no custom colour collides with a built-in',
  !CUSTOM_MARKER_STYLES.some((c) => SYMPTOM_TYPES.some((b) => b.color.toUpperCase() === c.color.toUpperCase())));
check('no custom shape collides with a built-in',
  !CUSTOM_MARKER_STYLES.some((c) => SYMPTOM_TYPES.some((b) => b.shape === c.shape)));

// ---- resolution ------------------------------------------------------------
const itching = { id: 'custom_a', label: 'Itching', custom: true, style: 'pink', shape: 'triangle', color: '#DB2777' };
const map = JSON.parse(JSON.stringify(EMPTY_PAIN_MAP));
map.customTypes = [itching];
map.anterior.marks = [
  { id: 'm1', x: 0.4, y: 0.5, type: 'custom_a', zone: 'right thigh' },
  { id: 'm2', x: 0.5, y: 0.4, type: 'ache', zone: 'abdomen' },
];

check('customTypes reads them back', customTypes(map).length === 1);
check('allTypes appends custom to the built-ins', allTypes(map).length === SYMPTOM_TYPES.length + 1);
check('getType resolves a custom id', getType('custom_a', allTypes(map)).label === 'Itching');
check('getType still resolves a built-in', getType('ache', allTypes(map)).label === 'Aching / dull pain');
check('getType falls back rather than throwing on an unknown id',
  !!getType('gone', allTypes(map)),
  'a mark whose type was deleted must still render');
check('malformed custom entries are ignored',
  customTypes({ customTypes: [null, { id: 'x' }, { label: 'y' }] }).length === 0);

// ---- the note must use the patient's own word ------------------------------
const prose = summarizePainMap(map);
check('the summary uses the patient word', /itching at the right thigh/i.test(prose), prose);
check('the summary still handles built-ins', /aching \/ dull pain at the abdomen/i.test(prose), prose);
check('a custom symptom is NOT silently reported as aching',
  (prose.match(/aching/gi) || []).length === 1, prose);

// ---- fingerprint -----------------------------------------------------------
const base = { demographics: { age: 54 }, painMap: map, currentStep: 3, lastUpdated: 'a', completedSteps: [1] };
const fpBase = fingerprintAnswers(base);
check('fingerprint is stable across identical data', fpBase === fingerprintAnswers({ ...base }));
check('fingerprint ignores step bookkeeping',
  fpBase === fingerprintAnswers({ ...base, currentStep: 17, lastUpdated: 'zzz', completedSteps: [1, 2, 3] }),
  'otherwise every navigation would claim the note is stale');
check('fingerprint ignores note corrections',
  fpBase === fingerprintAnswers({ ...base, noteCorrections: [{ id: 'c', comment: 'hi' }] }),
  'corrections have their own rewrite path');
check('fingerprint ignores the generated note itself',
  fpBase === fingerprintAnswers({ ...base, generatedSummary: { narrative: 'x' } }));
check('fingerprint ignores key order',
  fingerprintAnswers({ a: 1, b: 2 }) === fingerprintAnswers({ b: 2, a: 1 }));
check('fingerprint MOVES when an answer changes',
  fpBase !== fingerprintAnswers({ ...base, demographics: { age: 55 } }));
check('fingerprint MOVES when the drawing changes', (() => {
  const m2 = JSON.parse(JSON.stringify(map));
  m2.anterior.marks.push({ id: 'm3', x: 0.6, y: 0.7, type: 'ache', zone: 'left shin' });
  return fpBase !== fingerprintAnswers({ ...base, painMap: m2 });
})());

// ---- staleness -------------------------------------------------------------
check('a note stamped with the current answers is not stale',
  !isNoteStale(base, { sourceFingerprint: fpBase }));
check('a note stamped with older answers IS stale',
  isNoteStale({ ...base, demographics: { age: 55 } }, { sourceFingerprint: fpBase }));
check('a note with no fingerprint is not reported stale',
  !isNoteStale(base, { narrative: 'old note' }),
  'unknown is not evidence of change; nagging would train patients to ignore it');
check('no summary at all is not stale', !isNoteStale(base, null));

console.log(`custom symptoms + fingerprint: ${pass}/${pass + fails.length} checks pass`);
if (fails.length) { console.log('\nFAILURES:'); console.log(fails.join('\n')); process.exit(1); }
