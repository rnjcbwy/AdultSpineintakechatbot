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
// The spine and the bone-and-joint services (lib/service.js) each have their
// own rule set and evidence vocabulary: lib/payers/rules.json holds the spine
// payers' published criteria; lib/payers/ortho-rules.json is a practice
// checklist of the documentation elements most payers ask for before common
// orthopaedic procedures (not any payer's policy text). The specialty comes
// from the intake's service.key, or from the `service` argument where there
// is no intake to read it from; it is the spine when nothing says otherwise.
//
// IMPORTANT: this reports DOCUMENTATION COMPLETENESS, not coverage. It answers
// "is the packet likely to contain what the reviewer asks for", never "will
// this be approved". Criteria change; every rule carries its citation and
// effective date so results can be checked against the live policy.
// ============================================================================

import spineRules from './payers/rules.json';
import orthoRules from './payers/ortho-rules.json';
import { DOCUMENT_CATEGORIES } from './documents';

const SPINE_LABELS = {
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

const ORTHO_LABELS = {
  symptom_duration: 'Symptom duration',
  symptom_severity: 'Symptom severity',
  mechanical_symptoms: 'Mechanical symptoms (locking, giving way, instability)',
  neuro_deficit: 'Neurologic findings',
  functional_impairment_score: 'Functional impairment (outcome questionnaire)',
  pt_supervised: 'Supervised physical therapy',
  home_exercise: 'Home exercise program',
  medication_trial: 'Medication trial',
  injection_steroid: 'Corticosteroid injection',
  injection_viscosupplement: 'Hyaluronic acid (gel) injection',
  injection_other: 'Other injection (PRP, nerve block)',
  chiropractic: 'Chiropractic care',
  acupuncture: 'Acupuncture',
  bracing: 'Bracing, splinting or immobilisation',
  activity_modification: 'Activity modification',
  imaging_xray: 'X-ray',
  imaging_weightbearing_xray: 'Weight-bearing X-rays',
  imaging_mri: 'MRI',
  imaging_ct: 'CT',
  imaging_ultrasound: 'Ultrasound',
  emg_ncs: 'EMG / nerve conduction study',
  nicotine_status: 'Nicotine status',
  bmi: 'BMI',
  diabetes_control: 'Diabetes control (HbA1c)',
  psych_clearance: 'Behavioral health screening',
  bone_density: 'Bone density (DEXA)',
  prior_op_report: 'Prior operative report',
  exam_findings: 'Examination findings (motion, strength, stability)',
  laterality_site: 'Side and site',
  cpt_codes: 'CPT code(s)',
  icd10_codes: 'ICD-10 code(s)',
};

/** What differs between the two rule sets, by specialty. */
const SPECIALTY = {
  spine: {
    rules: spineRules,
    labels: SPINE_LABELS,
    // Evidence the surgeon supplies at booking, not the patient at intake.
    clinicianSupplied: new Set(['cpt_codes', 'icd10_codes', 'spinal_levels', 'neuro_deficit', 'instability_documented', 'psych_clearance', 'bmi', 'bone_density']),
    clinicianDefaults: ['cpt_codes', 'icd10_codes', 'spinal_levels', 'instability_documented', 'psych_clearance', 'bmi', 'bone_density'],
    // A requirement worded as a recommendation is advisory, not a gate.
    advisory: /recommend|should be considered|strongly encouraged/i,
  },
  ortho: {
    rules: orthoRules,
    labels: ORTHO_LABELS,
    clinicianSupplied: new Set(['cpt_codes', 'icd10_codes', 'laterality_site', 'neuro_deficit', 'exam_findings', 'psych_clearance', 'bmi', 'diabetes_control', 'bone_density', 'imaging_weightbearing_xray']),
    clinicianDefaults: ['cpt_codes', 'icd10_codes', 'laterality_site', 'exam_findings', 'psych_clearance', 'bmi', 'diabetes_control', 'bone_density'],
    advisory: /recommend|should be considered|strongly encouraged|where applicable/i,
  },
};

/**
 * The specialty for a service key ('adult_ortho'), a service object, an
 * intake (its service.key) or nothing (the spine). The keys are
 * <patient>_<specialty> (lib/service.js); read here without importing the
 * service modules, so this file stays a plain data module the export-spec
 * and PDF scripts can stage on its own.
 */
function specialtyOf(service) {
  const key = typeof service === 'string' ? service
    : service && typeof service === 'object' ? (SPECIALTY[service.specialty] ? service.specialty : service.service?.key || '')
    : '';
  return /(^|_)ortho$/.test(String(key)) ? 'ortho' : 'spine';
}

const setFor = (service) => SPECIALTY[specialtyOf(service)];

/** The evidence vocabulary of the spine rules; evidenceLabels() for a service. */
export const EVIDENCE_LABELS = SPINE_LABELS;
export function evidenceLabels(service) {
  return setFor(service).labels;
}

/** Evidence the surgeon supplies at booking, not the patient at intake (spine); clinicianSupplied() for a service. */
export const CLINICIAN_SUPPLIED = SPECIALTY.spine.clinicianSupplied;
export function clinicianSupplied(service) {
  return setFor(service).clinicianSupplied;
}

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
 * `documents` is the metadata array mirrored from IndexedDB. The intake's
 * service.key picks the vocabulary; `service` overrides it when given.
 */
export function extractEvidence(intake, service) {
  const d = intake || {};
  const ortho = specialtyOf(service || d) === 'ortho';
  const tx = d.hpiData?.conservativeTreatments || {};
  const auth = d.authEvidence || {};
  const docs = d.documents || [];
  const overall = d.hpiData?.overall || {};
  const problems = Object.values(d.hpiData?.problems || {});
  const out = {};

  // ---- Symptoms -------------------------------------------------------
  out.symptom_duration = d.chiefComplaint?.duration
    ? ev(PRESENT, d.chiefComplaint.duration)
    : ev(ABSENT, 'Not recorded');

  const severities = [...Object.values(d.hpiData?.symptoms || {}), ...problems]
    .map((s) => s.severity)
    .filter((v) => typeof v === 'number');
  out.symptom_severity = severities.length
    ? ev(PRESENT, `Worst reported ${Math.max(...severities)}/10`)
    : ev(ABSENT, 'Not recorded');

  if (ortho) {
    const mech = [...new Set(problems.flatMap((p) => p.mechanical || []).filter((m) => m && m !== 'None of these'))];
    const deniedMech = problems.some((p) => (p.mechanical || []).includes('None of these'));
    out.mechanical_symptoms = mech.length
      ? ev(PRESENT, `Patient-reported: ${mech.join(', ')}`)
      : ev(deniedMech ? ABSENT : UNKNOWN, deniedMech ? 'Patient reports none' : 'Not recorded');
  }

  const neuro = [];
  if (overall.numbness) neuro.push('numbness');
  if (overall.tingling) neuro.push('tingling');
  if (overall.weakness) neuro.push('weakness');
  if (ortho) {
    if (overall.nightHandNumbness) neuro.push('night waking with hand numbness');
    if (overall.overheadWeakness) neuro.push('overhead weakness');
  } else {
    if (overall.footDrop) neuro.push('foot drop');
    if (overall.gaitChanges) neuro.push('balance/gait changes');
  }
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
      if (ortho) {
        const val = s.score != null ? `${s.score}/100` : s.interval != null ? `${s.interval}/100` : s.rawScore != null ? `raw ${s.rawScore}/${s.maxPossible}` : s.totalScore != null ? `${s.totalScore}/${s.maxScore}` : '';
        return `${k.toUpperCase().replace('_', ' ')} ${val}`;
      }
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

  if (ortho) {
    // Activity modification is almost never written down; the questionnaires
    // and the "what have you given up" history carry it.
    out.activity_modification = scored.length || problems.some((p) => p.progression)
      ? ev(PARTIAL, 'Functional limitation reported; state the activities modified in the note', { gaps: ['Activity modification not captured as its own item'] })
      : ev(UNKNOWN, 'Not captured');
  }

  // ---- Injections ------------------------------------------------------
  const injections = tx.injections || [];
  const injDocs = docsFor(docs, 'injection_records');
  const injBy = (re) => injections.filter((i) => re.test(i.type || ''));
  const injEv = (list, label) => {
    if (!list.length) return ev(ABSENT, `No ${label} recorded`);
    const gaps = [];
    list.forEach((i, n) => {
      const tag = i.type || `#${n + 1}`;
      if (!i.location) gaps.push(`${tag}: ${ortho ? 'joint' : 'level'}/side not stated`);
      if (!i.when) gaps.push(`${tag}: date not stated`);
      if (!i.reliefDuration) gaps.push(`${tag}: duration of relief not stated`);
      if (!i.provider) gaps.push(`${tag}: performing provider not stated`);
    });
    if (!injDocs.length) gaps.push('no procedure notes attached');
    return ev(gaps.length ? PARTIAL : PRESENT,
      list.map((i) => [i.type, i.location, i.when, i.helped, i.reliefDuration && `relief ${i.reliefDuration}`].filter(Boolean).join(' · ')).join(' | '),
      { gaps, documents: injDocs });
  };
  if (ortho) {
    out.injection_steroid = injEv(injBy(/steroid|cortisone|bursa|tendon/i), 'corticosteroid injection');
    out.injection_viscosupplement = injEv(injBy(/gel|hyaluronic/i), 'hyaluronic acid injection');
    out.injection_other = injEv(injBy(/PRP|platelet|nerve block|other/i), 'other injection');
  } else {
    out.injection_esi = injEv(injBy(/epidural|ESI|nerve root|transforaminal/i), 'epidural/nerve root injection');
    out.injection_facet = injEv(injBy(/facet|medial branch/i), 'facet/medial branch injection');
    out.injection_si = injEv(injBy(/sacroiliac|SI joint/i), 'SI joint injection');
    out.rfa = injEv(injBy(/radiofrequency|RFA|ablation/i), 'radiofrequency ablation');
  }

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
  if (ortho) {
    out.imaging_xray = imgEv(/X-ray/i, 'X-ray');
    out.imaging_mri = imgEv(/MRI/i, 'MRI');
    out.imaging_ct = imgEv(/CT/i, 'CT');
    out.imaging_ultrasound = imgEv(/ultrasound/i, 'ultrasound');

    // Standing films are obtained in-office at the surgical visit.
    out.imaging_weightbearing_xray = ev(UNKNOWN,
      'Weight-bearing films are obtained and interpreted in office — confirm before submission',
      { gaps: ['Most joint-replacement policies ask for weight-bearing films showing joint-space narrowing'] });
  } else {
    out.imaging_mri = imgEv(/MRI/i, 'MRI');
    out.imaging_ct = imgEv(/CT/i, 'CT');
    out.imaging_xray = imgEv(/X-ray/i, 'X-ray');
    out.imaging_myelogram = imgEv(/myelogram/i, 'myelogram');

    // Dynamic films are almost always obtained in-office at the surgical visit.
    out.imaging_flexion_extension = ev(UNKNOWN,
      'Flexion-extension films are obtained and interpreted in office — confirm before submission',
      { gaps: ['Required for most fusion requests; several payers require the surgeon\'s own written interpretation'] });
  }

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
      gaps.push(ortho
        ? 'Nicotine use slows bone and tendon healing; some policies and most surgeons ask for cessation before elective reconstruction'
        : 'Several payers require documented abstinence (commonly 6 weeks) with objective cotinine testing before fusion');
    }
    out.nicotine_status = ev(nic === 'Yes, currently' ? PARTIAL : PRESENT, detailBits.join(' · '), { gaps });
  } else {
    out.nicotine_status = ev(tobacco ? PARTIAL : ABSENT,
      tobacco ? `Social history: ${tobacco}` : 'Not recorded',
      { gaps: ['Nicotine detail not captured'] });
  }

  // ---- Prior surgery ---------------------------------------------------
  const opDocs = docsFor(docs, 'operative_reports');
  const surgeries = d.pastSurgicalHistory?.surgeries || [];
  const hadSurgery = !!d.chiefComplaint?.hasPriorSpineSurgery || (ortho
    ? surgeries.some((s) => s.isSpineSurgery || /shoulder|elbow|wrist|hand|hip|knee|ankle|foot|fracture|replacement|arthroscop|repair|release/i.test(`${s.type || ''} ${s.bodyRegion || ''}`))
    : surgeries.some((s) => /spine|fusion|laminectomy|discectomy|cervical|lumbar/i.test(`${s.type || ''} ${s.bodyRegion || ''}`)));
  const what = ortho ? 'bone or joint' : 'spine';
  out.prior_op_report = hadSurgery
    ? ev(opDocs.length ? PRESENT : PARTIAL,
        `Prior ${what} surgery reported`,
        { gaps: opDocs.length ? [] : ['Operative report not attached'], documents: opDocs })
    : ev(ABSENT, `No prior ${what} surgery reported`);

  // ---- Clinician-supplied ---------------------------------------------
  for (const id of SPECIALTY[ortho ? 'ortho' : 'spine'].clinicianDefaults) {
    if (!out[id]) out[id] = ev(UNKNOWN, 'Supplied by the surgeon at booking');
  }

  return out;
}

/** The rule set a payer id belongs to: the named service's, else whichever lists it. */
function ruleSetFor(payerId, service) {
  if (service != null) return setFor(service);
  return Object.values(SPECIALTY).find((s) => s.rules.payers.some((x) => x.id === payerId)) || SPECIALTY.spine;
}

/**
 * `scoring` states how much weight a payer's encoded criteria carry:
 *   full        the payer publishes its own medical-necessity criteria
 *   indicative  criteria exist but the actual reviewer's rules are unpublished,
 *               so results are a guide, not the standard that will be applied
 *   none        nothing usable is published; readiness cannot be scored
 */
export function listPayers(service) {
  return setFor(service).rules.payers.map((p) => {
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

export function listProcedures(payerId, service) {
  const p = getPayer(payerId, service);
  if (!p) return [];
  return p.procedures.map((proc, i) => ({
    index: i,
    procedure: proc.procedure,
    indication: proc.indication,
    policyId: proc.policyId,
    requirementCount: proc.requirements.length,
  }));
}

export function getPayer(payerId, service) {
  return ruleSetFor(payerId, service).rules.payers.find((x) => x.id === payerId) || null;
}

/**
 * Score one procedure block against extracted evidence.
 * Returns satisfied / partial / missing requirement lists plus a percentage
 * over GATING requirements only (advisory ones are reported separately so the
 * tool doesn't over-refer on "strongly recommended" items).
 */
export function scoreReadiness({ payerId, procedureIndex, evidence, service }) {
  const set = ruleSetFor(payerId, service);
  const payer = set.rules.payers.find((x) => x.id === payerId);
  if (!payer) return null;
  const proc = payer.procedures[procedureIndex];
  if (!proc) return null;

  const policy = payer.policies.find((p) => p.policyId === proc.policyId) || null;
  const satisfied = [], partial = [], missing = [], advisory = [], clinician = [];

  for (const req of proc.requirements) {
    const e = evidence[req.evidenceId] || { status: UNKNOWN, summary: 'Not captured', gaps: [] };
    const row = {
      evidenceId: req.evidenceId,
      label: set.labels[req.evidenceId] || req.evidenceId,
      requirement: req.requirement,
      durationRequired: req.durationRequired,
      verbatimQuote: req.verbatimQuote || null,
      status: e.status,
      summary: e.summary,
      gaps: e.gaps || [],
      documents: e.documents || [],
    };

    if (set.advisory.test(req.requirement || '')) { advisory.push(row); continue; }
    if (set.clinicianSupplied.has(req.evidenceId) && e.status === UNKNOWN) { clinician.push(row); continue; }

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

/** The spine rules' provenance; rulesMeta() for a service. */
export const RULES_META = { generatedAt: spineRules.generatedAt, disclaimer: spineRules.disclaimer };
export function rulesMeta(service) {
  const { rules } = setFor(service);
  return { generatedAt: rules.generatedAt, disclaimer: rules.disclaimer };
}
