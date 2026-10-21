// ============================================================================
// Outcome questionnaires for a child's bone or joint visit: the PROMIS
// Pediatric short forms (ported from peds-ortho-intake app/page.jsx).
//
//   Mobility             SF 8a   8 items, 1-5, higher = better function
//   Pain Interference    SF 8a   8 items, 1-5, higher = pain interfered more
//   Upper Extremity      SF 8a   8 items, 1-5, higher = better function
//
// Each exists as a self-report form (ages 8-17) and a parent-proxy form
// (ages 5-17). Under 5 there is no validated form, so none is shown. The
// adult joint scores (QuickDASH, HOOS JR, KOOS JR, LEFS) are not used for a
// child; the module keeps the adult export names (QUESTIONNAIRES,
// scoreQuestionnaire, getApplicableQuestionnaires, TRANSLATIONS) so the
// shared PROMs step and promSummary read it the same way.
//
// !! VERIFY BEFORE CLINICAL USE !!
// PROMIS instruments are free to use but must be reproduced verbatim, and
// real PROMIS scores are IRT-based T-scores (mean 50, SD 10) from official
// raw-score-to-T-score tables, not simple sums. The scoring here is a RAW
// score only. Before clinical use, check the item text against the official
// short forms at https://www.healthmeasures.net and paste the conversion
// tables into T_SCORE_TABLES below; every score, preview and note then picks
// the T-score up.
// ============================================================================

// The adult instruments stay reachable under their names (same export shape
// as lib/services/ortho/questionnaires.js); the four exports the shared PROMs
// step reads (QUESTIONNAIRES, scoreQuestionnaire, getApplicableQuestionnaires,
// TRANSLATIONS) are the pediatric ones declared below.
export * from '../ortho/questionnaires';

import { UPPER_LIMB_PARTS } from './constants';

/**
 * Years old on a date, from an ISO date of birth; NaN when unknown. The same
 * rule as lib/service.js ageOn, written here so this module does not import
 * the service switch that imports it.
 */
function ageOn(dob, on = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob || ''));
  if (!m) return NaN;
  const birth = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  let years = on.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday = on.getUTCMonth() < birth.getUTCMonth() || (on.getUTCMonth() === birth.getUTCMonth() && on.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) years -= 1;
  return years;
}

const FUNCTION_SCALE = ['Not able to do', 'With a lot of trouble', 'With some trouble', 'With a little trouble', 'With no trouble'];
const FREQUENCY_SCALE = ['Never', 'Almost never', 'Sometimes', 'Often', 'Almost always'];
const scale = (labels) => labels.map((label, i) => ({ score: i + 1, label }));

const items = (prefix, texts, options) => texts.map((title, i) => ({ id: `${prefix}_${i + 1}`, title, options: scale(options) }));

const MOBILITY_SELF = [
  'I could get up from the floor.',
  'I could walk up stairs without holding on to anything.',
  'I could stand up on my tiptoes.',
  'I could get out of bed by myself.',
  'I could get in and out of a car.',
  'I could walk more than one block.',
  'I could keep up when I played with other kids.',
  'I could run a mile.',
];
const MOBILITY_PROXY = [
  'My child could get up from the floor.',
  'My child could walk up stairs without holding on to anything.',
  'My child could stand up on their tiptoes.',
  'My child could get out of bed by themselves.',
  'My child could get in and out of a car.',
  'My child could walk more than one block.',
  'My child could keep up when they played with other children.',
  'My child could run a mile.',
];
const PAIN_SELF = [
  'I had trouble sleeping when I had pain.',
  'It was hard for me to pay attention when I had pain.',
  'It was hard for me to walk one block when I had pain.',
  'It was hard to have fun when I had pain.',
  'I had trouble doing schoolwork when I had pain.',
  'It was hard to stay standing when I had pain.',
  'It was hard to get along with other people when I had pain.',
  'I felt angry when I had pain.',
];
const PAIN_PROXY = [
  'My child had trouble sleeping when they had pain.',
  'It was hard for my child to pay attention when they had pain.',
  'It was hard for my child to walk one block when they had pain.',
  'It was hard for my child to have fun when they had pain.',
  'My child had trouble doing schoolwork when they had pain.',
  'It was hard for my child to stay standing when they had pain.',
  'It was hard for my child to get along with other people when they had pain.',
  'My child felt angry when they had pain.',
];
const UE_SELF = [
  'I could carry my books in my backpack.',
  'I could open a jar by myself.',
  'I could pour a drink from a full pitcher.',
  'I could push open a heavy door.',
  'I could turn a key in a lock.',
  'I could brush my teeth.',
  'I could put on my shoes.',
  'I could use a fork to eat.',
];
const UE_PROXY = [
  'My child could carry their books in a backpack.',
  'My child could open a jar by themselves.',
  'My child could pour a drink from a full pitcher.',
  'My child could push open a heavy door.',
  'My child could turn a key in a lock.',
  'My child could brush their teeth.',
  'My child could put on their shoes.',
  'My child could use a fork to eat.',
];

const SELF_INTRO = 'In the past 7 days, how were you able to do each of the following?';
const PROXY_INTRO = 'In the past 7 days, how was your child able to do each of the following?';
const PAIN_INTRO = 'In the past 7 days...';

const form = (id, name, shortName, description, prefix, texts, options, higherIsBetter, proxy) => ({
  id,
  name,
  shortName,
  description,
  higherIsBetter,
  proxy,
  sections: items(prefix, texts, options),
});

export const PROMIS_MOBILITY = form('promis_mobility', 'PROMIS Pediatric Mobility (answered by the child)', 'Mobility', SELF_INTRO, 'mob', MOBILITY_SELF, FUNCTION_SCALE, true, false);
export const PROMIS_MOBILITY_PROXY = form('promis_mobility_proxy', 'PROMIS Parent Proxy Mobility (answered by the parent or guardian)', 'Mobility (parent)', PROXY_INTRO, 'mob', MOBILITY_PROXY, FUNCTION_SCALE, true, true);
export const PROMIS_PAIN = form('promis_pain', 'PROMIS Pediatric Pain Interference (answered by the child)', 'Pain Interference', PAIN_INTRO, 'pain', PAIN_SELF, FREQUENCY_SCALE, false, false);
export const PROMIS_PAIN_PROXY = form('promis_pain_proxy', 'PROMIS Parent Proxy Pain Interference (answered by the parent or guardian)', 'Pain Interference (parent)', PAIN_INTRO, 'pain', PAIN_PROXY, FREQUENCY_SCALE, false, true);
export const PROMIS_UE = form('promis_ue', 'PROMIS Pediatric Upper Extremity (answered by the child)', 'Upper Extremity', SELF_INTRO, 'ue', UE_SELF, FUNCTION_SCALE, true, false);
export const PROMIS_UE_PROXY = form('promis_ue_proxy', 'PROMIS Parent Proxy Upper Extremity (answered by the parent or guardian)', 'Upper Extremity (parent)', PROXY_INTRO, 'ue', UE_PROXY, FUNCTION_SCALE, true, true);

export const QUESTIONNAIRES = {
  promis_mobility: PROMIS_MOBILITY,
  promis_mobility_proxy: PROMIS_MOBILITY_PROXY,
  promis_pain: PROMIS_PAIN,
  promis_pain_proxy: PROMIS_PAIN_PROXY,
  promis_ue: PROMIS_UE,
  promis_ue_proxy: PROMIS_UE_PROXY,
};

/**
 * Official PROMIS raw-score-to-T-score tables go here, keyed by questionnaire
 * id, as a raw-score-indexed lookup ({ 8: 20.1, 9: 23.4, ... }). Until they
 * are pasted in, tScore is null and the raw score is shown, labelled as such.
 */
export const T_SCORE_TABLES = {};

/**
 * Raw score of a PROMIS short form: the sum of the 1-5 item values, out of
 * 5 x items. A T-score only when the official table is loaded and every
 * item was answered.
 */
export function scorePromis(id, answers) {
  const q = QUESTIONNAIRES[id];
  if (!q || !answers) return null;
  const values = q.sections.map((s) => answers[s.id]).filter((v) => typeof v === 'number');
  if (!values.length) return null;
  const itemsTotal = q.sections.length;
  const itemsAnswered = values.length;
  const rawScore = values.reduce((a, b) => a + b, 0);
  const maxRaw = itemsTotal * 5;
  const incomplete = itemsAnswered < itemsTotal;
  const table = T_SCORE_TABLES[id];
  const tScore = !incomplete && table && table[rawScore] !== undefined ? table[rawScore] : null;
  const direction = q.higherIsBetter ? 'higher = better function' : 'higher = pain interfered more';
  return {
    rawScore,
    maxRaw,
    itemsAnswered,
    itemsTotal,
    incomplete,
    tScore,
    higherIsBetter: q.higherIsBetter,
    interpretation: incomplete ? `Incomplete (${itemsAnswered} of ${itemsTotal} items answered)` : `Raw score (${direction})`,
  };
}

/** Score any instrument by id. */
export function scoreQuestionnaire(id, answers) {
  if (!answers || !Object.keys(answers).length) return null;
  return scorePromis(id, answers);
}

// ============================================================================
// Which forms this child gets
// ============================================================================

const UPPER_REGIONS = ['right-shoulder', 'left-shoulder', 'right-elbow', 'left-elbow', 'right-hand', 'left-hand'];

/** True when the visit is about the arm, from the chief complaint, the injury step or an operation. */
function upperLimbInvolved(intakeData) {
  const regions = intakeData?.chiefComplaint?.symptomRegions || [];
  if (regions.some((r) => UPPER_REGIONS.includes(r))) return true;
  const parts = [
    ...(intakeData?.pedsOrtho?.injury?.bodyPart || []),
    ...(intakeData?.pedsOrtho?.fxFollowUp?.bodyPart || []),
  ];
  return parts.some((p) => UPPER_LIMB_PARTS.includes(p));
}

/**
 * The questionnaires for this child. Self-report forms are validated for
 * ages 8-17 and the parent-proxy forms for 5-17; under 5 there is nothing
 * valid to ask. A parent is the respondent on every child's form here
 * (the triage step's "my child"), so the proxy form is used until the child
 * is old enough to answer for themselves (11 and over, as in the source app
 * when a parent is filling in); a child of 8 to 10 answering on their own
 * account ("myself" on triage) gets the self-report form.
 *
 * @returns {string[]} questionnaire ids
 */
export function getApplicableQuestionnaires(intakeData) {
  const age = ageOn(intakeData?.demographics?.dob);
  if (!Number.isNaN(age) && age < 5) return [];
  const parentAnswering = intakeData?.triage?.who !== 'myself';
  const useProxy = Number.isNaN(age)
    ? parentAnswering
    : age < 8 || (parentAnswering && age < 11);
  const suffix = useProxy ? '_proxy' : '';
  const out = [`promis_mobility${suffix}`, `promis_pain${suffix}`];
  if (upperLimbInvolved(intakeData)) out.push(`promis_ue${suffix}`);
  return out;
}

/**
 * Spanish and Chinese for every patient-facing string this module defines.
 * Scoring never touches a translated string: it runs on numeric
 * `option.score` values only.
 */
export const TRANSLATIONS = {
  // ---- Names ----
  'PROMIS Pediatric Mobility (answered by the child)': { es: 'PROMIS Pediátrico: Movilidad (responde el niño o la niña)', zh: 'PROMIS 儿童行动能力量表（由孩子作答）' },
  'PROMIS Parent Proxy Mobility (answered by the parent or guardian)': { es: 'PROMIS Movilidad, versión para padres (responde el padre, la madre o el tutor)', zh: 'PROMIS 家长代答行动能力量表（由家长或监护人作答）' },
  'PROMIS Pediatric Pain Interference (answered by the child)': { es: 'PROMIS Pediátrico: Interferencia del dolor (responde el niño o la niña)', zh: 'PROMIS 儿童疼痛干扰量表（由孩子作答）' },
  'PROMIS Parent Proxy Pain Interference (answered by the parent or guardian)': { es: 'PROMIS Interferencia del dolor, versión para padres (responde el padre, la madre o el tutor)', zh: 'PROMIS 家长代答疼痛干扰量表（由家长或监护人作答）' },
  'PROMIS Pediatric Upper Extremity (answered by the child)': { es: 'PROMIS Pediátrico: Extremidad superior (responde el niño o la niña)', zh: 'PROMIS 儿童上肢功能量表（由孩子作答）' },
  'PROMIS Parent Proxy Upper Extremity (answered by the parent or guardian)': { es: 'PROMIS Extremidad superior, versión para padres (responde el padre, la madre o el tutor)', zh: 'PROMIS 家长代答上肢功能量表（由家长或监护人作答）' },
  'Mobility': { es: 'Movilidad', zh: '行动能力' },
  'Mobility (parent)': { es: 'Movilidad (padres)', zh: '行动能力（家长）' },
  'Pain Interference': { es: 'Interferencia del dolor', zh: '疼痛干扰' },
  'Pain Interference (parent)': { es: 'Interferencia del dolor (padres)', zh: '疼痛干扰（家长）' },
  'Upper Extremity': { es: 'Extremidad superior', zh: '上肢功能' },
  'Upper Extremity (parent)': { es: 'Extremidad superior (padres)', zh: '上肢功能（家长）' },
  // ---- Instructions ----
  'In the past 7 days, how were you able to do each of the following?': { es: 'En los últimos 7 días, ¿cómo pudiste hacer cada una de las siguientes cosas?', zh: '在过去7天里，你完成以下各项活动的情况如何？' },
  'In the past 7 days, how was your child able to do each of the following?': { es: 'En los últimos 7 días, ¿cómo pudo su hijo o hija hacer cada una de las siguientes cosas?', zh: '在过去7天里，您的孩子完成以下各项活动的情况如何？' },
  'In the past 7 days...': { es: 'En los últimos 7 días...', zh: '在过去7天里……' },
  // ---- Scales ----
  'Not able to do': { es: 'No pude hacerlo', zh: '无法完成' },
  'With a lot of trouble': { es: 'Con mucha dificultad', zh: '非常困难' },
  'With some trouble': { es: 'Con algo de dificultad', zh: '有些困难' },
  'With a little trouble': { es: 'Con un poco de dificultad', zh: '有一点困难' },
  'With no trouble': { es: 'Sin ninguna dificultad', zh: '没有困难' },
  'Never': { es: 'Nunca', zh: '从不' },
  'Almost never': { es: 'Casi nunca', zh: '几乎从不' },
  'Sometimes': { es: 'A veces', zh: '有时' },
  'Often': { es: 'A menudo', zh: '经常' },
  'Almost always': { es: 'Casi siempre', zh: '几乎总是' },
  // ---- Mobility, self ----
  'I could get up from the floor.': { es: 'Pude levantarme del suelo.', zh: '我能从地上站起来。' },
  'I could walk up stairs without holding on to anything.': { es: 'Pude subir escaleras sin agarrarme de nada.', zh: '我能不扶任何东西走上楼梯。' },
  'I could stand up on my tiptoes.': { es: 'Pude ponerme de puntillas.', zh: '我能踮起脚尖站立。' },
  'I could get out of bed by myself.': { es: 'Pude levantarme de la cama solo/a.', zh: '我能自己下床。' },
  'I could get in and out of a car.': { es: 'Pude subir y bajar de un carro.', zh: '我能上下汽车。' },
  'I could walk more than one block.': { es: 'Pude caminar más de una cuadra.', zh: '我能走一个街区以上。' },
  'I could keep up when I played with other kids.': { es: 'Pude seguir el ritmo cuando jugaba con otros niños.', zh: '和其他小朋友一起玩时我能跟得上。' },
  'I could run a mile.': { es: 'Pude correr una milla (1,6 km).', zh: '我能跑一英里（约1.6公里）。' },
  // ---- Mobility, proxy ----
  'My child could get up from the floor.': { es: 'Mi hijo/a pudo levantarse del suelo.', zh: '我的孩子能从地上站起来。' },
  'My child could walk up stairs without holding on to anything.': { es: 'Mi hijo/a pudo subir escaleras sin agarrarse de nada.', zh: '我的孩子能不扶任何东西走上楼梯。' },
  'My child could stand up on their tiptoes.': { es: 'Mi hijo/a pudo ponerse de puntillas.', zh: '我的孩子能踮起脚尖站立。' },
  'My child could get out of bed by themselves.': { es: 'Mi hijo/a pudo levantarse de la cama solo/a.', zh: '我的孩子能自己下床。' },
  'My child could get in and out of a car.': { es: 'Mi hijo/a pudo subir y bajar de un carro.', zh: '我的孩子能上下汽车。' },
  'My child could walk more than one block.': { es: 'Mi hijo/a pudo caminar más de una cuadra.', zh: '我的孩子能走一个街区以上。' },
  'My child could keep up when they played with other children.': { es: 'Mi hijo/a pudo seguir el ritmo cuando jugaba con otros niños.', zh: '和其他小朋友一起玩时我的孩子能跟得上。' },
  'My child could run a mile.': { es: 'Mi hijo/a pudo correr una milla (1,6 km).', zh: '我的孩子能跑一英里（约1.6公里）。' },
  // ---- Pain interference, self ----
  'I had trouble sleeping when I had pain.': { es: 'Me costó dormir cuando tenía dolor.', zh: '疼痛时我睡不好。' },
  'It was hard for me to pay attention when I had pain.': { es: 'Me costó prestar atención cuando tenía dolor.', zh: '疼痛时我很难集中注意力。' },
  'It was hard for me to walk one block when I had pain.': { es: 'Me costó caminar una cuadra cuando tenía dolor.', zh: '疼痛时我很难走完一个街区。' },
  'It was hard to have fun when I had pain.': { es: 'Me costó divertirme cuando tenía dolor.', zh: '疼痛时我很难玩得开心。' },
  'I had trouble doing schoolwork when I had pain.': { es: 'Me costó hacer las tareas escolares cuando tenía dolor.', zh: '疼痛时我很难做功课。' },
  'It was hard to stay standing when I had pain.': { es: 'Me costó permanecer de pie cuando tenía dolor.', zh: '疼痛时我很难一直站着。' },
  'It was hard to get along with other people when I had pain.': { es: 'Me costó llevarme bien con los demás cuando tenía dolor.', zh: '疼痛时我很难与他人相处。' },
  'I felt angry when I had pain.': { es: 'Me sentía enojado/a cuando tenía dolor.', zh: '疼痛时我感到生气。' },
  // ---- Pain interference, proxy ----
  'My child had trouble sleeping when they had pain.': { es: 'A mi hijo/a le costó dormir cuando tenía dolor.', zh: '疼痛时我的孩子睡不好。' },
  'It was hard for my child to pay attention when they had pain.': { es: 'A mi hijo/a le costó prestar atención cuando tenía dolor.', zh: '疼痛时我的孩子很难集中注意力。' },
  'It was hard for my child to walk one block when they had pain.': { es: 'A mi hijo/a le costó caminar una cuadra cuando tenía dolor.', zh: '疼痛时我的孩子很难走完一个街区。' },
  'It was hard for my child to have fun when they had pain.': { es: 'A mi hijo/a le costó divertirse cuando tenía dolor.', zh: '疼痛时我的孩子很难玩得开心。' },
  'My child had trouble doing schoolwork when they had pain.': { es: 'A mi hijo/a le costó hacer las tareas escolares cuando tenía dolor.', zh: '疼痛时我的孩子很难做功课。' },
  'It was hard for my child to stay standing when they had pain.': { es: 'A mi hijo/a le costó permanecer de pie cuando tenía dolor.', zh: '疼痛时我的孩子很难一直站着。' },
  'It was hard for my child to get along with other people when they had pain.': { es: 'A mi hijo/a le costó llevarse bien con los demás cuando tenía dolor.', zh: '疼痛时我的孩子很难与他人相处。' },
  'My child felt angry when they had pain.': { es: 'Mi hijo/a se sentía enojado/a cuando tenía dolor.', zh: '疼痛时我的孩子感到生气。' },
  // ---- Upper extremity, self ----
  'I could carry my books in my backpack.': { es: 'Pude cargar mis libros en la mochila.', zh: '我能用书包背书。' },
  'I could open a jar by myself.': { es: 'Pude abrir un frasco solo/a.', zh: '我能自己打开罐子。' },
  'I could pour a drink from a full pitcher.': { es: 'Pude servir una bebida de una jarra llena.', zh: '我能从装满的水壶里倒饮料。' },
  'I could push open a heavy door.': { es: 'Pude empujar para abrir una puerta pesada.', zh: '我能推开一扇重门。' },
  'I could turn a key in a lock.': { es: 'Pude girar una llave en una cerradura.', zh: '我能转动锁里的钥匙。' },
  'I could brush my teeth.': { es: 'Pude cepillarme los dientes.', zh: '我能刷牙。' },
  'I could put on my shoes.': { es: 'Pude ponerme los zapatos.', zh: '我能穿鞋。' },
  'I could use a fork to eat.': { es: 'Pude usar un tenedor para comer.', zh: '我能用叉子吃饭。' },
  // ---- Upper extremity, proxy ----
  'My child could carry their books in a backpack.': { es: 'Mi hijo/a pudo cargar sus libros en una mochila.', zh: '我的孩子能用书包背书。' },
  'My child could open a jar by themselves.': { es: 'Mi hijo/a pudo abrir un frasco solo/a.', zh: '我的孩子能自己打开罐子。' },
  'My child could pour a drink from a full pitcher.': { es: 'Mi hijo/a pudo servir una bebida de una jarra llena.', zh: '我的孩子能从装满的水壶里倒饮料。' },
  'My child could push open a heavy door.': { es: 'Mi hijo/a pudo empujar para abrir una puerta pesada.', zh: '我的孩子能推开一扇重门。' },
  'My child could turn a key in a lock.': { es: 'Mi hijo/a pudo girar una llave en una cerradura.', zh: '我的孩子能转动锁里的钥匙。' },
  'My child could brush their teeth.': { es: 'Mi hijo/a pudo cepillarse los dientes.', zh: '我的孩子能刷牙。' },
  'My child could put on their shoes.': { es: 'Mi hijo/a pudo ponerse los zapatos.', zh: '我的孩子能穿鞋。' },
  'My child could use a fork to eat.': { es: 'Mi hijo/a pudo usar un tenedor para comer.', zh: '我的孩子能用叉子吃饭。' },
  // ---- Interpretations and score-preview words ----
  'Raw score (higher = better function)': { es: 'Puntuación bruta (más alta = mejor función)', zh: '原始分（越高 = 功能越好）' },
  'Raw score (higher = pain interfered more)': { es: 'Puntuación bruta (más alta = el dolor interfirió más)', zh: '原始分（越高 = 疼痛干扰越大）' },
  'Incomplete': { es: 'Incompleto', zh: '未完成' },
  'raw score': { es: 'puntuación bruta', zh: '原始分' },
  'T-score': { es: 'Puntuación T', zh: 'T分' },
  'items': { es: 'preguntas', zh: '项' },
  'answered': { es: 'respondidas', zh: '已回答' },
};
