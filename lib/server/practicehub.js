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
import { getService } from '../service';
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

/** The adult who filled in a child's form, as the pediatric intakes sent it ("name - relationship"). */
function guardianName(d, service) {
  const g = d.guardian || {};
  if (service.patient !== 'child' || g.completedBy === 'patient') return '';
  return [g.name, g.relationship].filter(Boolean).join(' - ');
}

/** Registration details that have no column of their own on the chart; written to its notes. */
function chartNotes(d, service) {
  const out = [];
  // A child's visit: who filled the form in, the family's language and
  // preferences, and the other doctors (the pediatric intakes' notes).
  if (guardianName(d, service)) {
    const g = d.guardian || {};
    out.push('Form completed by: ' + [g.name, g.relationship].filter(Boolean).join(' (') + (g.name && g.relationship ? ')' : ''));
  }
  const lang = d.preferredLanguage === 'Other' ? d.otherLanguage : d.preferredLanguage;
  if (lang && !/^english$/i.test(lang)) out.push('Preferred language: ' + lang);
  if (/^yes$/i.test(String(d.interpreterNeeded || ''))) out.push('INTERPRETER REQUESTED');
  else if (d.interpreterNeeded) out.push('Interpreter: ' + d.interpreterNeeded);
  if (d.culturalPreferences) out.push('Cultural or religious preferences: ' + d.culturalPreferences);
  if (d.schedulingConsiderations) out.push('Scheduling: ' + d.schedulingConsiderations);
  if (d.otherProviders) {
    out.push('Other doctors involved:');
    out.push(...String(d.otherProviders).split(/\r?\n/).filter((l) => l.trim()).map((l) => '  ' + l.trim()));
  }
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
  // The service's own operations module reads its operation shapes (levels
  // for the spine, side and joint for a bone or joint).
  const service = getService(intake.service?.key);
  const { mostRecentOperation, operationDate, operationsForHandoff } = service.operations;
  const abroad = d.country && !/^(us|usa|u\.s\.a?\.?|united states( of america)?)$/i.test(String(d.country).trim());
  const address = [d.address, [d.city, d.state].filter(Boolean).join(', '), d.zip, abroad ? d.country : ''].filter(Boolean).join(' ');
  // A child's visit: the adult who answered, the growth measurements and the
  // clinical photos, under the names the pediatric intakes sent them by.
  const child = service.patient === 'child';
  const g = d.guardian || {};
  const gr = d.growth || {};
  const respondentType = child ? (g.completedBy === 'patient' ? 'patient' : 'parent') : '';
  const growthData = child ? {
    heightFeet: gr.heightFeet || '', heightInches: gr.heightInches || '', weightLbs: gr.weightLbs || '',
    hasMenarche: gr.hasMenarche || '', menarcheOnset: gr.menarcheOnset || '', recentGrowthSpurt: gr.recentGrowthSpurt || '',
    handedness: gr.handedness || '', grade: gr.grade || '', school: gr.school || '',
    sports: Array.isArray(gr.sports) ? gr.sports : [], otherActivities: gr.otherActivities || '', activityLevel: gr.activityLevel || '',
  } : null;
  const clinicalPhotos = attachments
    .map((a, i) => ({ a, i }))
    .filter(({ a }) => a.category === 'clinical_photo')
    .map(({ a, i }) => ({ field: `file${i}`, name: a.name, label: /^([a-z]+(?:-[a-z]+)*)-/.exec(a.name || '')?.[1] || '' }));
  return {
    submissionId: id,
    // From a link the office sent from the chart: Practice Hub files the intake there.
    ...(intake.invite?.status === 'ok' && intake.invite?.token ? { inviteToken: intake.invite.token } : {}),
    source: service.source,
    form: service.key,
    // Whether the patient is a child ('child' | 'adult', lib/service.js).
    patientType: service.patient,
    child,
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
      // A child's parent or guardian ("name - relationship"), as the
      // pediatric intakes sent it; empty for an adult or a child who
      // answered for themselves.
      guardianName: guardianName(d, service),
      // Which service line the chart belongs to, so a child is never filed
      // under the adult spine.
      service: service.key,
      ...(child ? { schoolOrEmployer: gr.grade ? String(gr.grade) : '' } : {}),
      chartNotes: chartNotes(d, service),
    },
    summary: {
      visitReason: d.visitReason || (express ? 'Express request from the website chat: please call to schedule' : ''),
      // A child's visit (the pediatric intakes' names): who answered, the
      // growth measurements, the clinical photos among the attachments.
      ...(child ? {
        age: d.age ? Number(d.age) : null,
        respondentType,
        respondentName: respondentType === 'parent' ? g.name || '' : '',
        relationship: respondentType === 'parent' ? g.relationship || '' : '',
        respondent: respondentType === 'patient' ? 'Patient' : [g.name, g.relationship].filter(Boolean).join(' / '),
        growthData,
        clinicalPhotos,
      } : {}),
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
