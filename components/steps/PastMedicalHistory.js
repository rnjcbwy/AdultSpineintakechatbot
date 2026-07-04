'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import { COMMON_CONDITIONS, IMPLANTED_DEVICES } from '../../lib/constants';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';

// Display-only translations. Stored condition/device values stay the canonical
// English strings; only the visible label is passed through t().
const LOCAL = {
  // Section header
  'Past Medical History': { es: 'Antecedentes médicos', zh: '既往病史' },
  'Select any medical conditions you have been diagnosed with. This helps your surgeon plan your care safely.':
    { es: 'Seleccione cualquier afección médica que le hayan diagnosticado. Esto ayuda a su cirujano a planificar su atención de forma segura.', zh: '请选择您被诊断出的任何疾病。这有助于您的外科医生安全地规划您的治疗。' },

  // Search
  'Search conditions': { es: 'Buscar afecciones', zh: '搜索疾病' },
  'Type to search... e.g., diabetes, osteoporosis':
    { es: 'Escriba para buscar... p. ej., diabetes, osteoporosis', zh: '输入以搜索...例如，糖尿病、骨质疏松症' },

  // Condition checklist
  'Medical Conditions': { es: 'Afecciones médicas', zh: '疾病' },
  'Add another condition not listed above...':
    { es: 'Agregar otra afección que no aparece arriba...', zh: '添加上面未列出的其他疾病...' },
  '+ Add': { es: '+ Agregar', zh: '+ 添加' },

  // Selected conditions
  'Your Selected Conditions': { es: 'Sus afecciones seleccionadas', zh: '您选择的疾病' },
  "Optionally add details or year diagnosed. You can skip these if you're unsure.":
    { es: 'Opcionalmente, agregue detalles o el año del diagnóstico. Puede omitir esto si no está seguro.', zh: '可选填写详情或诊断年份。如果不确定可以跳过。' },
  'Year diagnosed': { es: 'Año del diagnóstico', zh: '诊断年份' },
  'Details (optional)': { es: 'Detalles (opcional)', zh: '详情（可选）' },

  // Implanted devices
  'Implanted Devices': { es: 'Dispositivos implantados', zh: '植入设备' },
  'Do you have any implanted medical devices? (Important for surgical planning and imaging)':
    { es: '¿Tiene algún dispositivo médico implantado? (Importante para la planificación quirúrgica y las imágenes)', zh: '您是否有任何植入的医疗设备？（对手术规划和影像检查很重要）' },

  // Additional notes
  'Anything else about your medical history?':
    { es: '¿Algo más sobre sus antecedentes médicos?', zh: '关于您的病史还有其他要说明的吗？' },
  "Any other conditions or details you'd like to mention...":
    { es: 'Cualquier otra afección o detalle que desee mencionar...', zh: '您想提及的任何其他疾病或细节...' },

  // Navigation
  'Continue to Surgical History':
    { es: 'Continuar a antecedentes quirúrgicos', zh: '继续填写手术史' },

  // Medical conditions (COMMON_CONDITIONS)
  'Diabetes (Type 1)': { es: 'Diabetes (tipo 1)', zh: '糖尿病（1型）' },
  'Diabetes (Type 2)': { es: 'Diabetes (tipo 2)', zh: '糖尿病（2型）' },
  'Hypertension (high blood pressure)': { es: 'Hipertensión (presión arterial alta)', zh: '高血压' },
  'Coronary artery disease': { es: 'Enfermedad de las arterias coronarias', zh: '冠状动脉疾病' },
  'Prior heart attack': { es: 'Ataque cardíaco previo', zh: '既往心脏病发作' },
  'Prior stroke or TIA': { es: 'Accidente cerebrovascular o AIT previo', zh: '既往中风或短暂性脑缺血发作' },
  'Atrial fibrillation': { es: 'Fibrilación auricular', zh: '心房颤动' },
  'Heart failure': { es: 'Insuficiencia cardíaca', zh: '心力衰竭' },
  'Osteoporosis': { es: 'Osteoporosis', zh: '骨质疏松症' },
  'Osteopenia': { es: 'Osteopenia', zh: '骨量减少' },
  'Kidney disease': { es: 'Enfermedad renal', zh: '肾病' },
  'COPD / Lung disease': { es: 'EPOC / Enfermedad pulmonar', zh: '慢性阻塞性肺病 / 肺病' },
  'Asthma': { es: 'Asma', zh: '哮喘' },
  'Cancer': { es: 'Cáncer', zh: '癌症' },
  'Rheumatoid arthritis': { es: 'Artritis reumatoide', zh: '类风湿性关节炎' },
  'Lupus / Autoimmune disease': { es: 'Lupus / Enfermedad autoinmune', zh: '狼疮 / 自身免疫性疾病' },
  'Depression': { es: 'Depresión', zh: '抑郁症' },
  'Anxiety': { es: 'Ansiedad', zh: '焦虑症' },
  'Sleep apnea': { es: 'Apnea del sueño', zh: '睡眠呼吸暂停' },
  'Bleeding disorder': { es: 'Trastorno hemorrágico', zh: '出血性疾病' },
  'Blood clots / DVT / PE': { es: 'Coágulos sanguíneos / TVP / EP', zh: '血栓 / 深静脉血栓 / 肺栓塞' },
  'Peripheral neuropathy': { es: 'Neuropatía periférica', zh: '周围神经病变' },
  'Multiple sclerosis': { es: 'Esclerosis múltiple', zh: '多发性硬化症' },
  "Parkinson's disease": { es: 'Enfermedad de Parkinson', zh: '帕金森病' },
  'Seizure disorder / Epilepsy': { es: 'Trastorno convulsivo / Epilepsia', zh: '癫痫发作 / 癫痫' },
  'Fibromyalgia': { es: 'Fibromialgia', zh: '纤维肌痛' },
  'Obesity': { es: 'Obesidad', zh: '肥胖症' },
  'Thyroid disease': { es: 'Enfermedad de la tiroides', zh: '甲状腺疾病' },
  'Liver disease': { es: 'Enfermedad del hígado', zh: '肝病' },
  'HIV/AIDS': { es: 'VIH/SIDA', zh: '艾滋病病毒/艾滋病' },
  'Hepatitis': { es: 'Hepatitis', zh: '肝炎' },

  // Implanted devices (IMPLANTED_DEVICES)
  'Pacemaker': { es: 'Marcapasos', zh: '起搏器' },
  'Defibrillator (ICD)': { es: 'Desfibrilador (DCI)', zh: '除颤器（ICD）' },
  'Spinal cord stimulator': { es: 'Estimulador de la médula espinal', zh: '脊髓刺激器' },
  'VP shunt': { es: 'Derivación ventriculoperitoneal', zh: '脑室腹腔分流管' },
  'Baclofen pump': { es: 'Bomba de baclofeno', zh: '巴氯芬泵' },
  'Insulin pump': { es: 'Bomba de insulina', zh: '胰岛素泵' },
  'Cochlear implant': { es: 'Implante coclear', zh: '人工耳蜗' },
  'Joint replacement': { es: 'Reemplazo de articulación', zh: '关节置换' },
  'Prior spine hardware': { es: 'Instrumentación previa de columna', zh: '既往脊柱内固定物' },
};

export default function PastMedicalHistory({ onNext, onBack }) {
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const { data, setSection } = useIntake();
  const pmh = data.pastMedicalHistory;
  const [searchTerm, setSearchTerm] = useState('');
  const [customCondition, setCustomCondition] = useState('');

  const toggleCondition = (condition) => {
    const current = pmh.conditions || [];
    const exists = current.find((c) => c.name === condition);
    if (exists) {
      setSection('pastMedicalHistory', {
        ...pmh,
        conditions: current.filter((c) => c.name !== condition),
      });
    } else {
      setSection('pastMedicalHistory', {
        ...pmh,
        conditions: [...current, { name: condition, details: '', yearDiagnosed: '' }],
      });
    }
  };

  const updateConditionDetail = (conditionName, field, value) => {
    const updated = (pmh.conditions || []).map((c) =>
      c.name === conditionName ? { ...c, [field]: value } : c
    );
    setSection('pastMedicalHistory', { ...pmh, conditions: updated });
  };

  const addCustomCondition = () => {
    if (customCondition.trim()) {
      const current = pmh.conditions || [];
      if (!current.find((c) => c.name === customCondition.trim())) {
        setSection('pastMedicalHistory', {
          ...pmh,
          conditions: [...current, { name: customCondition.trim(), details: '', yearDiagnosed: '' }],
        });
      }
      setCustomCondition('');
    }
  };

  const toggleDevice = (device) => {
    const current = pmh.implantedDevices || [];
    setSection('pastMedicalHistory', {
      ...pmh,
      implantedDevices: current.includes(device)
        ? current.filter((d) => d !== device)
        : [...current, device],
    });
  };

  const filteredConditions = searchTerm
    ? COMMON_CONDITIONS.filter((c) => c.toLowerCase().includes(searchTerm.toLowerCase()))
    : COMMON_CONDITIONS;

  const selectedConditions = pmh.conditions || [];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('Past Medical History')}</h2>
        <p className="section-subtitle">
          {t('Select any medical conditions you have been diagnosed with. This helps your surgeon plan your care safely.')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div className="card">
          <label className="form-label">{t('Search conditions')}</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('Type to search... e.g., diabetes, osteoporosis')}
          />
        </div>

        {/* Condition checklist */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">{t('Medical Conditions')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
            {filteredConditions.map((condition) => {
              const isSelected = selectedConditions.some((c) => c.name === condition);
              return (
                <label
                  key={condition}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-teal-400 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-200 hover:bg-teal-50/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCondition(condition)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-teal-400 bg-teal-400' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">{t(condition)}</span>
                </label>
              );
            })}
          </div>

          {/* Add custom condition */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomCondition()}
              placeholder={t('Add another condition not listed above...')}
              className="flex-1"
            />
            <button onClick={addCustomCondition} disabled={!customCondition.trim()}
              className="btn-secondary text-sm whitespace-nowrap">
              {t('+ Add')}
            </button>
          </div>
        </div>

        {/* Selected conditions with details */}
        {selectedConditions.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-medium text-navy-600 mb-4">
              {t('Your Selected Conditions')} ({selectedConditions.length})
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {t("Optionally add details or year diagnosed. You can skip these if you're unsure.")}
            </p>
            <div className="space-y-3">
              {selectedConditions.map((condition) => (
                <div key={condition.name} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{t(condition.name)}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <input
                        type="text"
                        value={condition.yearDiagnosed || ''}
                        onChange={(e) => updateConditionDetail(condition.name, 'yearDiagnosed', e.target.value)}
                        placeholder={t('Year diagnosed')}
                        className="text-sm py-2"
                      />
                      <input
                        type="text"
                        value={condition.details || ''}
                        onChange={(e) => updateConditionDetail(condition.name, 'details', e.target.value)}
                        placeholder={t('Details (optional)')}
                        className="text-sm py-2"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCondition(condition.name)}
                    className="text-gray-400 hover:text-red-500 mt-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Implanted devices */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-2">{t('Implanted Devices')}</h3>
          <p className="text-sm text-gray-400 mb-4">
            {t('Do you have any implanted medical devices? (Important for surgical planning and imaging)')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {IMPLANTED_DEVICES.map((device) => {
              const isSelected = (pmh.implantedDevices || []).includes(device);
              return (
                <label
                  key={device}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleDevice(device)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-amber-400 bg-amber-400' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">{t(device)}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Additional notes */}
        <div className="card">
          <label className="form-label">{t('Anything else about your medical history?')}</label>
          <textarea
            value={pmh.additionalNotes || ''}
            onChange={(e) => setSection('pastMedicalHistory', { ...pmh, additionalNotes: e.target.value })}
            placeholder={t("Any other conditions or details you'd like to mention...")}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none"
          />
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={true}
        nextLabel={t('Continue to Surgical History')}
        showSkip={true}
      />
    </div>
  );
}
