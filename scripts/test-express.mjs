// Offline checks for the express request (lib/express.js): the answer
// readers that pre-fill the confirmation card, the safety and language
// classifiers, the lighter acknowledgments, the red-flag scan over an express
// lead, and the lead note. No server, no AWS.
//
//   node scripts/test-express.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const TMP = path.join(ROOT, '.express-test-tmp');

// lib/ is ESM inside a CommonJS package: stage the modules as .mjs.
const MODULES = ['express', 'languages', 'consent', 'redFlags', 'rosSystems'];
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
for (const name of MODULES) {
  let src = fs.readFileSync(path.join(ROOT, 'lib', `${name}.js`), 'utf8');
  src = src.replace(/from '\.\/([A-Za-z0-9_]+)'/g, "from './$1.mjs'");
  if (name === 'i18n') {
    // The hooks need React; only the language tables are wanted here.
    src = src.replace(/^'use client';\s*/m, '').replace(/import \{ useEffect, useState \} from 'react';\s*/, '').replace(/import \{ useIntake \} from '\.\/store\.mjs';\s*/, '');
    src = src.replace(/export function useLang\(\) \{[\s\S]*?\n\}\n/, 'export function useLang() { return "en"; }\n');
  }
  fs.writeFileSync(path.join(TMP, `${name}.mjs`), src);
}
const X = await import(pathToFileURL(path.join(TMP, 'express.mjs')).href);
const { LANGUAGES } = await import(pathToFileURL(path.join(TMP, 'languages.mjs')).href);
const { expressConsentComplete, consentComplete } = await import(pathToFileURL(path.join(TMP, 'consent.mjs')).href);
const { detectRedFlags } = await import(pathToFileURL(path.join(TMP, 'redFlags.mjs')).href);

let failed = 0;
function check(label, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `\n       got  ${JSON.stringify(got)}\n       want ${JSON.stringify(want)}`}`);
}

// --- who: name and date of birth ------------------------------------------
check('who: plain', X.parseWho('Jane Doe, 3/5/1980'), { firstName: 'Jane', lastName: 'Doe', dob: '1980-03-05' });
check('who: phrased', X.parseWho("Hi, my name is Jane Q. Doe and I was born on March 5th, 1980."), { firstName: 'Jane', lastName: 'Q Doe', dob: '1980-03-05' });
check('who: iso date', X.parseWho('Carlos Mendez Ruiz 1975-11-30'), { firstName: 'Carlos', lastName: 'Mendez Ruiz', dob: '1975-11-30' });
check('who: spanish', X.parseWho('Me llamo María García, nací el 5 de marzo de 1980'), { firstName: 'María', lastName: 'García', dob: '1980-03-05' });
check('who: chinese date', X.parseWho('王小明 1980年3月5日'), { firstName: '王小明', lastName: '', dob: '1980-03-05' });
check('who: two-digit year', X.parseWho('Sam Lee 03-05-80'), { firstName: 'Sam', lastName: 'Lee', dob: '1980-03-05' });
check('who: no date', X.parseWho('Sam Lee'), { firstName: 'Sam', lastName: 'Lee', dob: '' });
check('who: day first when month impossible', X.parseWho('Ana Silva 25/12/1990'), { firstName: 'Ana', lastName: 'Silva', dob: '1990-12-25' });

// --- contact ---------------------------------------------------------------
check('contact: phone', X.parseContact('201-555-0142'), { phone: '(201) 555-0142', email: '' });
check('contact: phrased phone', X.parseContact('you can call me at (201) 555 0142 after 5'), { phone: '(201) 555-0142', email: '' });
check('contact: country code', X.parseContact('+1 201 555 0142'), { phone: '(201) 555-0142', email: '' });
check('contact: email', X.parseContact('jane.doe@example.com'), { phone: '', email: 'jane.doe@example.com' });
check('contact: both', X.parseContact('2015550142 or jane@example.com'), { phone: '(201) 555-0142', email: 'jane@example.com' });
check('contact: nothing usable', X.parseContact('later'), { phone: '', email: '' });

// --- safety and language -----------------------------------------------------
check('safety: chip', X.classifySafety('No, none of these'), 'none');
check('safety: no', X.classifySafety('no'), 'none');
check('safety: yes', X.classifySafety('Yes, I have had trouble with my bladder'), 'yes');
check('safety: unsure', X.classifySafety("I'm not sure, maybe"), 'unsure');
check('safety: spanish no', X.classifySafety('No, ninguno'), 'none');
check('safety: chinese none', X.classifySafety('没有'), 'none');
check('safety: unknown', X.classifySafety('my back hurts'), '');
check('language: chip code', X.classifyLanguage('es', LANGUAGES), 'es');
check('language: native label', X.classifyLanguage('Español', LANGUAGES), 'es');
check('language: english word', X.classifyLanguage('Korean please', LANGUAGES), 'ko');
check('language: alias', X.classifyLanguage('Mandarin', LANGUAGES), 'zh');
check('language: unknown', X.classifyLanguage('whatever is easiest', LANGUAGES), '');

// --- acknowledgments -------------------------------------------------------
check('express consent: complete', expressConsentComplete({ accurate: true, contact: true, signatureName: 'Jane Doe' }), true);
check('express consent: missing box', expressConsentComplete({ accurate: true, contact: false, signatureName: 'Jane Doe' }), false);
check('express consent is not full consent', consentComplete({ accurate: true, contact: true, signatureName: 'Jane Doe' }), false);

// --- a lead, end to end through the shared pieces ---------------------------
const lead = {
  language: 'en',
  demographics: { firstName: 'Jane', lastName: 'Doe', dob: '1980-03-05', phone: '(201) 555-0142', email: '' },
  chiefComplaint: { mainReason: 'Low back pain going down my right leg for two months, worse sitting. Some days I can\'t hold urine.' },
  express: {
    startedAt: '2026-10-20T14:00:00.000Z', completedAt: '2026-10-20T14:04:00.000Z', phase: 'done', safety: 'yes', callLanguage: 'es',
    answers: { who: 'Jane Doe 3/5/1980', contact: '201-555-0142', problem: 'Low back pain...', safety: 'Yes, one or more of these', language: 'Español' },
    transcript: [{ role: 'assistant', content: 'Hello! What is your full name and date of birth?' }, { role: 'user', content: 'Jane Doe 3/5/1980' }],
  },
};
check('isExpressLead', X.isExpressLead(lead), true);
check('isExpressLead: in progress is not a lead', X.isExpressLead({ express: { phase: 'chat' } }), false);
const flags = detectRedFlags(lead);
check('red flags: bladder phrase found in the lead text', flags.map((f) => f.id).includes('cauda_equina_bowel_bladder'), true);
const note = X.expressLeadNarrative(lead, flags);
check('note: title', note.startsWith('EXPRESS APPOINTMENT REQUEST'), true);
check('note: names the patient and DOB', note.includes('Doe, Jane, DOB 5 Mar 1980'), true);
check('note: phone', note.includes('phone (201) 555-0142'), true);
check('note: call language', note.includes('Language for the call: Spanish'), true);
check('note: safety yes is loud', note.includes('PATIENT REPORTS ONE OR MORE'), true);
check('note: asks for a call today', note.includes('Call to schedule a new-patient visit today'), true);
check('note: says it is not an intake', note.includes('not a completed intake'), true);
console.log('\n--- lead note ---\n' + note + '\n---');

fs.rmSync(TMP, { recursive: true, force: true });
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed');
process.exit(failed ? 1 : 0);
