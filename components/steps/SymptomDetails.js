'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import { PAIN_QUALITIES, SYMPTOM_REGIONS } from '../../lib/constants';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';

// Display-only translations. Stored values stay canonical English.
const LOCAL = {
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
  const setPrimary = (regionId) => setNested('hpiData.primaryRegion', regionId);

  // Which body areas are involved (drives conditional screening sections)
  const areas = new Set(
    selectedRegions
      .map((id) => SYMPTOM_REGIONS.find((r) => r.id === id)?.area)
      .filter(Boolean)
  );
  const hasCervical = areas.has('cervical');
  const hasLumbar = areas.has('lumbar');

  if (selectedRegions.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            {t('No symptom areas were selected yet. Please go back and choose where you have symptoms.')}
          </p>
          <button onClick={onBack} className="btn-secondary">{t('Go Back')}</button>
        </div>
        <StepNavigation onNext={onNext} onBack={onBack} canGoNext nextLabel={t('Continue to Prior Treatments')} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('Symptom Details')}</h2>
        <p className="section-subtitle">
          {t("Let's go through the symptoms you told us about. You can fill this out for all of your symptoms on this one page — answer what you can and skip anything that doesn't apply.")}
        </p>
      </div>

      {/* Which bothers you most */}
      {selectedRegions.length > 1 && (
        <div className="card mb-4">
          <label className="form-label text-base">{t('Which symptom bothers you the most?')}</label>
          <p className="text-sm text-gray-400 mb-3">{t('This helps your surgeon focus on what matters most to you.')}</p>
          <div className="flex flex-wrap gap-2">
            {selectedRegions.map((id) => {
              const region = SYMPTOM_REGIONS.find((r) => r.id === id);
              return (
                <button
                  key={id}
                  onClick={() => setPrimary(id)}
                  className={`chip ${hpi.primaryRegion === id ? 'chip-selected' : 'chip-unselected'}`}
                >
                  {region?.label ? t(region.label) : id}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-symptom cards */}
      <div className="space-y-4">
        {selectedRegions.map((id, idx) => {
          const region = SYMPTOM_REGIONS.find((r) => r.id === id);
          return (
            <SymptomCard
              key={id}
              t={t}
              index={idx}
              total={selectedRegions.length}
              region={region || { id, label: id }}
              isPrimary={hpi.primaryRegion === id}
              regionData={hpi.symptoms?.[id] || {}}
              update={(field, value) => setNested(`hpiData.symptoms.${id}.${field}`, value)}
            />
          );
        })}
      </div>

      {/* ================= Shared questions (asked once) ================= */}
      <div className="mt-6 mb-2">
        <h3 className="text-lg font-semibold text-navy-600">{t('A Few Questions About Your Symptoms Overall')}</h3>
        <p className="text-sm text-gray-400">{t('These apply to all of the symptoms above — you only need to answer them once.')}</p>
      </div>

      {/* Aggravating / relieving */}
      <div className="card mb-4">
        <MultiChip
          t={t}
          label={t('What makes your symptoms worse? (select all that apply)')}
          options={['Sitting', 'Standing', 'Walking', 'Bending forward', 'Bending backward',
            'Twisting', 'Lifting', 'Coughing/sneezing', 'Lying down', 'Getting up from a chair',
            'Driving', 'Exercise', 'Stairs']}
          selected={overall.aggravatingFactors || []}
          onChange={(v) => updateOverall('aggravatingFactors', v)}
        />
        <div className="mt-6">
          <MultiChip
            t={t}
            label={t('What makes your symptoms better? (select all that apply)')}
            options={['Rest', 'Lying down', 'Sitting', 'Leaning forward', 'Walking', 'Ice', 'Heat',
              'Medication', 'Stretching', 'Position changes', 'Nothing helps']}
            selected={overall.relievingFactors || []}
            onChange={(v) => updateOverall('relievingFactors', v)}
          />
        </div>
      </div>

      {/* Associated symptoms */}
      <div className="card mb-4">
        <h4 className="text-base font-medium text-navy-600 mb-4">{t('Associated Symptoms')}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <YesNoQuestion t={t} label="Numbness?" sublabel="Loss of sensation or feeling"
            value={overall.numbness} onChange={(v) => updateOverall('numbness', v)} />
          <YesNoQuestion t={t} label="Tingling or pins-and-needles?"
            value={overall.tingling} onChange={(v) => updateOverall('tingling', v)} />
          <YesNoQuestion t={t} label="Weakness?" sublabel="Difficulty moving or muscle feels weak"
            value={overall.weakness} onChange={(v) => updateOverall('weakness', v)} />
          <YesNoQuestion t={t} label="Does it disrupt your sleep?"
            value={overall.sleepDisruption} onChange={(v) => updateOverall('sleepDisruption', v)} />
        </div>
      </div>

      {/* Cervical screening (shown once if any neck/arm/balance/hand region) */}
      {hasCervical && (
        <div className="card mb-4">
          <h4 className="text-base font-medium text-navy-600 mb-1">{t('Neck & Upper Body')}</h4>
          <p className="text-sm text-gray-400 mb-4">{t('A few specific questions related to your neck/arm symptoms.')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <YesNoQuestion t={t} label="Trouble with buttons, writing, or small objects?" sublabel="Fine motor difficulty"
              value={overall.handDexterity} onChange={(v) => updateOverall('handDexterity', v)} />
            <YesNoQuestion t={t} label="Dropping objects more than usual?"
              value={overall.droppingObjects} onChange={(v) => updateOverall('droppingObjects', v)} />
            <YesNoQuestion t={t} label="Balance or coordination problems?"
              value={overall.gaitChanges} onChange={(v) => updateOverall('gaitChanges', v)} />
            <YesNoQuestion t={t} label="Electric shock feeling with neck movement?" sublabel="Sensation down your spine when bending the neck"
              value={overall.lhermittes} onChange={(v) => updateOverall('lhermittes', v)} />
          </div>
        </div>
      )}

      {/* Lumbar screening (shown once if any low-back/leg/walking region) */}
      {hasLumbar && (
        <div className="card mb-4">
          <h4 className="text-base font-medium text-navy-600 mb-1">{t('Lower Body')}</h4>
          <p className="text-sm text-gray-400 mb-4">{t('A few specific questions related to your back/leg symptoms.')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <YesNoQuestion t={t} label="Pain below the knee?"
              value={overall.painBelowKnee} onChange={(v) => updateOverall('painBelowKnee', v)} />
            <YesNoQuestion t={t} label="Symptoms improve when you sit or lean forward?"
              value={overall.reliefLeaningForward} onChange={(v) => updateOverall('reliefLeaningForward', v)} />
            <YesNoQuestion t={t} label="Difficulty with stairs or foot feels floppy?" sublabel="Foot drop or leg weakness"
              value={overall.footDrop} onChange={(v) => updateOverall('footDrop', v)} />
            <YesNoQuestion t={t} label="Changes in bowel or bladder control?" sublabel="New incontinence or difficulty with urination"
              value={overall.bowelBladder} onChange={(v) => updateOverall('bowelBladder', v)} />
            <YesNoQuestion t={t} label="Numbness in the groin or inner thigh area?"
              value={overall.saddleAnesthesia} onChange={(v) => updateOverall('saddleAnesthesia', v)} />
          </div>
          <div className="mt-4">
            <label className="form-label">{t('How far can you walk before needing to stop?')}</label>
            <div className="flex flex-wrap gap-2">
              {['Unlimited', 'More than 30 minutes', '15-30 minutes', '5-15 minutes',
                'Less than 5 minutes', 'Less than 1 block', 'Need a wheelchair/scooter'].map((opt) => (
                <button key={opt} onClick={() => updateOverall('walkingTolerance', opt)}
                  className={`chip ${overall.walkingTolerance === opt ? 'chip-selected' : 'chip-unselected'}`}>
                  {t(opt)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Functional impact (once) */}
      <div className="card mb-4">
        <h4 className="text-base font-medium text-navy-600 mb-4">{t('Impact on Daily Life')}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField t={t} label="Impact on work" value={overall.workImpact} onChange={(v) => updateOverall('workImpact', v)}
            options={['No impact', 'Mild — can still work', 'Moderate — work is difficult', 'Severe — missing work', 'Unable to work', 'Retired/Not working']} />
          <SelectField t={t} label="Impact on exercise/activities" value={overall.exerciseImpact} onChange={(v) => updateOverall('exerciseImpact', v)}
            options={['No impact', 'Mild limitation', 'Moderate limitation', 'Severe limitation', 'Unable to exercise']} />
          <SelectField t={t} label="How long can you sit comfortably?" value={overall.sittingTolerance} onChange={(v) => updateOverall('sittingTolerance', v)}
            options={['No limitation', 'More than 1 hour', '30-60 minutes', '15-30 minutes', 'Less than 15 minutes']} />
          <SelectField t={t} label="How long can you stand comfortably?" value={overall.standingTolerance} onChange={(v) => updateOverall('standingTolerance', v)}
            options={['No limitation', 'More than 30 minutes', '15-30 minutes', '5-15 minutes', 'Less than 5 minutes']} />
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext
        nextLabel={t('Continue to Prior Treatments')}
      />
    </div>
  );
}


// ===========================================================================
// Per-symptom card — compact, only the fields that vary per symptom
// ===========================================================================
function SymptomCard({ t, region, regionData, update, isPrimary, index, total }) {
  const [open, setOpen] = useState(index === 0 || total <= 3);

  return (
    <div className={`card ${isPrimary ? 'ring-2 ring-teal-300' : ''}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg font-semibold text-navy-600">{t(region.label)}</span>
          {isPrimary && (
            <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              {t('Bothers me most')}
            </span>
          )}
        </span>
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="space-y-5 mt-5">
          {/* Onset */}
          <div>
            <label className="form-label">{t('When did this start?')}</label>
            <input type="text" value={regionData.onset || ''}
              onChange={(e) => update('onset', e.target.value)}
              placeholder={t('e.g., About 6 months ago, After a fall in March 2024')} />
          </div>

          <ChipRow t={t} label={t('How did it start?')} value={regionData.onsetType} onChange={(v) => update('onsetType', v)}
            options={['Gradually over time', 'Suddenly', 'After an injury', 'After surgery', "I'm not sure"]} />

          <ChipRow t={t} label={t('Over time, has this symptom been...')} value={regionData.progression} onChange={(v) => update('progression', v)}
            options={['Getting worse', 'Staying about the same', 'Getting better', 'Comes and goes']} />

          <ChipRow t={t} label={t('Which side?')} value={regionData.side} onChange={(v) => update('side', v)}
            options={['Right', 'Left', 'Both sides', 'Midline/center', 'Varies']} />

          {/* Severity */}
          <div>
            <label className="form-label">
              {t('How severe is it? (0 = none, 10 = worst imaginable):')}{' '}
              <strong className="text-teal-600">{regionData.severity ?? 5}</strong>
            </label>
            <input type="range" min="0" max="10" value={regionData.severity ?? 5}
              onChange={(e) => update('severity', parseInt(e.target.value))} />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{t('0 — None')}</span><span>{t('5 — Moderate')}</span><span>{t('10 — Worst')}</span>
            </div>
          </div>

          <MultiChip t={t} label={t('How would you describe it? (select all that apply)')}
            options={PAIN_QUALITIES} selected={regionData.quality || []}
            onChange={(v) => update('quality', v)} />

          {/* Radiation */}
          <div>
            <label className="form-label">{t('Does it travel or spread to other areas?')}</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {['No', 'Yes'].map((opt) => (
                <button key={opt} onClick={() => update('radiation', opt === 'Yes')}
                  className={`chip ${regionData.radiation === (opt === 'Yes') ? 'chip-selected' : 'chip-unselected'}`}>
                  {t(opt)}
                </button>
              ))}
            </div>
            {regionData.radiation && (
              <input type="text" value={regionData.radiationTo || ''}
                onChange={(e) => update('radiationTo', e.target.value)}
                placeholder={t('Where does it travel to? e.g., Down my left leg to the foot')} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ===========================================================================
// Small reusable field helpers
// ===========================================================================
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

function SelectField({ t, label, value, onChange, options }) {
  return (
    <div>
      <label className="form-label">{t(label)}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t('Select...')}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{t(opt)}</option>
        ))}
      </select>
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
