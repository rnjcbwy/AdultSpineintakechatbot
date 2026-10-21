import { NextResponse } from 'next/server';
import { limitOr429 } from '../../../lib/server/rateLimit';
import { logError, logEvent } from '../../../lib/server/log';
import { completeWithFile } from '../../../lib/server/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 15 * 1024 * 1024;
const IMAGE = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const DOC = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv',
  'text/html': 'html',
};

const SYSTEM = `You read a patient's own document (a photo of a medication list or pill bottles, a pharmacy printout, a typed list, a discharge summary, a clinic letter, an allergy card) and pull out what belongs on a medical history form. Extract only what the document actually says; never guess a dose, a date or a diagnosis that is not there. Expand obvious abbreviations (qd = once daily, bid = twice daily, PRN = as needed). Leave a field empty when the document does not give it.

Reply with ONE JSON object and nothing else, no code fences:
{
  "medications": [{ "name": "", "dose": "", "frequency": "", "reason": "" }],
  "allergies": [{ "allergen": "", "reaction": "", "type": "Medication" | "Food" | "Environmental" | "Other" }],
  "conditions": [{ "name": "", "yearDiagnosed": "", "details": "" }],
  "surgeries": [{ "type": "", "date": "", "bodyRegion": "", "hospital": "", "surgeon": "" }],
  "notes": ""
}
"notes" is one sentence on anything you could not place (illegible lines, a section you skipped). Use empty arrays for sections the document does not cover.`;

const INSURANCE_SYSTEM = `You read a photo of a patient's health insurance card (front, back, or both) and pull out what the office needs to verify benefits. Read only what is printed; never guess a number.

Reply with ONE JSON object and nothing else, no code fences:
{
  "insurer": "",
  "planName": "",
  "memberId": "",
  "groupNumber": "",
  "memberServicesPhone": "",
  "policyHolderName": "",
  "notes": ""
}
"insurer" is the plan or company name as printed (e.g. "Aetna", "Horizon BCBS NJ"); "planName" the product line if printed (e.g. "PPO", "Medicare Advantage"); "memberId" the member / subscriber / ID number exactly as printed; "groupNumber" the group number if printed; "memberServicesPhone" the member services or customer service phone; "policyHolderName" the subscriber's name as printed; "notes" one sentence on anything unreadable. Leave a field empty when it is not on the card.`;

/**
 * POST /api/extract — multipart with one `file`: a photo, PDF, Word or text
 * document the patient has. The model reads it and returns the medications,
 * allergies, conditions and surgeries it names, as JSON the form can fill in.
 * The file itself is not kept by this route; the browser keeps it as an
 * attached record if the patient chooses.
 */
export async function POST(request) {
  const limited = limitOr429(request, 'extract', 20, 60 * 60_000);
  if (limited) return limited;
  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected a file upload.' }, { status: 400 });
  }
  const file = form.get('file');
  // 'insurance': a photo of the insurance card instead of a medical document.
  const kind = String(form.get('kind') || 'history');
  if (!file || typeof file.arrayBuffer !== 'function') return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'That file is too large (15 MB limit). A photo or a PDF of the list works best.' }, { status: 413 });
  const contentType = String(file.type || '').toLowerCase();
  const name = String(file.name || 'document');
  const ext = name.toLowerCase().split('.').pop();
  const imageFormat = IMAGE[contentType] || (ext === 'jpg' ? 'jpeg' : IMAGE[`image/${ext}`]);
  const docFormat = DOC[contentType] || (['pdf', 'docx', 'doc', 'txt', 'md', 'csv', 'html'].includes(ext) ? ext : null);
  if (!imageFormat && !docFormat) {
    return NextResponse.json({ error: 'Please upload a photo (JPG or PNG), a PDF, a Word document or a text file.' }, { status: 415 });
  }
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const fileArg = imageFormat ? { kind: 'image', format: imageFormat, bytes } : { kind: 'document', format: docFormat, name: name.replace(/[^\w.\- ]+/g, '_').slice(0, 60), bytes };
    if (kind === 'insurance') {
      const { text } = await completeWithFile({ purpose: 'extract', system: INSURANCE_SYSTEM, prompt: 'Here is my insurance card. Please read the plan and the numbers printed on it.', file: fileArg, maxTokens: 600 });
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      const parsed = JSON.parse(text.slice(start, end + 1));
      const field = (k) => String(parsed[k] ?? '').trim().slice(0, 120);
      const out = { insurance: { insurer: field('insurer'), planName: field('planName'), memberId: field('memberId'), groupNumber: field('groupNumber'), memberServicesPhone: field('memberServicesPhone'), policyHolderName: field('policyHolderName') }, notes: String(parsed.notes || '').slice(0, 300) };
      logEvent('extract.complete', { kind: 'insurance', filled: Object.values(out.insurance).filter(Boolean).length });
      return NextResponse.json(out, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const { text } = await completeWithFile({
      purpose: 'extract',
      system: SYSTEM,
      prompt: 'Here is my document. Please pull out the medications, allergies, conditions and surgeries it lists.',
      file: imageFormat ? { kind: 'image', format: imageFormat, bytes } : { kind: 'document', format: docFormat, name: name.replace(/[^\w.\- ]+/g, '_').slice(0, 60), bytes },
      maxTokens: 2000,
    });
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const parsed = JSON.parse(text.slice(start, end + 1));
    const list = (arr, keys) => (Array.isArray(arr) ? arr : [])
      .filter((x) => x && typeof x === 'object')
      .map((x) => Object.fromEntries(keys.map((k) => [k, String(x[k] ?? '').trim().slice(0, 200)])))
      .filter((x) => Object.values(x).some(Boolean))
      .slice(0, 60);
    const out = {
      medications: list(parsed.medications, ['name', 'dose', 'frequency', 'reason']).filter((m) => m.name),
      allergies: list(parsed.allergies, ['allergen', 'reaction', 'type']).filter((a) => a.allergen),
      conditions: list(parsed.conditions, ['name', 'yearDiagnosed', 'details']).filter((c) => c.name),
      surgeries: list(parsed.surgeries, ['type', 'date', 'bodyRegion', 'hospital', 'surgeon']).filter((s) => s.type),
      notes: String(parsed.notes || '').slice(0, 300),
    };
    logEvent('extract.complete', { kind: imageFormat ? 'image' : docFormat, medications: out.medications.length, allergies: out.allergies.length, conditions: out.conditions.length, surgeries: out.surgeries.length });
    return NextResponse.json(out, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    logError('extract.failed', err);
    return NextResponse.json({ error: 'Could not read that document. You can try a clearer photo, or type the list instead.' }, { status: 502 });
  }
}
