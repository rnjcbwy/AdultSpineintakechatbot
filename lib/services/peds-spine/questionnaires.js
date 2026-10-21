// The child's version of questionnaires: the adult spine instruments (ODI,
// NDI, mJOA, SRS-22r) plus the two the pediatric spine intake offered on top
// of SRS-22r: the Spinal Appearance Questionnaire for adolescents and the
// parent-reported EOSQ-24 for children under 10. Same export shape as the
// adult module; components/steps/PROMs.js renders any instrument whose items
// are titled sections with scored options.
export * from '../spine/questionnaires';

import {
  QUESTIONNAIRES as ADULT_QUESTIONNAIRES,
  scoreQuestionnaire as scoreAdultQuestionnaire,
  getApplicableQuestionnaires as adultApplicableQuestionnaires,
  TRANSLATIONS as ADULT_TRANSLATIONS,
} from '../spine/questionnaires';

/** Options listed worst first, scored 1 (worst) to 5 (best), as the source stored them. */
const scale = (labels) => labels.map((label, i) => ({ score: i + 1, label }));

const UNHAPPY_HAPPY = ['Very unhappy', 'Unhappy', 'Neutral', 'Happy', 'Very happy'];
const DISSATISFIED_SATISFIED = ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied'];

// ============================================================================
// SAQ: Spinal Appearance Questionnaire (adolescents, 10 and over; the patient answers)
// ============================================================================

export const SAQ = {
  id: 'saq',
  name: 'Spinal Appearance Questionnaire (SAQ)',
  shortName: 'SAQ',
  description: 'These questions are for the young person to answer, about how they feel about the look of their back and body. There are no right or wrong answers.',
  sections: [
    { id: 'curve', title: 'How do you feel about the curve in your spine?', options: scale(UNHAPPY_HAPPY) },
    { id: 'behind', title: 'How do you feel about how your body looks from behind?', options: scale(UNHAPPY_HAPPY) },
    { id: 'front', title: 'How do you feel about how your body looks from the front?', options: scale(UNHAPPY_HAPPY) },
    { id: 'shoulders', title: 'How do you feel about the way your shoulders look?', options: scale(UNHAPPY_HAPPY) },
    { id: 'ribs', title: 'How do you feel about the shape of your rib cage?', options: scale(UNHAPPY_HAPPY) },
    { id: 'waist', title: 'How do you feel about how your waist looks?', options: scale(UNHAPPY_HAPPY) },
    { id: 'hips', title: 'How do you feel about how your hips look?', options: scale(UNHAPPY_HAPPY) },
    { id: 'noticeable', title: 'How noticeable do you think your spine curve is to others?', options: scale(['Very noticeable', 'Noticeable', 'Somewhat noticeable', 'Slightly noticeable', 'Not noticeable']) },
    { id: 'swimsuit', title: 'How do you feel about your body when wearing a swimsuit?', options: scale(UNHAPPY_HAPPY) },
    { id: 'tight_clothes', title: 'How do you feel about your body when wearing tight clothes?', options: scale(UNHAPPY_HAPPY) },
    { id: 'treated_differently', title: 'Do you feel that people treat you differently because of your spine?', options: scale(['Very often', 'Often', 'Sometimes', 'Rarely', 'Never']) },
    { id: 'think_about', title: 'How often do you think about your spine curve?', options: scale(['All the time', 'Often', 'Sometimes', 'Rarely', 'Never']) },
    { id: 'satisfied', title: 'Overall, how satisfied are you with your body appearance?', options: scale(DISSATISFIED_SATISFIED) },
    { id: 'confident', title: 'How confident do you feel about your appearance?', options: scale(['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely']) },
  ],
};

// ============================================================================
// EOSQ-24: Early Onset Scoliosis Questionnaire (under 10; a parent answers)
// ============================================================================

const eosq = (id, domain, title, labels) => ({ id, domain, title, options: scale(labels) });
const ALWAYS_NEVER = ['Always', 'Often', 'Sometimes', 'Rarely', 'Never'];
const DIFFICULT_EASY = ['Very difficult', 'Difficult', 'Somewhat difficult', 'Easy', 'Very easy'];
const SEVERELY_NOT = ['Severely', 'Very much', 'Somewhat', 'A little', 'Not at all'];

export const EOSQ24 = {
  id: 'eosq24',
  name: 'Early Onset Scoliosis Questionnaire (EOSQ-24)',
  shortName: 'EOSQ-24',
  description: 'For a parent or guardian to answer about a young child: how the spine condition affects the child\'s health, daily life and the family.',
  domains: [
    { id: 'general_health', name: 'General Health', sectionIds: ['gh1', 'gh2'] },
    { id: 'pulmonary', name: 'Breathing & Lungs', sectionIds: ['p1', 'p2', 'p3'] },
    { id: 'transfer', name: 'Transfer & Dressing', sectionIds: ['t1', 't2'] },
    { id: 'physical_function', name: 'Physical Function', sectionIds: ['pf1', 'pf2', 'pf3'] },
    { id: 'daily_living', name: 'Daily Living', sectionIds: ['dl1', 'dl2', 'dl3'] },
    { id: 'pain', name: 'Pain', sectionIds: ['pain1', 'pain2'] },
    { id: 'emotion', name: 'Emotional Health', sectionIds: ['e1', 'e2'] },
    { id: 'parent_impact', name: 'Family Impact', sectionIds: ['pi1', 'pi2', 'pi3', 'pi4'] },
    { id: 'satisfaction', name: 'Satisfaction', sectionIds: ['s1', 's2'] },
  ],
  sections: [
    eosq('gh1', 'general_health', "In general, how would you rate your child's overall health?", ['Very poor', 'Poor', 'Fair', 'Good', 'Very good']),
    eosq('gh2', 'general_health', "How satisfied are you with your child's overall health?", DISSATISFIED_SATISFIED),
    eosq('p1', 'pulmonary', 'Does your child have difficulty breathing during normal daily activities?', ALWAYS_NEVER),
    eosq('p2', 'pulmonary', 'Does your child need breathing support or oxygen?', ['All the time', 'Most of the time', 'Sometimes', 'Rarely', 'Never']),
    eosq('p3', 'pulmonary', 'How often does your child get respiratory infections (colds, bronchitis, pneumonia)?', ['Very often', 'Often', 'Sometimes', 'Rarely', 'Never']),
    eosq('t1', 'transfer', 'How easy is it to move or transfer your child (for example in and out of a car seat or bed)?', DIFFICULT_EASY),
    eosq('t2', 'transfer', 'How easy is it to dress your child?', DIFFICULT_EASY),
    eosq('pf1', 'physical_function', "Compared with other children the same age, how would you rate your child's physical ability?", ['Much worse', 'Worse', 'About the same', 'Better', 'Much better']),
    eosq('pf2', 'physical_function', "Does your child's spine condition limit their physical activities?", ['Severely limited', 'Very limited', 'Somewhat limited', 'Slightly limited', 'Not limited']),
    eosq('pf3', 'physical_function', 'How well can your child keep up with other children during play?', ['Not at all', 'A little', 'Somewhat', 'Mostly', 'Completely']),
    eosq('dl1', 'daily_living', "Does your child's spine condition affect their ability to eat or drink?", SEVERELY_NOT),
    eosq('dl2', 'daily_living', "Does your child's spine condition affect their sleep?", SEVERELY_NOT),
    eosq('dl3', 'daily_living', "How much does your child's spine condition affect their daily routine?", SEVERELY_NOT),
    eosq('pain1', 'pain', 'In the past 4 weeks, how much pain has your child had from their spine?', ['Severe', 'Moderate', 'Mild', 'Very mild', 'None']),
    eosq('pain2', 'pain', 'How often does your child seem to be in pain or discomfort?', ALWAYS_NEVER),
    eosq('e1', 'emotion', 'How happy does your child seem?', ['Never happy', 'Rarely happy', 'Sometimes happy', 'Usually happy', 'Always happy']),
    eosq('e2', 'emotion', 'How often does your child seem frustrated or upset about their condition?', ALWAYS_NEVER),
    eosq('pi1', 'parent_impact', "How much has your child's spine condition affected your family's daily life?", SEVERELY_NOT),
    eosq('pi2', 'parent_impact', "How worried are you about your child's future because of their spine condition?", ['Extremely worried', 'Very worried', 'Somewhat worried', 'A little worried', 'Not worried']),
    eosq('pi3', 'parent_impact', "How much financial burden has your child's spine care caused?", ['Severe', 'Significant', 'Moderate', 'Mild', 'None']),
    eosq('pi4', 'parent_impact', "How much stress has your child's spine condition caused you?", ['Extreme stress', 'A lot of stress', 'Moderate stress', 'A little stress', 'No stress']),
    eosq('s1', 'satisfaction', "How satisfied are you with your child's current spine treatment?", DISSATISFIED_SATISFIED),
    eosq('s2', 'satisfaction', "How satisfied are you with the appearance of your child's back?", DISSATISFIED_SATISFIED),
  ],
};

// ============================================================================
// SCORING
// ============================================================================

const mean = (values) => parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));

/**
 * Score the SAQ or the EOSQ-24: the mean of the answered items, 1 to 5 with 5
 * best, and for the EOSQ-24 a mean per domain as well.
 * @returns {{ totalScore, maxScore, answered, total, domainScores, interpretation }}
 */
export function scoreMeanInstrument(answers, questionnaire) {
  const answered = Object.entries(answers || {}).filter(([, v]) => v !== null && v !== undefined);
  if (!answered.length) return null;
  const totalScore = mean(answered.map(([, v]) => v));
  const domainScores = {};
  for (const domain of questionnaire.domains || []) {
    const vals = domain.sectionIds.map((id) => answers[id]).filter((v) => v !== null && v !== undefined);
    if (vals.length) {
      domainScores[domain.id] = { name: domain.name, score: mean(vals), questionsAnswered: vals.length, questionsTotal: domain.sectionIds.length };
    }
  }
  const interpretation = questionnaire.id === 'saq'
    ? (totalScore >= 4 ? 'Little appearance concern' : totalScore >= 3 ? 'Moderate appearance concern' : 'Significant appearance concern')
    : (totalScore >= 4 ? 'Good quality of life' : totalScore >= 3 ? 'Moderately affected quality of life' : 'Substantially affected quality of life');
  return {
    totalScore,
    maxScore: 5,
    answered: answered.length,
    total: questionnaire.sections.length,
    domainScores: questionnaire.domains ? domainScores : null,
    interpretation,
  };
}

/** Every instrument this service can offer, keyed by the id stored under `proms`. */
export const QUESTIONNAIRES = { ...ADULT_QUESTIONNAIRES, saq: SAQ, eosq24: EOSQ24 };

/** Score any instrument by id; null until something has been answered. */
export function scoreQuestionnaire(id, answers) {
  if (!answers || !Object.keys(answers).length) return null;
  if (id === 'saq') return scoreMeanInstrument(answers, SAQ);
  if (id === 'eosq24') return scoreMeanInstrument(answers, EOSQ24);
  return scoreAdultQuestionnaire(id, answers);
}

/** Years old from the demographics (ISO date of birth, or the age the form worked out). */
function childAge(demographics = {}) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(demographics.dob || ''));
  if (m) {
    const birth = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    const now = new Date();
    let years = now.getUTCFullYear() - birth.getUTCFullYear();
    const before = now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
    if (before) years -= 1;
    return years;
  }
  const n = parseInt(demographics.age, 10);
  return Number.isNaN(n) ? null : n;
}

/**
 * Which questionnaires a child gets, as the pediatric spine intake chose
 * them: under 10, the parent-reported EOSQ-24; from 10 up (or when the age
 * is not known yet), SRS-22r and the SAQ, plus the mJOA when the shared
 * symptom details raised myelopathic signs.
 */
export function getApplicableQuestionnaires(intakeData) {
  const age = childAge(intakeData?.demographics);
  if (age !== null && age < 10) return ['eosq24'];
  const adult = adultApplicableQuestionnaires(intakeData);
  return ['srs22r', 'saq', ...adult.filter((id) => id === 'mjoa')];
}

/** Spanish and Chinese for the two pediatric instruments, over the adult table. */
export const TRANSLATIONS = {
  ...ADULT_TRANSLATIONS,
  // ---- Names and descriptions ----
  'Spinal Appearance Questionnaire (SAQ)': { es: 'Cuestionario de Apariencia de la Columna (SAQ)', zh: '脊柱外观问卷 (SAQ)' },
  'These questions are for the young person to answer, about how they feel about the look of their back and body. There are no right or wrong answers.': { es: 'Estas preguntas son para que las responda el o la joven, sobre cómo se siente con el aspecto de su espalda y su cuerpo. No hay respuestas correctas ni incorrectas.', zh: '这些问题请由孩子本人回答，关于他/她对自己背部和身体外观的感受。答案没有对错之分。' },
  'Early Onset Scoliosis Questionnaire (EOSQ-24)': { es: 'Cuestionario de Escoliosis de Inicio Temprano (EOSQ-24)', zh: '早发性脊柱侧弯问卷 (EOSQ-24)' },
  'For a parent or guardian to answer about a young child: how the spine condition affects the child\'s health, daily life and the family.': { es: 'Para que lo responda el padre, la madre o el tutor sobre un niño pequeño: cómo afecta la condición de la columna a la salud del niño, su vida diaria y la familia.', zh: '由家长或监护人就幼儿情况回答：脊柱问题对孩子的健康、日常生活和家庭的影响。' },
  // ---- SAQ items ----
  'How do you feel about the curve in your spine?': { es: '¿Cómo te sientes con la curva de tu columna?', zh: '你对自己脊柱的弯曲感觉如何？' },
  'How do you feel about how your body looks from behind?': { es: '¿Cómo te sientes con cómo se ve tu cuerpo por detrás?', zh: '你对自己身体从背后看起来的样子感觉如何？' },
  'How do you feel about how your body looks from the front?': { es: '¿Cómo te sientes con cómo se ve tu cuerpo por delante?', zh: '你对自己身体从正面看起来的样子感觉如何？' },
  'How do you feel about the way your shoulders look?': { es: '¿Cómo te sientes con cómo se ven tus hombros?', zh: '你对自己肩膀的样子感觉如何？' },
  'How do you feel about the shape of your rib cage?': { es: '¿Cómo te sientes con la forma de tu caja torácica?', zh: '你对自己胸廓的形状感觉如何？' },
  'How do you feel about how your waist looks?': { es: '¿Cómo te sientes con cómo se ve tu cintura?', zh: '你对自己腰部的样子感觉如何？' },
  'How do you feel about how your hips look?': { es: '¿Cómo te sientes con cómo se ven tus caderas?', zh: '你对自己髋部的样子感觉如何？' },
  'How noticeable do you think your spine curve is to others?': { es: '¿Qué tan notoria crees que es la curva de tu columna para los demás?', zh: '你认为别人能多明显地看出你的脊柱弯曲？' },
  'How do you feel about your body when wearing a swimsuit?': { es: '¿Cómo te sientes con tu cuerpo cuando usas traje de baño?', zh: '穿泳装时你对自己的身体感觉如何？' },
  'How do you feel about your body when wearing tight clothes?': { es: '¿Cómo te sientes con tu cuerpo cuando usas ropa ajustada?', zh: '穿紧身衣服时你对自己的身体感觉如何？' },
  'Do you feel that people treat you differently because of your spine?': { es: '¿Sientes que la gente te trata diferente por tu columna?', zh: '你是否觉得别人因为你的脊柱而对你另眼相待？' },
  'How often do you think about your spine curve?': { es: '¿Con qué frecuencia piensas en la curva de tu columna?', zh: '你多久会想到自己的脊柱弯曲？' },
  'Overall, how satisfied are you with your body appearance?': { es: 'En general, ¿qué tan satisfecho o satisfecha estás con la apariencia de tu cuerpo?', zh: '总体而言，你对自己的身体外观有多满意？' },
  'How confident do you feel about your appearance?': { es: '¿Qué tan seguro o segura te sientes con tu apariencia?', zh: '你对自己的外表有多自信？' },
  // ---- SAQ options ----
  'Very unhappy': { es: 'Muy infeliz', zh: '非常不开心' },
  'Unhappy': { es: 'Infeliz', zh: '不开心' },
  'Neutral': { es: 'Neutral', zh: '一般' },
  'Happy': { es: 'Feliz', zh: '开心' },
  'Very happy': { es: 'Muy feliz', zh: '非常开心' },
  'Very noticeable': { es: 'Muy notoria', zh: '非常明显' },
  'Noticeable': { es: 'Notoria', zh: '明显' },
  'Somewhat noticeable': { es: 'Algo notoria', zh: '有些明显' },
  'Slightly noticeable': { es: 'Apenas notoria', zh: '略微明显' },
  'Not noticeable': { es: 'No se nota', zh: '不明显' },
  'Very often': { es: 'Muy a menudo', zh: '非常经常' },
  'Often': { es: 'A menudo', zh: '经常' },
  'Sometimes': { es: 'A veces', zh: '有时' },
  'Rarely': { es: 'Rara vez', zh: '很少' },
  'Never': { es: 'Nunca', zh: '从不' },
  'All the time': { es: 'Todo el tiempo', zh: '一直' },
  'Very dissatisfied': { es: 'Muy insatisfecho/a', zh: '非常不满意' },
  'Dissatisfied': { es: 'Insatisfecho/a', zh: '不满意' },
  'Satisfied': { es: 'Satisfecho/a', zh: '满意' },
  'Very satisfied': { es: 'Muy satisfecho/a', zh: '非常满意' },
  'Not at all': { es: 'Nada', zh: '完全没有' },
  'Slightly': { es: 'Un poco', zh: '略微' },
  'Moderately': { es: 'Moderadamente', zh: '中等' },
  'Very': { es: 'Mucho', zh: '很' },
  'Extremely': { es: 'Muchísimo', zh: '非常' },
  // ---- EOSQ-24 domains ----
  'General Health': { es: 'Salud general', zh: '总体健康' },
  'Breathing & Lungs': { es: 'Respiración y pulmones', zh: '呼吸与肺部' },
  'Transfer & Dressing': { es: 'Traslados y vestirse', zh: '转移与穿衣' },
  'Physical Function': { es: 'Función física', zh: '身体功能' },
  'Daily Living': { es: 'Vida diaria', zh: '日常生活' },
  'Pain': { es: 'Dolor', zh: '疼痛' },
  'Emotional Health': { es: 'Salud emocional', zh: '情绪健康' },
  'Family Impact': { es: 'Impacto en la familia', zh: '对家庭的影响' },
  'Satisfaction': { es: 'Satisfacción', zh: '满意度' },
  // ---- EOSQ-24 items ----
  "In general, how would you rate your child's overall health?": { es: 'En general, ¿cómo calificaría la salud general de su hijo/a?', zh: '总体而言，您如何评价孩子的整体健康状况？' },
  "How satisfied are you with your child's overall health?": { es: '¿Qué tan satisfecho/a está con la salud general de su hijo/a?', zh: '您对孩子的整体健康状况有多满意？' },
  'Does your child have difficulty breathing during normal daily activities?': { es: '¿Su hijo/a tiene dificultad para respirar durante las actividades diarias normales?', zh: '孩子在正常日常活动中是否有呼吸困难？' },
  'Does your child need breathing support or oxygen?': { es: '¿Su hijo/a necesita apoyo respiratorio u oxígeno?', zh: '孩子是否需要呼吸支持或吸氧？' },
  'How often does your child get respiratory infections (colds, bronchitis, pneumonia)?': { es: '¿Con qué frecuencia su hijo/a tiene infecciones respiratorias (resfriados, bronquitis, neumonía)?', zh: '孩子多久会得一次呼吸道感染（感冒、支气管炎、肺炎）？' },
  'How easy is it to move or transfer your child (for example in and out of a car seat or bed)?': { es: '¿Qué tan fácil es mover o trasladar a su hijo/a (por ejemplo, entrar y salir del asiento del auto o de la cama)?', zh: '移动或转移孩子（例如进出汽车安全座椅或床）有多容易？' },
  'How easy is it to dress your child?': { es: '¿Qué tan fácil es vestir a su hijo/a?', zh: '给孩子穿衣服有多容易？' },
  "Compared with other children the same age, how would you rate your child's physical ability?": { es: 'En comparación con otros niños de la misma edad, ¿cómo calificaría la capacidad física de su hijo/a?', zh: '与同龄孩子相比，您如何评价孩子的身体能力？' },
  "Does your child's spine condition limit their physical activities?": { es: '¿La condición de la columna de su hijo/a limita sus actividades físicas?', zh: '孩子的脊柱问题是否限制了他/她的体育活动？' },
  'How well can your child keep up with other children during play?': { es: '¿Qué tan bien puede su hijo/a seguir el ritmo de otros niños al jugar?', zh: '孩子在玩耍时能否跟得上其他孩子？' },
  "Does your child's spine condition affect their ability to eat or drink?": { es: '¿La condición de la columna de su hijo/a afecta su capacidad para comer o beber?', zh: '孩子的脊柱问题是否影响他/她的进食或饮水？' },
  "Does your child's spine condition affect their sleep?": { es: '¿La condición de la columna de su hijo/a afecta su sueño?', zh: '孩子的脊柱问题是否影响他/她的睡眠？' },
  "How much does your child's spine condition affect their daily routine?": { es: '¿Cuánto afecta la condición de la columna de su hijo/a a su rutina diaria?', zh: '孩子的脊柱问题对他/她的日常作息影响有多大？' },
  'In the past 4 weeks, how much pain has your child had from their spine?': { es: 'En las últimas 4 semanas, ¿cuánto dolor ha tenido su hijo/a por la columna?', zh: '过去4周内，孩子因脊柱问题有多少疼痛？' },
  'How often does your child seem to be in pain or discomfort?': { es: '¿Con qué frecuencia su hijo/a parece tener dolor o malestar?', zh: '孩子看起来多久会有疼痛或不适？' },
  'How happy does your child seem?': { es: '¿Qué tan feliz parece su hijo/a?', zh: '孩子看起来有多开心？' },
  'How often does your child seem frustrated or upset about their condition?': { es: '¿Con qué frecuencia su hijo/a parece frustrado/a o molesto/a por su condición?', zh: '孩子多久会因为自己的病情而显得沮丧或不安？' },
  "How much has your child's spine condition affected your family's daily life?": { es: '¿Cuánto ha afectado la condición de la columna de su hijo/a a la vida diaria de su familia?', zh: '孩子的脊柱问题对您家庭的日常生活影响有多大？' },
  "How worried are you about your child's future because of their spine condition?": { es: '¿Qué tan preocupado/a está por el futuro de su hijo/a debido a su condición de la columna?', zh: '因为孩子的脊柱问题，您对孩子的未来有多担心？' },
  "How much financial burden has your child's spine care caused?": { es: '¿Cuánta carga económica ha causado la atención de la columna de su hijo/a?', zh: '孩子的脊柱治疗造成了多大的经济负担？' },
  "How much stress has your child's spine condition caused you?": { es: '¿Cuánto estrés le ha causado la condición de la columna de su hijo/a?', zh: '孩子的脊柱问题给您带来了多大的压力？' },
  "How satisfied are you with your child's current spine treatment?": { es: '¿Qué tan satisfecho/a está con el tratamiento actual de la columna de su hijo/a?', zh: '您对孩子目前的脊柱治疗有多满意？' },
  "How satisfied are you with the appearance of your child's back?": { es: '¿Qué tan satisfecho/a está con la apariencia de la espalda de su hijo/a?', zh: '您对孩子背部的外观有多满意？' },
  // ---- EOSQ-24 options ----
  'Very poor': { es: 'Muy mala', zh: '非常差' },
  'Poor': { es: 'Mala', zh: '差' },
  'Fair': { es: 'Regular', zh: '一般' },
  'Good': { es: 'Buena', zh: '好' },
  'Very good': { es: 'Muy buena', zh: '非常好' },
  'Always': { es: 'Siempre', zh: '总是' },
  'Most of the time': { es: 'La mayor parte del tiempo', zh: '大部分时间' },
  'Very difficult': { es: 'Muy difícil', zh: '非常困难' },
  'Difficult': { es: 'Difícil', zh: '困难' },
  'Somewhat difficult': { es: 'Algo difícil', zh: '有些困难' },
  'Easy': { es: 'Fácil', zh: '容易' },
  'Very easy': { es: 'Muy fácil', zh: '非常容易' },
  'Much worse': { es: 'Mucho peor', zh: '差很多' },
  'Worse': { es: 'Peor', zh: '较差' },
  'About the same': { es: 'Más o menos igual', zh: '差不多' },
  'Better': { es: 'Mejor', zh: '较好' },
  'Much better': { es: 'Mucho mejor', zh: '好很多' },
  'Severely limited': { es: 'Gravemente limitadas', zh: '严重受限' },
  'Very limited': { es: 'Muy limitadas', zh: '很受限' },
  'Somewhat limited': { es: 'Algo limitadas', zh: '有些受限' },
  'Slightly limited': { es: 'Ligeramente limitadas', zh: '略微受限' },
  'Not limited': { es: 'Sin limitaciones', zh: '不受限' },
  'A little': { es: 'Un poco', zh: '一点' },
  'Somewhat': { es: 'Algo', zh: '有些' },
  'Mostly': { es: 'En su mayor parte', zh: '大部分能' },
  'Completely': { es: 'Completamente', zh: '完全能' },
  'Severely': { es: 'Gravemente', zh: '严重' },
  'Very much': { es: 'Mucho', zh: '很大' },
  'Severe': { es: 'Intenso', zh: '严重' },
  'Moderate': { es: 'Moderado', zh: '中度' },
  'Mild': { es: 'Leve', zh: '轻度' },
  'Very mild': { es: 'Muy leve', zh: '很轻' },
  'None': { es: 'Ninguno', zh: '没有' },
  'Never happy': { es: 'Nunca feliz', zh: '从不开心' },
  'Rarely happy': { es: 'Rara vez feliz', zh: '很少开心' },
  'Sometimes happy': { es: 'A veces feliz', zh: '有时开心' },
  'Usually happy': { es: 'Generalmente feliz', zh: '通常开心' },
  'Always happy': { es: 'Siempre feliz', zh: '总是开心' },
  'Extremely worried': { es: 'Extremadamente preocupado/a', zh: '极度担心' },
  'Very worried': { es: 'Muy preocupado/a', zh: '非常担心' },
  'Somewhat worried': { es: 'Algo preocupado/a', zh: '有些担心' },
  'A little worried': { es: 'Un poco preocupado/a', zh: '有点担心' },
  'Not worried': { es: 'Sin preocupación', zh: '不担心' },
  'Significant': { es: 'Importante', zh: '较大' },
  'Extreme stress': { es: 'Estrés extremo', zh: '极大压力' },
  'A lot of stress': { es: 'Mucho estrés', zh: '很大压力' },
  'Moderate stress': { es: 'Estrés moderado', zh: '中等压力' },
  'A little stress': { es: 'Un poco de estrés', zh: '一点压力' },
  'No stress': { es: 'Sin estrés', zh: '没有压力' },
  // ---- Score words ----
  'Little appearance concern': { es: 'Poca preocupación por la apariencia', zh: '外观顾虑较少' },
  'Moderate appearance concern': { es: 'Preocupación moderada por la apariencia', zh: '外观顾虑中等' },
  'Significant appearance concern': { es: 'Preocupación importante por la apariencia', zh: '外观顾虑明显' },
  'Good quality of life': { es: 'Buena calidad de vida', zh: '生活质量良好' },
  'Moderately affected quality of life': { es: 'Calidad de vida moderadamente afectada', zh: '生活质量受到中度影响' },
  'Substantially affected quality of life': { es: 'Calidad de vida considerablemente afectada', zh: '生活质量受到较大影响' },
  'items': { es: 'preguntas', zh: '题' },
  'mean': { es: 'promedio', zh: '平均' },
};
