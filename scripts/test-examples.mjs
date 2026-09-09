/**
 * The greyed-out example must become a clean answer when tapped.
 *
 *   node scripts/test-examples.mjs
 *
 * These placeholders are written to MODEL the detail we want — a therapist's
 * full name and phone number, a clinic address — so they contain their own
 * punctuation, including brackets. An earlier version stopped at the first
 * ")" and handed the patient "Dr. Alan Reyes, Front Range Pain — (303", a
 * truncated phone number that looks deliberate once it is in the chart.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const SRC = path.resolve('components/ui/SuggestedAnswers.js');
const TMP = path.resolve('components/ui/__ex.test.mjs');
// Only the pure helper is under test. The rest of the file is JSX, which
// Node's ESM loader cannot parse, so it is sliced off rather than stripped.
const full = fs.readFileSync(SRC, 'utf8');
const start = full.indexOf('export function stripExamplePrefix');
if (start === -1) throw new Error('stripExamplePrefix not found in ' + SRC);
fs.writeFileSync(TMP, full.slice(start));

let mod;
try {
  mod = await import(pathToFileURL(TMP).href);
} finally {
  fs.unlinkSync(TMP);
}
const { stripExamplePrefix } = mod;

const CASES = [
  // The one that bit: a phone number's brackets inside the example.
  ['Who did it? (e.g., Dr. Alan Reyes, Front Range Pain — (303) 555-0199)',
   'Dr. Alan Reyes, Front Range Pain — (303) 555-0199'],
  ['e.g., ProCare Physical Therapy, Denver — (303) 555-0142',
   'ProCare Physical Therapy, Denver — (303) 555-0142'],
  ['e.g., Sarah Mills, PT — (303) 555-0142', 'Sarah Mills, PT — (303) 555-0142'],
  ['e.g., Denver Neurology, 1400 Elm St — (303) 555-0177',
   'Denver Neurology, 1400 Elm St — (303) 555-0177'],

  // Ordinary bracketed prompts still work.
  ['Where? (e.g., L4-L5, left side)', 'L4-L5, left side'],
  ['How many? (e.g., 3)', '3'],
  ['How long did relief last? (e.g., 2 weeks)', '2 weeks'],
  ['When? (e.g., June 2024)', 'June 2024'],

  // Leading-form examples.
  ['e.g., 2x per week', '2x per week'],
  ['e.g., 3 months, spring 2024', '3 months, spring 2024'],
  ['e.g., Lumbar support belt, worn daily for 3 months', 'Lumbar support belt, worn daily for 3 months'],
  ['e.g., Mild nerve irritation on the right at L5', 'Mild nerve irritation on the right at L5'],

  // Not examples at all — must pass through, minus trailing ellipsis.
  ['Describe your main concern...', 'Describe your main concern'],
  ['Physician / provider name', 'Physician / provider name'],
  ['', ''],
];

let pass = 0;
const fails = [];
for (const [input, want] of CASES) {
  const got = stripExamplePrefix(input);
  if (got === want) pass++;
  else fails.push(`  ${JSON.stringify(input)}\n     expected ${JSON.stringify(want)}\n     got      ${JSON.stringify(got)}`);
}

// No result may keep the scaffolding of the prompt it came from.
for (const [input] of CASES) {
  const got = stripExamplePrefix(input);
  if (/^\s*(e\.g\.|for example)/i.test(got)) {
    fails.push(`  ${JSON.stringify(input)} still begins with the example marker: ${JSON.stringify(got)}`);
  } else pass++;
}

// Brackets must be balanced — a lone "(" is the truncation signature.
for (const [input] of CASES) {
  const got = stripExamplePrefix(input);
  const opens = (got.match(/\(/g) || []).length;
  const closes = (got.match(/\)/g) || []).length;
  if (opens !== closes) {
    fails.push(`  ${JSON.stringify(input)} produced unbalanced brackets: ${JSON.stringify(got)}`);
  } else pass++;
}

console.log(`example adoption: ${pass}/${pass + fails.length} checks pass`);
if (fails.length) { console.log('\nFAILURES:'); console.log(fails.join('\n')); process.exit(1); }
