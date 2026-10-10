// End-to-end check of the submission pipeline against a running dev server:
// submit the fictional sample intake, upload one attachment, finalize, then
// poll until the note is written and the hand-off (if configured) completes.
//
//   node scripts/e2e-local-submit.mjs [http://localhost:3000]
import fs from 'node:fs';
import path from 'node:path';
import { SAMPLE_INTAKE } from './sample-intake.mjs';

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');
const ROOT = process.cwd();

async function j(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

const t0 = Date.now();
const submit = await fetch(`${base}/api/intake/submit`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ intakeData: SAMPLE_INTAKE }),
});
const s = await j(submit);
if (!submit.ok) { console.error('submit failed', submit.status, s); process.exit(1); }
console.log(`submitted ${s.id}: ${s.uploads.length} upload(s), ${s.redFlags.length} red flag(s)`);
const auth = { Authorization: `Bearer ${s.token}` };

// Upload the sample PDF as the one attachment the sample intake lists.
const samplePdf = path.join(ROOT, '.pdf-tmp', 'sample-transcript.pdf');
for (const u of s.uploads) {
  if (u.skipped) { console.log(`  upload ${u.docId} skipped: ${u.skipped}`); continue; }
  const bytes = fs.existsSync(samplePdf) ? fs.readFileSync(samplePdf) : Buffer.from('%PDF-1.4\n%fake\n');
  const blob = new Blob([bytes], { type: 'application/pdf' });
  let r;
  if (u.local) {
    const fd = new FormData();
    fd.append('file', blob, 'PT discharge summary.pdf');
    r = await fetch(`${base}${u.url}`, { method: 'POST', headers: auth, body: fd });
  } else {
    r = await fetch(u.url, { method: u.method, headers: u.headers, body: blob });
  }
  console.log(`  upload ${u.docId}: HTTP ${r.status}`);
}

const fin = await fetch(`${base}/api/intake/${s.id}/finalize`, { method: 'POST', headers: auth });
console.log('finalize:', fin.status, await j(fin));

let last = null;
for (let i = 0; i < 80; i++) {
  await new Promise((r) => setTimeout(r, 3000));
  let st;
  try {
    st = await j(await fetch(`${base}/api/intake/${s.id}/status`, { headers: auth }));
  } catch {
    continue; // the dev server compiles routes on first hit; a reset here is noise
  }
  if (JSON.stringify(st) !== JSON.stringify(last)) {
    console.log(`  ${Math.round((Date.now() - t0) / 1000)}s status=${st.status} note=${st.note ? 'yes' : 'no'} delivered=${st.delivered} handoff=${st.handoffConfigured} error=${st.error ? st.error.step : '-'}`);
    last = st;
  }
  if (st.note && (st.delivered || !st.handoffConfigured || st.error)) break;
}
if (last?.note) {
  console.log('\n--- note (first 600 chars) ---\n' + last.note.narrative.slice(0, 600) + '\n---');
}
console.log(last?.note ? 'OK' : 'NO NOTE', `in ${Math.round((Date.now() - t0) / 1000)}s`);
process.exit(last?.note ? 0 : 1);
