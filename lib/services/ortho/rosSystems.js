// ============================================================================
// Review of Systems — the 14 body systems recognised for E/M documentation.
//
// A NOTE ON BILLING LEVEL. Since 1 January 2021, office and outpatient E/M
// codes (99202-99215) are selected on medical decision making or total time.
// History and exam only need to be "medically appropriate", so the number of
// systems reviewed no longer determines whether a visit is level 4. Under the
// pre-2021 guidelines it did: 99204 (new patient, level 4) required a
// comprehensive history, which meant 10 or more systems, while 99214
// (established) required only 2-9.
//
// So the count is not what earns the level any more. It is still worth
// collecting: 10+ systems is the conventional bar for a "complete" ROS, payers
// and prior-authorisation reviewers still look for it, and several of these
// questions are high-yield for an orthopaedic practice specifically — a hot
// swollen joint and fever before any injection or operation, calf swelling
// after an injury or a cast, bleeding and clotting history, osteoporosis and
// steroid use for fracture and implant planning.
//
// `title` is what the patient reads; `system` is the formal name used in the
// clinician view and the generated note.
// ============================================================================

export const ROS_SECTIONS = [
  {
    id: 'constitutional',
    title: 'General & Whole-Body',
    system: 'Constitutional',
    questions: [
      { id: 'fevers', label: 'Fevers or chills?' },
      { id: 'nightSweats', label: 'Night sweats?' },
      { id: 'unexplainedWeightLoss', label: 'Unexplained weight loss (more than 10 lbs)?' },
      { id: 'fatigue', label: 'Unusual fatigue or malaise?' },
    ],
  },
  {
    id: 'eyes',
    title: 'Eyes',
    system: 'Eyes',
    questions: [
      { id: 'visionChanges', label: 'Recent changes in your vision?' },
      { id: 'doubleVision', label: 'Double or blurred vision?' },
    ],
  },
  {
    id: 'ent',
    title: 'Ears, Nose, Mouth & Throat',
    system: 'Ears, nose, mouth and throat',
    questions: [
      { id: 'hearingLoss', label: 'Hearing loss or ringing in the ears?' },
      // Airway and swallowing matter to the anaesthetist before any operation.
      { id: 'difficultySwallowing', label: 'Difficulty or pain when swallowing?' },
      { id: 'hoarseness', label: 'Hoarseness or a change in your voice?' },
    ],
  },
  {
    id: 'cardiovascular',
    title: 'Heart & Circulation',
    system: 'Cardiovascular',
    questions: [
      { id: 'chestPain', label: 'Chest pain or pressure?' },
      { id: 'shortnessOfBreath', label: 'Shortness of breath?' },
      { id: 'palpitations', label: 'Racing or irregular heartbeat?' },
      { id: 'swelling', label: 'Leg swelling?' },
      { id: 'calfSwelling', label: 'A swollen or painful calf?' },
    ],
  },
  {
    id: 'respiratory',
    title: 'Breathing & Lungs',
    system: 'Respiratory',
    questions: [
      { id: 'chronicCough', label: 'A cough that will not go away?' },
      { id: 'wheezing', label: 'Wheezing or asthma?' },
      { id: 'sleepApnea', label: 'Sleep apnea, or been told you snore heavily?' },
    ],
  },
  {
    id: 'gastrointestinal',
    title: 'Digestive',
    system: 'Gastrointestinal',
    questions: [
      { id: 'bowelChanges', label: 'Changes in bowel habits?' },
      { id: 'nausea', label: 'Nausea or vomiting?' },
      { id: 'abdominalPain', label: 'Abdominal pain?' },
      // Bears directly on whether NSAIDs are a usable option.
      { id: 'heartburn', label: 'Frequent heartburn, reflux, or stomach ulcers?' },
    ],
  },
  {
    id: 'genitourinary',
    title: 'Bladder & Urinary',
    system: 'Genitourinary',
    questions: [
      { id: 'bladderChanges', label: 'Changes in bladder function?' },
      { id: 'urinaryFrequency', label: 'Increased urinary frequency or urgency?' },
      { id: 'urinaryRetention', label: 'Difficulty starting or maintaining urination?' },
    ],
  },
  {
    id: 'musculoskeletal',
    title: 'Muscles & Joints',
    system: 'Musculoskeletal',
    questions: [
      { id: 'jointPain', label: 'Pain or swelling in other joints (besides the one you are here for)?' },
      { id: 'hotSwollenJoint', label: 'A joint that is hot, red and swollen?' },
      { id: 'morningStiffness', label: 'Stiffness in several joints in the morning lasting more than 30 minutes?' },
      { id: 'muscleWeakness', label: 'General muscle weakness?' },
      { id: 'falls', label: 'Recent falls?' },
    ],
  },
  {
    id: 'integumentary',
    title: 'Skin',
    system: 'Integumentary (skin)',
    questions: [
      { id: 'rash', label: 'Any new rash?' },
      { id: 'woundIssues', label: 'Any current wounds, sores, or skin infections?' },
      { id: 'pressureSores', label: 'Any skin breakdown from sitting or lying down?' },
    ],
  },
  {
    id: 'neurological',
    title: 'Nerves & Brain',
    system: 'Neurological',
    questions: [
      { id: 'headaches', label: 'Frequent headaches?' },
      { id: 'dizziness', label: 'Dizziness or lightheadedness?' },
      { id: 'seizures', label: 'Seizures?' },
      { id: 'memoryIssues', label: 'Memory or concentration problems?' },
      { id: 'balanceProblems', label: 'Trouble with balance, or feeling unsteady on your feet?' },
      { id: 'handClumsiness', label: 'Numbness or tingling in your hands or feet?' },
    ],
  },
  {
    id: 'psychiatric',
    title: 'Mood & Sleep',
    system: 'Psychiatric',
    questions: [
      { id: 'depressedMood', label: 'Feeling down, depressed, or hopeless?' },
      { id: 'anxiety', label: 'Feeling anxious or on edge?' },
      { id: 'sleepDisturbance', label: 'Trouble sleeping because of your pain?' },
    ],
  },
  {
    id: 'endocrine',
    title: 'Hormones & Metabolism',
    system: 'Endocrine',
    questions: [
      { id: 'diabetes', label: 'Diabetes or high blood sugar?' },
      { id: 'thyroid', label: 'Thyroid problems?' },
      // Bone quality changes the fracture and implant conversation.
      { id: 'osteoporosis', label: 'Osteoporosis, thinning bones, or a fracture from a minor fall?' },
      { id: 'gout', label: 'Gout?' },
    ],
  },
  {
    id: 'hematologic',
    title: 'Blood & Lymph Nodes',
    system: 'Hematologic / Lymphatic',
    questions: [
      { id: 'easyBruising', label: 'Do you bruise or bleed easily?' },
      { id: 'bloodClots', label: 'History of blood clots in the legs or lungs?' },
      { id: 'swollenGlands', label: 'Swollen glands?' },
      { id: 'cancerHistory', label: 'Any history of cancer?' },
    ],
  },
  {
    id: 'immunologic',
    title: 'Allergies & Immune System',
    system: 'Allergic / Immunologic',
    questions: [
      { id: 'recentInfections', label: 'Any recent or frequent infections?' },
      { id: 'seasonalAllergies', label: 'Seasonal allergies or hay fever?' },
      { id: 'immuneSuppression', label: 'Do you take steroids or medicines that lower your immune system?' },
    ],
  },
];

/**
 * The screening list: the items that change an orthopaedic plan, one tap each, with
 * "None of these" for the common case. Each id is a question in ROS_SECTIONS,
 * so an answer lands in the same place the full review would put it. A
 * patient who prefers can switch to the full fourteen-system review.
 */
export const ROS_SCREEN = [
  { id: 'fevers', label: 'Fever or chills' },
  { id: 'unexplainedWeightLoss', label: 'Weight loss without trying' },
  { id: 'hotSwollenJoint', label: 'A joint that is hot, red and swollen' },
  { id: 'morningStiffness', label: 'Morning stiffness in several joints' },
  { id: 'calfSwelling', label: 'A swollen or painful calf' },
  { id: 'handClumsiness', label: 'Numbness or tingling in the hands or feet' },
  { id: 'muscleWeakness', label: 'Weakness in an arm or leg' },
  { id: 'falls', label: 'A fall' },
  { id: 'chestPain', label: 'Chest pain or pressure' },
  { id: 'shortnessOfBreath', label: 'Shortness of breath' },
  { id: 'bloodClots', label: 'A blood clot, now or in the past' },
  { id: 'cancerHistory', label: 'Cancer, now or in the past' },
  { id: 'osteoporosis', label: 'Osteoporosis or thinning bones' },
  { id: 'immuneSuppression', label: 'Steroids or medicines that lower immunity' },
  { id: 'gout', label: 'Gout' },
  { id: 'easyBruising', label: 'Easy bruising or bleeding' },
  { id: 'depressedMood', label: 'Feeling down or anxious' },
  { id: 'sleepDisturbance', label: 'Pain that keeps you from sleeping' },
];

/** The section a question id lives in. */
export function rosSectionOf(questionId) {
  return ROS_SECTIONS.find((s) => s.questions.some((q) => q.id === questionId))?.id;
}

/** 10+ is the conventional bar for a documented "complete" ROS. */
export const COMPLETE_ROS_THRESHOLD = 10;

/** Blank answers for every system, for the store's defaults. */
export function emptyROS() {
  const out = {};
  for (const s of ROS_SECTIONS) {
    out[s.id] = Object.fromEntries(s.questions.map((q) => [q.id, '']));
  }
  out.additionalNotes = '';
  // 'screen' (the short list) or 'full' (every system). The note generator
  // reads this to describe what was actually reviewed.
  out.mode = 'screen';
  return out;
}

/**
 * A system counts as reviewed only when every one of its questions has an
 * answer. Counting partly-filled systems would overstate what was documented.
 */
export function isSectionComplete(ros, section) {
  return section.questions.every((q) => !!ros?.[section.id]?.[q.id]);
}

export function countReviewedSystems(ros) {
  return ROS_SECTIONS.filter((s) => isSectionComplete(ros, s)).length;
}

/** Positive findings, grouped by formal system name, for the note. */
export function rosPositives(ros) {
  const out = [];
  for (const s of ROS_SECTIONS) {
    const yes = s.questions.filter((q) => ros?.[s.id]?.[q.id] === 'yes');
    if (yes.length) out.push({ system: s.system, findings: yes.map((q) => q.label) });
  }
  return out;
}

/**
 * Look up one answer wherever it lives.
 *
 * Red-flag rules want to ask "did they report weight loss?" without knowing
 * which system it sits under, and questions do move between systems as the
 * form is revised. Searching by question id keeps those rules working across
 * that churn — they previously read reviewOfSystems.unexplainedWeightLoss,
 * which was never a real path, so the answer never reached them at all.
 */
export function rosAnswer(ros, questionId) {
  if (!ros) return undefined;
  for (const s of ROS_SECTIONS) {
    const v = ros[s.id]?.[questionId];
    if (v !== undefined && v !== '') return v;
  }
  return undefined;
}

/**
 * Carry a saved draft onto the current section layout.
 *
 * The store shallow-merges persisted state over the defaults, so a draft saved
 * before a system existed would drop it entirely. This fills in missing
 * systems and rehomes answers from the retired catch-all "Safety Screening"
 * group, whose questions belong to real systems (skin, blood, immune).
 */
export function migrateROS(saved) {
  const fresh = emptyROS();
  if (!saved || typeof saved !== 'object') return fresh;

  const merged = { ...fresh, additionalNotes: saved.additionalNotes || '', mode: saved.mode || 'screen' };
  for (const s of ROS_SECTIONS) {
    merged[s.id] = { ...fresh[s.id], ...(saved[s.id] || {}) };
  }

  // Retired group: move its answers to the systems they actually belong to.
  const legacy = saved.general || {};
  const REHOME = {
    woundIssues: 'integumentary',
    cancerHistory: 'hematologic',
    recentInfections: 'immunologic',
  };
  for (const [q, target] of Object.entries(REHOME)) {
    if (legacy[q] && !merged[target][q]) merged[target][q] = legacy[q];
  }
  return merged;
}
