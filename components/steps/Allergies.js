'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';

const LOCAL = {
  'Allergies': { es: 'Alergias', zh: '过敏' },
  'List any known allergies, including medications, foods, and environmental allergies.': {
    es: 'Indique cualquier alergia conocida, incluyendo medicamentos, alimentos y alergias ambientales.',
    zh: '请列出任何已知的过敏，包括药物、食物和环境过敏。',
  },
  'No Known Drug Allergies (NKDA)': {
    es: 'Sin alergias a medicamentos conocidas (NKDA)',
    zh: '无已知药物过敏 (NKDA)',
  },
  'Check this if you have no known allergies to medications': {
    es: 'Marque esta casilla si no tiene alergias conocidas a medicamentos',
    zh: '如果您没有已知的药物过敏，请勾选此项',
  },
  'Your Allergies': { es: 'Sus alergias', zh: '您的过敏' },
  'Severe': { es: 'Grave', zh: '严重' },
  'Reaction:': { es: 'Reacción:', zh: '反应：' },
  'Add Allergy': { es: 'Agregar alergia', zh: '添加过敏' },
  'What are you allergic to? *': { es: '¿A qué es alérgico? *', zh: '您对什么过敏？ *' },
  'e.g., Penicillin, Shellfish, Latex': {
    es: 'ej., Penicilina, Mariscos, Látex',
    zh: '例如：青霉素、贝类、乳胶',
  },
  'Type of allergen': { es: 'Tipo de alérgeno', zh: '过敏原类型' },
  'Medication': { es: 'Medicamento', zh: '药物' },
  'Food': { es: 'Alimento', zh: '食物' },
  'Environmental': { es: 'Ambiental', zh: '环境' },
  'Latex': { es: 'Látex', zh: '乳胶' },
  'Other': { es: 'Otro', zh: '其他' },
  'What reaction do you have?': { es: '¿Qué reacción tiene?', zh: '您有什么反应？' },
  'e.g., Rash, Hives, Swelling, Difficulty breathing': {
    es: 'ej., Erupción, Ronchas, Hinchazón, Dificultad para respirar',
    zh: '例如：皮疹、荨麻疹、肿胀、呼吸困难',
  },
  'Severity': { es: 'Gravedad', zh: '严重程度' },
  'Mild (rash, itching)': { es: 'Leve (erupción, picazón)', zh: '轻度（皮疹、瘙痒）' },
  'Moderate (significant symptoms)': {
    es: 'Moderada (síntomas significativos)',
    zh: '中度（明显症状）',
  },
  'Severe/Anaphylaxis': { es: 'Grave/Anafilaxia', zh: '严重/过敏性休克' },
  'Intolerance (side effect, not true allergy)': {
    es: 'Intolerancia (efecto secundario, no una alergia verdadera)',
    zh: '不耐受（副作用，非真正过敏）',
  },
  'Unknown': { es: 'Desconocida', zh: '未知' },
  'Cancel': { es: 'Cancelar', zh: '取消' },
  'Add an Allergy': { es: 'Agregar una alergia', zh: '添加过敏' },
  'Continue to Social History': {
    es: 'Continuar a Historia social',
    zh: '继续到社会史',
  },
};

export default function Allergies({ onNext, onBack }) {
  const { data, setSection } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const allergies = data.allergies;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ allergen: '', reaction: '', severity: '', type: 'Medication' });

  const addAllergy = () => {
    if (!form.allergen) return;
    const entries = [...(allergies.entries || []), { ...form }];
    setSection('allergies', { ...allergies, entries, nkda: false });
    setForm({ allergen: '', reaction: '', severity: '', type: 'Medication' });
    setShowForm(false);
  };

  const removeAllergy = (index) => {
    const entries = (allergies.entries || []).filter((_, i) => i !== index);
    setSection('allergies', { ...allergies, entries });
  };

  const toggleNKDA = () => {
    setSection('allergies', {
      ...allergies,
      nkda: !allergies.nkda,
      entries: allergies.nkda ? allergies.entries : [],
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('Allergies')}</h2>
        <p className="section-subtitle">
          {t('List any known allergies, including medications, foods, and environmental allergies.')}
        </p>
      </div>

      <div className="space-y-6">
        {/* NKDA toggle */}
        <div className="card">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allergies.nkda || false}
              onChange={toggleNKDA}
            />
            <div>
              <span className="text-base font-medium text-gray-700">{t('No Known Drug Allergies (NKDA)')}</span>
              <p className="text-sm text-gray-400">{t('Check this if you have no known allergies to medications')}</p>
            </div>
          </label>
        </div>

        {!allergies.nkda && (
          <>
            {/* Allergy list */}
            {(allergies.entries || []).length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-navy-600 mb-3">
                  {t('Your Allergies')} ({(allergies.entries || []).length})
                </h3>
                <div className="space-y-2">
                  {(allergies.entries || []).map((allergy, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${
                      allergy.severity === 'Severe/Anaphylaxis'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-gray-50'
                    }`}>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {allergy.allergen}
                          <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            {t(allergy.type)}
                          </span>
                          {allergy.severity === 'Severe/Anaphylaxis' && (
                            <span className="ml-1 text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                              {t('Severe')}
                            </span>
                          )}
                        </p>
                        {allergy.reaction && (
                          <p className="text-xs text-gray-500 mt-0.5">{t('Reaction:')} {allergy.reaction}</p>
                        )}
                      </div>
                      <button onClick={() => removeAllergy(i)} className="text-gray-400 hover:text-red-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add allergy form */}
            {showForm ? (
              <div className="card border-2 border-teal-200">
                <h3 className="text-lg font-medium text-navy-600 mb-4">{t('Add Allergy')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="form-label">{t('What are you allergic to? *')}</label>
                    <input
                      type="text"
                      value={form.allergen}
                      onChange={(e) => setForm(prev => ({ ...prev, allergen: e.target.value }))}
                      placeholder={t('e.g., Penicillin, Shellfish, Latex')}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="form-label">{t('Type of allergen')}</label>
                    <div className="flex flex-wrap gap-2">
                      {['Medication', 'Food', 'Environmental', 'Latex', 'Other'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setForm(prev => ({ ...prev, type: opt }))}
                          className={`chip ${form.type === opt ? 'chip-selected' : 'chip-unselected'}`}
                        >
                          {t(opt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">{t('What reaction do you have?')}</label>
                    <input
                      type="text"
                      value={form.reaction}
                      onChange={(e) => setForm(prev => ({ ...prev, reaction: e.target.value }))}
                      placeholder={t('e.g., Rash, Hives, Swelling, Difficulty breathing')}
                    />
                  </div>

                  <div>
                    <label className="form-label">{t('Severity')}</label>
                    <div className="flex flex-wrap gap-2">
                      {['Mild (rash, itching)', 'Moderate (significant symptoms)', 'Severe/Anaphylaxis', 'Intolerance (side effect, not true allergy)', 'Unknown'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setForm(prev => ({ ...prev, severity: s }))}
                          className={`chip ${form.severity === s ? 'chip-selected' : 'chip-unselected'}`}
                        >
                          {t(s)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={addAllergy} disabled={!form.allergen} className="btn-primary">
                      {t('Add Allergy')}
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setForm({ allergen: '', reaction: '', severity: '', type: 'Medication' });
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
                <p className="text-gray-500 font-medium">{t('Add an Allergy')}</p>
              </button>
            )}
          </>
        )}
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={true}
        nextLabel={t('Continue to Social History')}
        showSkip={true}
      />
    </div>
  );
}
