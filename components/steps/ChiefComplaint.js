'use client';

import { useIntake } from '../../lib/store';
import { SYMPTOM_REGIONS } from '../../lib/constants';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';

const LOCAL = {
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
  'Spine & Back': { es: 'Columna y espalda', zh: '脊柱与背部' },
  'Arms & Legs': { es: 'Brazos y piernas', zh: '手臂与腿部' },
  'Other Symptoms': { es: 'Otros síntomas', zh: '其他症状' },
  'Selected:': { es: 'Seleccionado:', zh: '已选择：' },
  'I have had prior spine surgery': {
    es: 'He tenido una cirugía de columna previa',
    zh: '我曾接受过脊柱手术',
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
  'Continue to Symptom Details': {
    es: 'Continuar a los detalles de los síntomas',
    zh: '继续填写症状详情',
  },
};

export default function ChiefComplaint({ onNext, onBack }) {
  const { data, setField, setSection } = useIntake();
  const cc = data.chiefComplaint;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

  const updateField = (field, value) => {
    setField('chiefComplaint', field, value);
  };

  const toggleRegion = (regionId) => {
    const current = cc.symptomRegions || [];
    const updated = current.includes(regionId)
      ? current.filter((r) => r !== regionId)
      : [...current, regionId];
    updateField('symptomRegions', updated);
  };

  const isValid = cc.mainReason && cc.symptomRegions.length > 0;

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
            {t('For example: "My low back hurts and the pain goes down my left leg" or "I was told I have a curved spine"')}
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
            {t('Which areas are affected? Select all that apply. *')}
          </label>
          <p className="text-sm text-gray-400 mb-4">
            {t('Choose every area where you have pain, numbness, tingling, weakness, or other symptoms.')}
          </p>

          {/* Visual body region groups */}
          <div className="space-y-4">
            {/* Spine regions */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">{t('Spine & Back')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SYMPTOM_REGIONS.filter(r => ['neck', 'upper-back', 'low-back'].includes(r.id)).map((region) => (
                  <RegionButton
                    key={region.id}
                    region={region}
                    label={t(region.label)}
                    selected={cc.symptomRegions.includes(region.id)}
                    onClick={() => toggleRegion(region.id)}
                  />
                ))}
              </div>
            </div>

            {/* Arm/Leg regions */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">{t('Arms & Legs')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SYMPTOM_REGIONS.filter(r => ['right-arm', 'left-arm', 'right-leg', 'left-leg'].includes(r.id)).map((region) => (
                  <RegionButton
                    key={region.id}
                    region={region}
                    label={t(region.label)}
                    selected={cc.symptomRegions.includes(region.id)}
                    onClick={() => toggleRegion(region.id)}
                  />
                ))}
              </div>
            </div>

            {/* Neurologic symptoms */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">{t('Other Symptoms')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SYMPTOM_REGIONS.filter(r =>
                  ['numbness-tingling', 'weakness', 'balance', 'hand-clumsiness', 'walking-difficulty',
                   'posture-deformity', 'prior-surgery-pain', 'trauma'].includes(r.id)
                ).map((region) => (
                  <RegionButton
                    key={region.id}
                    region={region}
                    label={t(region.label)}
                    selected={cc.symptomRegions.includes(region.id)}
                    onClick={() => toggleRegion(region.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {cc.symptomRegions.length > 0 && (
            <div className="mt-4 p-3 bg-teal-50 rounded-xl">
              <p className="text-sm text-teal-700">
                <strong>{t('Selected:')}</strong> {cc.symptomRegions.map(id => {
                  const label = SYMPTOM_REGIONS.find(r => r.id === id)?.label;
                  return label ? t(label) : null;
                }).filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Prior spine surgery flag */}
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
                {t('I have had prior spine surgery')}
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
            placeholder={t('e.g., The pain in my right leg makes it hard to walk more than a block...')}
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
