'use client';

import { useIntake, useService } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';

// The old adult spine site. The ortho service points a neck-or-back tap at
// it, as the ortho intake did; once the cutover (docs/UNIFIED-INTAKE.md)
// redirects that address here with the spine service pre-set, the link still
// lands the patient on the right questions.
const SPINE_INTAKE_URL = 'https://intake.aaronweymd.com/';

const LOCAL = {
  'Choose every area where you have pain, numbness, tingling or weakness. The next step asks what it feels like.': {
    es: 'Elija cada zona donde tenga dolor, entumecimiento, hormigueo o debilidad. El siguiente paso pregunta cómo se siente.',
    zh: '请选择所有出现疼痛、麻木、刺痛或无力的部位。下一步会询问具体感受。',
  },
  'What Brings You In Today?': {
    es: '¿Qué lo trae hoy?',
    zh: '今天您为什么来就诊？',
  },
  'Tell us about your main concern. This helps us focus on what matters most to you.': {
    es: 'Cuéntenos su principal preocupación. Esto nos ayuda a centrarnos en lo que más le importa.',
    zh: '请告诉我们您主要的困扰。这有助于我们关注对您最重要的问题。',
  },
  'In your own words, what is the main reason for your visit? *': {
    es: 'En sus propias palabras, ¿cuál es el motivo principal de su visita? *',
    zh: '请用您自己的话说明，您本次就诊的主要原因是什么？*',
  },
  'For example: "My low back hurts and the pain goes down my left leg" or "I was told I have a curved spine"': {
    es: 'Por ejemplo: "Me duele la parte baja de la espalda y el dolor baja por mi pierna izquierda" o "Me dijeron que tengo la columna curvada"',
    zh: '例如："我的下背部疼痛，疼痛蔓延到左腿" 或 "有人告诉我我的脊柱弯曲"',
  },
  'For example: "I twisted my knee playing soccer and it keeps giving way" or "My right shoulder aches at night and I cannot lift it overhead" or "I broke my wrist and want it checked"': {
    es: 'Por ejemplo: "Me torcí la rodilla jugando fútbol y se me dobla" o "Me duele el hombro derecho por la noche y no puedo levantar el brazo" o "Me fracturé la muñeca y quiero que la revisen"',
    zh: '例如："我踢足球时扭伤了膝盖，膝盖总是打软" 或 "我的右肩夜里疼，手臂抬不过头" 或 "我手腕骨折了，想检查一下"',
  },
  'Describe your main concern...': {
    es: 'Describa su principal preocupación...',
    zh: '请描述您主要的困扰……',
  },
  'How long have you been experiencing these symptoms?': {
    es: '¿Cuánto tiempo lleva experimentando estos síntomas?',
    zh: '您出现这些症状有多长时间了？',
  },
  'Less than 1 week': { es: 'Menos de 1 semana', zh: '不到 1 周' },
  '1-4 weeks': { es: '1-4 semanas', zh: '1-4 周' },
  '1-3 months': { es: '1-3 meses', zh: '1-3 个月' },
  '3-6 months': { es: '3-6 meses', zh: '3-6 个月' },
  '6-12 months': { es: '6-12 meses', zh: '6-12 个月' },
  'More than 1 year': { es: 'Más de 1 año', zh: '超过 1 年' },
  'More than 2 years': { es: 'Más de 2 años', zh: '超过 2 年' },
  'More than 5 years': { es: 'Más de 5 años', zh: '超过 5 年' },
  "I'm not sure": { es: 'No estoy seguro', zh: '我不确定' },
  'Which areas are affected? Select all that apply. *': {
    es: '¿Qué áreas están afectadas? Seleccione todas las que correspondan. *',
    zh: '哪些部位受到影响？请选择所有适用项。*',
  },
  'Choose every area where you have pain, numbness, tingling, weakness, or other symptoms.': {
    es: 'Elija cada área donde tenga dolor, entumecimiento, hormigueo, debilidad u otros síntomas.',
    zh: '请选择您有疼痛、麻木、刺痛、无力或其他症状的每个部位。',
  },
  'Which joint or area is affected? Tap the side. *': {
    es: '¿Qué articulación o zona está afectada? Toque el lado. *',
    zh: '哪个关节或部位受到影响？请点选左右侧。*',
  },
  'Choose every joint where you have pain, swelling, stiffness, numbness or weakness. The next step asks what it feels like.': {
    es: 'Elija cada articulación donde tenga dolor, hinchazón, rigidez, entumecimiento o debilidad. El siguiente paso pregunta cómo se siente.',
    zh: '请选择所有出现疼痛、肿胀、僵硬、麻木或无力的关节。下一步会询问具体感受。',
  },
  'Spine & Back': { es: 'Columna y espalda', zh: '脊柱与背部' },
  'Arms & Legs': { es: 'Brazos y piernas', zh: '手臂与腿部' },
  'Other Symptoms': { es: 'Otros síntomas', zh: '其他症状' },
  'Joints': { es: 'Articulaciones', zh: '关节' },
  'Left': { es: 'Izquierdo', zh: '左' },
  'Right': { es: 'Derecho', zh: '右' },
  'What else describes it?': { es: '¿Qué más lo describe?', zh: '还有哪些描述符合？' },
  'Selected:': { es: 'Seleccionado:', zh: '已选择：' },
  'Neck and back problems have their own intake form.': {
    es: 'Los problemas de cuello y espalda tienen su propio formulario.',
    zh: '颈部和背部问题有单独的问诊表。',
  },
  'If the neck or back is your main problem, please use the spine intake instead.': {
    es: 'Si el cuello o la espalda es su problema principal, use el formulario de columna.',
    zh: '如果颈部或背部是您的主要问题，请改用脊柱问诊表。',
  },
  'Open the spine intake': { es: 'Abrir el formulario de columna', zh: '打开脊柱问诊表' },
  'If a joint is the main problem and the back pain is on the side, carry on here.': {
    es: 'Si una articulación es el problema principal y el dolor de espalda es secundario, continúe aquí.',
    zh: '如果关节是主要问题、背痛只是附带的，请在此继续。',
  },
  'I have had prior spine surgery': {
    es: 'He tenido una cirugía de columna previa',
    zh: '我曾接受过脊柱手术',
  },
  'I have had surgery on this bone or joint before': {
    es: 'Ya me han operado este hueso o articulación',
    zh: '我以前做过这个骨骼或关节的手术',
  },
  "We'll ask you more details about this later in the form.": {
    es: 'Le pediremos más detalles sobre esto más adelante en el formulario.',
    zh: '我们将在表格后面询问您有关此事的更多详情。',
  },
  'What bothers you the most right now?': {
    es: '¿Qué es lo que más le molesta en este momento?',
    zh: '目前最困扰您的是什么？',
  },
  'If you have multiple symptoms, which one impacts your daily life the most?': {
    es: 'Si tiene varios síntomas, ¿cuál afecta más su vida diaria?',
    zh: '如果您有多种症状，哪一种对您的日常生活影响最大？',
  },
  'e.g., The pain in my right leg makes it hard to walk more than a block...': {
    es: 'p. ej., el dolor en mi pierna derecha me dificulta caminar más de una cuadra...',
    zh: '例如：我右腿的疼痛让我很难走超过一个街区……',
  },
  'e.g., My knee gives way on stairs, so I avoid them...': {
    es: 'p. ej., la rodilla se me dobla en las escaleras, así que las evito...',
    zh: '例如：我的膝盖上下楼梯时会打软，所以我尽量不走楼梯……',
  },
  'Continue to Symptom Details': {
    es: 'Continuar a los detalles de los síntomas',
    zh: '继续填写症状详情',
  },
};

/**
 * Chief complaint. What differs by service comes from the service's
 * constants module: the regions, how they are laid out (JOINT_ROWS is the
 * left/right joint grid of the ortho service and empty for the spine;
 * REGION_GROUPS the titled lists under it), and the wording that names the
 * specialty (CHIEF_COMPLAINT_TEXT).
 */
export default function ChiefComplaint({ onNext, onBack }) {
  const { data, setField } = useIntake();
  const svc = useService();
  const { SYMPTOM_REGIONS, JOINT_ROWS, REGION_GROUPS, CHIEF_COMPLAINT_TEXT: text } = svc.constants;
  const cc = data.chiefComplaint;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

  const updateField = (field, value) => {
    setField('chiefComplaint', field, value);
  };

  const selected = cc.symptomRegions || [];
  const toggleRegion = (regionId) => {
    const updated = selected.includes(regionId)
      ? selected.filter((r) => r !== regionId)
      : [...selected, regionId];
    updateField('symptomRegions', updated);
  };

  const isValid = cc.mainReason && selected.length > 0;

  // The ortho service accepts a neck-or-back tap but points it at the spine
  // questions; a service without that region (the spine) never shows the row.
  const neckBack = SYMPTOM_REGIONS.find((r) => r.id === 'neck-back');
  const spineOnly = !!neckBack && selected.includes('neck-back') && !selected.some((r) => /^(right|left)-/.test(r));

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('What Brings You In Today?')}</h2>
        <p className="section-subtitle">
          {t('Tell us about your main concern. This helps us focus on what matters most to you.')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Main reason */}
        <div className="card">
          <label className="form-label text-base">
            {t('In your own words, what is the main reason for your visit? *')}
          </label>
          <p className="text-sm text-gray-400 mb-3">
            {t(text.example)}
          </p>
          <textarea
            value={cc.mainReason}
            onChange={(e) => updateField('mainReason', e.target.value)}
            placeholder={t('Describe your main concern...')}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 resize-none"
          />
        </div>

        {/* Duration */}
        <div className="card">
          <label className="form-label text-base">
            {t('How long have you been experiencing these symptoms?')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {[
              'Less than 1 week',
              '1-4 weeks',
              '1-3 months',
              '3-6 months',
              '6-12 months',
              'More than 1 year',
              'More than 2 years',
              'More than 5 years',
              "I'm not sure",
            ].map((option) => (
              <button
                key={option}
                onClick={() => updateField('duration', option)}
                className={`p-3 rounded-xl border text-sm text-left transition-all ${
                  cc.duration === option
                    ? 'border-teal-400 bg-teal-50 text-teal-700 font-medium'
                    : 'border-gray-200 hover:border-teal-200 hover:bg-teal-50/30 text-gray-600'
                }`}
              >
                {t(option)}
              </button>
            ))}
          </div>
        </div>

        {/* Symptom regions */}
        <div className="card">
          <label className="form-label text-base">
            {t(text.regionsLabel)}
          </label>
          <p className="text-sm text-gray-400 mb-4">
            {t(text.regionsHint)}
          </p>

          <div className="space-y-4">
            {/* Joints: a row per joint, left and right (the ortho service) */}
            {JOINT_ROWS.length > 0 && (
              <div>
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center mb-1 px-1">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{t('Joints')}</h4>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 text-center">{t('Left')}</span>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 text-center">{t('Right')}</span>
                </div>
                <div className="space-y-2">
                  {JOINT_ROWS.map((row) => (
                    <div key={row.joint} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                      <span className="text-sm font-medium text-gray-700 px-1">{t(row.joint)}</span>
                      <SideButton label={t('Left')} selected={selected.includes(row.left)} onClick={() => toggleRegion(row.left)} />
                      <SideButton label={t('Right')} selected={selected.includes(row.right)} onClick={() => toggleRegion(row.right)} />
                    </div>
                  ))}
                  {neckBack && (
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center pt-1">
                      <span className="text-sm font-medium text-gray-700 px-1">{t(neckBack.label)}</span>
                      <SideButton label={t(neckBack.label)} selected={selected.includes(neckBack.id)} onClick={() => toggleRegion(neckBack.id)} wide />
                    </div>
                  )}
                </div>
              </div>
            )}

            {neckBack && selected.includes(neckBack.id) && (
              <div className={`rounded-xl px-4 py-3 text-sm ${spineOnly ? 'bg-amber-50 border border-amber-300 text-amber-900' : 'bg-gray-50 border border-gray-200 text-gray-600'}`}>
                <p className="font-medium">{t('Neck and back problems have their own intake form.')}</p>
                <p className="mt-1">
                  {t('If the neck or back is your main problem, please use the spine intake instead.')}{' '}
                  <a href={SPINE_INTAKE_URL} className="font-semibold underline text-teal-600 hover:text-teal-700">{t('Open the spine intake')}</a>
                </p>
                <p className="mt-1 text-xs opacity-80">{t('If a joint is the main problem and the back pain is on the side, carry on here.')}</p>
              </div>
            )}

            {/* Titled region groups: the spine's areas; the ortho qualities and context */}
            {REGION_GROUPS.map((group) => (
              <div key={group.id}>
                <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">{t(group.label)}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SYMPTOM_REGIONS.filter((r) => group.ids.includes(r.id)).map((region) => (
                    <RegionButton
                      key={region.id}
                      region={region}
                      label={t(region.label)}
                      selected={selected.includes(region.id)}
                      onClick={() => toggleRegion(region.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selected.length > 0 && (
            <div className="mt-4 p-3 bg-teal-50 rounded-xl">
              <p className="text-sm text-teal-700">
                <strong>{t('Selected:')}</strong> {selected.map((id) => {
                  const label = SYMPTOM_REGIONS.find((r) => r.id === id)?.label;
                  return label ? t(label) : null;
                }).filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Prior surgery on the spine, or on this bone or joint. One field for
            every service: Practice Hub stores it under this name. */}
        <div className="card">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={cc.hasPriorSpineSurgery}
              onChange={(e) => updateField('hasPriorSpineSurgery', e.target.checked)}
              className="mt-1"
            />
            <div>
              <span className="text-base font-medium text-gray-700">
                {t(text.priorSurgery)}
              </span>
              <p className="text-sm text-gray-400 mt-1">
                {t("We'll ask you more details about this later in the form.")}
              </p>
            </div>
          </label>
        </div>

        {/* Primary concern */}
        <div className="card">
          <label className="form-label text-base">
            {t('What bothers you the most right now?')}
          </label>
          <p className="text-sm text-gray-400 mb-3">
            {t('If you have multiple symptoms, which one impacts your daily life the most?')}
          </p>
          <textarea
            value={cc.primaryConcern}
            onChange={(e) => updateField('primaryConcern', e.target.value)}
            placeholder={t(text.concernPlaceholder)}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 resize-none"
          />
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={isValid}
        nextLabel={t('Continue to Symptom Details')}
      />
    </div>
  );
}


function SideButton({ label, selected, onClick, wide }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`region-btn flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium ${wide ? 'w-[12.5rem]' : 'w-24'} ${
        selected ? 'selected' : 'border-gray-200 text-gray-600'
      }`}
    >
      <span className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
        selected ? 'border-teal-400 bg-teal-400' : 'border-gray-300'
      }`}>
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {wide ? label : null}
      {!wide && <span className="sr-only">{label}</span>}
    </button>
  );
}

function RegionButton({ region, label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`region-btn flex items-center gap-3 p-3 rounded-xl border text-left ${
        selected ? 'selected' : 'border-gray-200 text-gray-600'
      }`}
    >
      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
        selected ? 'border-teal-400 bg-teal-400' : 'border-gray-300'
      }`}>
        {selected && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-sm font-medium">{label ?? region.label}</span>
    </button>
  );
}
