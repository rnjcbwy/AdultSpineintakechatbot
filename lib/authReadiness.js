// ============================================================================
// Prior-authorization readiness engine.
//
// Two stages:
//   1. extractEvidence()  — intake data  ->  canonical evidence objects
//   2. scoreReadiness()   — evidence + payer criteria  ->  satisfied / missing
//
// The evidence vocabulary is shared with the payer research, so one PT note
// satisfies the pt_supervised requirement for every payer at once rather than
// being reprocessed per payer.
//
// IMPORTANT: this reports DOCUMENTATION COMPLETENESS, not coverage. It answers
// "is the packet likely to contain what the reviewer asks for", never "will
// this be approved". Criteria change; every rule carries its citation and
// effective date so results can be checked against the live policy.
// ============================================================================

import rules from './payers/rules.json';
import { DOCUMENT_CATEGORIES } from './documents';

export const EVIDENCE_LABELS = {
  symptom_duration: 'Symptom duration',
  symptom_severity: 'Symptom severity',
  neuro_deficit: 'Neurologic findings',
  functional_impairment_score: 'Functional impairment',
  pt_supervised: 'Supervised physical therapy',
  home_exercise: 'Home exercise program',
  medication_trial: 'Medication trial',
  injection_esi: 'Epidural steroid injection',
  injection_facet: 'Facet injection',
  injection_si: 'SI joint injection',
  rfa: 'Radiofrequency ablation',
  chiropractic: 'Chiropractic care',
  acupuncture: 'Acupuncture',
  bracing: 'Bracing',
  imaging_mri: 'MRI',
  imaging_ct: 'CT',
  imaging_xray: 'X-ray',
  imaging_flexion_extension: 'Flexion-extension films',
  imaging_myelogram: 'Myelogram',
  emg_ncs: 'EMG / nerve conduction study',
  nicotine_status: 'Nicotine status',
  bmi: 'BMI',
  psych_clearance: 'Behavioral health screening',
  bone_density: 'Bone density (DEXA)',
  prior_op_report: 'Prior operative report',
  instability_documented: 'Documented instability',
  cpt_codes: 'CPT code(s)',
  icd10_codes: 'ICD-10 code(s)',
  spinal_levels: 'Spinal level(s)',
};

/** Evidence the surgeon supplies at booking, not the patient at intake. */
export const CLINICIAN_SUPPLIED = new Set([
  'cpt_codes',
  'icd10_codes',
  'spinal_levels',
  'neuro_deficit',
  'instability_documented',
  'psych_clearance',
  'bmi',
  'bone_density',
]);

const PRESENT = 'present';
const PARTIAL = 'partial';
const ABSENT = 'absent';
const UNKNOWN = 'unknown';

function docsFor(documents, categoryId) {
  return (documents || []).filter((d) => d.category === categoryId);
}

function ev(status, summary, extra = {}) {
  return { status, summary, gaps: [], documents: [], ...extra };
}

/**
 * Turn the intake record into canonical evidence objects.
 * `documents` is the metadata array mirrored from IndexedDB.
 */
export function extractEvidence(intake) {
  const d = intake || {};
  const tx = d.hpiData?.conservativeTreatments || {};
  const auth = d.authEvidence || {};
  const docs = d.documents || [];
  const overall = d.hpiData?.overall || {};
  const out = {};

  // ---- Symptoms -------------------------------------------------------
  out.symptom_duration = d.chiefComplaint?.duration
    ? ev(PRESENT, d.chiefComplaint.duration)
    : ev(ABSENT, 'Not recorded');

  const severities = Object.values(d.hpiData?.symptoms || {})
    .map((s) => s.severity)
    .filter((v) => typeof v === 'number');
  out.symptom_severity = severities.length
    ? ev(PRESENT, `Worst reported ${Math.max(...severities)}/10`)
    : ev(ABSENT, 'Not recorded');

  const neuro = [];
  if (overall.numbness) neuro.push('numbness');
  if (overall.tingling) neuro.push('tingling');
  if (overall.weakness) neuro.push('weakness');
  if (overall.footDrop) neuro.push('foot drop');
  if (overall.gaitChanges) neuro.push('balance/gait changes');
  out.neuro_deficit = neuro.length
    ? ev(PARTIAL, `Patient-reported: ${neuro.join(', ')}`, {
        gaps: ['Objective exam findings must be documented by the surgeon'],
      })
    : ev(UNKNOWN, 'No patient-reported neurologic symptoms; exam findings required from the surgeon');

  // ---- Functional impairment (PROMs) ----------------------------------
  const proms = d.proms || {};
  const scored = Object.entries(proms)
    .filter(([, v]) => v?.score)
    .map(([k, v]) => {
      const s = v.score;
      const val = s.percentage != null ? `${s.percentage}%` : s.totalScore != null ? `${s.totalScore}` : '';
      return `${k.toUpperCase()} ${val}${s.interpretation ? ` (${s.interpretation})` : ''}`;
    });
  out.functional_impairment_score = scored.length
    ? ev(PRESENT, scored.join('; '))
    : ev(ABSENT, 'No outcome questionnaire completed');

  // ---- Conservative care ----------------------------------------------
  const pt = tx.physicalTherapy || {};
  const ptDocs = docsFor(docs, 'pt_notes');
  if (pt.tried) {
    const gaps = [];
    if (!pt.duration) gaps.push('duration not stated');
    if (!pt.frequency) gaps.push('frequency not stated');
    if (!pt.helped) gaps.push('response not stated');
    if (!pt.facility && !pt.provider) gaps.push('provider/facility not stated');
    if (!ptDocs.length) gaps.push('no PT records attached');
    out.pt_supervised = ev(gaps.length ? PARTIAL : PRESENT,
      [pt.facility, pt.duration, pt.frequency, pt.helped].filter(Boolean).join(' · ') || 'Reported',
      { gaps, documents: ptDocs });
  } else {
    out.pt_supervised = ev(ABSENT, pt.tried === false ? 'Patient reports no physical therapy' : 'Not recorded');
  }

  const he = tx.homeExercise || {};
  out.home_exercise = he.tried
    ? ev(PRESENT, [he.guided, he.appService, he.duration, he.frequency, he.details].filter(Boolean).join(' · ') || 'Reported')
    : ev(ABSENT, he.tried === false ? 'Patient reports none' : 'Not recorded');

  const meds = auth.medicationTrials || [];
  out.medication_trial = meds.length
    ? ev(
        meds.every((m) => m.duration) ? PRESENT : PARTIAL,
        meds.map((m) => `${m.drugClass}${m.duration ? ` (${m.duration})` : ''}${m.helped ? ` — ${m.helped}` : ''}`).join('; '),
        { gaps: meds.filter((m) => !m.duration).map((m) => `${m.drugClass}: duration not stated`) }
      )
    : ev(ABSENT, 'No medication trial recorded');

  const chiro = tx.chiropracticCare || {};
  out.chiropractic = chiro.tried
    ? ev(PRESENT, [chiro.duration, chiro.helped].filter(Boolean).join(' · ') || 'Reported')
    : ev(ABSENT, chiro.tried === false ? 'Patient reports none' : 'Not recorded');

  const acu = tx.acupuncture || {};
  out.acupuncture = acu.tried
    ? ev(PRESENT, [acu.duration, acu.helped].filter(Boolean).join(' · ') || 'Reported')
    : ev(ABSENT, 'Not recorded');

  const brace = tx.braces || {};
  out.bracing = brace.tried
    ? ev(PRESENT, [brace.type, brace.helped].filter(Boolean).join(' · ') || 'Reported')
    : ev(ABSENT, 'Not recorded');

  // ---- Injections ------------------------------------------------------
  const injections = tx.injections || [];
  const injDocs = docsFor(docs, 'injection_records');
  const injBy = (re) => injections.filter((i) => re.test(i.type || ''));
  const injEv = (list, label) => {
    if (!list.length) return ev(ABSENT, `No ${label} recorded`);
    const gaps = [];
    list.forEach((i, n) => {
      const tag = i.type || `#${n + 1}`;
      if (!i.location) gaps.push(`${tag}: level/side not stated`);
      if (!i.when) gaps.push(`${tag}: date not stated`);
      if (!i.reliefDuration) gaps.push(`${tag}: duration of relief not stated`);
      if (!i.provider) gaps.push(`${tag}: performing provider not stated`);
    });
    if (!injDocs.length) gaps.push('no procedure notes attached');
    return ev(gaps.length ? PARTIAL : PRESENT,
      list.map((i) => [i.type, i.location, i.when, i.helped, i.reliefDuration && `relief ${i.reliefDuration}`].filter(Boolean).join(' · ')).join(' | '),
      { gaps, documents: injDocs });
  };
  out.injection_esi = injEv(injBy(/epidural|ESI|nerve root|transforaminal/i), 'epidural/nerve root injection');
  out.injection_facet = injEv(injBy(/facet|medial branch/i), 'facet/medial branch injection');
  out.injection_si = injEv(injBy(/sacroiliac|SI joint/i), 'SI joint injection');
  out.rfa = injEv(injBy(/radiofrequency|RFA|ablation/i), 'radiofrequency ablation');

  // ---- Imaging ---------------------------------------------------------
  const imagingDocs = docsFor(docs, 'imaging_reports');
  const selected = (tx.priorImaging || []).filter((i) => i && i !== 'None');
  const detail = auth.imagingStudies || [];
  const imgEv = (matcher, label) => {
    const has = selected.some((s) => matcher.test(s));
    if (!has) return ev(ABSENT, `No ${label} reported`);
    const det = detail.find((x) => matcher.test(x.study || '')) || {};
    const gaps = [];
    if (!det.date) gaps.push('date not stated');
    if (!det.facility) gaps.push('facility not stated');
    if (!det.hasReport) gaps.push('patient does not have the written report');
    if (!imagingDocs.length) gaps.push('no imaging report attached');
    return ev(gaps.length ? PARTIAL : PRESENT,
      [label, det.date, det.facility].filter(Boolean).join(' · '),
      { gaps, documents: imagingDocs });
  };
  out.imaging_mri = imgEv(/MRI/i, 'MRI');
  out.imaging_ct = imgEv(/CT/i, 'CT');
  out.imaging_xray = imgEv(/X-ray/i, 'X-ray');
  out.imaging_myelogram = imgEv(/myelogram/i, 'myelogram');

  // Dynamic films are almost always obtained in-office at the surgical visit.
  out.imaging_flexion_extension = ev(UNKNOWN,
    'Flexion-extension films are obtained and interpreted in office — confirm before submission',
    { gaps: ['Required for most fusion requests; several payers require the surgeon\'s own written interpretation'] });

  // ---- EMG -------------------------------------------------------------
  const emg = tx.priorEMG || {};
  const emgDocs = docsFor(docs, 'emg_report');
  if (emg.done) {
    const gaps = [];
    if (!emg.when) gaps.push('date not stated');
    if (!emg.facility) gaps.push('facility not stated');
    if (!emg.results) gaps.push('results not stated');
    if (!emgDocs.length) gaps.push('no EMG report attached');
    out.emg_ncs = ev(gaps.length ? PARTIAL : PRESENT,
      [emg.when, emg.facility, emg.results].filter(Boolean).join(' · ') || 'Reported',
      { gaps, documents: emgDocs });
  } else {
    out.emg_ncs = ev(ABSENT, 'No EMG/NCS reported');
  }

  // ---- Nicotine --------------------------------------------------------
  const nic = auth.nicotineCurrent || '';
  const tobacco = d.socialHistory?.tobaccoUse || '';
  if (nic) {
    const detailBits = [nic, auth.nicotineProduct, auth.nicotineQuitDate && `quit ${auth.nicotineQuitDate}`].filter(Boolean);
    const gaps = [];
    if (nic === 'Yes, currently') {
      gaps.push('Several payers require documented abstinence (commonly 6 weeks) with objective cotinine testing before fusion');
    }
    out.nicotine_status = ev(nic === 'Yes, currently' ? PARTIAL : PRESENT, detailBits.join(' · '), { gaps });
  } else {
    out.nicotine_status = ev(tobacco ? PARTIAL : ABSENT,
      tobacco ? `Social history: ${tobacco}` : 'Not recorded',
      { gaps: ['Nicotine detail not captured'] });
  }

  // ---- Prior surgery ---------------------------------------------------
  const opDocs = docsFor(docs, 'operative_reports');
  const hadSurgery = !!d.chiefComplaint?.hasPriorSpineSurgery ||
    (d.pastSurgicalHistory?.surgeries || []).some((s) => /spine|fusion|laminectomy|discectomy|cervical|lumbar/i.test(`${s.type || ''} ${s.bodyRegion || ''}`));
  out.prior_op_report = hadSurgery
    ? ev(opDocs.length ? PRESENT : PARTIAL,
        'Prior spine surgery reported',
        { gaps: opDocs.length ? [] : ['Operative report not attached'], documents: opDocs })
    : ev(ABSENT, 'No prior spine surgery reported');

  // ---- Clinician-supplied ---------------------------------------------
  for (const id of ['cpt_codes', 'icd10_codes', 'spinal_levels', 'instability_documented', 'psych_clearance', 'bmi', 'bone_density']) {
    if (!out[id]) out[id] = ev(UNKNOWN, 'Supplied by the surgeon at booking');
  }

  return out;
}

/** A requirement worded as a recommendation is advisory, not a gate. */
function isAdvisory(requirement) {
  return /recommend|should be considered|strongly encouraged/i.test(requirement || '');
}

/**
 * `scoring` states how much weight a payer's encoded criteria carry:
 *   full        the payer publishes its own medical-necessity criteria
 *   indicative  criteria exist but the actual reviewer's rules are unpublished,
 *               so results are a guide, not the standard that will be applied
 *   none        nothing usable is published; readiness cannot be scored
 */
export function listPayers() {
  return rules.payers.map((p) => {
    const scoring = p.scoring || (p.procedures.some((x) => x.requirements.length > 0) ? 'full' : 'none');
    return {
      id: p.id,
      name: p.name,
      umVendor: p.umVendor,
      criteriaAvailability: p.criteriaAvailability,
      note: p.note,
      scoring,
      scorable: scoring !== 'none',
    };
  });
}

export function listProcedures(payerId) {
  const p = rules.payers.find((x) => x.id === payerId);
  if (!p) return [];
  return p.procedures.map((proc, i) => ({
    index: i,
    procedure: proc.procedure,
    indication: proc.indication,
    policyId: proc.policyId,
    requirementCount: proc.requirements.length,
  }));
}

export function getPayer(payerId) {
  return rules.payers.find((x) => x.id === payerId) || null;
}

/**
 * Score one procedure block against extracted evidence.
 * Returns satisfied / partial / missing requirement lists plus a percentage
 * over GATING requirements only (advisory ones are reported separately so the
 * tool doesn't over-refer on "strongly recommended" items).
 */
export function scoreReadiness({ payerId, procedureIndex, evidence }) {
  const payer = getPayer(payerId);
  if (!payer) return null;
  const proc = payer.procedures[procedureIndex];
  if (!proc) return null;

  const policy = payer.policies.find((p) => p.policyId === proc.policyId) || null;
  const satisfied = [], partial = [], missing = [], advisory = [], clinician = [];

  for (const req of proc.requirements) {
    const e = evidence[req.evidenceId] || { status: UNKNOWN, summary: 'Not captured', gaps: [] };
    const row = {
      evidenceId: req.evidenceId,
      label: EVIDENCE_LABELS[req.evidenceId] || req.evidenceId,
      requirement: req.requirement,
      durationRequired: req.durationRequired,
      verbatimQuote: req.verbatimQuote || null,
      status: e.status,
      summary: e.summary,
      gaps: e.gaps || [],
      documents: e.documents || [],
    };

    if (isAdvisory(req.requirement)) { advisory.push(row); continue; }
    if (CLINICIAN_SUPPLIED.has(req.evidenceId) && e.status === UNKNOWN) { clinician.push(row); continue; }

    if (e.status === PRESENT) satisfied.push(row);
    else if (e.status === PARTIAL) partial.push(row);
    else missing.push(row);
  }

  const gating = satisfied.length + partial.length + missing.length;
  const percent = gating === 0 ? null : Math.round(((satisfied.length + partial.length * 0.5) / gating) * 100);

  return {
    payer: { id: payer.id, name: payer.name, umVendor: payer.umVendor, criteriaAvailability: payer.criteriaAvailability, note: payer.note },
    policy,
    procedure: proc.procedure,
    indication: proc.indication,
    criteriaLogic: proc.criteriaLogic,
    percent,
    status: percent == null ? 'unknown' : missing.length === 0 && partial.length === 0 ? 'ready' : missing.length === 0 ? 'partial' : 'not_ready',
    satisfied, partial, missing, advisory, clinician,
  };
}

/** Documents the packet still lacks, by category. */
export function missingDocuments(intake) {
  const docs = intake?.documents || [];
  return DOCUMENT_CATEGORIES.filter((c) => c.id !== 'other' && !docs.some((d) => d.category === c.id));
}

export const RULES_META = { generatedAt: rules.generatedAt, disclaimer: rules.disclaimer };
