// ============================================================================
// Visit types and the steps each one walks through.
//
// A follow-up visit should not re-ask a patient's whole life history, and a
// post-operative visit is about the operation and the recovery, not about
// what was tried before surgery. Each visit type therefore has its own
// sequence of steps; the welcome, consent and "type of visit" steps are shared.
//
// Step ids are stable keys: components, labels and the review page refer to
// steps by id, never by position, because the position depends on the flow.
// ============================================================================

export const VISIT_TYPES = [
  {
    id: 'new',
    label: 'New patient or new problem',
    description: 'A first visit for this problem, a second opinion, or a referral for a surgical opinion.',
  },
  {
    id: 'followup',
    label: 'Follow-up visit',
    description: 'You have been seen for this problem before and are coming back.',
  },
  {
    id: 'postop',
    label: 'After surgery',
    description: 'A visit after an operation, whether it was done here or elsewhere.',
  },
  {
    id: 'workers_comp',
    label: "Workers' compensation",
    description: 'A work-related injury with a claim. You will be asked for the claim number.',
  },
  {
    id: 'personal_injury',
    label: 'Injury with a legal claim',
    description: 'A crash, a fall or another injury with an attorney or an insurance claim.',
  },
];

export const VISIT_LABEL = Object.fromEntries(VISIT_TYPES.map((v) => [v.id, v.label]));

/**
 * What the patient is asked. Two choices; a follow-up question under each
 * picks the internal kind (a work injury adds the claim step, a follow-up
 * after surgery adds the operation and recovery step).
 */
export const VISIT_CHOICES = [
  { id: 'new', label: 'New patient or new problem', description: 'A first visit, a new problem, a new injury, a second opinion, or a referral for a surgical opinion.' },
  { id: 'followup', label: 'Follow-up visit', description: 'You have been seen here before and are coming back, with or without surgery in between.' },
];

/** The claim question, asked on the demographics step for a new problem. */
export const CLAIM_OPTIONS = ['No', "Yes, a workers' compensation claim", 'Yes, an accident or injury with an attorney or insurance claim'];

/**
 * The internal visit kind from the patient's answers. A new problem is an
 * ordinary new-patient visit until the claim question says otherwise.
 */
export function visitTypeFor({ choice, workInjury, hadSurgery }) {
  if (choice === 'new') {
    if (workInjury === CLAIM_OPTIONS[1] || workInjury === 'Yes') return 'workers_comp';
    if (workInjury === CLAIM_OPTIONS[2]) return 'personal_injury';
    return 'new';
  }
  if (choice === 'followup') return hadSurgery === 'Yes' ? 'postop' : hadSurgery === 'No' ? 'followup' : '';
  return '';
}

export const STEP_LABELS = {
  welcome: 'Welcome',
  triage: 'Getting Started',
  demographics: 'Demographics',
  'work-injury': 'Work Injury & Claim',
  'legal-injury': 'The Accident & Your Claim',
  interval: 'Since Your Last Visit',
  postop: 'Your Surgery & Recovery',
  'chief-complaint': 'Chief Complaint',
  'pain-map': 'Symptom Map',
  'symptom-details': 'Symptom Details',
  treatments: 'Prior Treatments',
  records: 'Records & Documents',
  additional: 'Additional Details',
  pmh: 'Past Medical History',
  psh: 'Past Surgical History',
  medications: 'Medications',
  allergies: 'Allergies',
  social: 'Social History',
  family: 'Family History',
  ros: 'Review of Systems',
  proms: 'Outcome Questionnaires',
  review: 'Review & Submit',
};

// Welcome, then straight into the form. The acknowledgments and signature
// are on the review step, where the patient signs what they are sending.
// The triage step also settles the kind of visit, so there is no separate visit-type step.
const SHARED = ['welcome', 'triage'];

const FLOWS = {
  new: [
    'demographics', 'chief-complaint', 'pain-map', 'symptom-details', 'treatments', 'records',
    'additional', 'pmh', 'psh', 'medications', 'allergies', 'social', 'family', 'ros', 'proms', 'review',
  ],
  // A work injury is a new-patient history plus the claim and the mechanism.
  workers_comp: [
    'demographics', 'work-injury', 'chief-complaint', 'pain-map', 'symptom-details', 'treatments', 'records',
    'additional', 'pmh', 'psh', 'medications', 'allergies', 'social', 'family', 'ros', 'proms', 'review',
  ],
  // An injury with a legal claim: the event, the aftermath, the state of the
  // same region before, everything since, the parties; then the full history.
  personal_injury: [
    'demographics', 'legal-injury', 'chief-complaint', 'pain-map', 'symptom-details', 'treatments', 'records',
    'additional', 'pmh', 'psh', 'medications', 'allergies', 'social', 'family', 'ros', 'proms', 'review',
  ],
  // Established patient: what changed, what was tried since, where it hurts
  // now, a review of systems, and the questionnaires for comparison. The
  // past medical, surgical, medication, allergy, family and social history
  // are on file and are not asked again; the medication list is reconciled.
  followup: [
    'demographics', 'interval', 'pain-map', 'symptom-details', 'records', 'medications', 'additional', 'ros', 'proms', 'review',
  ],
  // After an operation: the operation(s), the recovery, residual symptoms,
  // a review of systems, and the questionnaires. Opioid use is asked on the
  // recovery step and the medication list is reconciled; the rest of the
  // history is on file.
  postop: [
    'demographics', 'postop', 'pain-map', 'medications', 'additional', 'ros', 'proms', 'review',
  ],
};

/**
 * The ordered steps for a visit type (the full new-patient flow until one is
 * chosen).
 */
export function stepsForVisit(type, service, data) {
  const base = [...SHARED, ...(FLOWS[type] || FLOWS.new)];
  const flow = service?.flow;
  const ids = flow?.adjustSteps ? flow.adjustSteps(base, { type, data }) : base;
  const labels = { ...STEP_LABELS, ...(flow?.STEP_LABELS || {}) };
  return ids.map((id) => ({ id, label: labels[id] || id }));
}

export function stepIndex(steps, id) {
  return steps.findIndex((s) => s.id === id);
}
