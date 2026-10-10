// ============================================================================
// Hand-off to Wey Practice Hub.
//
// Practice Hub is the system of record: it holds the patient charts and the
// staff inboxes. A finished submission is POSTed to its /api/intake endpoint
// as one multipart request carrying the structured answers, the generated
// note, the transcript PDF and every attachment. Practice Hub matches or
// creates the patient and flags the office; this side only needs to know
// whether the hand-off succeeded.
//
// Authentication is a shared service key (practicehub/INTAKE_API_KEY in
// Secrets Manager, the same secret Practice Hub's container reads). It is
// fetched with the runtime's IAM credentials, never stored in an env var in
// production.
// ============================================================================

import { DOCUMENT_CATEGORIES } from '../documentCategories';
import { logError, logEvent } from './log';

export function practiceHubUrl() {
  return (process.env.PRACTICEHUB_URL || '').replace(/\/+$/, '');
}

export function practiceHubConfigured() {
  return !!practiceHubUrl();
}

let cachedKey = null;
let cachedAt = 0;

export async function getApiKey() {
  if (process.env.PRACTICEHUB_API_KEY) return process.env.PRACTICEHUB_API_KEY;
  const secretId = process.env.PRACTICEHUB_API_KEY_SECRET_ID;
  if (!secretId) throw Object.assign(new Error('Practice Hub API key is not configured'), { name: 'ConfigError' });
  if (cachedKey && Date.now() - cachedAt < 10 * 60 * 1000) return cachedKey;
  const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');
  const sm = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });
  const res = await sm.send(new GetSecretValueCommand({ SecretId: secretId }));
  cachedKey = res.SecretString;
  cachedAt = Date.now();
  return cachedKey;
}

const categoryLabel = (id) => DOCUMENT_CATEGORIES.find((c) => c.id === id)?.label || 'Other';

/**
 * The demographic and summary fields Practice Hub needs to file the intake.
 * Everything else travels inside `intake` (full structured answers).
 */
export function buildMeta({ id, intake, note, redFlags, attachments, submittedAt }) {
  const d = intake.demographics || {};
  const cc = intake.chiefComplaint || {};
  const abroad = d.country && !/^(us|usa|u\.s\.a?\.?|united states( of america)?)$/i.test(String(d.country).trim());
  const address = [d.address, [d.city, d.state].filter(Boolean).join(', '), d.zip, abroad ? d.country : ''].filter(Boolean).join(' ');
  return {
    submissionId: id,
    source: 'adult-spine-intake',
    submittedAt,
    language: intake.language || 'en',
    patient: {
      firstName: d.firstName || '',
      lastName: d.lastName || '',
      dob: d.dob || '',
      sex: d.sex || '',
      phone: d.phone || '',
      email: d.email || '',
      address,
      insurance: d.insuranceProvider || '',
      insuranceId: d.memberId || '',
      referringProvider: d.referringPhysician || '',
      pcpName: d.primaryCarePhysician || '',
    },
    summary: {
      visitReason: d.visitReason || '',
      mainReason: cc.mainReason || '',
      duration: cc.duration || '',
      symptomRegions: cc.symptomRegions || [],
      hasPriorSpineSurgery: !!cc.hasPriorSpineSurgery,
    },
    redFlags: (redFlags || []).map((f) => ({ id: f.id, label: f.label, severity: f.severity })),
    note: note ? { narrative: note.narrative, generatedAt: note.generatedAt, model: note.modelId || null, provider: note.provider || null } : null,
    attachments: attachments.map((a, i) => ({
      field: `file${i}`,
      name: a.name,
      contentType: a.contentType,
      size: a.size,
      category: a.category,
      categoryLabel: categoryLabel(a.category),
    })),
  };
}

/**
 * POST the bundle. `loadAttachment(att) -> Buffer` is injected so the caller
 * controls memory (attachments are read one at a time).
 * @returns {Promise<object>} Practice Hub's JSON reply
 */
export async function forwardSubmission({ id, intake, note, redFlags, transcriptPdf, attachments, loadAttachment, submittedAt }) {
  const url = practiceHubUrl();
  if (!url) throw Object.assign(new Error('PRACTICEHUB_URL is not set'), { name: 'ConfigError' });
  const key = await getApiKey();

  const meta = buildMeta({ id, intake, note, redFlags, attachments, submittedAt });
  const fd = new FormData();
  fd.append('meta', JSON.stringify(meta));
  fd.append('intake', JSON.stringify(intake));
  if (transcriptPdf) {
    fd.append('transcript', new Blob([transcriptPdf], { type: 'application/pdf' }), `Intake_${safe(meta.patient.lastName)}_${meta.submittedAt.slice(0, 10)}.pdf`);
  }
  for (let i = 0; i < attachments.length; i++) {
    const a = attachments[i];
    const bytes = await loadAttachment(a);
    if (!bytes) continue;
    fd.append(`file${i}`, new Blob([bytes], { type: a.contentType }), a.name);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);
  const t0 = Date.now();
  try {
    const res = await fetch(`${url}/api/intake`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'X-Intake-Submission-Id': id },
      body: fd,
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-JSON error page */ }
    if (!res.ok) {
      throw Object.assign(new Error(`Practice Hub HTTP ${res.status}`), { name: 'PracticeHubHttpError', status: res.status, code: json?.error ? 'rejected' : 'http' });
    }
    logEvent('practicehub.forwarded', { submissionId: id, ms: Date.now() - t0, attachments: attachments.length, patientStatus: json?.patientStatus });
    return json || { ok: true };
  } catch (err) {
    logError('practicehub.forward_failed', err, { submissionId: id });
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function safe(s) {
  return String(s || 'patient').replace(/[^\w-]+/g, '_').slice(0, 40);
}
