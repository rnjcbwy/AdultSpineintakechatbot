'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import { PAIN_QUALITIES, SYMPTOM_REGIONS } from '../../lib/constants';
import StepNavigation from '../ui/StepNavigation';
import { PainScale } from '../ui/Fields';
import { problemsFor, ONSET_OPTIONS, ONSET_TYPE_OPTIONS, PROGRESSION_OPTIONS } from '../../lib/problems';
import HPIChat from '../HPIChat';
import { useLang, makeT, COMMON } from '../../lib/i18n';

// Display-only translations. Stored values stay canonical English.
const LOCAL = {
  'Neck and arm symptoms': { es: 'Síntomas de cuello y brazo', zh: '颈部和手臂症状' },
  'Mid-back symptoms': { es: 'Síntomas de la espalda media', zh: '中背部症状' },
  'Low back and leg symptoms': { es: 'Síntomas de la espalda baja y la pierna', zh: '下背部和腿部症状' },
  'Posture or curvature': { es: 'Postura o curvatura', zh: '姿势或脊柱弯曲' },
  'Your symptoms': { es: 'Sus síntomas', zh: '您的症状' },
  'A few quick questions about each problem. Where it hurts and where it travels comes from the body map you drew, so we will not ask that again.': {
    es: 'Unas pocas preguntas rápidas sobre cada problema. Dónde le duele y hacia dónde se extiende viene del mapa corporal que dibujó, así que no lo volveremos a preguntar.',
    zh: '关于每个问题的几个快速提问。疼痛的部位和放射范围来自您绘制的身体图，因此不会再次询问。',
  },
  'Which problem bothers you the most?': { es: '¿Qué problema le molesta más?', zh: '哪个问题最困扰您？' },
  'When did this start?': { es: '¿Cuándo empezó esto?', zh: '这是什么时候开始的？' },
  'Gradually, for no clear reason': { es: 'Gradualmente, sin una razón clara', zh: '逐渐出现，没有明显原因' },
  'Suddenly': { es: 'De repente', zh: '突然' },
  'After an injury or accident': { es: 'Después de una lesión o accidente', zh: '受伤或事故之后' },
  'After lifting or straining': { es: 'Después de levantar algo o hacer esfuerzo', zh: '搬重物或用力之后' },
  'Getting better': { es: 'Mejorando', zh: '正在好转' },
  'Getting worse': { es: 'Empeorando', zh: '正在加重' },
  'Comes and goes': { es: 'Va y viene', zh: '时好时坏' },
  'How bad is it on a typical day? (0 to 10)': { es: '¿Qué tan fuerte es en un día típico? (0 a 10)', zh: '通常一天的疼痛程度如何？（0 到 10）' },
  'How would you describe it? (optional, tap all that apply)': { es: '¿Cómo lo describiría? (opcional, toque todos los que apliquen)', zh: '您会如何描述它？（可选，点选所有适用项）' },
  'Safety check': { es: 'Revisión de seguridad', zh: '安全检查' },
  'A few yes/no questions that matter for your care. Please answer each one.': {
    es: 'Unas pocas preguntas de sí/no que importan para su atención. Por favor responda cada una.',
    zh: '几个对您的诊疗很重要的是/否问题。请逐一回答。',
  },
  'Numbness anywhere?': { es: '¿Entumecimiento en alguna parte?', zh: '身体任何部位麻木？' },
  'Tingling or pins-and-needles?': { es: '¿Hormigueo o sensación de alfileres?', zh: '刺痛或针刺感？' },
  'Weakness in an arm or leg?': { es: '¿Debilidad en un brazo o una pierna?', zh: '手臂或腿部无力？' },
  'Any new trouble controlling your bladder or bowels?': { es: '¿Algún problema nuevo para controlar la vejiga o el intestino?', zh: '新出现的大小便控制困难？' },
  'Numbness in the groin or inner thighs?': { es: '¿Entumecimiento en la ingle o la cara interna de los muslos?', zh: '腹股沟或大腿内侧麻木？' },
  'Foot slapping or catching on stairs?': { es: '¿El pie se arrastra o se traba en las escaleras?', zh: '上楼梯时脚拖地或绊到？' },
  'Trouble with buttons, writing or small objects?': { es: '¿Dificultad con botones, escritura u objetos pequeños?', zh: '扣扣子、写字或拿小物件有困难？' },
  'Dropping things more than usual?': { es: '¿Se le caen las cosas más de lo habitual?', zh: '比平时更容易掉东西？' },
  'Unsteady on your feet?': { es: '¿Inestable al caminar?', zh: '站立或行走不稳？' },
  'Electric shock down your spine when you bend your neck?': { es: '¿Sensación de descarga eléctrica por la columna al doblar el cuello?', zh: '低头时脊柱有触电感？' },
  'How would you like to describe your symptoms?': { es: '¿Cómo prefiere describir sus síntomas?', zh: '您想如何描述您的症状？' },
  'Either way takes about five minutes. Pick whichever feels easier.': {
    es: 'Cualquiera de las dos toma unos cinco minutos. Elija la que le resulte más fácil.',
    zh: '两种方式都大约需要五分钟。选择您觉得更容易的一种。',
  },
  'Tell it in your own words': { es: 'Cuéntelo con sus propias palabras', zh: '用您自己的话讲述' },
  'A short back-and-forth: our assistant asks about five questions and you answer however you like.': {
    es: 'Una conversación corta: nuestro asistente hace unas cinco preguntas y usted responde como quiera.',
    zh: '简短的问答：我们的助手会问大约五个问题，您可以随意作答。',
  },
  'Answer quick questions': { es: 'Responder preguntas rápidas', zh: '回答快速问题' },
  'Tap through a few multiple-choice questions for each area that hurts.': {
    es: 'Responda unas pocas preguntas de opción múltiple por cada zona que le duele.',
    zh: '为每个疼痛部位点选几个选择题。',
  },
  'Prefer to talk it through instead?': { es: '¿Prefiere contarlo en una conversación?', zh: '更想通过对话来讲述？' },
  'Prefer quick questions instead?': { es: '¿Prefiere las preguntas rápidas?', zh: '更想回答快速问题？' },
  'Switch': { es: 'Cambiar', zh: '切换' },
  // Section header
  'Symptom Details': { es: 'Detalles de los síntomas', zh: '症状详情' },
  "Let's go through the symptoms you told us about. You can fill this out for all of your symptoms on this one page — answer what you can and skip anything that doesn't apply.":
    { es: 'Repasemos los síntomas que nos indicó. Puede completar esto para todos sus síntomas en esta misma página: responda lo que pueda y omita lo que no corresponda.', zh: '让我们回顾您告诉我们的症状。您可以在同一页面上填写所有症状——尽量回答，遇到不适用的可以跳过。' },

  // Bothers most
  'Which symptom bothers you the most?': { es: '¿Qué síntoma le molesta más?', zh: '哪种症状最困扰您？' },
  'This helps your surgeon focus on what matters most to you.': { es: 'Esto ayuda a su cirujano a concentrarse en lo que más le importa.', zh: '这有助于您的外科医生关注对您最重要的问题。' },
  'Bothers me most': { es: 'Lo que más me molesta', zh: '最困扰我' },

  // Empty state
  'No symptom areas were selected yet. Please go back and choose where you have symptoms.':
    { es: 'Aún no se seleccionaron áreas de síntomas. Vuelva atrás y elija dónde tiene síntomas.', zh: '尚未选择任何症状部位。请返回并选择您有症状的部位。' },
  'Go Back': { es: 'Volver', zh: '返回' },

  // Nav
  'Continue to Prior Treatments': { es: 'Continuar a tratamientos previos', zh: '继续到既往治疗' },

  // Shared section headings
  'A Few Questions About Your Symptoms Overall': { es: 'Algunas preguntas sobre sus síntomas en general', zh: '关于您整体症状的几个问题' },
  'These apply to all of the symptoms above — you only need to answer them once.':
    { es: 'Estas aplican a todos los síntomas anteriores: solo debe responderlas una vez.', zh: '这些问题适用于上述所有症状——您只需回答一次。' },
  'Associated Symptoms': { es: 'Síntomas asociados', zh: '相关症状' },
  'Neck & Upper Body': { es: 'Cuello y parte superior del cuerpo', zh: '颈部与上半身' },
  'A few specific questions related to your neck/arm symptoms.': { es: 'Algunas preguntas específicas relacionadas con sus síntomas de cuello/brazo.', zh: '一些与您颈部/手臂症状相关的具体问题。' },
  'Lower Body': { es: 'Parte inferior del cuerpo', zh: '下半身' },
  'A few specific questions related to your back/leg symptoms.': { es: 'Algunas preguntas específicas relacionadas con sus síntomas de espalda/pierna.', zh: '一些与您背部/腿部症状相关的具体问题。' },
  'Impact on Daily Life': { es: 'Impacto en la vida diaria', zh: '对日常生活的影响' },

  // Aggravating / relieving
  'What makes your symptoms worse? (select all that apply)': { es: '¿Qué empeora sus síntomas? (seleccione todo lo que corresponda)', zh: '什么会加重您的症状？（选择所有适用项）' },
  'What makes your symptoms better? (select all that apply)': { es: '¿Qué mejora sus síntomas? (seleccione todo lo que corresponda)', zh: '什么会改善您的症状？（选择所有适用项）' },
  // aggravating options
  'Sitting': { es: 'Estar sentado', zh: '坐着' },
  'Standing': { es: 'Estar de pie', zh: '站立' },
  'Walking': { es: 'Caminar', zh: '行走' },
  'Bending forward': { es: 'Inclinarse hacia adelante', zh: '向前弯腰' },
  'Bending backward': { es: 'Inclinarse hacia atrás', zh: '向后弯腰' },
  'Twisting': { es: 'Girar el torso', zh: '扭转身体' },
  'Lifting': { es: 'Levantar peso', zh: '提举重物' },
  'Coughing/sneezing': { es: 'Toser/estornudar', zh: '咳嗽/打喷嚏' },
  'Lying down': { es: 'Acostarse', zh: '躺下' },
  'Getting up from a chair': { es: 'Levantarse de una silla', zh: '从椅子上起身' },
  'Driving': { es: 'Conducir', zh: '开车' },
  'Exercise': { es: 'Hacer ejercicio', zh: '运动' },
  'Stairs': { es: 'Subir escaleras', zh: '上下楼梯' },
  // relieving options
  'Rest': { es: 'Descansar', zh: '休息' },
  'Leaning forward': { es: 'Inclinarse hacia adelante', zh: '身体前倾' },
  'Ice': { es: 'Hielo', zh: '冰敷' },
  'Heat': { es: 'Calor', zh: '热敷' },
  'Medication': { es: 'Medicamentos', zh: '药物' },
  'Stretching': { es: 'Estiramientos', zh: '拉伸' },
  'Position changes': { es: 'Cambios de posición', zh: '改变姿势' },
  'Nothing helps': { es: 'Nada ayuda', zh: '什么都没用' },

  // Associated symptoms
  'Numbness?': { es: '¿Entumecimiento?', zh: '麻木？' },
  'Loss of sensation or feeling': { es: 'Pérdida de sensibilidad', zh: '感觉丧失' },
  'Tingling or pins-and-needles?': { es: '¿Hormigueo o sensación de pinchazos?', zh: '刺痛或针刺感？' },
  'Weakness?': { es: '¿Debilidad?', zh: '无力？' },
  'Difficulty moving or muscle feels weak': { es: 'Dificultad para mover o sensación de músculo débil', zh: '活动困难或肌肉感觉无力' },
  'Does it disrupt your sleep?': { es: '¿Le altera el sueño?', zh: '会干扰您的睡眠吗？' },

  // Cervical screening
  'Trouble with buttons, writing, or small objects?': { es: '¿Dificultad con botones, escribir u objetos pequeños?', zh: '扣纽扣、书写或抓小物件有困难吗？' },
  'Fine motor difficulty': { es: 'Dificultad con la motricidad fina', zh: '精细动作困难' },
  'Dropping objects more than usual?': { es: '¿Deja caer objetos más de lo habitual?', zh: '比平时更容易掉落物品吗？' },
  'Balance or coordination problems?': { es: '¿Problemas de equilibrio o coordinación?', zh: '有平衡或协调问题吗？' },
  'Electric shock feeling with neck movement?': { es: '¿Sensación de descarga eléctrica al mover el cuello?', zh: '活动颈部时有触电般的感觉吗？' },
  'Sensation down your spine when bending the neck': { es: 'Sensación que baja por la columna al doblar el cuello', zh: '低头时脊柱有一股感觉向下传' },

  // Lumbar screening
  'Pain below the knee?': { es: '¿Dolor por debajo de la rodilla?', zh: '膝盖以下疼痛吗？' },
  'Symptoms improve when you sit or lean forward?': { es: '¿Mejoran los síntomas al sentarse o inclinarse hacia adelante?', zh: '坐下或身体前倾时症状会缓解吗？' },
  'Difficulty with stairs or foot feels floppy?': { es: '¿Dificultad con las escaleras o el pie se siente flojo?', zh: '上下楼梯困难或脚感觉无力下垂吗？' },
  'Foot drop or leg weakness': { es: 'Pie caído o debilidad en la pierna', zh: '足下垂或腿部无力' },
  'Changes in bowel or bladder control?': { es: '¿Cambios en el control intestinal o de la vejiga?', zh: '大小便控制有变化吗？' },
  'New incontinence or difficulty with urination': { es: 'Nueva incontinencia o dificultad para orinar', zh: '新出现的失禁或排尿困难' },
  'Numbness in the groin or inner thigh area?': { es: '¿Entumecimiento en la ingle o la cara interna del muslo?', zh: '腹股沟或大腿内侧麻木吗？' },
  'How far can you walk before needing to stop?': { es: '¿Qué distancia puede caminar antes de tener que detenerse?', zh: '您能走多远才需要停下来？' },
  // walking tolerance options
  'Unlimited': { es: 'Sin límite', zh: '不受限' },
  'More than 30 minutes': { es: 'Más de 30 minutos', zh: '超过30分钟' },
  '15-30 minutes': { es: '15 a 30 minutos', zh: '15至30分钟' },
  '5-15 minutes': { es: '5 a 15 minutos', zh: '5至15分钟' },
  'Less than 5 minutes': { es: 'Menos de 5 minutos', zh: '少于5分钟' },
  'Less than 1 block': { es: 'Menos de una cuadra', zh: '不到一个街区' },
  'Need a wheelchair/scooter': { es: 'Necesito silla de ruedas/scooter', zh: '需要轮椅/代步车' },

  // Functional impact selects
  'Impact on work': { es: 'Impacto en el trabajo', zh: '对工作的影响' },
  'No impact': { es: 'Sin impacto', zh: '没有影响' },
  'Mild — can still work': { es: 'Leve: aún puedo trabajar', zh: '轻度——仍能工作' },
  'Moderate — work is difficult': { es: 'Moderado: el trabajo es difícil', zh: '中度——工作困难' },
  'Severe — missing work': { es: 'Grave: falto al trabajo', zh: '重度——请假误工' },
  'Unable to work': { es: 'Incapaz de trabajar', zh: '无法工作' },
  'Retired/Not working': { es: 'Jubilado/Sin trabajar', zh: '已退休/未工作' },
  'Impact on exercise/activities': { es: 'Impacto en el ejercicio/actividades', zh: '对运动/活动的影响' },
  'Mild limitation': { es: 'Limitación leve', zh: '轻度受限' },
  'Moderate limitation': { es: 'Limitación moderada', zh: '中度受限' },
  'Severe limitation': { es: 'Limitación grave', zh: '重度受限' },
  'Unable to exercise': { es: 'Incapaz de hacer ejercicio', zh: '无法运动' },
  'How long can you sit comfortably?': { es: '¿Cuánto tiempo puede estar sentado cómodamente?', zh: '您能舒适地坐多久？' },
  'No limitation': { es: 'Sin limitación', zh: '不受限' },
  'More than 1 hour': { es: 'Más de 1 hora', zh: '超过1小时' },
  '30-60 minutes': { es: '30 a 60 minutos', zh: '30至60分钟' },
  'Less than 15 minutes': { es: 'Menos de 15 minutos', zh: '少于15分钟' },
  'How long can you stand comfortably?': { es: '¿Cuánto tiempo puede estar de pie cómodamente?', zh: '您能舒适地站多久？' },

  // Per-card labels
  'When did this start?': { es: '¿Cuándo comenzó esto?', zh: '这是什么时候开始的？' },
  'e.g., About 6 months ago, After a fall in March 2024': { es: 'p. ej., Hace unos 6 meses, Después de una caída en marzo de 2024', zh: '例如：大约6个月前，2024年3月摔倒之后' },
  'How did it start?': { es: '¿Cómo comenzó?', zh: '它是如何开始的？' },
  'Gradually over time': { es: 'Gradualmente con el tiempo', zh: '随时间逐渐出现' },
  'Suddenly': { es: 'De repente', zh: '突然出现' },
  'After an injury': { es: 'Después de una lesión', zh: '受伤之后' },
  'After surgery': { es: 'Después de una cirugía', zh: '手术之后' },
  "I'm not sure": { es: 'No estoy seguro', zh: '我不确定' },
  'Over time, has this symptom been...': { es: 'Con el tiempo, este síntoma ha estado...', zh: '随着时间推移，这个症状一直是……' },
  'Getting worse': { es: 'Empeorando', zh: '逐渐加重' },
  'Staying about the same': { es: 'Manteniéndose más o menos igual', zh: '大致保持不变' },
  'Getting better': { es: 'Mejorando', zh: '逐渐好转' },
  'Comes and goes': { es: 'Va y viene', zh: '时有时无' },
  'Which side?': { es: '¿Qué lado?', zh: '哪一侧？' },
  'Right': { es: 'Derecho', zh: '右侧' },
  'Left': { es: 'Izquierdo', zh: '左侧' },
  'Both sides': { es: 'Ambos lados', zh: '两侧' },
  'Midline/center': { es: 'Línea media/centro', zh: '中线/中央' },
  'Varies': { es: 'Varía', zh: '不定' },
  'How severe is it? (0 = none, 10 = worst imaginable):': { es: '¿Qué tan intenso es? (0 = ninguno, 10 = el peor imaginable):', zh: '有多严重？（0 = 无，10 = 无法想象的剧烈）：' },
  '0 — None': { es: '0 — Ninguno', zh: '0 — 无' },
  '5 — Moderate': { es: '5 — Moderado', zh: '5 — 中等' },
  '10 — Worst': { es: '10 — El peor', zh: '10 — 最剧烈' },
  'How would you describe it? (select all that apply)': { es: '¿Cómo lo describiría? (seleccione todo lo que corresponda)', zh: '您会如何描述它？（选择所有适用项）' },
  'Does it travel or spread to other areas?': { es: '¿Se traslada o se extiende a otras áreas?', zh: '它会传导或扩散到其他部位吗？' },
  'Where does it travel to? e.g., Down my left leg to the foot': { es: '¿A dónde se traslada? p. ej., Baja por mi pierna izquierda hasta el pie', zh: '它传导到哪里？例如：沿我的左腿向下到脚' },

  // PAIN_QUALITIES (defined in lib/constants) — translate here for display
  'Aching': { es: 'Adolorido', zh: '酸痛' },
  'Sharp': { es: 'Agudo', zh: '刺痛' },
  'Burning': { es: 'Ardiente', zh: '灼痛' },
  'Stabbing': { es: 'Como puñalada', zh: '如刀刺' },
  'Cramping': { es: 'Con calambres', zh: '痉挛性痛' },
  'Electric/shooting': { es: 'Como descarga eléctrica/punzante', zh: '电击样/放射痛' },
  'Throbbing': { es: 'Pulsátil', zh: '搏动性痛' },
  'Pressure': { es: 'Presión', zh: '压迫感' },
  'Dull': { es: 'Sordo', zh: '钝痛' },
  'Stiffness': { es: 'Rigidez', zh: '僵硬' },
};

/**
 * Symptom Details — consolidated structured symptom collection.
 *
 * Instead of forcing the patient to fill out an entire page of questions for
 * EACH symptom region, this step is completed all at once:
 *   - Per-symptom cards ask only what genuinely varies by symptom
 *     (onset, trend, side, severity, quality, radiation).
 *   - Shared questions (aggravating/relieving factors, associated symptoms,
 *     region-specific screening, functional impact) are asked a single time.
 */
export default function SymptomDetails({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const hpi = data.hpiData;
  const selectedRegions = data.chiefComplaint.symptomRegions || [];

  const overall = hpi.overall || {};
  const updateOverall = (field, value) => setNested(`hpiData.overall.${field}`, value);

  // The areas the patient tapped, folded into the problems they belong to.
  const problems = problemsFor(selectedRegions);
  const hasCervical = problems.some((p) => p.id === 'cervical');
  const hasLumbar = problems.some((p) => p.id === 'lumbar' || p.id === 'general');
  const primary = hpi.primaryProblem || (problems.length === 1 ? problems[0].id : '');

  // One path or the other, never both: a short guided conversation, or the
  // structured questions. The choice is kept so coming back shows the same.
  const mode = hpi.detailMode || '';
  const setMode = (m) => setNested('hpiData.detailMode', m);

  if (selectedRegions.length > 0 && !mode) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h2 className="section-title">{t('How would you like to describe your symptoms?')}</h2>
          <p className="section-subtitle">{t('Either way takes about five minutes. Pick whichever feels easier.')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button type="button" onClick={() => setMode('conversation')} className="text-left p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-teal-300 transition-all">
            <span className="block text-base font-semibold text-navy-600">{t('Tell it in your own words')}</span>
            <span className="block text-sm text-gray-500 mt-1 leading-relaxed">{t('A short back-and-forth: our assistant asks about five questions and you answer however you like.')}</span>
          </button>
          <button type="button" onClick={() => setMode('questions')} className="text-left p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-teal-300 transition-all">
            <span className="block text-base font-semibold text-navy-600">{t('Answer quick questions')}</span>
            <span className="block text-sm text-gray-500 mt-1 leading-relaxed">{t('Tap through a few multiple-choice questions for each area that hurts.')}</span>
          </button>
        </div>
        <StepNavigation onNext={onNext} onBack={onBack} canGoNext={false} />
      </div>
    );
  }

  if (selectedRegions.length > 0 && mode === 'conversation') {
    const answered = (hpi.conversationHistory || []).filter((m) => m.role === 'user').length;
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h2 className="section-title">{t('Symptom Details')}</h2>
          <p className="section-subtitle">
            {t('Prefer quick questions instead?')}{' '}
            <button type="button" onClick={() => setMode('questions')} className="text-teal-600 hover:underline font-medium">{t('Switch')}</button>
          </p>
        </div>
        <HPIChat intakeData={data} hpiData={hpi} setNested={setNested} maxTurns={5} autoStart />
        <SafetyCheck t={t} overall={overall} update={updateOverall} hasCervical={hasCervical} hasLumbar={hasLumbar} />
        <StepNavigation onNext={onNext} onBack={onBack} canGoNext={answered >= 1} nextLabel={t('Continue')} />
      </div>
    );
  }

  if (selectedRegions.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            {t('No symptom areas were selected yet. Please go back and choose where you have symptoms.')}
          </p>
          <button onClick={onBack} className="btn-secondary">{t('Go Back')}</button>
        </div>
        <StepNavigation onNext={onNext} onBack={onBack} canGoNext nextLabel={t('Continue')} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('Symptom Details')}</h2>
        <p className="section-subtitle">
          {t('A few quick questions about each problem. Where it hurts and where it travels comes from the body map you drew, so we will not ask that again.')}{' '}
          {t('Prefer to talk it through instead?')}{' '}
          <button type="button" onClick={() => setMode('conversation')} className="text-teal-600 hover:underline font-medium">{t('Switch')}</button>
        </p>
      </div>

      {problems.length > 1 && (
        <div className="card mb-4">
          <label className="form-label text-base">{t('Which problem bothers you the most?')}</label>
          <div className="flex flex-wrap gap-2">
            {problems.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setNested('hpiData.primaryProblem', p.id)}
                className={`chip ${primary === p.id ? 'chip-selected' : 'chip-unselected'}`}
              >
                {t(p.label)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {problems.map((p) => (
          <ProblemCard
            key={p.id}
            t={t}
            problem={p}
            single={problems.length === 1}
            isPrimary={problems.length > 1 && primary === p.id}
            value={hpi.problems?.[p.id] || {}}
            duration={data.chiefComplaint.duration}
            update={(field, v) => setNested(`hpiData.problems.${p.id}.${field}`, v)}
          />
        ))}
      </div>

      <SafetyCheck t={t} overall={overall} update={updateOverall} hasCervical={hasCervical} hasLumbar={hasLumbar} />

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext nextLabel={t('Continue')} />
    </div>
  );
}


// ===========================================================================
// One problem: when, how it started, the trend, how bad, what it feels like.
// The chief-complaint step already asked how long it has been going on, so a
// single problem does not ask again.
// ===========================================================================
function ProblemCard({ t, problem, value, update, single, isPrimary, duration }) {
  return (
    <div className={`card space-y-5 ${isPrimary ? 'ring-2 ring-teal-300' : ''}`}>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-navy-600">{t(problem.label)}</h3>
        {isPrimary && (
          <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">{t('Bothers me most')}</span>
        )}
      </div>
      {!(single && duration) && (
        <ChipRow t={t} label={t('When did this start?')} value={value.onset} onChange={(v) => update('onset', v)} options={ONSET_OPTIONS} />
      )}
      <ChipRow t={t} label={t('How did it start?')} value={value.onsetType} onChange={(v) => update('onsetType', v)} options={ONSET_TYPE_OPTIONS} />
      <ChipRow t={t} label={t('Over time, has this symptom been...')} value={value.progression} onChange={(v) => update('progression', v)} options={PROGRESSION_OPTIONS} />
      <PainScale label={t('How bad is it on a typical day? (0 to 10)')} value={value.severity == null ? '' : String(value.severity)} onChange={(v) => update('severity', v === '' ? '' : parseInt(v, 10))} />
      <MultiChip t={t} label={t('How would you describe it? (optional, tap all that apply)')} options={PAIN_QUALITIES} selected={value.quality || []} onChange={(v) => update('quality', v)} />
    </div>
  );
}


// ===========================================================================
// The questions that change management, asked once. The cervical myelopathy
// screens appear with a neck problem, the cauda equina and foot-drop screens
// with a back problem; numbness, tingling and weakness always.
// ===========================================================================
function SafetyCheck({ t, overall, update, hasCervical, hasLumbar }) {
  return (
    <div className="card mt-4 mb-4">
      <h4 className="text-base font-medium text-navy-600 mb-1">{t('Safety check')}</h4>
      <p className="text-sm text-gray-400 mb-4">{t('A few yes/no questions that matter for your care. Please answer each one.')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <YesNoQuestion t={t} label="Numbness anywhere?" value={overall.numbness} onChange={(v) => update('numbness', v)} />
        <YesNoQuestion t={t} label="Tingling or pins-and-needles?" value={overall.tingling} onChange={(v) => update('tingling', v)} />
        <YesNoQuestion t={t} label="Weakness in an arm or leg?" value={overall.weakness} onChange={(v) => update('weakness', v)} />
        <YesNoQuestion t={t} label="Any new trouble controlling your bladder or bowels?" value={overall.bowelBladder} onChange={(v) => update('bowelBladder', v)} />
        {hasLumbar && (
          <>
            <YesNoQuestion t={t} label="Numbness in the groin or inner thighs?" value={overall.saddleAnesthesia} onChange={(v) => update('saddleAnesthesia', v)} />
            <YesNoQuestion t={t} label="Foot slapping or catching on stairs?" sublabel="Foot drop or leg weakness" value={overall.footDrop} onChange={(v) => update('footDrop', v)} />
          </>
        )}
        {hasCervical && (
          <>
            <YesNoQuestion t={t} label="Trouble with buttons, writing or small objects?" value={overall.handDexterity} onChange={(v) => update('handDexterity', v)} />
            <YesNoQuestion t={t} label="Dropping things more than usual?" value={overall.droppingObjects} onChange={(v) => update('droppingObjects', v)} />
            <YesNoQuestion t={t} label="Unsteady on your feet?" value={overall.gaitChanges} onChange={(v) => update('gaitChanges', v)} />
            <YesNoQuestion t={t} label="Electric shock down your spine when you bend your neck?" value={overall.lhermittes} onChange={(v) => update('lhermittes', v)} />
          </>
        )}
      </div>
    </div>
  );
}


function ChipRow({ t, label, value, onChange, options }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button key={opt} onClick={() => onChange(opt)}
            className={`chip ${value === opt ? 'chip-selected' : 'chip-unselected'}`}>
            {t(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiChip({ t, label, options, selected, onChange }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isOn = selected.includes(opt);
          return (
            <button key={opt}
              onClick={() => onChange(isOn ? selected.filter((x) => x !== opt) : [...selected, opt])}
              className={`chip ${isOn ? 'chip-selected' : 'chip-unselected'}`}>
              {t(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function YesNoQuestion({ t, label, sublabel, value, onChange }) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <p className="text-sm font-medium text-gray-700 mb-1">{t(label)}</p>
      {sublabel && <p className="text-xs text-gray-400 mb-2">{t(sublabel)}</p>}
      <div className="flex gap-2">
        {['Yes', 'No'].map((opt) => (
          <button key={opt} onClick={() => onChange(opt === 'Yes')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              value === (opt === 'Yes')
                ? opt === 'Yes'
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}>
            {t(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}
