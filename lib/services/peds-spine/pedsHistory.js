// ============================================================================
// The pediatric spine history: the option lists, the labels and the row
// helpers behind the `spine-history` step (components/steps/peds/SpineHistory.js).
//
// Ported from the pediatric spine intake's lib/catalog.js (SPINE_HISTORY,
// INTERVAL_HISTORY, POSTOP_HISTORY and their label tables). Values are stored
// in English exactly as written here; the step shows them through t().
//
// Everything the step records lives under data.pedsSpine:
//   pedsSpine.history   the story so far (new, new problem, work or legal claim)
//   pedsSpine.interval  what a follow-up adds to the shared interval step
//   pedsSpine.postop    what a post-operative visit adds to the shared recovery step
//
// Not exported through the service index: this is internal to the folder.
// extras.js turns it into PDF sections and review items, prompts.js into the
// resolved-to-words block the note model reads, redFlags.js into flags.
// ============================================================================

/** What the family has been told so far. Stored as the label. */
export const DIAGNOSIS_OPTIONS = [
  'Adolescent idiopathic scoliosis',
  'Early-onset scoliosis (under 10)',
  'Congenital scoliosis',
  'Neuromuscular scoliosis',
  'Syndromic scoliosis',
  'Kyphosis',
  'Spondylolysis or spondylolisthesis',
  'Back pain',
  'Other or not sure',
];

/** The diagnosis groups the extra sections hang on. */
export const DX = {
  lowBack: ['Spondylolysis or spondylolisthesis', 'Back pain', 'Other or not sure'],
  neuromuscular: ['Neuromuscular scoliosis'],
  kyphosis: ['Kyphosis'],
  associated: ['Congenital scoliosis', 'Syndromic scoliosis'],
  eos: ['Early-onset scoliosis (under 10)'],
  scoliosis: ['Adolescent idiopathic scoliosis', 'Early-onset scoliosis (under 10)', 'Congenital scoliosis', 'Neuromuscular scoliosis', 'Syndromic scoliosis', 'Kyphosis'],
};

export const VISIT_GOAL_OPTIONS = [
  'Understand the diagnosis',
  'Discuss treatment options',
  'Get a second opinion',
  'Evaluate for surgery',
  'Bracing evaluation',
  'Pain management',
  'Monitor curve progression',
  'Address cosmetic concerns',
  'Discuss activity or sports restrictions',
];

export const YES_NO_UNSURE = ['Yes', 'No', 'Not sure'];

/** The story so far. */
export const SPINE_HISTORY = {
  discovery: ['School screening', 'Pediatrician check-up', 'A parent noticed something', 'The child noticed something', 'Pain brought us in', 'Seen on imaging done for another reason', 'Sports physical', 'Another doctor or therapist noticed', 'Not sure'],
  appearance: ['Uneven shoulders', 'Rib hump or prominence when bending forward', 'Uneven waist or hips', 'Leaning or shifting to one side', 'Rounded upper back or hunch', 'Head carried forward', 'Clothes fit unevenly', 'Nothing visible', 'Not sure'],
  painFrequency: ['Constant', 'Every day', 'A few times a week', 'Occasionally', 'Only with certain activities'],
  painWorse: ['Sitting', 'Standing', 'Bending forward', 'Bending or arching backward', 'Sports or exercise', 'Lifting or carrying', 'Carrying a backpack', 'Lying down or at night', 'Nothing in particular'],
  painBetter: ['Rest', 'Ice or heat', 'Medication', 'Stretching', 'Changing position', 'Nothing helps', 'Have not tried anything'],
  // The shared safety check already asks about numbness, weakness and the
  // bladder and bowels; these are the pediatric screens it does not ask.
  neuro: ['Changes in walking or balance', 'Fever, weight loss or night sweats', 'None of these'],
  imagesOnHand: ['Yes, we have the images on a CD or USB', 'We only have the written report', 'No, but we can request them', 'Not sure'],
  // Physical therapy, chiropractic care, injections and medicines are asked
  // on the shared treatments page; these are the scoliosis-specific ones.
  treatments: ['None yet', 'Observation and check-ups', 'Brace', 'Schroth or scoliosis-specific exercises', 'Casting', 'Surgery', 'Other'],
  braceTypes: ['Boston brace', 'Rigo-Cheneau brace', 'Providence (night-time) brace', 'SpineCor or soft brace', 'Other or not sure'],
  braceHours: ['Less than 8 hours a day', '8 to 12 hours a day', '13 to 18 hours a day', '19 to 23 hours a day', 'Night-time only', 'Not wearing it'],
  limited: ['Nothing is limited', 'Sports or exercise', 'Gym class', 'Sitting in class', 'Carrying a backpack', 'Sleep', 'Walking long distances', 'Other'],
  peClass: ['Full participation', 'Modified', 'Excused', 'Not in school'],
  appearanceBother: ['Not at all', 'A little', 'Moderately', 'A lot'],
  extensionSports: ['Gymnastics', 'Dance', 'Cheerleading', 'Diving', 'Football', 'Wrestling', 'Weight lifting', 'None of these'],
  mobility: ['Walks without support', 'Walks with a walker, crutches or braces', 'Uses a wheelchair some of the time', 'Uses a wheelchair all of the time'],
  kyphosisFlex: ['Flexible: can straighten up when asked', 'Stiff: cannot straighten up', 'Not sure'],
  associated: ['Heart', 'Kidney or urinary tract', 'Spinal cord (tethered cord, syrinx, Chiari)', 'Hearing', 'None that we know of', 'Not sure'],
};

/** Labels for the story-so-far fields, in reading order (review, PDF, note prompt). */
export const SPINE_HISTORY_LABELS = {
  diagnosis: 'What the family has been told',
  goals: 'What the family hopes for from the visit',
  goalOther: 'Other hope for the visit',
  discovery: 'How it was first noticed',
  appearance: 'What the family has noticed',
  hasPain: 'Pain',
  painFrequency: 'How often',
  painWorse: 'Worse with',
  painBetter: 'Better with',
  nightPain: 'Pain wakes the child from sleep',
  neuro: 'Walking, balance and constitutional symptoms',
  curveMeasure: 'Curve measurement, if known',
  imagesOnHand: 'Images on CD or USB',
  treatments: 'Scoliosis-specific treatment so far',
  braceType: 'Brace type',
  braceHoursPrescribed: 'Brace hours prescribed',
  braceHoursWorn: 'Brace hours actually worn',
  braceSince: 'Bracing since',
  braceFit: 'Brace fit or problems',
  therapy: 'Schroth or scoliosis-specific exercise details',
  treatmentDetail: 'Treatment details',
  otherSpecialist: 'Seen another spine specialist',
  specialistTold: 'What they were told',
  secondOpinionWhy: 'Reason for seeking another opinion',
  limited: 'Activities limited',
  limitedDetail: 'Activity details',
  peClass: 'Gym class',
  appearanceBother: 'How much the appearance bothers the child',
  extensionSports: 'Back-arching sports',
  archPain: 'Pain when arching backward',
  mobility: 'Mobility',
  sittingBalance: 'Sitting balance concerns',
  seatingIssues: 'Seating or positioning problems',
  kyphosisFlex: 'The rounded back is',
  associated: 'Associated findings',
  eosNoticedAge: 'Age when the curve was first noticed',
  story: "In the family's own words",
};

/** What a follow-up adds to the shared interval step. */
export const INTERVAL_HISTORY = {
  sinceLast: ['About the same', 'The curve looks worse', 'The curve looks better', 'More pain', 'Less pain', 'New symptoms', 'Grew noticeably', 'Started or changed a brace', 'Started or stopped therapy', 'Had new imaging', 'Seen another doctor for the spine', 'Not sure'],
  currentTreatment: ['Observation only', 'Brace', 'Physical therapy', 'Schroth exercises', 'Casting', 'Other', 'None'],
  braceProblems: ['Skin irritation', 'Pain in the brace', 'Too tight or too loose', 'Hard to wear at school', 'Hard to wear at night', 'Sweating or heat', 'Outgrown', 'None'],
  therapyAdherence: ['Doing it as prescribed', 'Doing some of it', 'Stopped', 'Not started yet'],
  newImaging: ['Yes, X-ray', 'Yes, MRI', 'Yes, other imaging', 'No', 'Not sure'],
  menarcheSince: ['Yes, since the last visit', 'No, not yet', 'Had already started before the last visit', 'Not applicable'],
};

export const INTERVAL_HISTORY_LABELS = {
  sinceLast: 'What has changed since the last visit',
  currentTreatment: 'Current treatment',
  braceHoursWorn: 'Brace hours actually worn',
  braceProblems: 'Brace problems',
  braceNotes: 'About the brace',
  therapyAdherence: 'Exercise program',
  nightPain: 'Pain wakes the child from sleep',
  neuro: 'Walking, balance and constitutional symptoms since the last visit',
  newImaging: 'New imaging since the last visit',
  imagingWhen: 'When and where the imaging was done',
  curveMeasure: 'Curve measurement, if known',
  imagesOnHand: 'Images on CD or USB',
  heightChange: 'Growth since the last visit',
  menarcheSince: 'Periods started since the last visit',
  limited: 'Activities limited',
  peClass: 'Gym class',
  appearanceBother: 'How much the appearance bothers the child',
  story: "In the family's own words",
};

/** What a post-operative visit adds to the shared recovery step. */
export const POSTOP_HISTORY = {
  overall: ['Better than expected', 'About as expected', 'Harder than expected', 'Struggling'],
  incision: ['Looks fine', 'Redness', 'Swelling', 'Drainage or fluid', 'Opening of the incision', 'Warm to the touch', 'Not sure'],
  painTrend: ['Improving each week', 'About the same', 'Getting worse', 'Comes and goes'],
  painMeds: ['None', 'Acetaminophen', 'Ibuprofen or naproxen', 'Muscle relaxant', 'Opioid (oxycodone, hydrocodone)', 'Gabapentin', 'Other'],
  bowel: ['Normal', 'Constipated', 'Diarrhea', 'Not sure'],
  appetite: ['Normal', 'Reduced', 'Poor'],
  sleep: ['Sleeping well', 'Waking from pain', 'Trouble falling asleep', 'Poor'],
  mobility: ['Walking normally', 'Walking with some difficulty', 'Needs help walking', 'Mostly in bed'],
  activities: ['Back at school full time', 'Back at school part time', 'Not back at school yet', 'Doing home exercises', 'Started physical therapy', 'Returned to sports', 'None of these yet'],
  satisfaction: ['Very satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very dissatisfied'],
};

export const POSTOP_HISTORY_LABELS = {
  overall: 'Recovery overall',
  incision: 'Incision',
  fever: 'Fever over 100.4 F since going home',
  painTrend: 'Pain trend',
  painMeds: 'Pain medications in use',
  bowel: 'Bowel movements',
  bladder: 'Trouble urinating',
  appetite: 'Appetite',
  sleep: 'Sleep',
  walkingBalance: 'New trouble walking or balancing since surgery',
  mobility: 'Mobility',
  activities: 'Activity and school',
  satisfaction: 'Family satisfaction so far',
  story: "In the family's own words",
};

/** Which answers the office should see flagged, and how loudly. */
export const PEDS_FLAG_ANSWERS = {
  'Fever, weight loss or night sweats': 'urgent',
  'Changes in walking or balance': 'review',
};

/** Generic [label, value] rows for a chip-form object, in label order. */
export function rowsFor(labels, obj) {
  if (!obj) return [];
  const rows = [];
  for (const [key, label] of Object.entries(labels)) {
    const v = obj[key];
    if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) continue;
    rows.push([label, Array.isArray(v) ? v.join(', ') : String(v)]);
  }
  return rows;
}

/** The three pediatric blocks, each as a titled list of rows; empty ones are left out. */
export function pedsHistoryBlocks(pedsSpine) {
  const p = pedsSpine || {};
  return [
    { id: 'history', title: 'Pediatric spine history', rows: rowsFor(SPINE_HISTORY_LABELS, p.history) },
    { id: 'interval', title: 'Since the last visit (pediatric spine)', rows: rowsFor(INTERVAL_HISTORY_LABELS, p.interval) },
    { id: 'postop', title: 'After surgery (pediatric spine)', rows: rowsFor(POSTOP_HISTORY_LABELS, p.postop) },
  ].filter((b) => b.rows.length);
}

/** The pediatric section the visit type shows: 'interval', 'postop' or 'history'. */
export function pedsSectionFor(visitType) {
  if (visitType === 'followup') return 'interval';
  if (visitType === 'postop') return 'postop';
  return 'history';
}
