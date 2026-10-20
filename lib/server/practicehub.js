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
import { mostRecentOperation, operationDate, operationsForHandoff } from '../operations';
import { LANGUAGE_NAMES } from '../languages';
import { isExpressLead } from '../express';
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

/** Registration details that have no column of their own on the chart; written to its notes. */
function chartNotes(d) {
  const out = [];
  const plan = [
    ['Group', d.groupNumber],
    ['Plan phone', d.insurancePhone],
    ['Policy holder', [d.policyHolderName, d.policyHolderRelationship, d.policyHolderDob && `DOB ${d.policyHolderDob}`].filter(Boolean).join(', ')],
  ].filter(([, v]) => v);
  if (plan.length) out.push('Primary insurance: ' + plan.map(([k, v]) => `${k} ${v}`).join(' | '));
  if (d.secondaryInsurance || d.secondaryMemberId) out.push('Secondary insurance: ' + [d.secondaryInsurance, d.secondaryMemberId && `ID ${d.secondaryMemberId}`, d.secondaryGroupNumber && `Group ${d.secondaryGroupNumber}`].filter(Boolean).join(' | '));
  if (d.referringPhone || d.referringFax) out.push('Referring physician: ' + [d.referringPhysician, d.referringPhone && `ph ${d.referringPhone}`, d.referringFax && `fax ${d.referringFax}`].filter(Boolean).join(', '));
  if (d.emergencyContactName || d.emergencyContactPhone) out.push('Emergency contact: ' + [d.emergencyContactName, d.emergencyContactRelation, d.emergencyContactPhone].filter(Boolean).join(', '));
  return out.join('\n').slice(0, 4000);
}

/**
 * The demographic and summary fields Practice Hub needs to file the intake.
 * Everything else travels inside `intake` (full structured answers).
 */
export function buildMeta({ id, intake, note, redFlags, attachments, submittedAt }) {
  const d = intake.demographics || {};
  const cc = intake.chiefComplaint || {};
  const v = intake.visit || {};
  const wc = v.wc || {};
  const pi = v.pi || {};
  const po = v.postop || {};
  const express = isExpressLead(intake);
  const x = intake.express || {};
  const abroad = d.country && !/^(us|usa|u\.s\.a?\.?|united states( of america)?)$/i.test(String(d.country).trim());
  const address = [d.address, [d.city, d.state].filter(Boolean).join(', '), d.zip, abroad ? d.country : ''].filter(Boolean).join(' ');
  return {
    submissionId: id,
    // From a link the office sent from the chart: Practice Hub files the intake there.
    ...(intake.invite?.status === 'ok' && intake.invite?.token ? { inviteToken: intake.invite.token } : {}),
    source: 'adult-spine-intake',
    // The ad or link that brought the patient in (lib/campaign.js), for the
    // office's own reporting. Never forwarded to an ad platform.
    ...(intake.campaign ? { campaign: intake.campaign } : {}),
    submittedAt,
    // The express lead names the language the patient wants for the call.
    language: express ? (LANGUAGE_NAMES[x.callLanguage || intake.language] || x.callLanguage || intake.language || 'en') : (intake.language || 'en'),
    // A lead from the website chat (lib/express.js). A later full intake
    // started from that lead carries its submission id.
    ...(express ? { express: true } : {}),
    ...(x.leadId ? { expressLeadId: x.leadId } : {}),
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
      pcpPhone: d.pcpPhone || '',
      pcpFax: d.pcpFax || '',
      chartNotes: chartNotes(d),
    },
    summary: {
      visitReason: d.visitReason || (express ? 'Express request from the website chat: please call to schedule' : ''),
      ...(express ? { express: true, safetyScreen: x.safety || '' } : {}),
      // 'new' | 'followup' | 'postop' | 'workers_comp' (lib/flows.js)
      visitType: v.type || 'new',
      mainReason: cc.mainReason || '',
      duration: cc.duration || '',
      symptomRegions: cc.symptomRegions || [],
      hasPriorSpineSurgery: !!cc.hasPriorSpineSurgery,
      // Workers' compensation: what the office needs to bill and to file.
      ...(v.type === 'workers_comp' ? {
        claimNumber: wc.claimNumber || '',
        dateOfInjury: wc.dateOfInjury || '',
        employer: wc.employer || '',
        carrier: wc.carrier || '',
        adjusterName: wc.adjusterName || '',
        adjusterContact: wc.adjusterContact || '',
        attorneyName: wc.attorney === 'Yes' ? wc.attorneyName || '' : '',
        workStatus: wc.workStatus || '',
      } : {}),
      // An injury with a legal claim: what the office needs to file and bill.
      ...(v.type === 'personal_injury' ? {
        claimNumber: pi.claimNumber || '',
        dateOfInjury: pi.dateOfInjury || '',
        accidentType: pi.accidentType || '',
        carrier: pi.insurer || '',
        attorneyName: [pi.attorneyName, pi.attorneyFirm].filter(Boolean).join(', '),
        adjusterContact: pi.attorneyContact || '',
        letterOfProtection: pi.letterOfProtection || '',
        workStatus: pi.workStatus || '',
      } : {}),
      // Post-operative: the most recent operation, and every operation the
      // patient listed so the chart can keep them for future visits.
      ...(v.type === 'postop' ? (() => {
        const recent = mostRecentOperation(po.operations || []);
        return {
          procedure: recent?.procedure || '',
          surgeryDate: recent ? operationDate(recent) : '',
          surgeryWhere: recent?.where || '',
          operations: operationsForHandoff(po.operations || []),
        };
      })() : {}),
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
