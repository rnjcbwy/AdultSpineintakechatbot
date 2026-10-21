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

/**
 * Safety-check field (hpiData.overall.<field>, problems.js SAFETY_QUESTIONS)
 * -> the review questions it answers. Several fields may feed one question.
 *
 *   hotJoint          -> hotSwollenJoint   (septic joint screen)
 *   dvtSymptoms       -> calfSwelling      (clot screen)
 *   weakness          -> muscleWeakness
 *   numbness          -> handClumsiness    ("numbness or tingling in the hands or feet")
 *   tingling          -> handClumsiness
 *   nightHandNumbness -> handClumsiness
 *   openWound         -> woundIssues
 *   bowelBladder      -> bladderChanges, bowelChanges  (asked with a neck-or-back problem)
 */
export const SAFETY_TO_ROS = {
  hotJoint: ['hotSwollenJoint'],
  dvtSymptoms: ['calfSwelling'],
  weakness: ['muscleWeakness'],
  numbness: ['handClumsiness'],
  tingling: ['handClumsiness'],
  nightHandNumbness: ['handClumsiness'],
  openWound: ['woundIssues'],
  bowelBladder: ['bladderChanges', 'bowelChanges'],
};

/** Past-medical-history condition (constants.js COMMON_CONDITIONS, by name) -> the review questions it answers yes. */
export const PMH_TO_ROS = {
  'Cancer': ['cancerHistory'],
  'Osteoporosis': ['osteoporosis'],
  'Osteopenia': ['osteoporosis'],
  'Blood clots / DVT / PE': ['bloodClots'],
  'Depression': ['depressedMood'],
  'Anxiety': ['anxiety'],
  'Gout': ['gout'],
  'Bleeding disorder': ['easyBruising'],
  'Diabetes (Type 1)': ['diabetes'],
  'Diabetes (Type 2)': ['diabetes'],
  'Thyroid disease': ['thyroid'],
  'Sleep apnea': ['sleepApnea'],
  'Asthma': ['wheezing'],
  'Seizure disorder / Epilepsy': ['seizures'],
};

/**
 * Review-of-systems answers the form already has.
 *
 * The safety check on the symptom-details step (hpiData.overall, see
 * SAFETY_QUESTIONS in problems.js) and the past medical history
 * (pastMedicalHistory.conditions) ask some of the same things the review
 * asks. Those answers are copied here and the matching short-list chips are
 * not shown again. Returns { [questionId]: 'yes' | 'no' }.
 *
 * A safety answer maps to 'yes' when any of its sources is yes, 'no' when
 * every answered source is no, and is left out when none was answered. A
 * condition on the medical history only ever says 'yes': a condition not
 * listed is not a denial.
 */
export function prefilledROS(data = {}) {
  const out = {};
  const overall = data.hpiData?.overall || {};
  for (const [field, ids] of Object.entries(SAFETY_TO_ROS)) {
    const v = overall[field];
    if (v !== true && v !== false) continue;
    for (const id of ids) {
      if (v) out[id] = 'yes';
      else if (!out[id]) out[id] = 'no';
    }
  }
  const names = (data.pastMedicalHistory?.conditions || []).map((c) => (typeof c === 'string' ? c : c?.name) || '');
  for (const [condition, ids] of Object.entries(PMH_TO_ROS)) {
    if (!names.includes(condition)) continue;
    for (const id of ids) out[id] = 'yes';
  }
  return out;
}

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

/**
 * Spanish and Chinese for every patient-facing string this module defines:
 * the section headings, the questions and the short screening list.
 * components/steps/ReviewOfSystems.js spreads it into its dictionary; the
 * nine other languages come from lib/translations, built by
 * scripts/translate-ui.mjs, which reads these keys too. Stored answers stay
 * 'yes'/'no' whatever the language on screen.
 */
export const TRANSLATIONS = {
  // ---- Section headings ----
  'General & Whole-Body': { es: 'General y todo el cuerpo', zh: '全身状况' },
  'Eyes': { es: 'Ojos', zh: '眼睛' },
  'Ears, Nose, Mouth & Throat': { es: 'Oídos, nariz, boca y garganta', zh: '耳鼻口喉' },
  'Heart & Circulation': { es: 'Corazón y circulación', zh: '心脏与循环' },
  'Breathing & Lungs': { es: 'Respiración y pulmones', zh: '呼吸与肺部' },
  'Digestive': { es: 'Digestivo', zh: '消化系统' },
  'Bladder & Urinary': { es: 'Vejiga y sistema urinario', zh: '膀胱与泌尿' },
  'Muscles & Joints': { es: 'Músculos y articulaciones', zh: '肌肉与关节' },
  'Skin': { es: 'Piel', zh: '皮肤' },
  'Nerves & Brain': { es: 'Nervios y cerebro', zh: '神经与大脑' },
  'Mood & Sleep': { es: 'Estado de ánimo y sueño', zh: '情绪与睡眠' },
  'Hormones & Metabolism': { es: 'Hormonas y metabolismo', zh: '激素与代谢' },
  'Blood & Lymph Nodes': { es: 'Sangre y ganglios linfáticos', zh: '血液与淋巴结' },
  'Allergies & Immune System': { es: 'Alergias y sistema inmunitario', zh: '过敏与免疫系统' },
  // ---- Questions ----
  'Fevers or chills?': { es: '¿Fiebre o escalofríos?', zh: '发烧或发冷？' },
  'Night sweats?': { es: '¿Sudores nocturnos?', zh: '夜间盗汗？' },
  'Unexplained weight loss (more than 10 lbs)?': { es: '¿Pérdida de peso inexplicable (más de 10 libras)?', zh: '不明原因的体重减轻（超过10磅）？' },
  'Unusual fatigue or malaise?': { es: '¿Fatiga o malestar inusual?', zh: '异常疲劳或不适？' },
  'Recent changes in your vision?': { es: '¿Cambios recientes en su visión?', zh: '最近视力有变化吗？' },
  'Double or blurred vision?': { es: '¿Visión doble o borrosa?', zh: '复视或视力模糊？' },
  'Hearing loss or ringing in the ears?': { es: '¿Pérdida de audición o zumbido en los oídos?', zh: '听力下降或耳鸣？' },
  'Difficulty or pain when swallowing?': { es: '¿Dificultad o dolor al tragar?', zh: '吞咽困难或疼痛？' },
  'Hoarseness or a change in your voice?': { es: '¿Ronquera o cambio en su voz?', zh: '声音嘶哑或声音改变？' },
  'Chest pain or pressure?': { es: '¿Dolor u opresión en el pecho?', zh: '胸痛或胸闷？' },
  'Shortness of breath?': { es: '¿Falta de aire?', zh: '呼吸急促？' },
  'Racing or irregular heartbeat?': { es: '¿Latidos acelerados o irregulares?', zh: '心跳加速或不规律？' },
  'Leg swelling?': { es: '¿Hinchazón de las piernas?', zh: '腿部肿胀？' },
  'A swollen or painful calf?': { es: '¿Una pantorrilla hinchada o dolorosa?', zh: '小腿肿胀或疼痛吗？' },
  'A cough that will not go away?': { es: '¿Tos que no se quita?', zh: '持续不愈的咳嗽？' },
  'Wheezing or asthma?': { es: '¿Sibilancias o asma?', zh: '喘息或哮喘？' },
  'Sleep apnea, or been told you snore heavily?': { es: '¿Apnea del sueño, o le han dicho que ronca fuerte?', zh: '睡眠呼吸暂停，或被告知打鼾严重？' },
  'Changes in bowel habits?': { es: '¿Cambios en los hábitos intestinales?', zh: '排便习惯改变？' },
  'Nausea or vomiting?': { es: '¿Náuseas o vómitos?', zh: '恶心或呕吐？' },
  'Abdominal pain?': { es: '¿Dolor abdominal?', zh: '腹痛？' },
  'Frequent heartburn, reflux, or stomach ulcers?': { es: '¿Acidez frecuente, reflujo o úlceras estomacales?', zh: '经常胃灼热、反流或胃溃疡？' },
  'Changes in bladder function?': { es: '¿Cambios en la función de la vejiga?', zh: '膀胱功能改变？' },
  'Increased urinary frequency or urgency?': { es: '¿Aumento de la frecuencia o urgencia urinaria?', zh: '尿频或尿急增加？' },
  'Difficulty starting or maintaining urination?': { es: '¿Dificultad para iniciar o mantener la micción?', zh: '排尿起始或维持困难？' },
  'Pain or swelling in other joints (besides the one you are here for)?': { es: '¿Dolor o hinchazón en otras articulaciones (además de la que lo trae hoy)?', zh: '其他关节（除了您本次就诊的关节）有疼痛或肿胀吗？' },
  'A joint that is hot, red and swollen?': { es: '¿Una articulación caliente, roja e hinchada?', zh: '有关节发热、发红、肿胀吗？' },
  'Stiffness in several joints in the morning lasting more than 30 minutes?': { es: '¿Rigidez en varias articulaciones por la mañana que dura más de 30 minutos?', zh: '早晨多个关节僵硬超过30分钟吗？' },
  'General muscle weakness?': { es: '¿Debilidad muscular general?', zh: '全身肌肉无力？' },
  'Recent falls?': { es: '¿Caídas recientes?', zh: '最近跌倒？' },
  'Any new rash?': { es: '¿Alguna erupción nueva?', zh: '有新出现的皮疹吗？' },
  'Any current wounds, sores, or skin infections?': { es: '¿Alguna herida, llaga o infección de la piel actualmente?', zh: '目前有伤口、溃疡或皮肤感染吗？' },
  'Any skin breakdown from sitting or lying down?': { es: '¿Alguna lesión en la piel por estar sentado o acostado?', zh: '因久坐或久卧导致的皮肤破损？' },
  'Frequent headaches?': { es: '¿Dolores de cabeza frecuentes?', zh: '经常头痛？' },
  'Dizziness or lightheadedness?': { es: '¿Mareos o aturdimiento?', zh: '头晕或头重脚轻？' },
  'Seizures?': { es: '¿Convulsiones?', zh: '癫痫发作？' },
  'Memory or concentration problems?': { es: '¿Problemas de memoria o concentración?', zh: '记忆力或注意力问题？' },
  'Trouble with balance, or feeling unsteady on your feet?': { es: '¿Problemas de equilibrio o sensación de inestabilidad al caminar?', zh: '平衡困难，或走路时感觉不稳？' },
  'Numbness or tingling in your hands or feet?': { es: '¿Entumecimiento u hormigueo en las manos o los pies?', zh: '手或脚有麻木或刺痛吗？' },
  'Feeling down, depressed, or hopeless?': { es: '¿Se siente decaído, deprimido o sin esperanza?', zh: '感到情绪低落、抑郁或绝望？' },
  'Feeling anxious or on edge?': { es: '¿Se siente ansioso o nervioso?', zh: '感到焦虑或紧张？' },
  'Trouble sleeping because of your pain?': { es: '¿Dificultad para dormir a causa del dolor?', zh: '因疼痛而难以入睡？' },
  'Diabetes or high blood sugar?': { es: '¿Diabetes o azúcar alta en sangre?', zh: '糖尿病或高血糖？' },
  'Thyroid problems?': { es: '¿Problemas de tiroides?', zh: '甲状腺问题？' },
  'Osteoporosis, thinning bones, or a fracture from a minor fall?': { es: '¿Osteoporosis, huesos débiles o una fractura por una caída leve?', zh: '骨质疏松、骨质变薄，或因轻微跌倒而骨折？' },
  'Gout?': { es: '¿Gota?', zh: '痛风？' },
  'Do you bruise or bleed easily?': { es: '¿Se le hacen moretones o sangra con facilidad?', zh: '容易瘀青或出血？' },
  'History of blood clots in the legs or lungs?': { es: '¿Antecedentes de coágulos en las piernas o los pulmones?', zh: '腿部或肺部血栓病史？' },
  'Swollen glands?': { es: '¿Ganglios inflamados?', zh: '淋巴结肿大？' },
  'Any history of cancer?': { es: '¿Algún antecedente de cáncer?', zh: '有癌症病史吗？' },
  'Any recent or frequent infections?': { es: '¿Infecciones recientes o frecuentes?', zh: '近期或频繁感染？' },
  'Seasonal allergies or hay fever?': { es: '¿Alergias estacionales o fiebre del heno?', zh: '季节性过敏或花粉症？' },
  'Do you take steroids or medicines that lower your immune system?': { es: '¿Toma esteroides o medicamentos que bajan sus defensas?', zh: '您是否服用类固醇或降低免疫力的药物？' },
  // ---- Short screening list ----
  'Fever or chills': { es: 'Fiebre o escalofríos', zh: '发热或寒战' },
  'Weight loss without trying': { es: 'Pérdida de peso sin intentarlo', zh: '非刻意的体重下降' },
  'A joint that is hot, red and swollen': { es: 'Una articulación caliente, roja e hinchada', zh: '关节发热、发红、肿胀' },
  'Morning stiffness in several joints': { es: 'Rigidez matutina en varias articulaciones', zh: '多个关节晨僵' },
  'A swollen or painful calf': { es: 'Una pantorrilla hinchada o dolorosa', zh: '小腿肿胀或疼痛' },
  'Numbness or tingling in the hands or feet': { es: 'Entumecimiento u hormigueo en las manos o los pies', zh: '手或脚麻木或刺痛' },
  'Weakness in an arm or leg': { es: 'Debilidad en un brazo o una pierna', zh: '手臂或腿部无力' },
  'A fall': { es: 'Una caída', zh: '跌倒' },
  'Chest pain or pressure': { es: 'Dolor u opresión en el pecho', zh: '胸痛或胸闷' },
  'Shortness of breath': { es: 'Falta de aire', zh: '气短' },
  'A blood clot, now or in the past': { es: 'Un coágulo de sangre, ahora o en el pasado', zh: '现在或过去有血栓' },
  'Cancer, now or in the past': { es: 'Cáncer, ahora o en el pasado', zh: '现在或过去患过癌症' },
  'Osteoporosis or thinning bones': { es: 'Osteoporosis o huesos debilitados', zh: '骨质疏松或骨质变薄' },
  'Steroids or medicines that lower immunity': { es: 'Esteroides o medicamentos que bajan las defensas', zh: '类固醇或降低免疫力的药物' },
  'Gout': { es: 'Gota', zh: '痛风' },
  'Easy bruising or bleeding': { es: 'Moretones o sangrado con facilidad', zh: '容易瘀伤或出血' },
  'Feeling down or anxious': { es: 'Sentirse decaído o ansioso', zh: '情绪低落或焦虑' },
  'Pain that keeps you from sleeping': { es: 'Dolor que no le deja dormir', zh: '疼痛影响睡眠' },
};
