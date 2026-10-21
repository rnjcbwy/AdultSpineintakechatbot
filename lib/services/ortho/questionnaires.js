// ============================================================================
// Patient-Reported Outcome Measures (PROMs) Definitions
// Conditionally applied based on the joint the patient's complaint is about.
//
//   Upper limb (shoulder, elbow, hand)  QuickDASH  (11 items, 0-100, higher = worse)
//   Hip                                 HOOS JR    (6 items, raw 0-24, higher = worse)
//   Knee                                KOOS JR    (7 items, raw 0-28, higher = worse)
//   Ankle / foot                        LEFS       (20 items, 0-80, higher = better)
//
// LICENSING. QuickDASH is copyright of the Institute for Work & Health and is
// free for clinical use once registered; it must be used unmodified. HOOS JR
// and KOOS JR are free to use (Hospital for Special Surgery); LEFS is free to
// use (Binkley et al.). Item wording below is reproduced for clinical use; if
// the practice's licence terms change, swap the instrument here.
//
// SCORING. QuickDASH and LEFS are scored exactly as published. HOOS JR and
// KOOS JR are published with a raw-sum-to-interval crosswalk (0-100, 100 =
// perfect joint health). The crosswalk is NOT reproduced here from memory:
// the raw sum is reported honestly as "x of 24 / 28, lower is better", and
// INTERVAL_TABLES below is where the official table goes. Once it is pasted
// in, every score, review screen and note picks the interval score up.
// ============================================================================

const FIVE = (labels) => labels.map((label, i) => ({ score: i, label }));
const NONE_EXTREME = ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'];
const DIFFICULTY_1_5 = ['No difficulty', 'Mild difficulty', 'Moderate difficulty', 'Severe difficulty', 'Unable'].map((label, i) => ({ score: i + 1, label }));

/**
 * QuickDASH — Disabilities of the Arm, Shoulder and Hand, short form.
 * 11 items scored 1-5. Score = ((sum / n) - 1) x 25; at least 10 of 11
 * items must be answered for a valid score.
 */
export const QUICKDASH = {
  id: 'quickdash',
  name: 'QuickDASH (arm, shoulder and hand)',
  shortName: 'QuickDASH',
  description: 'Please rate your ability to do the following activities in the last week, and how your arm, shoulder or hand problem has affected you.',
  minAnswered: 10,
  sections: [
    { id: 'jar', title: 'Open a tight or new jar', options: DIFFICULTY_1_5 },
    { id: 'chores', title: 'Do heavy household chores (wash walls, floors)', options: DIFFICULTY_1_5 },
    { id: 'carry', title: 'Carry a shopping bag or briefcase', options: DIFFICULTY_1_5 },
    { id: 'wash_back', title: 'Wash your back', options: DIFFICULTY_1_5 },
    { id: 'knife', title: 'Use a knife to cut food', options: DIFFICULTY_1_5 },
    { id: 'recreation', title: 'Recreational activities in which you take some force or impact through your arm, shoulder or hand (golf, hammering, tennis)', options: DIFFICULTY_1_5 },
    {
      id: 'social',
      title: 'During the past week, to what extent has your arm, shoulder or hand problem interfered with your normal social activities with family, friends, neighbours or groups?',
      options: ['Not at all', 'Slightly', 'Moderately', 'Quite a bit', 'Extremely'].map((label, i) => ({ score: i + 1, label })),
    },
    {
      id: 'work',
      title: 'During the past week, were you limited in your work or other regular daily activities as a result of your arm, shoulder or hand problem?',
      options: ['Not limited at all', 'Slightly limited', 'Moderately limited', 'Very limited', 'Unable'].map((label, i) => ({ score: i + 1, label })),
    },
    { id: 'pain', title: 'Arm, shoulder or hand pain in the past week', options: NONE_EXTREME.map((label, i) => ({ score: i + 1, label })) },
    { id: 'tingling', title: 'Tingling (pins and needles) in your arm, shoulder or hand in the past week', options: NONE_EXTREME.map((label, i) => ({ score: i + 1, label })) },
    {
      id: 'sleep',
      title: 'Difficulty sleeping because of the pain in your arm, shoulder or hand in the past week',
      options: ['No difficulty', 'Mild difficulty', 'Moderate difficulty', 'Severe difficulty', "So much difficulty that I can't sleep"].map((label, i) => ({ score: i + 1, label })),
    },
  ],
};

/**
 * HOOS JR — Hip disability and Osteoarthritis Outcome Score for Joint
 * Replacement. 6 items scored 0-4. Raw sum 0-24, converted to an interval
 * score by the published crosswalk (see INTERVAL_TABLES).
 */
export const HOOS_JR = {
  id: 'hoos_jr',
  name: 'HOOS JR (hip)',
  shortName: 'HOOS JR',
  description: 'Think about the hip pain and difficulty you have had during the last week.',
  sections: [
    { id: 'pain_stairs', title: 'Pain: going up or down stairs', subtitle: 'What amount of hip pain have you experienced the last week during this activity?', options: FIVE(NONE_EXTREME) },
    { id: 'pain_uneven', title: 'Pain: walking on an uneven surface', subtitle: 'What amount of hip pain have you experienced the last week during this activity?', options: FIVE(NONE_EXTREME) },
    { id: 'fn_rising', title: 'Function: rising from sitting', subtitle: 'What degree of difficulty have you experienced the last week due to your hip?', options: FIVE(NONE_EXTREME) },
    { id: 'fn_bending', title: 'Function: bending to the floor / picking up an object', subtitle: 'What degree of difficulty have you experienced the last week due to your hip?', options: FIVE(NONE_EXTREME) },
    { id: 'fn_bed', title: 'Function: lying in bed (turning over, maintaining hip position)', subtitle: 'What degree of difficulty have you experienced the last week due to your hip?', options: FIVE(NONE_EXTREME) },
    { id: 'fn_sitting', title: 'Function: sitting', subtitle: 'What degree of difficulty have you experienced the last week due to your hip?', options: FIVE(NONE_EXTREME) },
  ],
};

/**
 * KOOS JR — Knee injury and Osteoarthritis Outcome Score for Joint
 * Replacement. 7 items scored 0-4. Raw sum 0-28, converted to an interval
 * score by the published crosswalk (see INTERVAL_TABLES).
 */
export const KOOS_JR = {
  id: 'koos_jr',
  name: 'KOOS JR (knee)',
  shortName: 'KOOS JR',
  description: 'Think about the knee stiffness, pain and difficulty you have had during the last week.',
  sections: [
    { id: 'stiffness', title: 'Stiffness: how severe is your knee stiffness after first wakening in the morning?', options: FIVE(NONE_EXTREME) },
    { id: 'pain_twisting', title: 'Pain: twisting or pivoting on your knee', subtitle: 'What amount of knee pain have you experienced the last week during this activity?', options: FIVE(NONE_EXTREME) },
    { id: 'pain_straightening', title: 'Pain: straightening the knee fully', subtitle: 'What amount of knee pain have you experienced the last week during this activity?', options: FIVE(NONE_EXTREME) },
    { id: 'pain_stairs', title: 'Pain: going up or down stairs', subtitle: 'What amount of knee pain have you experienced the last week during this activity?', options: FIVE(NONE_EXTREME) },
    { id: 'pain_standing', title: 'Pain: standing upright', subtitle: 'What amount of knee pain have you experienced the last week during this activity?', options: FIVE(NONE_EXTREME) },
    { id: 'fn_rising', title: 'Function: rising from sitting', subtitle: 'What degree of difficulty have you experienced the last week due to your knee?', options: FIVE(NONE_EXTREME) },
    { id: 'fn_bending', title: 'Function: bending to the floor / picking up an object', subtitle: 'What degree of difficulty have you experienced the last week due to your knee?', options: FIVE(NONE_EXTREME) },
  ],
};

/**
 * LEFS — Lower Extremity Functional Scale. 20 items scored 0-4; total 0-80,
 * higher is better. Used here for ankle and foot complaints.
 */
const LEFS_OPTIONS = [
  { score: 0, label: 'Extreme difficulty or unable to perform the activity' },
  { score: 1, label: 'Quite a bit of difficulty' },
  { score: 2, label: 'Moderate difficulty' },
  { score: 3, label: 'A little bit of difficulty' },
  { score: 4, label: 'No difficulty' },
];
const LEFS_ITEMS = [
  ['work', 'Any of your usual work, housework or school activities'],
  ['hobbies', 'Your usual hobbies, recreational or sporting activities'],
  ['bath', 'Getting into or out of the bath'],
  ['rooms', 'Walking between rooms'],
  ['shoes', 'Putting on your shoes or socks'],
  ['squat', 'Squatting'],
  ['lift', 'Lifting an object, like a bag of groceries, from the floor'],
  ['light_home', 'Performing light activities around your home'],
  ['heavy_home', 'Performing heavy activities around your home'],
  ['car', 'Getting into or out of a car'],
  ['two_blocks', 'Walking 2 blocks'],
  ['mile', 'Walking a mile'],
  ['stairs', 'Going up or down 10 stairs (about one flight)'],
  ['stand_hour', 'Standing for 1 hour'],
  ['sit_hour', 'Sitting for 1 hour'],
  ['run_even', 'Running on even ground'],
  ['run_uneven', 'Running on uneven ground'],
  ['turns', 'Making sharp turns while running fast'],
  ['hop', 'Hopping'],
  ['roll', 'Rolling over in bed'],
];
export const LEFS = {
  id: 'lefs',
  name: 'Lower Extremity Functional Scale (LEFS)',
  shortName: 'LEFS',
  description: 'Today, do you or would you have any difficulty at all with the following activities because of your ankle or foot problem?',
  sections: LEFS_ITEMS.map(([id, title]) => ({ id, title, options: LEFS_OPTIONS })),
};

/**
 * Raw-sum-to-interval crosswalks for HOOS JR (index 0..24) and KOOS JR
 * (index 0..28), 100 = perfect joint health. Left empty on purpose: paste the
 * published tables from the Hospital for Special Surgery here and verify two
 * values by hand. Until then the raw sum is reported.
 */
export const INTERVAL_TABLES = {
  hoos_jr: null,
  koos_jr: null,
};

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

const answeredOf = (answers) => Object.entries(answers || {}).filter(([, v]) => v !== null && v !== undefined);

/**
 * QuickDASH: ((sum / n) - 1) x 25. Valid with 10 or 11 items answered; with
 * fewer the score is still shown but marked incomplete.
 */
export function scoreQuickDash(answers) {
  const answered = answeredOf(answers);
  if (!answered.length) return null;
  const sum = answered.reduce((s, [, v]) => s + v, 0);
  const n = answered.length;
  const score = Math.round(((sum / n) - 1) * 25);
  return {
    score,
    maxScore: 100,
    itemsAnswered: n,
    itemsTotal: QUICKDASH.sections.length,
    incomplete: n < QUICKDASH.minAnswered,
    interpretation: n < QUICKDASH.minAnswered ? 'Incomplete (fewer than 10 items answered)' : '0 = no disability, 100 = most severe',
  };
}

/** HOOS JR / KOOS JR: raw sum, plus the interval score once a crosswalk is present. */
export function scoreJrRaw(answers, questionnaire) {
  const answered = answeredOf(answers);
  if (!answered.length) return null;
  const rawScore = answered.reduce((s, [, v]) => s + v, 0);
  const maxPossible = questionnaire.sections.length * 4;
  const complete = answered.length === questionnaire.sections.length;
  const table = INTERVAL_TABLES[questionnaire.id];
  const interval = complete && Array.isArray(table) && typeof table[rawScore] === 'number' ? Math.round(table[rawScore] * 10) / 10 : null;
  return {
    rawScore,
    maxPossible,
    itemsAnswered: answered.length,
    itemsTotal: questionnaire.sections.length,
    incomplete: !complete,
    interval,
    interpretation: interval != null
      ? 'Interval score, 100 = no problems'
      : complete ? 'Raw sum, 0 = no problems (interval conversion table not loaded)' : 'Incomplete',
  };
}

/** LEFS: sum of 20 items, maximum 80, higher is better. */
export function scoreLefs(answers) {
  const answered = answeredOf(answers);
  if (!answered.length) return null;
  const totalScore = answered.reduce((s, [, v]) => s + v, 0);
  const maxScore = LEFS.sections.length * 4;
  const complete = answered.length === LEFS.sections.length;
  return {
    totalScore,
    maxScore,
    percentOfMaximal: complete ? Math.round((totalScore / maxScore) * 100) : null,
    itemsAnswered: answered.length,
    itemsTotal: LEFS.sections.length,
    incomplete: !complete,
    interpretation: complete ? `${Math.round((totalScore / maxScore) * 100)}% of maximal function` : 'Incomplete',
  };
}

export const QUESTIONNAIRES = { quickdash: QUICKDASH, hoos_jr: HOOS_JR, koos_jr: KOOS_JR, lefs: LEFS };

/** Score any instrument by id. */
export function scoreQuestionnaire(id, answers) {
  if (!answers || !Object.keys(answers).length) return null;
  if (id === 'quickdash') return scoreQuickDash(answers);
  if (id === 'hoos_jr') return scoreJrRaw(answers, HOOS_JR);
  if (id === 'koos_jr') return scoreJrRaw(answers, KOOS_JR);
  if (id === 'lefs') return scoreLefs(answers);
  return null;
}

// ============================================================================
// CONDITIONAL LOGIC — Determine which PROMs to show
// ============================================================================

const UPPER = ['right-shoulder', 'left-shoulder', 'right-elbow', 'left-elbow', 'right-hand', 'left-hand'];
const HIP = ['right-hip', 'left-hip'];
const KNEE = ['right-knee', 'left-knee'];
const FOOT = ['right-foot', 'left-foot'];

/**
 * Determines which questionnaires are applicable based on intake data.
 * @param {Object} intakeData — full intake store data
 * @returns {string[]} — array of questionnaire IDs to show
 */
export function getApplicableQuestionnaires(intakeData) {
  const questionnaires = [];
  const regions = intakeData.chiefComplaint?.symptomRegions || [];
  const any = (list) => regions.some((r) => list.includes(r));

  if (any(UPPER)) questionnaires.push('quickdash');
  if (any(HIP)) questionnaires.push('hoos_jr');
  if (any(KNEE)) questionnaires.push('koos_jr');
  if (any(FOOT)) questionnaires.push('lefs');

  return questionnaires;
}
