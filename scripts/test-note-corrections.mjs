/**
 * The patient's corrections must actually reach the rewrite prompt.
 *
 *   node scripts/test-note-corrections.mjs
 *
 * A correction that is captured in the UI but never sent is worse than not
 * offering the feature: the patient believes the note was fixed.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const COPIES = [
  ['lib/bodyMap.js', 'lib/__bm.test.mjs', (t) => t],
  ['lib/prompts.js', 'lib/__pr.test.mjs', (t) => t.replace("from './bodyMap'", "from './__bm.test.mjs'")],
];
for (const [src, dst, tr] of COPIES) {
  fs.writeFileSync(path.resolve(dst), tr(fs.readFileSync(path.resolve(src), 'utf8')));
}
let prompts;
try {
  prompts = await import(pathToFileURL(path.resolve('lib/__pr.test.mjs')).href);
} finally {
  for (const [, dst] of COPIES) fs.unlinkSync(path.resolve(dst));
}
const { buildSummaryPrompt } = prompts;

let pass = 0;
const fails = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++; else fails.push(`  ${name}${detail ? `\n     ${detail}` : ''}`);
};

const base = { demographics: { age: 54 }, reviewOfSystems: {} };

// --- no corrections: the block must not appear at all ----------------------
const clean = buildSummaryPrompt(base);
check('no corrections adds no correction block', !clean.includes('PATIENT CORRECTIONS'));

// --- with corrections ------------------------------------------------------
const withFix = buildSummaryPrompt({
  ...base,
  noteCorrections: [
    { id: 'a', excerpt: 'physical therapy twice weekly for three months in 2019', comment: 'The PT was in 2023, not 2019.' },
    { id: 'b', excerpt: '', comment: 'I never had an injection.' },
  ],
});
check('correction block appears', withFix.includes('PATIENT CORRECTIONS'));
check('the patient comment is included verbatim', withFix.includes('The PT was in 2023, not 2019.'));
check('the second correction is included too', withFix.includes('I never had an injection.'));
check('the quoted excerpt is included', withFix.includes('physical therapy twice weekly for three months in 2019'));
check('the model is told corrections outrank the intake data',
  /follow the CORRECTION/i.test(withFix));
check('corrections are placed before the raw intake JSON',
  withFix.indexOf('PATIENT CORRECTIONS') < withFix.indexOf('INTAKE DATA'));
check('a correction with no excerpt omits the "Regarding" line',
  (withFix.match(/Regarding:/g) || []).length === 1);

// --- junk must not produce an empty scaffold -------------------------------
const blanks = buildSummaryPrompt({ ...base, noteCorrections: [{ id: 'x', comment: '   ' }, null] });
check('blank corrections are dropped entirely', !blanks.includes('PATIENT CORRECTIONS'));

// --- the note stays in English --------------------------------------------
check('language instruction survives', /write the ENTIRE clinical note in ENGLISH/i.test(withFix));

console.log(`note corrections: ${pass}/${pass + fails.length} checks pass`);
if (fails.length) { console.log('\nFAILURES:'); console.log(fails.join('\n')); process.exit(1); }
