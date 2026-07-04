'use client';

import { useState, useMemo } from 'react';
import { useIntake } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';
import {
  ODI, NDI, MJOA, SRS22R,
  scoreOdiNdi, scoreMJOA, scoreSRS22R,
  getApplicableQuestionnaires,
} from '../../lib/questionnaires';

const QUESTIONNAIRE_MAP = {
  odi: ODI,
  ndi: NDI,
  mjoa: MJOA,
  srs22r: SRS22R,
};

// ============================================================================
// Display-only translations (es = Spanish, zh = Simplified Chinese).
// These translate ONLY the patient-facing text. Scoring is done entirely on
// numeric `option.score` values in lib/questionnaires.js and is never touched.
// English is the canonical fallback (see makeT).
// ============================================================================
const LOCAL = {
  // ---- Step chrome ----
  'Patient-Reported Outcome Measures': {
    es: 'Medidas de resultados informadas por el paciente',
    zh: '患者自评结果量表',
  },
  'Based on your symptoms, no additional outcome questionnaires are needed at this time.': {
    es: 'Según sus síntomas, no se necesitan cuestionarios de resultados adicionales en este momento.',
    zh: '根据您的症状，目前无需填写额外的结果问卷。',
  },
  'No questionnaires required. You can continue to the next step.': {
    es: 'No se requieren cuestionarios. Puede continuar al siguiente paso.',
    zh: '无需填写问卷。您可以继续下一步。',
  },
  'Based on your symptoms, please complete the following questionnaire. These help your surgeon understand how your condition affects your daily life.': {
    es: 'Según sus síntomas, por favor complete el siguiente cuestionario. Esto ayuda a su cirujano a entender cómo su afección afecta su vida diaria.',
    zh: '根据您的症状，请填写以下问卷。这有助于您的外科医生了解您的病情如何影响您的日常生活。',
  },
  'Based on your symptoms, please complete the following questionnaires. These help your surgeon understand how your condition affects your daily life.': {
    es: 'Según sus síntomas, por favor complete los siguientes cuestionarios. Esto ayuda a su cirujano a entender cómo su afección afecta su vida diaria.',
    zh: '根据您的症状，请填写以下问卷。这有助于您的外科医生了解您的病情如何影响您的日常生活。',
  },
  '(optional)': { es: '(opcional)', zh: '（可选）' },
  'Score': { es: 'Puntuación', zh: '评分' },
  'sections': { es: 'secciones', zh: '个部分' },
  'of': { es: 'de', zh: '/' },
  'overall mean': { es: 'media general', zh: '总体平均分' },

  // ---- Questionnaire names ----
  'Oswestry Disability Index (ODI)': { es: 'Índice de Discapacidad de Oswestry (ODI)', zh: 'Oswestry 功能障碍指数 (ODI)' },
  'Neck Disability Index (NDI)': { es: 'Índice de Discapacidad Cervical (NDI)', zh: '颈部功能障碍指数 (NDI)' },
  'Modified Japanese Orthopedic Association Score (mJOA)': { es: 'Puntuación Modificada de la Asociación Ortopédica Japonesa (mJOA)', zh: '改良日本骨科协会评分 (mJOA)' },
  'Scoliosis Research Society Questionnaire (SRS-22r)': { es: 'Cuestionario de la Sociedad de Investigación de Escoliosis (SRS-22r)', zh: '脊柱侧凸研究学会问卷 (SRS-22r)' },

  // ---- Questionnaire descriptions ----
  'This questionnaire helps us understand how your low back pain affects your daily activities.': {
    es: 'Este cuestionario nos ayuda a entender cómo su dolor lumbar afecta sus actividades diarias.',
    zh: '本问卷帮助我们了解您的下背部疼痛如何影响您的日常活动。',
  },
  'This questionnaire helps us understand how your neck pain affects your daily activities.': {
    es: 'Este cuestionario nos ayuda a entender cómo su dolor de cuello afecta sus actividades diarias.',
    zh: '本问卷帮助我们了解您的颈部疼痛如何影响您的日常活动。',
  },
  'This questionnaire evaluates how well your arms, legs, and coordination are functioning. Please select the statement that best describes you right now.': {
    es: 'Este cuestionario evalúa qué tan bien funcionan sus brazos, piernas y coordinación. Por favor seleccione la afirmación que mejor lo describe en este momento.',
    zh: '本问卷评估您的手臂、腿部和协调能力的功能状况。请选择最能描述您目前情况的选项。',
  },
  'This questionnaire helps us understand how your spinal condition affects your daily life, appearance, and well-being.': {
    es: 'Este cuestionario nos ayuda a entender cómo su afección de la columna afecta su vida diaria, su apariencia y su bienestar.',
    zh: '本问卷帮助我们了解您的脊柱疾病如何影响您的日常生活、外观和身心健康。',
  },

  // ---- Section titles (ODI / NDI shared where identical) ----
  'Pain Intensity': { es: 'Intensidad del dolor', zh: '疼痛强度' },
  'Personal Care (Washing, Dressing, etc.)': { es: 'Cuidado personal (lavarse, vestirse, etc.)', zh: '个人护理（洗漱、穿衣等）' },
  'Lifting': { es: 'Levantar objetos', zh: '提举物品' },
  'Walking': { es: 'Caminar', zh: '行走' },
  'Sitting': { es: 'Sentarse', zh: '坐姿' },
  'Standing': { es: 'Estar de pie', zh: '站立' },
  'Sleeping': { es: 'Dormir', zh: '睡眠' },
  'Sex Life (if applicable)': { es: 'Vida sexual (si aplica)', zh: '性生活（如适用）' },
  'Social Life': { es: 'Vida social', zh: '社交生活' },
  'Traveling': { es: 'Viajar', zh: '出行' },
  'Reading': { es: 'Leer', zh: '阅读' },
  'Headaches': { es: 'Dolores de cabeza', zh: '头痛' },
  'Concentration': { es: 'Concentración', zh: '注意力' },
  'Work': { es: 'Trabajo', zh: '工作' },
  'Driving': { es: 'Conducir', zh: '驾驶' },
  'Recreation': { es: 'Actividades recreativas', zh: '娱乐活动' },
  'Upper Extremity Motor Function': { es: 'Función motora de las extremidades superiores', zh: '上肢运动功能' },
  'Lower Extremity Motor Function': { es: 'Función motora de las extremidades inferiores', zh: '下肢运动功能' },
  'Upper Extremity Sensation': { es: 'Sensibilidad de las extremidades superiores', zh: '上肢感觉' },
  'Bladder Function': { es: 'Función de la vejiga', zh: '膀胱功能' },

  // ---- Section subtitles (mJOA) ----
  'How well can you use your hands?': { es: '¿Qué tan bien puede usar las manos?', zh: '您的双手使用能力如何？' },
  'How well can you walk?': { es: '¿Qué tan bien puede caminar?', zh: '您的行走能力如何？' },
  'How is the feeling in your hands and arms?': { es: '¿Cómo es la sensibilidad en sus manos y brazos?', zh: '您手臂和双手的感觉如何？' },
  'How is your urinary control?': { es: '¿Cómo es su control urinario?', zh: '您的排尿控制能力如何？' },

  // ---- Domain names (SRS-22r score preview) ----
  'Function/Activity': { es: 'Función/Actividad', zh: '功能/活动' },
  'Pain': { es: 'Dolor', zh: '疼痛' },
  'Self-Image/Appearance': { es: 'Autoimagen/Apariencia', zh: '自我形象/外观' },
  'Mental Health': { es: 'Salud mental', zh: '心理健康' },
  'Satisfaction with Management': { es: 'Satisfacción con el tratamiento', zh: '对治疗的满意度' },

  // ---- Interpretations (ODI/NDI) ----
  'Minimal disability': { es: 'Discapacidad mínima', zh: '轻微功能障碍' },
  'Moderate disability': { es: 'Discapacidad moderada', zh: '中度功能障碍' },
  'Severe disability': { es: 'Discapacidad grave', zh: '重度功能障碍' },
  'Crippled': { es: 'Discapacidad muy grave', zh: '极重度功能障碍' },
  'Bed-bound or exaggerating symptoms': { es: 'Postrado en cama o síntomas exagerados', zh: '卧床不起或症状夸大' },

  // ---- Interpretations (mJOA) ----
  'No myelopathy': { es: 'Sin mielopatía', zh: '无脊髓病' },
  'Mild myelopathy': { es: 'Mielopatía leve', zh: '轻度脊髓病' },
  'Moderate myelopathy': { es: 'Mielopatía moderada', zh: '中度脊髓病' },
  'Severe myelopathy': { es: 'Mielopatía grave', zh: '重度脊髓病' },

  // ---- ODI answer options ----
  'I have no pain at the moment': { es: 'No tengo dolor en este momento', zh: '此刻我没有疼痛' },
  'The pain is very mild at the moment': { es: 'El dolor es muy leve en este momento', zh: '此刻疼痛非常轻微' },
  'The pain is moderate at the moment': { es: 'El dolor es moderado en este momento', zh: '此刻疼痛为中度' },
  'The pain is fairly severe at the moment': { es: 'El dolor es bastante intenso en este momento', zh: '此刻疼痛相当严重' },
  'The pain is very severe at the moment': { es: 'El dolor es muy intenso en este momento', zh: '此刻疼痛非常严重' },
  'The pain is the worst imaginable at the moment': { es: 'El dolor es el peor imaginable en este momento', zh: '此刻疼痛是难以想象的剧烈' },
  'I can look after myself normally without causing extra pain': { es: 'Puedo cuidarme normalmente sin causar dolor adicional', zh: '我能正常照顾自己，且不会引起额外疼痛' },
  'I can look after myself normally but it causes extra pain': { es: 'Puedo cuidarme normalmente pero me causa dolor adicional', zh: '我能正常照顾自己，但会引起额外疼痛' },
  'It is painful to look after myself and I am slow and careful': { es: 'Cuidarme es doloroso y lo hago lento y con cuidado', zh: '照顾自己时会疼痛，我动作缓慢而小心' },
  'I need some help but can manage most of my personal care': { es: 'Necesito algo de ayuda pero puedo hacer la mayor parte de mi cuidado personal', zh: '我需要一些帮助，但大部分个人护理能自理' },
  'I need help every day in most aspects of self-care': { es: 'Necesito ayuda todos los días en la mayoría de los aspectos del cuidado personal', zh: '我在大部分个人护理方面每天都需要帮助' },
  'I do not get dressed, I wash with difficulty, and stay in bed': { es: 'No me visto, me lavo con dificultad y permanezco en cama', zh: '我无法穿衣，洗漱困难，只能卧床' },
  'I can lift heavy weights without extra pain': { es: 'Puedo levantar objetos pesados sin dolor adicional', zh: '我能提举重物，且不会引起额外疼痛' },
  'I can lift heavy weights but it gives me extra pain': { es: 'Puedo levantar objetos pesados pero me causa dolor adicional', zh: '我能提举重物，但会引起额外疼痛' },
  'Pain prevents me from lifting heavy weights off the floor, but I can manage if they are conveniently placed': { es: 'El dolor me impide levantar objetos pesados del suelo, pero puedo hacerlo si están en una posición cómoda', zh: '疼痛使我无法从地面提举重物，但如果物品放在方便的位置，我可以做到' },
  'Pain prevents me from lifting heavy weights, but I can manage light to medium weights if they are conveniently positioned': { es: 'El dolor me impide levantar objetos pesados, pero puedo con pesos ligeros a medianos si están en una posición cómoda', zh: '疼痛使我无法提举重物，但如果物品放在方便的位置，我可以提举轻到中等重量的物品' },
  'I can only lift very light weights': { es: 'Solo puedo levantar objetos muy livianos', zh: '我只能提举非常轻的物品' },
  'I cannot lift or carry anything at all': { es: 'No puedo levantar ni cargar nada en absoluto', zh: '我完全无法提举或搬运任何东西' },
  'Pain does not prevent me from walking any distance': { es: 'El dolor no me impide caminar ninguna distancia', zh: '疼痛不影响我行走任何距离' },
  'Pain prevents me from walking more than 1 mile': { es: 'El dolor me impide caminar más de 1 milla (1,6 km)', zh: '疼痛使我无法行走超过1英里（约1.6公里）' },
  'Pain prevents me from walking more than 1/2 mile': { es: 'El dolor me impide caminar más de 1/2 milla (0,8 km)', zh: '疼痛使我无法行走超过半英里（约0.8公里）' },
  'Pain prevents me from walking more than 100 yards': { es: 'El dolor me impide caminar más de 100 yardas (90 m)', zh: '疼痛使我无法行走超过100码（约90米）' },
  'I can only walk using a cane or crutches': { es: 'Solo puedo caminar usando un bastón o muletas', zh: '我只能借助拐杖行走' },
  'I am in bed most of the time': { es: 'Paso la mayor parte del tiempo en cama', zh: '我大部分时间卧床' },
  'I can sit in any chair as long as I like': { es: 'Puedo sentarme en cualquier silla todo el tiempo que quiera', zh: '我可以在任何椅子上想坐多久就坐多久' },
  'I can only sit in my favorite chair as long as I like': { es: 'Solo puedo sentarme en mi silla favorita todo el tiempo que quiera', zh: '我只能在我最喜欢的椅子上想坐多久就坐多久' },
  'Pain prevents me from sitting for more than 1 hour': { es: 'El dolor me impide estar sentado más de 1 hora', zh: '疼痛使我无法坐超过1小时' },
  'Pain prevents me from sitting for more than 30 minutes': { es: 'El dolor me impide estar sentado más de 30 minutos', zh: '疼痛使我无法坐超过30分钟' },
  'Pain prevents me from sitting for more than 10 minutes': { es: 'El dolor me impide estar sentado más de 10 minutos', zh: '疼痛使我无法坐超过10分钟' },
  'Pain prevents me from sitting at all': { es: 'El dolor me impide estar sentado en absoluto', zh: '疼痛使我完全无法坐下' },
  'I can stand as long as I want without extra pain': { es: 'Puedo estar de pie todo el tiempo que quiera sin dolor adicional', zh: '我能想站多久就站多久，且不会引起额外疼痛' },
  'I can stand as long as I want but it gives me extra pain': { es: 'Puedo estar de pie todo el tiempo que quiera pero me causa dolor adicional', zh: '我能想站多久就站多久，但会引起额外疼痛' },
  'Pain prevents me from standing for more than 1 hour': { es: 'El dolor me impide estar de pie más de 1 hora', zh: '疼痛使我无法站立超过1小时' },
  'Pain prevents me from standing for more than 30 minutes': { es: 'El dolor me impide estar de pie más de 30 minutos', zh: '疼痛使我无法站立超过30分钟' },
  'Pain prevents me from standing for more than 10 minutes': { es: 'El dolor me impide estar de pie más de 10 minutos', zh: '疼痛使我无法站立超过10分钟' },
  'Pain prevents me from standing at all': { es: 'El dolor me impide estar de pie en absoluto', zh: '疼痛使我完全无法站立' },
  'My sleep is never disturbed by pain': { es: 'El dolor nunca perturba mi sueño', zh: '疼痛从不干扰我的睡眠' },
  'My sleep is occasionally disturbed by pain': { es: 'El dolor perturba mi sueño ocasionalmente', zh: '疼痛偶尔干扰我的睡眠' },
  'Because of pain I have less than 6 hours of sleep': { es: 'Debido al dolor duermo menos de 6 horas', zh: '由于疼痛我的睡眠不足6小时' },
  'Because of pain I have less than 4 hours of sleep': { es: 'Debido al dolor duermo menos de 4 horas', zh: '由于疼痛我的睡眠不足4小时' },
  'Because of pain I have less than 2 hours of sleep': { es: 'Debido al dolor duermo menos de 2 horas', zh: '由于疼痛我的睡眠不足2小时' },
  'Pain prevents me from sleeping at all': { es: 'El dolor me impide dormir en absoluto', zh: '疼痛使我完全无法入睡' },
  'My sex life is normal and causes no extra pain': { es: 'Mi vida sexual es normal y no causa dolor adicional', zh: '我的性生活正常，且不会引起额外疼痛' },
  'My sex life is normal but causes some extra pain': { es: 'Mi vida sexual es normal pero causa algo de dolor adicional', zh: '我的性生活正常，但会引起一些额外疼痛' },
  'My sex life is nearly normal but is very painful': { es: 'Mi vida sexual es casi normal pero es muy dolorosa', zh: '我的性生活几乎正常，但非常疼痛' },
  'My sex life is severely restricted by pain': { es: 'Mi vida sexual está muy restringida por el dolor', zh: '我的性生活因疼痛而严重受限' },
  'My sex life is nearly absent because of pain': { es: 'Mi vida sexual es casi inexistente debido al dolor', zh: '由于疼痛我的性生活几乎不存在' },
  'Pain prevents any sex life at all': { es: 'El dolor impide toda vida sexual', zh: '疼痛使我完全无法进行性生活' },
  'My social life is normal and gives me no extra pain': { es: 'Mi vida social es normal y no me causa dolor adicional', zh: '我的社交生活正常，且不会引起额外疼痛' },
  'My social life is normal but increases the degree of pain': { es: 'Mi vida social es normal pero aumenta el grado de dolor', zh: '我的社交生活正常，但会加重疼痛程度' },
  'Pain has no significant effect on my social life apart from limiting my more energetic interests': { es: 'El dolor no afecta mi vida social de forma significativa, salvo que limita mis intereses más enérgicos', zh: '除了限制我较为剧烈的兴趣活动外，疼痛对我的社交生活没有明显影响' },
  'Pain has restricted my social life and I do not go out as often': { es: 'El dolor ha restringido mi vida social y salgo con menos frecuencia', zh: '疼痛限制了我的社交生活，我外出的次数减少了' },
  'Pain has restricted my social life to my home': { es: 'El dolor ha restringido mi vida social a mi hogar', zh: '疼痛使我的社交生活局限在家中' },
  'I have no social life because of pain': { es: 'No tengo vida social debido al dolor', zh: '由于疼痛我没有社交生活' },
  'I can travel anywhere without pain': { es: 'Puedo viajar a cualquier lugar sin dolor', zh: '我可以去任何地方旅行而不感到疼痛' },
  'I can travel anywhere but it gives me extra pain': { es: 'Puedo viajar a cualquier lugar pero me causa dolor adicional', zh: '我可以去任何地方旅行，但会引起额外疼痛' },
  'Pain is bad but I manage journeys over 2 hours': { es: 'El dolor es intenso pero puedo hacer viajes de más de 2 horas', zh: '疼痛严重，但我能应对超过2小时的行程' },
  'Pain restricts me to journeys of less than 1 hour': { es: 'El dolor me limita a viajes de menos de 1 hora', zh: '疼痛使我只能进行不到1小时的行程' },
  'Pain restricts me to short necessary journeys under 30 minutes': { es: 'El dolor me limita a viajes cortos necesarios de menos de 30 minutos', zh: '疼痛使我只能进行不到30分钟的必要短途行程' },
  'Pain prevents me from traveling except to receive treatment': { es: 'El dolor me impide viajar excepto para recibir tratamiento', zh: '除接受治疗外，疼痛使我无法出行' },

  // ---- NDI answer options (unique to NDI) ----
  'Pain prevents me from lifting heavy weights off the floor, but I can if they are conveniently placed': { es: 'El dolor me impide levantar objetos pesados del suelo, pero puedo si están en una posición cómoda', zh: '疼痛使我无法从地面提举重物，但如果物品放在方便的位置我可以做到' },
  'Pain prevents me from lifting heavy weights, but I can manage light to medium weights if conveniently positioned': { es: 'El dolor me impide levantar objetos pesados, pero puedo con pesos ligeros a medianos si están en una posición cómoda', zh: '疼痛使我无法提举重物，但如果物品位置方便，我可以提举轻到中等重量的物品' },
  'I can read as much as I want to with no pain in my neck': { es: 'Puedo leer todo lo que quiera sin dolor en el cuello', zh: '我可以随心所欲地阅读，颈部没有疼痛' },
  'I can read as much as I want to with slight pain in my neck': { es: 'Puedo leer todo lo que quiera con dolor leve en el cuello', zh: '我可以随心所欲地阅读，颈部有轻微疼痛' },
  'I can read as much as I want with moderate pain in my neck': { es: 'Puedo leer todo lo que quiera con dolor moderado en el cuello', zh: '我可以随心所欲地阅读，颈部有中度疼痛' },
  'I can\'t read as much as I want because of moderate pain in my neck': { es: 'No puedo leer todo lo que quiero debido a un dolor moderado en el cuello', zh: '由于颈部中度疼痛，我无法随心所欲地阅读' },
  'I can hardly read at all because of severe pain in my neck': { es: 'Apenas puedo leer debido a un dolor intenso en el cuello', zh: '由于颈部剧烈疼痛，我几乎无法阅读' },
  'I cannot read at all': { es: 'No puedo leer en absoluto', zh: '我完全无法阅读' },
  'I have no headaches at all': { es: 'No tengo dolores de cabeza en absoluto', zh: '我完全没有头痛' },
  'I have slight headaches which come infrequently': { es: 'Tengo dolores de cabeza leves que aparecen con poca frecuencia', zh: '我偶尔有轻微头痛' },
  'I have moderate headaches which come infrequently': { es: 'Tengo dolores de cabeza moderados que aparecen con poca frecuencia', zh: '我偶尔有中度头痛' },
  'I have moderate headaches which come frequently': { es: 'Tengo dolores de cabeza moderados que aparecen con frecuencia', zh: '我经常有中度头痛' },
  'I have severe headaches which come frequently': { es: 'Tengo dolores de cabeza intensos que aparecen con frecuencia', zh: '我经常有剧烈头痛' },
  'I have headaches almost all the time': { es: 'Tengo dolores de cabeza casi todo el tiempo', zh: '我几乎一直都有头痛' },
  'I can concentrate fully when I want to with no difficulty': { es: 'Puedo concentrarme por completo cuando quiero sin dificultad', zh: '我想集中注意力时可以毫无困难地做到' },
  'I can concentrate fully when I want to with slight difficulty': { es: 'Puedo concentrarme por completo cuando quiero con una ligera dificultad', zh: '我想集中注意力时能做到，但有轻微困难' },
  'I have a fair degree of difficulty in concentrating when I want to': { es: 'Tengo bastante dificultad para concentrarme cuando quiero', zh: '我想集中注意力时有相当程度的困难' },
  'I have a lot of difficulty in concentrating when I want to': { es: 'Tengo mucha dificultad para concentrarme cuando quiero', zh: '我想集中注意力时有很大困难' },
  'I have a great deal of difficulty in concentrating when I want to': { es: 'Tengo muchísima dificultad para concentrarme cuando quiero', zh: '我想集中注意力时有极大困难' },
  'I cannot concentrate at all': { es: 'No puedo concentrarme en absoluto', zh: '我完全无法集中注意力' },
  'I can do as much work as I want to': { es: 'Puedo hacer todo el trabajo que quiera', zh: '我能完成我想做的所有工作' },
  'I can only do my usual work, but no more': { es: 'Solo puedo hacer mi trabajo habitual, pero nada más', zh: '我只能完成日常工作，无法再多' },
  'I can do most of my usual work, but no more': { es: 'Puedo hacer la mayor parte de mi trabajo habitual, pero nada más', zh: '我能完成大部分日常工作，但无法再多' },
  'I cannot do my usual work': { es: 'No puedo hacer mi trabajo habitual', zh: '我无法完成日常工作' },
  'I can hardly do any work at all': { es: 'Apenas puedo hacer trabajo alguno', zh: '我几乎无法做任何工作' },
  'I can\'t do any work at all': { es: 'No puedo hacer ningún trabajo en absoluto', zh: '我完全无法做任何工作' },
  'I can drive my car without any neck pain': { es: 'Puedo conducir mi auto sin ningún dolor de cuello', zh: '我开车时颈部没有任何疼痛' },
  'I can drive my car as long as I want with slight pain in my neck': { es: 'Puedo conducir mi auto todo lo que quiera con dolor leve en el cuello', zh: '我可以随心所欲地开车，颈部有轻微疼痛' },
  'I can drive my car as long as I want with moderate pain in my neck': { es: 'Puedo conducir mi auto todo lo que quiera con dolor moderado en el cuello', zh: '我可以随心所欲地开车，颈部有中度疼痛' },
  'I can\'t drive my car as long as I want because of moderate pain in my neck': { es: 'No puedo conducir mi auto todo lo que quiero debido a un dolor moderado en el cuello', zh: '由于颈部中度疼痛，我无法随心所欲地开车' },
  'I can hardly drive at all because of severe pain in my neck': { es: 'Apenas puedo conducir debido a un dolor intenso en el cuello', zh: '由于颈部剧烈疼痛，我几乎无法开车' },
  'I can\'t drive my car at all': { es: 'No puedo conducir mi auto en absoluto', zh: '我完全无法开车' },
  'I have no trouble sleeping': { es: 'No tengo problemas para dormir', zh: '我睡眠没有问题' },
  'My sleep is slightly disturbed (less than 1 hour sleepless)': { es: 'Mi sueño está ligeramente perturbado (menos de 1 hora sin dormir)', zh: '我的睡眠受到轻微干扰（失眠不足1小时）' },
  'My sleep is mildly disturbed (1–2 hours sleepless)': { es: 'Mi sueño está levemente perturbado (1 a 2 horas sin dormir)', zh: '我的睡眠受到轻度干扰（失眠1至2小时）' },
  'My sleep is moderately disturbed (2–3 hours sleepless)': { es: 'Mi sueño está moderadamente perturbado (2 a 3 horas sin dormir)', zh: '我的睡眠受到中度干扰（失眠2至3小时）' },
  'My sleep is greatly disturbed (3–5 hours sleepless)': { es: 'Mi sueño está muy perturbado (3 a 5 horas sin dormir)', zh: '我的睡眠受到严重干扰（失眠3至5小时）' },
  'My sleep is completely disturbed (5–7 hours sleepless)': { es: 'Mi sueño está completamente perturbado (5 a 7 horas sin dormir)', zh: '我的睡眠受到完全干扰（失眠5至7小时）' },
  'I am able to engage in all my recreation activities with no neck pain at all': { es: 'Puedo participar en todas mis actividades recreativas sin ningún dolor de cuello', zh: '我能参与所有娱乐活动，颈部完全没有疼痛' },
  'I am able to engage in all my recreation activities with some pain in my neck': { es: 'Puedo participar en todas mis actividades recreativas con algo de dolor en el cuello', zh: '我能参与所有娱乐活动，颈部有一些疼痛' },
  'I am able to engage in most, but not all, of my usual recreation activities because of pain in my neck': { es: 'Puedo participar en la mayoría, pero no en todas, mis actividades recreativas habituales debido al dolor de cuello', zh: '由于颈部疼痛，我能参与大部分但非全部的日常娱乐活动' },
  'I am able to engage in a few of my usual recreation activities because of pain in my neck': { es: 'Solo puedo participar en algunas de mis actividades recreativas habituales debido al dolor de cuello', zh: '由于颈部疼痛，我只能参与少数日常娱乐活动' },
  'I can hardly do any recreation activities because of pain in my neck': { es: 'Apenas puedo hacer actividades recreativas debido al dolor de cuello', zh: '由于颈部疼痛，我几乎无法进行任何娱乐活动' },
  'I can\'t do any recreation activities at all': { es: 'No puedo hacer ninguna actividad recreativa en absoluto', zh: '我完全无法进行任何娱乐活动' },

  // ---- mJOA answer options ----
  'I have no difficulty with hand function — my writing, buttoning, and eating are normal': { es: 'No tengo dificultad con la función de las manos: escribir, abotonar y comer son normales', zh: '我的手部功能没有困难——书写、扣纽扣和进食都正常' },
  'I have slight difficulty with buttons or fine hand movements, but can do most things': { es: 'Tengo una ligera dificultad con los botones o los movimientos finos de la mano, pero puedo hacer la mayoría de las cosas', zh: '我在扣纽扣或手部精细动作方面有轻微困难，但大部分事情能做到' },
  'I have noticeable difficulty with buttons, writing, or handling small objects': { es: 'Tengo una dificultad notable con los botones, la escritura o el manejo de objetos pequeños', zh: '我在扣纽扣、书写或处理小物件方面有明显困难' },
  'I can move my hands but cannot button my shirt or handle chopsticks/utensils well': { es: 'Puedo mover las manos pero no puedo abotonar mi camisa ni manejar bien los cubiertos', zh: '我能活动双手，但无法扣衬衫纽扣，也无法很好地使用筷子或餐具' },
  'I can move my hands but cannot feed myself with a spoon': { es: 'Puedo mover las manos pero no puedo alimentarme con una cuchara', zh: '我能活动双手，但无法用勺子自己进食' },
  'I am unable to move my hands': { es: 'No puedo mover las manos', zh: '我无法活动双手' },
  'I walk normally with no balance or coordination issues': { es: 'Camino normalmente sin problemas de equilibrio ni de coordinación', zh: '我行走正常，没有平衡或协调问题' },
  'I walk on my own but notice mild balance or coordination issues': { es: 'Camino por mi cuenta pero noto problemas leves de equilibrio o coordinación', zh: '我能独立行走，但注意到轻微的平衡或协调问题' },
  'I can walk on my own including stairs, but I notice moderate instability': { es: 'Puedo caminar por mi cuenta, incluidas las escaleras, pero noto una inestabilidad moderada', zh: '我能独立行走，包括上下楼梯，但注意到中度不稳' },
  'I can walk on flat ground on my own but need a handrail for stairs': { es: 'Puedo caminar en terreno plano por mi cuenta pero necesito un pasamanos para las escaleras', zh: '我能在平地上独立行走，但上下楼梯需要扶手' },
  'I need a cane, walker, or someone to help me walk': { es: 'Necesito un bastón, un andador o que alguien me ayude a caminar', zh: '我需要拐杖、助行器或他人帮助才能行走' },
  'I can move my legs but I am unable to walk': { es: 'Puedo mover las piernas pero no puedo caminar', zh: '我能活动双腿，但无法行走' },
  'I am unable to move my legs but have some sensation': { es: 'No puedo mover las piernas pero tengo algo de sensibilidad', zh: '我无法活动双腿，但仍有一些感觉' },
  'I am unable to move my legs and have no sensation': { es: 'No puedo mover las piernas y no tengo sensibilidad', zh: '我无法活动双腿，也没有感觉' },
  'I have completely normal sensation in my hands and arms': { es: 'Tengo una sensibilidad completamente normal en las manos y los brazos', zh: '我手臂和双手的感觉完全正常' },
  'I have mild numbness or tingling in my hands or arms': { es: 'Tengo un leve entumecimiento u hormigueo en las manos o los brazos', zh: '我手臂或双手有轻微麻木或刺痛' },
  'I have significant numbness or pain in my hands or arms': { es: 'Tengo un entumecimiento o dolor significativo en las manos o los brazos', zh: '我手臂或双手有明显麻木或疼痛' },
  'I have complete loss of feeling in my hands': { es: 'Tengo una pérdida total de sensibilidad en las manos', zh: '我双手完全失去知觉' },
  'I have completely normal bladder function': { es: 'Tengo una función de la vejiga completamente normal', zh: '我的膀胱功能完全正常' },
  'I have mild difficulty — slight urgency or frequency': { es: 'Tengo una dificultad leve: ligera urgencia o frecuencia', zh: '我有轻微困难——轻度尿急或尿频' },
  'I have significant difficulty — I strain or have retention issues': { es: 'Tengo una dificultad significativa: hago esfuerzo o tengo problemas de retención', zh: '我有明显困难——排尿费力或有尿潴留问题' },
  'I am unable to control my bladder': { es: 'No puedo controlar mi vejiga', zh: '我无法控制膀胱' },

  // ---- SRS-22r question prompts ----
  'Which best describes your pain over the past 6 months?': { es: '¿Cuál describe mejor su dolor durante los últimos 6 meses?', zh: '以下哪项最能描述您过去6个月的疼痛？' },
  'Over the past 6 months, how many months have you had back pain?': { es: 'Durante los últimos 6 meses, ¿cuántos meses ha tenido dolor de espalda?', zh: '在过去6个月中，您有多少个月出现过背痛？' },
  'During the past 6 months, have you felt so down in the dumps that nothing could cheer you up?': { es: 'Durante los últimos 6 meses, ¿se ha sentido tan decaído que nada podía animarlo?', zh: '在过去6个月中，您是否曾情绪低落到没有任何事能让您振作？' },
  'Do you feel that your spinal condition limits your daily activities?': { es: '¿Siente que su afección de la columna limita sus actividades diarias?', zh: '您是否觉得脊柱疾病限制了您的日常活动？' },
  'What is your current level of activity?': { es: '¿Cuál es su nivel actual de actividad?', zh: '您目前的活动水平如何？' },
  'How do you look in clothes?': { es: '¿Cómo se ve usted con la ropa puesta?', zh: '您穿衣服时的外观如何？' },
  'In the past 6 months, have you been a happy person?': { es: 'En los últimos 6 meses, ¿ha sido una persona feliz?', zh: '在过去6个月中，您是否是一个快乐的人？' },
  'Do you experience back pain at rest?': { es: '¿Experimenta dolor de espalda en reposo?', zh: '您在休息时是否感到背痛？' },
  'What is your current level of work/school activity?': { es: '¿Cuál es su nivel actual de actividad laboral o escolar?', zh: '您目前的工作/学习活动水平如何？' },
  'How do you feel about the appearance of your trunk/torso (the area of your body excluding arms, legs, and head)?': { es: '¿Cómo se siente respecto a la apariencia de su tronco (la parte del cuerpo excluyendo brazos, piernas y cabeza)?', zh: '您对自己躯干（不包括手臂、腿部和头部的身体部位）外观的感受如何？' },
  'Have you taken any pain medications in the past month for your back?': { es: '¿Ha tomado algún medicamento para el dolor de espalda en el último mes?', zh: '在过去一个月中，您是否为背部服用过任何止痛药？' },
  'Does your back condition limit your ability to do things around the house?': { es: '¿Su afección de espalda limita su capacidad para hacer tareas en el hogar?', zh: '您的背部疾病是否限制了您做家务的能力？' },
  'Have you felt calm and peaceful in the past 6 months?': { es: '¿Se ha sentido tranquilo y en paz en los últimos 6 meses?', zh: '在过去6个月中，您是否感到平静安宁？' },
  'Do you feel your spinal condition affects your body attractiveness?': { es: '¿Siente que su afección de la columna afecta el atractivo de su cuerpo?', zh: '您是否觉得脊柱疾病影响了您身体的吸引力？' },
  'Are you and/or your family experiencing financial difficulties because of your back?': { es: '¿Usted y/o su familia están teniendo dificultades económicas debido a su espalda?', zh: '您和/或您的家人是否因您的背部问题而遇到经济困难？' },
  'Have you been downhearted and blue in the past 6 months?': { es: '¿Se ha sentido desanimado y triste en los últimos 6 meses?', zh: '在过去6个月中，您是否感到沮丧和忧郁？' },
  'In the past 6 months, how often has your back pain been at rest?': { es: 'En los últimos 6 meses, ¿con qué frecuencia ha tenido dolor de espalda en reposo?', zh: '在过去6个月中，您在休息时出现背痛的频率如何？' },
  'In the past 3 months, how many days have you taken off from work/school because of back pain?': { es: 'En los últimos 3 meses, ¿cuántos días ha faltado al trabajo o a la escuela debido al dolor de espalda?', zh: '在过去3个月中，您因背痛而请假不上班/上学的天数有多少？' },
  'If you had to spend the rest of your life with your back as it is right now, how would you feel?': { es: 'Si tuviera que pasar el resto de su vida con su espalda tal como está ahora, ¿cómo se sentiría?', zh: '如果您的余生都要在背部处于目前状况下度过，您会有何感受？' },
  'Do you feel that your condition affects personal relationships?': { es: '¿Siente que su afección afecta sus relaciones personales?', zh: '您是否觉得您的病情影响了个人关系？' },
  'Are you satisfied with the results of your back management to date?': { es: '¿Está satisfecho con los resultados del tratamiento de su espalda hasta la fecha?', zh: '您对目前为止背部治疗的效果是否满意？' },
  'Would you have the same management again if you had the same condition?': { es: 'Si tuviera la misma afección, ¿volvería a elegir el mismo tratamiento?', zh: '如果您患有同样的病情，您是否会再次选择相同的治疗？' },

  // ---- SRS-22r answer options ----
  'None': { es: 'Ninguno', zh: '无' },
  'Mild': { es: 'Leve', zh: '轻度' },
  'Moderate': { es: 'Moderado', zh: '中度' },
  'Moderate to severe': { es: 'De moderado a intenso', zh: '中度至重度' },
  'Severe': { es: 'Intenso', zh: '重度' },
  '0 months': { es: '0 meses', zh: '0个月' },
  '1 month': { es: '1 mes', zh: '1个月' },
  '2–3 months': { es: '2 a 3 meses', zh: '2至3个月' },
  '4–5 months': { es: '4 a 5 meses', zh: '4至5个月' },
  '6 months': { es: '6 meses', zh: '6个月' },
  'Never': { es: 'Nunca', zh: '从不' },
  'Rarely': { es: 'Rara vez', zh: '很少' },
  'Sometimes': { es: 'A veces', zh: '有时' },
  'Often': { es: 'A menudo', zh: '经常' },
  'Very often': { es: 'Muy a menudo', zh: '非常频繁' },
  'Not at all': { es: 'En absoluto', zh: '完全没有' },
  'Slightly': { es: 'Ligeramente', zh: '轻微' },
  'Moderately': { es: 'Moderadamente', zh: '中等程度' },
  'Quite a bit': { es: 'Bastante', zh: '相当多' },
  'Very much': { es: 'Muchísimo', zh: '非常严重' },
  'Full activities without restriction': { es: 'Actividades plenas sin restricción', zh: '完全活动，无限制' },
  'Full activities with mild restrictions': { es: 'Actividades plenas con restricciones leves', zh: '完全活动，有轻微限制' },
  'Light activities and sports, moderate restrictions': { es: 'Actividades y deportes ligeros, restricciones moderadas', zh: '轻度活动和运动，中度限制' },
  'Unable to do most activities': { es: 'Incapaz de realizar la mayoría de las actividades', zh: '无法进行大部分活动' },
  'Completely disabled, bedridden': { es: 'Completamente incapacitado, postrado en cama', zh: '完全丧失能力，卧床不起' },
  'Very good': { es: 'Muy bien', zh: '非常好' },
  'Good': { es: 'Bien', zh: '好' },
  'Fair': { es: 'Regular', zh: '一般' },
  'Poor': { es: 'Mal', zh: '差' },
  'Very poor': { es: 'Muy mal', zh: '非常差' },
  'All of the time': { es: 'Todo el tiempo', zh: '所有时间' },
  'Most of the time': { es: 'La mayor parte del tiempo', zh: '大部分时间' },
  'Some of the time': { es: 'Parte del tiempo', zh: '部分时间' },
  'A little of the time': { es: 'Un poco del tiempo', zh: '少部分时间' },
  'None of the time': { es: 'En ningún momento', zh: '没有任何时间' },
  'Full-time work/school, no restrictions': { es: 'Trabajo o escuela a tiempo completo, sin restricciones', zh: '全职工作/全日制学习，无限制' },
  'Full-time work/school, with mild restrictions': { es: 'Trabajo o escuela a tiempo completo, con restricciones leves', zh: '全职工作/全日制学习，有轻微限制' },
  'Part-time, or full-time with significant restrictions': { es: 'Tiempo parcial, o tiempo completo con restricciones significativas', zh: '兼职，或有明显限制的全职' },
  'Severely limited — unable to work/attend school': { es: 'Muy limitado: incapaz de trabajar o asistir a la escuela', zh: '严重受限——无法工作/上学' },
  'Completely disabled': { es: 'Completamente incapacitado', zh: '完全丧失能力' },
  'Very satisfied': { es: 'Muy satisfecho', zh: '非常满意' },
  'Satisfied': { es: 'Satisfecho', zh: '满意' },
  'Neither satisfied nor dissatisfied': { es: 'Ni satisfecho ni insatisfecho', zh: '既不满意也不满意' },
  'Dissatisfied': { es: 'Insatisfecho', zh: '不满意' },
  'Very dissatisfied': { es: 'Muy insatisfecho', zh: '非常不满意' },
  '1 week or less of non-narcotic medications': { es: '1 semana o menos de medicamentos no narcóticos', zh: '服用非麻醉类药物1周或以内' },
  'More than 1 week of non-narcotics': { es: 'Más de 1 semana de medicamentos no narcóticos', zh: '服用非麻醉类药物超过1周' },
  '1 week or less of narcotic (opioid) medications': { es: '1 semana o menos de medicamentos narcóticos (opioides)', zh: '服用麻醉类（阿片类）药物1周或以内' },
  'More than 1 week of narcotic (opioid) medications': { es: 'Más de 1 semana de medicamentos narcóticos (opioides)', zh: '服用麻醉类（阿片类）药物超过1周' },
  'Always': { es: 'Siempre', zh: '总是' },
  '0 days': { es: '0 días', zh: '0天' },
  '1–3 days': { es: '1 a 3 días', zh: '1至3天' },
  '4–7 days': { es: '4 a 7 días', zh: '4至7天' },
  '8–14 days': { es: '8 a 14 días', zh: '8至14天' },
  'More than 14 days': { es: 'Más de 14 días', zh: '超过14天' },
  'Very happy': { es: 'Muy feliz', zh: '非常高兴' },
  'Somewhat happy': { es: 'Algo feliz', zh: '有些高兴' },
  'Neither happy nor unhappy': { es: 'Ni feliz ni infeliz', zh: '既不高兴也不难过' },
  'Somewhat unhappy': { es: 'Algo infeliz', zh: '有些难过' },
  'Very unhappy': { es: 'Muy infeliz', zh: '非常难过' },
  'Definitely yes': { es: 'Definitivamente sí', zh: '肯定会' },
  'Probably yes': { es: 'Probablemente sí', zh: '可能会' },
  'Not sure': { es: 'No estoy seguro', zh: '不确定' },
  'Probably not': { es: 'Probablemente no', zh: '可能不会' },
  'Definitely not': { es: 'Definitivamente no', zh: '肯定不会' },
};

export default function PROMs({ onNext, onBack }) {
  const { data, setSection } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const proms = data.proms || {};

  // Determine which questionnaires to show
  const applicableIds = useMemo(() => getApplicableQuestionnaires(data), [data]);

  // Track which questionnaire is currently active
  const [activeIndex, setActiveIndex] = useState(0);

  // Local answers state, initialized from store
  const [answers, setAnswers] = useState(() => {
    const init = {};
    for (const id of applicableIds) {
      init[id] = proms[id]?.answers || {};
    }
    return init;
  });

  const saveToStore = (updated) => {
    const promsData = {};
    for (const id of applicableIds) {
      const q = QUESTIONNAIRE_MAP[id];
      const a = updated[id] || {};
      let score = null;
      if (id === 'odi' || id === 'ndi') score = scoreOdiNdi(a, q);
      else if (id === 'mjoa') score = scoreMJOA(a);
      else if (id === 'srs22r') score = scoreSRS22R(a);
      promsData[id] = { answers: a, score };
    }
    setSection('proms', promsData);
  };

  const handleAnswer = (questionnaireId, questionId, score) => {
    const updated = {
      ...answers,
      [questionnaireId]: {
        ...answers[questionnaireId],
        [questionId]: score,
      },
    };
    setAnswers(updated);
    saveToStore(updated);
  };

  // If no questionnaires apply, skip this step
  if (applicableIds.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h2 className="section-title">{t('Patient-Reported Outcome Measures')}</h2>
          <p className="section-subtitle">
            {t('Based on your symptoms, no additional outcome questionnaires are needed at this time.')}
          </p>
        </div>
        <div className="card p-8 text-center">
          <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600">{t('No questionnaires required. You can continue to the next step.')}</p>
        </div>
        <StepNavigation onBack={onBack} onNext={onNext} nextLabel={t('Continue')} />
      </div>
    );
  }

  const activeId = applicableIds[activeIndex];
  const activeQ = QUESTIONNAIRE_MAP[activeId];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('Patient-Reported Outcome Measures')}</h2>
        <p className="section-subtitle">
          {applicableIds.length > 1
            ? t('Based on your symptoms, please complete the following questionnaires. These help your surgeon understand how your condition affects your daily life.')
            : t('Based on your symptoms, please complete the following questionnaire. These help your surgeon understand how your condition affects your daily life.')}
        </p>
      </div>

      {/* Questionnaire tabs if more than one */}
      {applicableIds.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {applicableIds.map((id, idx) => {
            const q = QUESTIONNAIRE_MAP[id];
            const a = answers[id] || {};
            const totalQuestions = id === 'srs22r' ? q.questions.length : q.sections.length;
            const answeredCount = Object.keys(a).length;
            const isComplete = answeredCount >= totalQuestions;
            return (
              <button
                key={id}
                onClick={() => setActiveIndex(idx)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  idx === activeIndex
                    ? 'bg-teal-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300'
                }`}
              >
                {q.shortName}
                {isComplete && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {!isComplete && answeredCount > 0 && (
                  <span className="text-xs opacity-75">({answeredCount}/{totalQuestions})</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Active questionnaire */}
      <div className="card mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-navy-600">{t(activeQ.name)}</h3>
          <p className="text-sm text-gray-500 mt-1">{t(activeQ.description)}</p>
        </div>

        {activeId === 'srs22r' ? (
          <SRS22RForm
            questionnaire={activeQ}
            answers={answers[activeId] || {}}
            onAnswer={(qId, score) => handleAnswer(activeId, qId, score)}
          />
        ) : (
          <StandardForm
            questionnaire={activeQ}
            answers={answers[activeId] || {}}
            onAnswer={(sectionId, score) => handleAnswer(activeId, sectionId, score)}
          />
        )}
      </div>

      {/* Score preview */}
      <ScorePreview questionnaireId={activeId} answers={answers[activeId] || {}} />

      <StepNavigation onBack={onBack} onNext={onNext} nextLabel={t('Continue')} />
    </div>
  );
}


/** Renders ODI, NDI, or mJOA sections */
function StandardForm({ questionnaire, answers, onAnswer }) {
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  return (
    <div className="space-y-6">
      {questionnaire.sections.map((section, idx) => (
        <div key={section.id} className="border border-gray-100 rounded-xl p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-navy-600">
              {idx + 1}. {t(section.title)}
              {section.optional && <span className="text-gray-400 font-normal ml-1">{t('(optional)')}</span>}
            </h4>
            {section.subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{t(section.subtitle)}</p>
            )}
          </div>
          <div className="space-y-1.5">
            {section.options.map((option) => (
              <label
                key={option.score}
                className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  answers[section.id] === option.score
                    ? 'bg-teal-50 border border-teal-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <input
                  type="radio"
                  name={`${questionnaire.id}-${section.id}`}
                  checked={answers[section.id] === option.score}
                  onChange={() => onAnswer(section.id, option.score)}
                  className="mt-0.5 accent-teal-500"
                />
                <span className="text-sm text-gray-700 leading-snug">{t(option.label)}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


/** Renders SRS-22r questions */
function SRS22RForm({ questionnaire, answers, onAnswer }) {
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  return (
    <div className="space-y-6">
      {questionnaire.questions.map((q, idx) => (
        <div key={q.id} className="border border-gray-100 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-navy-600 mb-3">
            {idx + 1}. {t(q.text)}
          </h4>
          <div className="space-y-1.5">
            {q.options.map((option) => (
              <label
                key={option.score}
                className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  answers[q.id] === option.score
                    ? 'bg-teal-50 border border-teal-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <input
                  type="radio"
                  name={`srs22r-q${q.id}`}
                  checked={answers[q.id] === option.score}
                  onChange={() => onAnswer(q.id, option.score)}
                  className="mt-0.5 accent-teal-500"
                />
                <span className="text-sm text-gray-700 leading-snug">{t(option.label)}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


/** Score preview below the questionnaire */
function ScorePreview({ questionnaireId, answers }) {
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const q = QUESTIONNAIRE_MAP[questionnaireId];
  const answeredCount = Object.keys(answers).length;

  if (answeredCount === 0) return null;

  let scoreDisplay = null;

  if (questionnaireId === 'odi' || questionnaireId === 'ndi') {
    const result = scoreOdiNdi(answers, q);
    if (result) {
      scoreDisplay = (
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <span className="text-2xl font-bold text-navy-600">{result.percentage}%</span>
            <span className="text-sm text-gray-500 ml-2">({result.sectionsAnswered} {t('of')} {q.sections.length} {t('sections')})</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getInterpretationColor(result.interpretation)}`}>
            {t(result.interpretation)}
          </span>
        </div>
      );
    }
  } else if (questionnaireId === 'mjoa') {
    const result = scoreMJOA(answers);
    if (result) {
      scoreDisplay = (
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <span className="text-2xl font-bold text-navy-600">{result.totalScore}</span>
            <span className="text-sm text-gray-500 ml-1">/ {result.maxScore}</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMjoaColor(result.interpretation)}`}>
            {t(result.interpretation)}
          </span>
        </div>
      );
    }
  } else if (questionnaireId === 'srs22r') {
    const result = scoreSRS22R(answers);
    if (result) {
      scoreDisplay = (
        <div className="space-y-2">
          {result.totalScore && (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-navy-600">{result.totalScore}</span>
              <span className="text-sm text-gray-500">/ 5.0 {t('overall mean')}</span>
            </div>
          )}
          <div className="flex gap-3 flex-wrap">
            {Object.values(result.domainScores).map((d) => (
              <span key={d.name} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                {t(d.name)}: <strong>{d.score}</strong>
              </span>
            ))}
          </div>
        </div>
      );
    }
  }

  if (!scoreDisplay) return null;

  return (
    <div className="card mb-6 bg-gray-50 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h4 className="text-sm font-semibold text-navy-600">{q.shortName} {t('Score')}</h4>
      </div>
      {scoreDisplay}
    </div>
  );
}


function getInterpretationColor(interpretation) {
  switch (interpretation) {
    case 'Minimal disability': return 'bg-green-100 text-green-700';
    case 'Moderate disability': return 'bg-yellow-100 text-yellow-700';
    case 'Severe disability': return 'bg-orange-100 text-orange-700';
    case 'Crippled': return 'bg-red-100 text-red-700';
    default: return 'bg-red-100 text-red-700';
  }
}

function getMjoaColor(interpretation) {
  switch (interpretation) {
    case 'No myelopathy': return 'bg-green-100 text-green-700';
    case 'Mild myelopathy': return 'bg-yellow-100 text-yellow-700';
    case 'Moderate myelopathy': return 'bg-orange-100 text-orange-700';
    case 'Severe myelopathy': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}
