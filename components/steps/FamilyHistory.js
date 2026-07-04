'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import { FAMILY_CONDITIONS, FAMILY_RELATIONS } from '../../lib/constants';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';

const LOCAL = {
  // Section title / subtitle
  'Family History': { es: 'Antecedentes familiares', zh: '家族病史' },
  'Do any close family members have conditions that might be relevant to your spine care? This is especially helpful for conditions like osteoporosis, scoliosis, or bleeding disorders.': {
    es: '¿Algún familiar cercano tiene afecciones que puedan ser relevantes para el cuidado de su columna? Esto es especialmente útil para afecciones como osteoporosis, escoliosis o trastornos de sangrado.',
    zh: '您有任何近亲患有可能与您的脊柱护理相关的疾病吗？这对于骨质疏松症、脊柱侧弯或出血性疾病等情况尤其有帮助。',
  },

  // No relevant history toggle
  'No relevant family history to report': { es: 'No hay antecedentes familiares relevantes que informar', zh: '没有需要报告的相关家族病史' },

  // Form labels / headings / buttons
  'Add Family History': { es: 'Agregar antecedentes familiares', zh: '添加家族病史' },
  'Family member *': { es: 'Familiar *', zh: '家庭成员 *' },
  'Condition *': { es: 'Afección *', zh: '疾病 *' },
  'Or type a condition...': { es: 'O escriba una afección...', zh: '或输入一种疾病...' },
  'Details (optional)': { es: 'Detalles (opcional)', zh: '详情（可选）' },
  'Any additional details': { es: 'Cualquier detalle adicional', zh: '任何额外详情' },
  'Add Entry': { es: 'Agregar entrada', zh: '添加条目' },
  'Cancel': { es: 'Cancelar', zh: '取消' },

  // Navigation
  'Continue to Review of Systems': { es: 'Continuar a la revisión de sistemas', zh: '继续进行系统回顾' },

  // FAMILY_CONDITIONS
  'Scoliosis or spinal deformity': { es: 'Escoliosis o deformidad de la columna', zh: '脊柱侧弯或脊柱畸形' },
  'Degenerative spine disease': { es: 'Enfermedad degenerativa de la columna', zh: '退行性脊柱疾病' },
  'Osteoporosis': { es: 'Osteoporosis', zh: '骨质疏松症' },
  'Rheumatoid arthritis': { es: 'Artritis reumatoide', zh: '类风湿性关节炎' },
  'Ankylosing spondylitis': { es: 'Espondilitis anquilosante', zh: '强直性脊柱炎' },
  'Neurological disease (MS, ALS, etc.)': { es: 'Enfermedad neurológica (EM, ELA, etc.)', zh: '神经系统疾病（多发性硬化症、渐冻症等）' },
  'Blood clotting disorder': { es: 'Trastorno de la coagulación de la sangre', zh: '血液凝固障碍' },
  'Heart disease': { es: 'Enfermedad cardíaca', zh: '心脏病' },
  'Stroke': { es: 'Accidente cerebrovascular', zh: '中风' },
  'Cancer': { es: 'Cáncer', zh: '癌症' },
  'Diabetes': { es: 'Diabetes', zh: '糖尿病' },

  // FAMILY_RELATIONS
  'Mother': { es: 'Madre', zh: '母亲' },
  'Father': { es: 'Padre', zh: '父亲' },
  'Sister': { es: 'Hermana', zh: '姐妹' },
  'Brother': { es: 'Hermano', zh: '兄弟' },
  'Maternal grandmother': { es: 'Abuela materna', zh: '外祖母' },
  'Maternal grandfather': { es: 'Abuelo materno', zh: '外祖父' },
  'Paternal grandmother': { es: 'Abuela paterna', zh: '祖母' },
  'Paternal grandfather': { es: 'Abuelo paterno', zh: '祖父' },
  'Son': { es: 'Hijo', zh: '儿子' },
  'Daughter': { es: 'Hija', zh: '女儿' },
  'Aunt': { es: 'Tía', zh: '姑姑／阿姨' },
  'Uncle': { es: 'Tío', zh: '叔叔／舅舅' },
};

export default function FamilyHistory({ onNext, onBack }) {
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const { data, setSection } = useIntake();
  const fh = data.familyHistory;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ relation: '', condition: '', details: '' });

  const addEntry = () => {
    if (!form.relation || !form.condition) return;
    const entries = [...(fh.entries || []), { ...form }];
    setSection('familyHistory', { ...fh, entries, noRelevantHistory: false });
    setForm({ relation: '', condition: '', details: '' });
    setShowForm(false);
  };

  const removeEntry = (index) => {
    const entries = (fh.entries || []).filter((_, i) => i !== index);
    setSection('familyHistory', { ...fh, entries });
  };

  const toggleNoHistory = () => {
    setSection('familyHistory', {
      ...fh,
      noRelevantHistory: !fh.noRelevantHistory,
      entries: fh.noRelevantHistory ? fh.entries : [],
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('Family History')}</h2>
        <p className="section-subtitle">
          {t('Do any close family members have conditions that might be relevant to your spine care? This is especially helpful for conditions like osteoporosis, scoliosis, or bleeding disorders.')}
        </p>
      </div>

      <div className="space-y-6">
        {/* No relevant history */}
        <div className="card">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={fh.noRelevantHistory || false}
              onChange={toggleNoHistory}
            />
            <span className="text-base font-medium text-gray-700">
              {t('No relevant family history to report')}
            </span>
          </label>
        </div>

        {!fh.noRelevantHistory && (
          <>
            {/* Family history entries */}
            {(fh.entries || []).length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-navy-600 mb-3">
                  {t('Family History')} ({(fh.entries || []).length})
                </h3>
                <div className="space-y-2">
                  {(fh.entries || []).map((entry, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {t(entry.relation)}: {t(entry.condition)}
                        </p>
                        {entry.details && (
                          <p className="text-xs text-gray-500 mt-0.5">{entry.details}</p>
                        )}
                      </div>
                      <button onClick={() => removeEntry(i)} className="text-gray-400 hover:text-red-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add entry form */}
            {showForm ? (
              <div className="card border-2 border-teal-200">
                <h3 className="text-lg font-medium text-navy-600 mb-4">{t('Add Family History')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="form-label">{t('Family member *')}</label>
                    <div className="flex flex-wrap gap-2">
                      {FAMILY_RELATIONS.map((rel) => (
                        <button
                          key={rel}
                          onClick={() => setForm(prev => ({ ...prev, relation: rel }))}
                          className={`chip ${form.relation === rel ? 'chip-selected' : 'chip-unselected'}`}
                        >
                          {t(rel)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">{t('Condition *')}</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {FAMILY_CONDITIONS.map((cond) => (
                        <button
                          key={cond}
                          onClick={() => setForm(prev => ({ ...prev, condition: cond }))}
                          className={`chip ${form.condition === cond ? 'chip-selected' : 'chip-unselected'}`}
                        >
                          {t(cond)}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={form.condition}
                      onChange={(e) => setForm(prev => ({ ...prev, condition: e.target.value }))}
                      placeholder={t('Or type a condition...')}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <label className="form-label">{t('Details (optional)')}</label>
                    <input
                      type="text"
                      value={form.details}
                      onChange={(e) => setForm(prev => ({ ...prev, details: e.target.value }))}
                      placeholder={t('Any additional details')}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={addEntry} disabled={!form.relation || !form.condition} className="btn-primary">
                      {t('Add Entry')}
                    </button>
                    <button onClick={() => { setShowForm(false); setForm({ relation: '', condition: '', details: '' }); }} className="btn-secondary">
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
                <p className="text-gray-500 font-medium">{t('Add Family History')}</p>
              </button>
            )}
          </>
        )}
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={true}
        nextLabel={t('Continue to Review of Systems')}
        showSkip={true}
      />
    </div>
  );
}
