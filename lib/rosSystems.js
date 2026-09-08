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
// questions are high-yield for a spine practice specifically — dysphagia and
// hoarseness before an anterior cervical approach, balance and hand clumsiness
// as a myelopathy screen, osteoporosis and steroid use for fusion planning.
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
      // Both matter before an anterior cervical approach, which is why they
      // are asked even though they sound unrelated to a back problem.
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
      { id: 'jointPain', label: 'Joint pain or swelling (besides your spine symptoms)?' },
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
      // The two cervical myelopathy screens. Worth their place in a spine ROS.
      { id: 'balanceProblems', label: 'Trouble with balance, or feeling unsteady on your feet?' },
      { id: 'handClumsiness', label: 'Increasing clumsiness with your hands — buttons, handwriting, dropping things?' },
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
      // Bone quality changes the fusion conversation.
      { id: 'osteoporosis', label: 'Osteoporosis, thinning bones, or a fracture from a minor fall?' },
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

/** 10+ is the conventional bar for a documented "complete" ROS. */
export const COMPLETE_ROS_THRESHOLD = 10;

/** Blank answers for every system, for the store's defaults. */
export function emptyROS() {
  const out = {};
  for (const s of ROS_SECTIONS) {
    out[s.id] = Object.fromEntries(s.questions.map((q) => [q.id, '']));
  }
  out.additionalNotes = '';
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

  const merged = { ...fresh, additionalNotes: saved.additionalNotes || '' };
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
