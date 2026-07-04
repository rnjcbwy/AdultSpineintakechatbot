'use client';

import { useState, useMemo } from 'react';
import { useIntake } from '../../lib/store';
import { COMMON_MEDICATIONS, ANTICOAGULANTS } from '../../lib/constants';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';

const LOCAL = {
  'Medications': { es: 'Medicamentos', zh: '药物' },
  'List all medications you currently take, including over-the-counter medications and supplements.': {
    es: 'Enumere todos los medicamentos que toma actualmente, incluidos los medicamentos de venta libre y los suplementos.',
    zh: '请列出您目前服用的所有药物，包括非处方药和补充剂。',
  },
  'Blood Thinner / Antiplatelet Detected': {
    es: 'Se detectó anticoagulante / antiagregante plaquetario',
    zh: '检测到血液稀释剂 / 抗血小板药物',
  },
  "You've listed: {meds}. Your surgeon will need to discuss timing of these medications before any procedure.": {
    es: 'Ha indicado: {meds}. Su cirujano deberá analizar el momento de tomar estos medicamentos antes de cualquier procedimiento.',
    zh: '您已列出：{meds}。在进行任何手术前，您的外科医生需要讨论这些药物的服用时间。',
  },
  "I don't take any medications": {
    es: 'No tomo ningún medicamento',
    zh: '我不服用任何药物',
  },
  'Your Medications ({count})': {
    es: 'Sus medicamentos ({count})',
    zh: '您的药物（{count}）',
  },
  'Blood thinner': { es: 'Anticoagulante', zh: '血液稀释剂' },
  'Add Medication': { es: 'Agregar medicamento', zh: '添加药物' },
  'Medication name *': { es: 'Nombre del medicamento *', zh: '药物名称 *' },
  'Start typing medication name...': {
    es: 'Comience a escribir el nombre del medicamento...',
    zh: '开始输入药物名称...',
  },
  'Dose (if known)': { es: 'Dosis (si se conoce)', zh: '剂量（如果知道）' },
  'e.g., 500mg': { es: 'p. ej., 500 mg', zh: '例如，500 毫克' },
  'Frequency': { es: 'Frecuencia', zh: '频率' },
  'Once daily': { es: 'Una vez al día', zh: '每天一次' },
  'Twice daily': { es: 'Dos veces al día', zh: '每天两次' },
  'Three times daily': { es: 'Tres veces al día', zh: '每天三次' },
  'As needed': { es: 'Según sea necesario', zh: '按需服用' },
  'Weekly': { es: 'Semanalmente', zh: '每周' },
  'Other': { es: 'Otro', zh: '其他' },
  'Reason (if known)': { es: 'Motivo (si se conoce)', zh: '原因（如果知道）' },
  'e.g., Back pain': { es: 'p. ej., Dolor de espalda', zh: '例如，背部疼痛' },
  'Cancel': { es: 'Cancelar', zh: '取消' },
  'Add a Medication': { es: 'Agregar un medicamento', zh: '添加药物' },
  "Don't worry about exact doses — do your best": {
    es: 'No se preocupe por las dosis exactas: haga lo mejor que pueda.',
    zh: '不必担心确切的剂量——尽力而为即可。',
  },
  'Continue to Allergies': { es: 'Continuar a Alergias', zh: '继续到过敏史' },
};

export default function Medications({ onNext, onBack }) {
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const { data, setSection } = useIntake();
  const meds = data.medications;
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', dose: '', frequency: '', reason: '', status: 'current' });

  const isAnticoagulant = (name) => {
    const lower = name.toLowerCase();
    return ANTICOAGULANTS.some((ac) => lower.includes(ac));
  };

  const suggestions = useMemo(() => {
    if (search.length < 2) return [];
    const lower = search.toLowerCase();
    return COMMON_MEDICATIONS.filter((m) => m.toLowerCase().includes(lower)).slice(0, 8);
  }, [search]);

  const addMedication = (medName) => {
    if (!medName) return;
    const med = {
      name: medName,
      dose: form.dose,
      frequency: form.frequency,
      reason: form.reason,
      status: form.status,
      isAnticoagulant: isAnticoagulant(medName),
    };
    const current = meds.current || [];
    setSection('medications', {
      ...meds,
      current: [...current, med],
      noMedications: false,
    });
    setForm({ name: '', dose: '', frequency: '', reason: '', status: 'current' });
    setSearch('');
    setShowForm(false);
  };

  const removeMedication = (index) => {
    const current = [...(meds.current || [])];
    current.splice(index, 1);
    setSection('medications', { ...meds, current });
  };

  const toggleNoMeds = () => {
    setSection('medications', {
      ...meds,
      noMedications: !meds.noMedications,
      current: meds.noMedications ? meds.current : [],
    });
  };

  const anticoagMeds = (meds.current || []).filter((m) => m.isAnticoagulant);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('Medications')}</h2>
        <p className="section-subtitle">
          {t('List all medications you currently take, including over-the-counter medications and supplements.')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Anticoagulant warning */}
        {anticoagMeds.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">{t('Blood Thinner / Antiplatelet Detected')}</p>
                <p className="text-sm text-amber-700 mt-1">
                  {t("You've listed: {meds}. Your surgeon will need to discuss timing of these medications before any procedure.").replace('{meds}', anticoagMeds.map(m => m.name).join(', '))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No medications toggle */}
        <div className="card">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={meds.noMedications || false}
              onChange={toggleNoMeds}
            />
            <span className="text-base font-medium text-gray-700">
              {t("I don't take any medications")}
            </span>
          </label>
        </div>

        {!meds.noMedications && (
          <>
            {/* Current medications list */}
            {(meds.current || []).length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-navy-600 mb-3">
                  {t('Your Medications ({count})').replace('{count}', (meds.current || []).length)}
                </h3>
                <div className="space-y-2">
                  {(meds.current || []).map((med, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${
                      med.isAnticoagulant ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                    }`}>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {med.name}
                          {med.isAnticoagulant && (
                            <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                              {t('Blood thinner')}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {[med.dose, med.frequency, med.reason].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <button onClick={() => removeMedication(i)} className="text-gray-400 hover:text-red-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add medication */}
            {showForm ? (
              <div className="card border-2 border-teal-200">
                <h3 className="text-lg font-medium text-navy-600 mb-4">{t('Add Medication')}</h3>
                <div className="space-y-4">
                  <div className="relative">
                    <label className="form-label">{t('Medication name *')}</label>
                    <input
                      type="text"
                      value={search || form.name}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setForm(prev => ({ ...prev, name: e.target.value }));
                      }}
                      placeholder={t('Start typing medication name...')}
                      autoFocus
                    />
                    {suggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setForm(prev => ({ ...prev, name: s }));
                              setSearch('');
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">{t('Dose (if known)')}</label>
                      <input
                        type="text"
                        value={form.dose}
                        onChange={(e) => setForm(prev => ({ ...prev, dose: e.target.value }))}
                        placeholder={t('e.g., 500mg')}
                      />
                    </div>
                    <div>
                      <label className="form-label">{t('Frequency')}</label>
                      <select value={form.frequency} onChange={(e) => setForm(prev => ({ ...prev, frequency: e.target.value }))}>
                        <option value="">{t('Select...')}</option>
                        <option value="Once daily">{t('Once daily')}</option>
                        <option value="Twice daily">{t('Twice daily')}</option>
                        <option value="Three times daily">{t('Three times daily')}</option>
                        <option value="As needed">{t('As needed')}</option>
                        <option value="Weekly">{t('Weekly')}</option>
                        <option value="Other">{t('Other')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">{t('Reason (if known)')}</label>
                      <input
                        type="text"
                        value={form.reason}
                        onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder={t('e.g., Back pain')}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => addMedication(form.name)}
                      disabled={!form.name}
                      className="btn-primary"
                    >
                      {t('Add Medication')}
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setForm({ name: '', dose: '', frequency: '', reason: '', status: 'current' });
                        setSearch('');
                      }}
                      className="btn-secondary"
                    >
                      {t('Cancel')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="card card-hover w-full text-center py-8 border-dashed border-2 border-gray-300"
              >
                <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-gray-500 font-medium">{t('Add a Medication')}</p>
                <p className="text-xs text-gray-400 mt-1">{t("Don't worry about exact doses — do your best")}</p>
              </button>
            )}
          </>
        )}
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={true}
        nextLabel={t('Continue to Allergies')}
        showSkip={true}
      />
    </div>
  );
}
