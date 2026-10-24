// End-to-end check of an express request against a running dev server: one
// chat turn through /api/chat in express mode (needs Bedrock credentials;
// skipped cleanly without them), then the lead through the ordinary
// submission path: submit, finalize, poll until the lead note is written.
//
//   node scripts/e2e-express-submit.mjs [http://localhost:3000]
const base = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');

async function j(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

// 1. The page itself, and the frame-ancestors rule that lets the website embed it.
const page = await fetch(`${base}/express`);
const csp = page.headers.get('content-security-policy') || '';
console.log(`GET /express: HTTP ${page.status}; X-Frame-Options=${page.headers.get('x-frame-options') || '(none)'}; frame-ancestors: ${(/frame-ancestors ([^;]+)/.exec(csp) || [])[1] || '(none)'}`);
const home = await fetch(`${base}/`);
console.log(`GET /:        HTTP ${home.status}; X-Frame-Options=${home.headers.get('x-frame-options') || '(none)'}; frame-ancestors: ${(/frame-ancestors ([^;]+)/.exec(home.headers.get('content-security-policy') || '') || [])[1] || '(none)'}`);

// 2. One express chat turn.
const chat = await fetch(`${base}/api/chat`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mode: 'express', messages: [], context: 'EXPRESS APPOINTMENT REQUEST\nLANGUAGE TO WRITE IN: English\n\nTHIS TURN (question 1 of 6): Ask for the patient\'s full name and date of birth (both, in one question). This is the first message: greet the patient in one short sentence first.' }),
});
const c = await j(chat);
console.log(`POST /api/chat (express): HTTP ${chat.status} ${c.reply ? `-> "${c.reply.slice(0, 160)}"` : `-> ${c.error || JSON.stringify(c).slice(0, 160)} (the page falls back to its fixed wording)`}`);

// 3. The lead through the submission path.
const now = new Date().toISOString();
const lead = {
  sessionId: 'e2e-express', createdAt: now, lastUpdated: now, currentStep: 0, completedSteps: [], language: 'en',
  demographics: { firstName: 'Test', lastName: 'Expresslead', dob: '1980-03-05', phone: '(201) 555-0142', email: 'test.expresslead@example.com', insuranceProvider: 'Aetna', memberId: 'W123456789', visitReason: 'Appointment request from the website form' },
  chiefComplaint: { mainReason: 'Neck pain with tingling into my left hand for six weeks. (fictional e2e)', symptomRegions: [], duration: '' },
  consent: { accurate: true, contact: true, signatureName: 'Test Expresslead', signedAt: now },
  express: {
    startedAt: now, completedAt: now, phase: 'done', safety: 'none', callLanguage: 'en', linkEmailed: false, linkEmailError: 'not-configured',
    answers: { who: 'Test Expresslead 3/5/1980', contact: '201-555-0142 test.expresslead@example.com', insurance: 'Aetna, member ID W123456789', problem: 'Neck pain with tingling into my left hand for six weeks.', safety: 'No, none of these', language: 'English' },
    transcript: [
      { role: 'assistant', content: 'Hello! To start, what is your full name and date of birth?', slot: 'who' },
      { role: 'user', content: 'Test Expresslead 3/5/1980', slot: 'who' },
    ],
  },
  documents: [],
};
// 2b. The pre-visit questionnaire link, as the card requests it before sending the lead.
const draft = await fetch(`${base}/api/draft`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intakeData: { ...lead, submittedAt: null }, email: lead.demographics.email, purpose: 'express' }) });
const dr = await j(draft);
console.log(`POST /api/draft (express): HTTP ${draft.status} url=${dr.url ? 'yes' : 'no'} emailed=${dr.emailed} emailError=${dr.emailError || '-'} (EMAIL_FROM ${dr.emailAvailable ? 'set' : 'unset'})`);
const t0 = Date.now();
const submit = await fetch(`${base}/api/intake/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intakeData: lead }) });
const s = await j(submit);
if (!submit.ok) { console.error('submit failed', submit.status, s); process.exit(1); }
console.log(`submitted ${s.id}: ${s.redFlags.length} red flag(s)`);
const auth = { Authorization: `Bearer ${s.token}` };

// A lead without a way to reach the patient is refused.
const bad = await fetch(`${base}/api/intake/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intakeData: { ...lead, demographics: { ...lead.demographics, phone: '', email: '' } } }) });
console.log(`submit without phone/email: HTTP ${bad.status} (${(await j(bad)).error || 'accepted?!'})`);
// And a full intake with only the express acknowledgments is still refused.
const notLead = await fetch(`${base}/api/intake/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intakeData: { ...lead, express: null } }) });
console.log(`full intake with express consent only: HTTP ${notLead.status} (${(await j(notLead)).error || 'accepted?!'})`);

const fin = await fetch(`${base}/api/intake/${s.id}/finalize`, { method: 'POST', headers: auth });
console.log('finalize:', fin.status, await j(fin));

let last = null;
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 1500));
  let st;
  try { st = await j(await fetch(`${base}/api/intake/${s.id}/status`, { headers: auth })); } catch { continue; }
  if (JSON.stringify(st) !== JSON.stringify(last)) {
    console.log(`  ${Math.round((Date.now() - t0) / 1000)}s status=${st.status} note=${st.note ? 'yes' : 'no'} delivered=${st.delivered} handoff=${st.handoffConfigured} error=${st.error ? st.error.step : '-'}`);
    last = st;
  }
  if (st.note && (st.delivered || !st.handoffConfigured || st.error)) break;
}
if (last?.note) console.log('\n--- lead note ---\n' + last.note.narrative + '\n---');
const ok = !!last?.note && last.note.narrative.startsWith('EXPRESS APPOINTMENT REQUEST') && last.note.narrative.includes('Insurance: Aetna, member ID W123456789') && bad.status === 422 && notLead.status === 422 && draft.ok && !!dr.url;
console.log(ok ? 'OK' : 'FAILED', `in ${Math.round((Date.now() - t0) / 1000)}s`);
process.exit(ok ? 0 : 1);
