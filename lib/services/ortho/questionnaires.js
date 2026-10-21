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

/**
 * Spanish and Chinese for every patient-facing string this module defines:
 * the names, descriptions, items, options, interpretations and the words of
 * the score preview. components/steps/PROMs.js spreads it into its
 * dictionary; the nine other languages come from lib/translations, built by
 * scripts/translate-ui.mjs, which reads these keys too. Scoring never touches
 * a translated string: it runs on numeric `option.score` values only.
 */
export const TRANSLATIONS = {
  // ---- Questionnaire names ----
  'QuickDASH (arm, shoulder and hand)': { es: 'QuickDASH (brazo, hombro y mano)', zh: 'QuickDASH（手臂、肩和手）' },
  'HOOS JR (hip)': { es: 'HOOS JR (cadera)', zh: 'HOOS JR（髋）' },
  'KOOS JR (knee)': { es: 'KOOS JR (rodilla)', zh: 'KOOS JR（膝）' },
  'Lower Extremity Functional Scale (LEFS)': { es: 'Escala Funcional de la Extremidad Inferior (LEFS)', zh: '下肢功能量表（LEFS）' },
  // ---- Questionnaire descriptions ----
  'Please rate your ability to do the following activities in the last week, and how your arm, shoulder or hand problem has affected you.': { es: 'Califique su capacidad para hacer las siguientes actividades en la última semana, y cómo le ha afectado su problema del brazo, hombro o mano.', zh: '请评价您在过去一周完成以下活动的能力，以及手臂、肩或手的问题对您的影响。' },
  'Think about the hip pain and difficulty you have had during the last week.': { es: 'Piense en el dolor y la dificultad de la cadera que ha tenido durante la última semana.', zh: '请回想过去一周您的髋部疼痛和困难。' },
  'Think about the knee stiffness, pain and difficulty you have had during the last week.': { es: 'Piense en la rigidez, el dolor y la dificultad de la rodilla que ha tenido durante la última semana.', zh: '请回想过去一周您的膝关节僵硬、疼痛和困难。' },
  'Today, do you or would you have any difficulty at all with the following activities because of your ankle or foot problem?': { es: 'Hoy, ¿tiene o tendría alguna dificultad con las siguientes actividades debido a su problema de tobillo o pie?', zh: '今天，由于您的踝或足部问题，您在以下活动中是否有任何困难？' },
  // ---- QuickDASH items ----
  'Open a tight or new jar': { es: 'Abrir un frasco apretado o nuevo', zh: '打开紧的或新的罐子' },
  'Do heavy household chores (wash walls, floors)': { es: 'Hacer tareas domésticas pesadas (lavar paredes, pisos)', zh: '做重体力家务（擦墙、擦地）' },
  'Carry a shopping bag or briefcase': { es: 'Cargar una bolsa de compras o un maletín', zh: '提购物袋或公文包' },
  'Wash your back': { es: 'Lavarse la espalda', zh: '洗自己的后背' },
  'Use a knife to cut food': { es: 'Usar un cuchillo para cortar comida', zh: '用刀切食物' },
  'Recreational activities in which you take some force or impact through your arm, shoulder or hand (golf, hammering, tennis)': { es: 'Actividades recreativas en las que recibe fuerza o impacto en el brazo, hombro o mano (golf, martillar, tenis)', zh: '手臂、肩或手承受力量或冲击的娱乐活动（高尔夫、锤击、网球）' },
  'During the past week, to what extent has your arm, shoulder or hand problem interfered with your normal social activities with family, friends, neighbours or groups?': { es: 'Durante la última semana, ¿en qué medida su problema del brazo, hombro o mano interfirió con sus actividades sociales normales con familia, amigos, vecinos o grupos?', zh: '在过去一周，您的手臂、肩或手的问题在多大程度上影响了您与家人、朋友、邻居或团体的正常社交活动？' },
  'During the past week, were you limited in your work or other regular daily activities as a result of your arm, shoulder or hand problem?': { es: 'Durante la última semana, ¿estuvo limitado en su trabajo u otras actividades diarias habituales a causa de su problema del brazo, hombro o mano?', zh: '在过去一周，您的手臂、肩或手的问题是否限制了您的工作或其他日常活动？' },
  'Arm, shoulder or hand pain in the past week': { es: 'Dolor del brazo, hombro o mano en la última semana', zh: '过去一周手臂、肩或手的疼痛' },
  'Tingling (pins and needles) in your arm, shoulder or hand in the past week': { es: 'Hormigueo (alfileres y agujas) en el brazo, hombro o mano en la última semana', zh: '过去一周手臂、肩或手的刺痛（针刺感）' },
  'Difficulty sleeping because of the pain in your arm, shoulder or hand in the past week': { es: 'Dificultad para dormir por el dolor del brazo, hombro o mano en la última semana', zh: '过去一周因手臂、肩或手的疼痛而难以入睡' },
  // ---- QuickDASH answer options ----
  'No difficulty': { es: 'Sin dificultad', zh: '没有困难' },
  'Mild difficulty': { es: 'Dificultad leve', zh: '轻度困难' },
  'Moderate difficulty': { es: 'Dificultad moderada', zh: '中度困难' },
  'Severe difficulty': { es: 'Dificultad grave', zh: '重度困难' },
  'Unable': { es: 'Incapaz', zh: '无法完成' },
  'Not at all': { es: 'En absoluto', zh: '完全没有' },
  'Slightly': { es: 'Ligeramente', zh: '轻微' },
  'Moderately': { es: 'Moderadamente', zh: '中等程度' },
  'Quite a bit': { es: 'Bastante', zh: '相当多' },
  'Extremely': { es: 'Extremadamente', zh: '极其严重' },
  'Not limited at all': { es: 'Sin limitación', zh: '完全不受限' },
  'Slightly limited': { es: 'Ligeramente limitado', zh: '轻微受限' },
  'Moderately limited': { es: 'Moderadamente limitado', zh: '中度受限' },
  'Very limited': { es: 'Muy limitado', zh: '严重受限' },
  'None': { es: 'Ninguno', zh: '无' },
  'Mild': { es: 'Leve', zh: '轻度' },
  'Moderate': { es: 'Moderado', zh: '中度' },
  'Severe': { es: 'Intenso', zh: '重度' },
  'Extreme': { es: 'Extremo', zh: '极重度' },
  "So much difficulty that I can't sleep": { es: 'Tanta dificultad que no puedo dormir', zh: '困难到无法入睡' },
  // ---- HOOS JR items ----
  'Pain: going up or down stairs': { es: 'Dolor: subir o bajar escaleras', zh: '疼痛：上下楼梯' },
  'Pain: walking on an uneven surface': { es: 'Dolor: caminar sobre una superficie irregular', zh: '疼痛：在不平的地面上行走' },
  'Function: rising from sitting': { es: 'Función: levantarse de estar sentado', zh: '功能：从坐姿站起' },
  'Function: bending to the floor / picking up an object': { es: 'Función: agacharse al suelo / recoger un objeto', zh: '功能：弯腰到地面／捡起物品' },
  'Function: lying in bed (turning over, maintaining hip position)': { es: 'Función: acostado en la cama (darse la vuelta, mantener la posición de la cadera)', zh: '功能：躺在床上（翻身、保持髋部姿势）' },
  'Function: sitting': { es: 'Función: estar sentado', zh: '功能：坐' },
  // ---- HOOS JR item subtitles ----
  'What amount of hip pain have you experienced the last week during this activity?': { es: '¿Cuánto dolor de cadera ha tenido la última semana durante esta actividad?', zh: '过去一周进行此活动时，您的髋部疼痛程度如何？' },
  'What degree of difficulty have you experienced the last week due to your hip?': { es: '¿Qué grado de dificultad ha tenido la última semana debido a su cadera?', zh: '过去一周由于髋部问题，您的困难程度如何？' },
  // ---- KOOS JR items ----
  'Stiffness: how severe is your knee stiffness after first wakening in the morning?': { es: 'Rigidez: ¿qué tan intensa es la rigidez de la rodilla al despertarse por la mañana?', zh: '僵硬：早晨醒来后您的膝关节僵硬程度如何？' },
  'Pain: twisting or pivoting on your knee': { es: 'Dolor: girar o pivotar sobre la rodilla', zh: '疼痛：膝关节扭转或转身' },
  'Pain: straightening the knee fully': { es: 'Dolor: estirar la rodilla por completo', zh: '疼痛：完全伸直膝关节' },
  'Pain: standing upright': { es: 'Dolor: estar de pie erguido', zh: '疼痛：直立站着' },
  // ---- KOOS JR item subtitles ----
  'What amount of knee pain have you experienced the last week during this activity?': { es: '¿Cuánto dolor de rodilla ha tenido la última semana durante esta actividad?', zh: '过去一周进行此活动时，您的膝关节疼痛程度如何？' },
  'What degree of difficulty have you experienced the last week due to your knee?': { es: '¿Qué grado de dificultad ha tenido la última semana debido a su rodilla?', zh: '过去一周由于膝关节问题，您的困难程度如何？' },
  // ---- LEFS items ----
  'Any of your usual work, housework or school activities': { es: 'Cualquiera de sus actividades habituales de trabajo, tareas domésticas o escuela', zh: '您的任何日常工作、家务或学习活动' },
  'Your usual hobbies, recreational or sporting activities': { es: 'Sus pasatiempos, actividades recreativas o deportivas habituales', zh: '您的日常爱好、娱乐或体育活动' },
  'Getting into or out of the bath': { es: 'Entrar o salir de la bañera', zh: '进出浴缸' },
  'Walking between rooms': { es: 'Caminar entre habitaciones', zh: '在房间之间走动' },
  'Putting on your shoes or socks': { es: 'Ponerse los zapatos o los calcetines', zh: '穿鞋或穿袜子' },
  'Squatting': { es: 'Ponerse en cuclillas', zh: '下蹲' },
  'Lifting an object, like a bag of groceries, from the floor': { es: 'Levantar un objeto del suelo, como una bolsa de compras', zh: '从地上提起物品，如一袋杂货' },
  'Performing light activities around your home': { es: 'Realizar actividades ligeras en casa', zh: '在家做轻活' },
  'Performing heavy activities around your home': { es: 'Realizar actividades pesadas en casa', zh: '在家做重活' },
  'Getting into or out of a car': { es: 'Entrar o salir de un auto', zh: '上下汽车' },
  'Walking 2 blocks': { es: 'Caminar 2 cuadras', zh: '步行两个街区' },
  'Walking a mile': { es: 'Caminar una milla (1,6 km)', zh: '步行一英里（约1.6公里）' },
  'Going up or down 10 stairs (about one flight)': { es: 'Subir o bajar 10 escalones (aproximadamente un tramo)', zh: '上下10级台阶（约一层楼）' },
  'Standing for 1 hour': { es: 'Estar de pie durante 1 hora', zh: '站立1小时' },
  'Sitting for 1 hour': { es: 'Estar sentado durante 1 hora', zh: '坐1小时' },
  'Running on even ground': { es: 'Correr en terreno plano', zh: '在平地上跑步' },
  'Running on uneven ground': { es: 'Correr en terreno irregular', zh: '在不平的地面上跑步' },
  'Making sharp turns while running fast': { es: 'Hacer giros bruscos mientras corre rápido', zh: '快跑时急转弯' },
  'Hopping': { es: 'Saltar en un pie', zh: '单脚跳' },
  'Rolling over in bed': { es: 'Darse la vuelta en la cama', zh: '在床上翻身' },
  // ---- LEFS answer options ----
  'Extreme difficulty or unable to perform the activity': { es: 'Dificultad extrema o incapaz de realizar la actividad', zh: '极度困难或无法完成该活动' },
  'Quite a bit of difficulty': { es: 'Bastante dificultad', zh: '相当困难' },
  'A little bit of difficulty': { es: 'Un poco de dificultad', zh: '有一点困难' },
  // ---- Interpretations and score-preview words ----
  '0 = no disability, 100 = most severe': { es: '0 = sin discapacidad, 100 = la más grave', zh: '0 = 无功能障碍，100 = 最严重' },
  'Incomplete (fewer than 10 items answered)': { es: 'Incompleto (menos de 10 preguntas respondidas)', zh: '未完成（回答少于10项）' },
  'Raw sum, 0 = no problems (interval conversion table not loaded)': { es: 'Suma bruta, 0 = sin problemas', zh: '原始总分，0 = 无问题' },
  'Interval score, 100 = no problems': { es: 'Puntuación de intervalo, 100 = sin problemas', zh: '区间分数，100 = 无问题' },
  'Incomplete': { es: 'Incompleto', zh: '未完成' },
  'of maximal function': { es: 'de la función máxima', zh: '的最大功能' },
  'items': { es: 'preguntas', zh: '项' },
  'answered': { es: 'respondidas', zh: '已回答' },
};
