'use client';

import { useIntake } from '../../../lib/store';
import { useLang, makeT, COMMON } from '../../../lib/i18n';
import StepNavigation from '../../ui/StepNavigation';
import { TextArea } from '../../ui/Fields';

const LOCAL = {
  'A quick health check': { es: 'Una revisión rápida de salud', zh: '快速健康检查' },
  'Four questions, in case your child needs a cast, a procedure or medicine.': { es: 'Cuatro preguntas, por si su hijo o hija necesita un yeso, un procedimiento o un medicamento.', zh: '四个问题，以备孩子需要打石膏、做处理或用药。' },
  'Does your child take any medicine every day?': { es: '¿Su hijo o hija toma algún medicamento todos los días?', zh: '您的孩子每天服用任何药物吗？' },
  'Which medicines, and how much?': { es: '¿Qué medicamentos y en qué dosis?', zh: '哪些药物？剂量多少？' },
  'Is your child allergic to any medicine?': { es: '¿Su hijo o hija es alérgico a algún medicamento?', zh: '您的孩子对任何药物过敏吗？' },
  'Which medicines, and what happened?': { es: '¿A qué medicamentos y qué pasó?', zh: '对哪些药物过敏？出现了什么反应？' },
  'Does your child have any health conditions, or has your child had an operation before?': { es: '¿Su hijo o hija tiene alguna afección de salud o ha tenido alguna operación antes?', zh: '您的孩子有任何健康问题，或者以前做过手术吗？' },
  'Which conditions or operations?': { es: '¿Qué afecciones u operaciones?', zh: '哪些疾病或手术？' },
  'Has your child, or anyone in the family, had a problem with anesthesia or sedation?': { es: '¿Su hijo o hija, o alguien de la familia, ha tenido algún problema con la anestesia o la sedación?', zh: '您的孩子或家人是否曾在麻醉或镇静时出现问题？' },
  'What happened?': { es: '¿Qué pasó?', zh: '发生了什么？' },
  'No': { es: 'No', zh: '没有' },
  'Yes': { es: 'Sí', zh: '有' },
  'Not sure': { es: 'No estoy seguro', zh: '不确定' },
  'One per line': { es: 'Uno por línea', zh: '每行一项' },
};

const lines = (text) => String(text || '').split(/\r?\n|,|;/).map((x) => x.trim()).filter(Boolean);

/**
 * The fracture form's health check: four yes/no questions in place of the
 * full history steps. "Yes" opens a box for the details. The answers are
 * written into the usual medication, allergy and condition lists, so the
 * note and the office see them where they always do.
 */
export default function FractureHealth({ onNext, onBack }) {
  const { data, setSection, setNested } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const h = data.pedsOrtho?.health || {};

  const save = (next) => {
    const merged = { ...h, ...next };
    setNested('pedsOrtho.health', merged);
    setSection('medications', {
      ...data.medications,
      noMedications: merged.meds === 'No',
      current: merged.meds === 'Yes' ? lines(merged.medsText).map((name) => ({ name, dose: '', frequency: '', reason: '', status: 'current' })) : [],
    });
    setSection('allergies', {
      ...data.allergies,
      nkda: merged.allergies === 'No',
      entries: merged.allergies === 'Yes' ? lines(merged.allergiesText).map((allergen) => ({ allergen, reaction: '', severity: '', type: 'Medication' })) : [],
    });
    setSection('pastMedicalHistory', {
      ...data.pastMedicalHistory,
      noConditions: merged.conditions === 'No',
      conditions: merged.conditions === 'Yes' ? lines(merged.conditionsText).map((name) => ({ name, yearDiagnosed: '', details: '' })) : [],
    });
  };

  const QUESTIONS = [
    { key: 'meds', label: 'Does your child take any medicine every day?', detail: 'Which medicines, and how much?' },
    { key: 'allergies', label: 'Is your child allergic to any medicine?', detail: 'Which medicines, and what happened?' },
    { key: 'conditions', label: 'Does your child have any health conditions, or has your child had an operation before?', detail: 'Which conditions or operations?' },
    { key: 'anesthesia', label: 'Has your child, or anyone in the family, had a problem with anesthesia or sedation?', detail: 'What happened?', unsure: true },
  ];

  const answered = QUESTIONS.every((q) => h[q.key] && (h[q.key] !== 'Yes' || String(h[`${q.key}Text`] || '').trim()));

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('A quick health check')}</h2>
        <p className="section-subtitle">{t('Four questions, in case your child needs a cast, a procedure or medicine.')}</p>
      </div>
      <div className="space-y-4">
        {QUESTIONS.map((q) => (
          <div key={q.key} className="card space-y-3">
            <p className="form-label">{t(q.label)}</p>
            <div className="flex flex-wrap gap-2">
              {['No', 'Yes', ...(q.unsure ? ['Not sure'] : [])].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={h[q.key] === opt}
                  onClick={() => save({ [q.key]: opt })}
                  className={`px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${h[q.key] === opt ? 'border-teal-400 bg-teal-50 text-navy-600' : 'border-gray-200 bg-white text-gray-600 hover:border-teal-200'}`}
                >
                  {t(opt)}
                </button>
              ))}
            </div>
            {h[q.key] === 'Yes' && (
              <TextArea
                label={t(q.detail)}
                value={h[`${q.key}Text`] || ''}
                onChange={(x) => save({ [`${q.key}Text`]: x })}
                rows={2}
                hint={q.key === 'anesthesia' ? undefined : t('One per line')}
              />
            )}
          </div>
        ))}
      </div>
      <StepNavigation onNext={onNext} onBack={onBack} canGoNext={answered} />
    </div>
  );
}
