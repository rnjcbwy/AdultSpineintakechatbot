'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import { INJECTION_TYPES } from '../../lib/constants';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';
import SuggestedAnswers, { useAdoptExample } from '../ui/SuggestedAnswers';

const LOCAL = {
  // Records / upload notice
  'You will be asked to upload documentation later': {
    es: 'Más adelante le pediremos que suba documentación',
    zh: '稍后我们会请您上传相关记录',
  },
  'Further along in this form there is a Records & Documents step where you can upload physical therapy notes, injection reports, EMG results, and imaging reports. Insurance companies require written proof of the treatments you have already tried before they will approve surgery, so anything you can gather now will speed up your approval. You can still finish this form without them.': {
    es: 'Más adelante en este formulario hay una sección de Registros y Documentos donde puede subir notas de fisioterapia, informes de inyecciones, resultados de EMG e informes de imágenes. Las aseguradoras exigen prueba escrita de los tratamientos que ya ha probado antes de aprobar una cirugía, así que todo lo que pueda reunir ahora acelerará su aprobación. Puede terminar este formulario sin ellos.',
    zh: '在本表格的后面有一个"记录与文件"步骤，您可以在那里上传物理治疗记录、注射报告、肌电图结果和影像报告。保险公司在批准手术前需要您已尝试过的治疗的书面证明，因此现在收集的任何资料都会加快审批速度。没有这些资料您也可以完成本表格。',
  },
  'PT visit notes or a discharge summary: upload them at the Records step, or bring them to your visit.': {
    es: 'Notas de fisioterapia o resumen de alta: súbalos en la sección de Registros, o tráigalos a su cita.',
    zh: '物理治疗就诊记录或出院小结：请在"记录"步骤上传，或就诊时带来。',
  },
  'Injection records or procedure notes: upload them at the Records step, or bring them to your visit.': {
    es: 'Registros de inyecciones o notas del procedimiento: súbalos en la sección de Registros, o tráigalos a su cita.',
    zh: '注射记录或操作记录：请在"记录"步骤上传，或就诊时带来。',
  },
  'Your EMG / nerve study report: upload it at the Records step, or bring a copy to your visit.': {
    es: 'Su informe de EMG / estudio nervioso: súbalo en la sección de Registros, o traiga una copia a su cita.',
    zh: '您的肌电图／神经传导检查报告：请在"记录"步骤上传，或就诊时带一份副本。',
  },

  // Suggested answers
  '6 weeks': { es: '6 semanas', zh: '6周' },
  '3 months': { es: '3 meses', zh: '3个月' },
  '6 months': { es: '6 meses', zh: '6个月' },
  'More than a year': { es: 'Más de un año', zh: '一年以上' },
  '1x per week': { es: '1 vez por semana', zh: '每周1次' },
  '2x per week': { es: '2 veces por semana', zh: '每周2次' },
  '3x per week': { es: '3 veces por semana', zh: '每周3次' },
  'None': { es: 'Ninguno', zh: '无' },
  'Printed handout': { es: 'Hoja impresa', zh: '纸质讲义' },
  'YouTube': { es: 'YouTube', zh: 'YouTube' },
  'Phone app': { es: 'Aplicación de teléfono', zh: '手机应用' },
  'Daily': { es: 'Diariamente', zh: '每天' },
  'A few times a month': { es: 'Algunas veces al mes', zh: '每月几次' },
  'Core strengthening': { es: 'Fortalecimiento del core', zh: '核心力量训练' },
  'Stretching': { es: 'Estiramientos', zh: '拉伸' },
  'Walking program': { es: 'Programa de caminata', zh: '步行计划' },

  // Title + subtitle
  'Prior Treatments': { es: 'Tratamientos previos', zh: '既往治疗' },
  "What treatments have you already tried for your spine symptoms? This helps your surgeon understand what's been done so far. Answer what applies and skip the rest.": {
    es: '¿Qué tratamientos ya ha probado para los síntomas de su columna? Esto ayuda a su cirujano a entender lo que se ha hecho hasta ahora. Responda lo que corresponda y omita el resto.',
    zh: '您已经为您的脊柱症状尝试过哪些治疗？这有助于您的外科医生了解迄今为止所做的治疗。请回答适用的项目，其余的可以跳过。',
  },

  // Treatment labels
  'Physical therapy': { es: 'Fisioterapia', zh: '物理治疗' },
  'Home exercise program': { es: 'Programa de ejercicios en casa', zh: '居家锻炼计划' },
  'Chiropractic care': { es: 'Atención quiropráctica', zh: '脊椎推拿治疗' },
  'Acupuncture': { es: 'Acupuntura', zh: '针灸' },
  'Back brace or cervical collar': { es: 'Faja lumbar o collarín cervical', zh: '腰背支具或颈托' },
  'Injections': { es: 'Inyecciones', zh: '注射' },
  'Prior Imaging': { es: 'Estudios de imagen previos', zh: '既往影像检查' },
  'EMG or nerve conduction study': { es: 'EMG o estudio de conducción nerviosa', zh: '肌电图或神经传导检查' },

  // Field labels
  'Where? (clinic name & city)': { es: '¿Dónde? (nombre de la clínica y ciudad)', zh: '在哪里？（诊所名称和城市）' },
  'Who referred or performed it?': { es: '¿Quién lo remitió o lo realizó?', zh: '谁转诊或执行的？' },
  'When / for how long?': { es: '¿Cuándo / por cuánto tiempo?', zh: '什么时候／持续多久？' },
  'How often?': { es: '¿Con qué frecuencia?', zh: '多久一次？' },
  'Was it guided?': { es: '¿Fue guiado?', zh: '是否有指导？' },
  'What app or service? (if any)': { es: '¿Qué aplicación o servicio? (si aplica)', zh: '哪个应用或服务？（如有）' },
  'For how long?': { es: '¿Por cuánto tiempo?', zh: '持续多久？' },
  'How frequent?': { es: '¿Con qué frecuencia?', zh: '多频繁？' },
  'What did you work on?': { es: '¿En qué trabajó?', zh: '您锻炼了什么？' },
  'Type': { es: 'Tipo', zh: '类型' },
  'Duration': { es: 'Duración', zh: '持续时间' },
  'Results (if known)': { es: 'Resultados (si se conocen)', zh: '结果（如已知）' },
  'When?': { es: '¿Cuándo?', zh: '什么时候？' },
  'Who did it?': { es: '¿Quién lo hizo?', zh: '谁做的？' },
  'Where? (facility & city)': { es: '¿Dónde? (centro y ciudad)', zh: '在哪里？（机构和城市）' },

  // Guided-select options
  'On my own': { es: 'Por mi cuenta', zh: '自己进行' },
  'Guided by a therapist': { es: 'Guiado por un terapeuta', zh: '由治疗师指导' },
  'App or online program': { es: 'Aplicación o programa en línea', zh: '应用或在线课程' },
  'Handout / printed exercises': { es: 'Folleto / ejercicios impresos', zh: '讲义／纸质练习' },

  // Imaging chips
  'X-rays': { es: 'Radiografías', zh: 'X光片' },
  'MRI': { es: 'Resonancia magnética (MRI)', zh: '磁共振（MRI）' },
  'CT scan': { es: 'Tomografía (TC)', zh: 'CT扫描' },
  'Myelogram': { es: 'Mielografía', zh: '脊髓造影' },
  'Bone density scan (DEXA)': { es: 'Densitometría ósea (DEXA)', zh: '骨密度扫描（DEXA）' },
  'None': { es: 'Ninguno', zh: '无' },

  // Injection section
  'Have you had any spine injections? Add each one with as much detail as you can — this is important for insurance authorization.': {
    es: '¿Se ha hecho alguna inyección en la columna? Agregue cada una con el mayor detalle posible; esto es importante para la autorización del seguro.',
    zh: '您做过脊柱注射吗？请尽量详细地添加每一次注射，这对保险授权很重要。',
  },
  'Injection type...': { es: 'Tipo de inyección...', zh: '注射类型...' },

  // Injection type options (display translated, stored English)
  'Epidural steroid injection (ESI)': { es: 'Inyección epidural de esteroides (ESI)', zh: '硬膜外类固醇注射 (ESI)' },
  'Nerve root block / transforaminal ESI': { es: 'Bloqueo de raíz nerviosa / ESI transforaminal', zh: '神经根阻滞／经椎间孔 ESI' },
  'Facet joint injection': { es: 'Inyección en la articulación facetaria', zh: '小关节注射' },
  'Medial branch block': { es: 'Bloqueo de la rama medial', zh: '内侧支阻滞' },
  'Radiofrequency ablation (RFA)': { es: 'Ablación por radiofrecuencia (RFA)', zh: '射频消融 (RFA)' },
  'Sacroiliac (SI) joint injection': { es: 'Inyección en la articulación sacroilíaca (SI)', zh: '骶髂 (SI) 关节注射' },
  'Trigger point injection': { es: 'Inyección en punto gatillo', zh: '触发点注射' },
  'Other': { es: 'Otro', zh: '其他' },
  'Where? (e.g., L4-L5, left side)': { es: '¿Dónde? (p. ej., L4-L5, lado izquierdo)', zh: '哪个部位？（例如 L4-L5，左侧）' },
  'Who did it? (doctor / clinic)': { es: '¿Quién lo hizo? (médico / clínica)', zh: '谁做的？（医生／诊所）' },
  'When? (e.g., June 2024)': { es: '¿Cuándo? (p. ej., junio de 2024)', zh: '什么时候？（例如 2024年6月）' },
  'How many? (e.g., 3)': { es: '¿Cuántas? (p. ej., 3)', zh: '多少次？（例如 3）' },
  'How long did relief last? (e.g., 2 weeks)': { es: '¿Cuánto duró el alivio? (p. ej., 2 semanas)', zh: '缓解持续了多久？（例如 2周）' },
  '+ Add Injection': { es: '+ Agregar inyección', zh: '+ 添加注射' },

  // Prior imaging section
  'What imaging studies have you had for your spine?': { es: '¿Qué estudios de imagen se ha hecho de la columna?', zh: '您为脊柱做过哪些影像检查？' },

  // Records notes
  'PT visit notes or a discharge summary: upload them at the Records step, or bring them to your visit.': {
    es: 'Si tiene notas de las visitas de fisioterapia o un resumen de alta, tráigalos a su cita.',
    zh: '如果您有物理治疗就诊记录或出院小结，请带到就诊时。',
  },
  'Injection records or procedure notes: upload them at the Records step, or bring them to your visit.': {
    es: 'Si tiene registros de inyecciones o notas del procedimiento, tráigalos a su cita.',
    zh: '如果您有注射记录或操作记录，请带到就诊时。',
  },
  'Your EMG / nerve study report: upload it at the Records step, or bring a copy to your visit.': {
    es: 'Por favor, traiga una copia del informe de su EMG/estudio nervioso a su cita.',
    zh: '请携带一份您的肌电图／神经检查报告到就诊时。',
  },

  // Placeholders
  'e.g., ProCare PT, Denver': { es: 'p. ej., ProCare PT, Denver', zh: '例如 ProCare PT，丹佛' },
  'e.g., Dr. Smith / therapist name': { es: 'p. ej., Dr. Smith / nombre del terapeuta', zh: '例如 Smith医生／治疗师姓名' },
  'e.g., 3 months in 2024': { es: 'p. ej., 3 meses en 2024', zh: '例如 2024年做了3个月' },
  'e.g., 2x per week': { es: 'p. ej., 2 veces por semana', zh: '例如 每周2次' },
  'e.g., Sword Health, YouTube, none': { es: 'p. ej., Sword Health, YouTube, ninguno', zh: '例如 Sword Health、YouTube、无' },
  'e.g., 2 months': { es: 'p. ej., 2 meses', zh: '例如 2个月' },
  'e.g., Daily, 3x per week': { es: 'p. ej., a diario, 3 veces por semana', zh: '例如 每天、每周3次' },
  'e.g., Core strengthening, stretching, walking program': {
    es: 'p. ej., fortalecimiento del core, estiramientos, programa de caminata',
    zh: '例如 核心力量训练、拉伸、步行计划',
  },
  'How long did you go?': { es: '¿Por cuánto tiempo asistió?', zh: '您去了多久？' },
  'How long?': { es: '¿Por cuánto tiempo?', zh: '多久？' },
  'What kind?': { es: '¿Qué tipo?', zh: '哪种？' },
  'e.g., March 2024': { es: 'p. ej., marzo de 2024', zh: '例如 2024年3月' },
  'e.g., Denver Neuro Clinic': { es: 'p. ej., Denver Neuro Clinic', zh: '例如 丹佛神经诊所' },
  'Physician / provider name': { es: 'Nombre del médico / proveedor', zh: '医生／医疗人员姓名' },
  'What did it show?': { es: '¿Qué mostró?', zh: '结果显示了什么？' },

  // Nav
  'Continue to Additional Details': { es: 'Continuar a detalles adicionales', zh: '继续到其他详情' },
};

/**
 * Prior Treatments — its own full step (previously a small tab within HPI).
 * Captures the conservative treatment history the surgeon needs to know about.
 */
export default function PriorTreatments({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const tx = data.hpiData.conservativeTreatments;

  const updateTx = (path, value) => setNested(`hpiData.conservativeTreatments.${path}`, value);

  const [newInjection, setNewInjection] = useState({
    type: '', location: '', provider: '', when: '', count: '', reliefDuration: '', helped: '',
  });

  const addInjection = () => {
    if (newInjection.type) {
      const current = tx.injections || [];
      setNested('hpiData.conservativeTreatments.injections', [...current, { ...newInjection }]);
      setNewInjection({ type: '', location: '', provider: '', when: '', count: '', reliefDuration: '', helped: '' });
    }
  };

  const removeInjection = (index) => {
    const current = tx.injections || [];
    setNested('hpiData.conservativeTreatments.injections', current.filter((_, i) => i !== index));
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('Prior Treatments')}</h2>
        <p className="section-subtitle">
          {t("What treatments have you already tried for your spine symptoms? This helps your surgeon understand what's been done so far. Answer what applies and skip the rest.")}
        </p>
      </div>

      {/* Set the expectation before the questions, not after. Insurers
          approve spine surgery on documented conservative care, so the notes
          matter as much as the answers — and a patient who knows that at the
          start of the section can start looking for them today. */}
      <div className="flex items-start gap-3 p-4 mb-4 rounded-xl bg-teal-50 border border-teal-200">
        <span className="text-lg leading-none mt-0.5" aria-hidden="true">📎</span>
        <div>
          <p className="text-sm font-semibold text-teal-800 mb-1">
            {t('You will be asked to upload documentation later')}
          </p>
          <p className="text-sm text-teal-700 leading-relaxed">
            {t('Further along in this form there is a Records & Documents step where you can upload physical therapy notes, injection reports, EMG results, and imaging reports. Insurance companies require written proof of the treatments you have already tried before they will approve surgery, so anything you can gather now will speed up your approval. You can still finish this form without them.')}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card space-y-6">
          <TreatmentToggle label={t('Physical therapy')} tried={tx.physicalTherapy?.tried} onToggle={(v) => updateTx('physicalTherapy.tried', v)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <TextField label={t('Where? (clinic name & city)')} value={tx.physicalTherapy?.facility}
                onChange={(v) => updateTx('physicalTherapy.facility', v)} placeholder={t('e.g., ProCare PT, Denver')} />
              <TextField label={t('Who referred or performed it?')} value={tx.physicalTherapy?.provider}
                onChange={(v) => updateTx('physicalTherapy.provider', v)} placeholder={t('e.g., Dr. Smith / therapist name')} />
              <TextField label={t('When / for how long?')} value={tx.physicalTherapy?.duration}
                onChange={(v) => updateTx('physicalTherapy.duration', v)} placeholder={t('e.g., 3 months in 2024')}
                suggestions={PT_DURATIONS} />
              <TextField label={t('How often?')} value={tx.physicalTherapy?.frequency}
                onChange={(v) => updateTx('physicalTherapy.frequency', v)} placeholder={t('e.g., 2x per week')}
                suggestions={VISIT_FREQUENCIES} />
              <HelpedSelect value={tx.physicalTherapy?.helped} onChange={(v) => updateTx('physicalTherapy.helped', v)} includeWorse />
            </div>
            <RecordsNote text={t('PT visit notes or a discharge summary: upload them at the Records step, or bring them to your visit.')} />
          </TreatmentToggle>

          <TreatmentToggle label={t('Home exercise program')} tried={tx.homeExercise?.tried} onToggle={(v) => updateTx('homeExercise.tried', v)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="form-label text-sm">{t('Was it guided?')}</label>
                <select value={tx.homeExercise?.guided || ''} onChange={(e) => updateTx('homeExercise.guided', e.target.value)}>
                  <option value="">{t('Select...')}</option>
                  <option value="On my own">{t('On my own')}</option>
                  <option value="Guided by a therapist">{t('Guided by a therapist')}</option>
                  <option value="App or online program">{t('App or online program')}</option>
                  <option value="Handout / printed exercises">{t('Handout / printed exercises')}</option>
                </select>
              </div>
              <TextField label={t('What app or service? (if any)')} value={tx.homeExercise?.appService}
                onChange={(v) => updateTx('homeExercise.appService', v)} placeholder={t('e.g., Sword Health, YouTube, none')}
                suggestions={HEP_SOURCES} />
              <TextField label={t('For how long?')} value={tx.homeExercise?.duration}
                onChange={(v) => updateTx('homeExercise.duration', v)} placeholder={t('e.g., 2 months')}
                suggestions={PT_DURATIONS} />
              <TextField label={t('How frequent?')} value={tx.homeExercise?.frequency}
                onChange={(v) => updateTx('homeExercise.frequency', v)} placeholder={t('e.g., Daily, 3x per week')}
                suggestions={HEP_FREQUENCIES} />
              <div className="sm:col-span-2">
                <TextField label={t('What did you work on?')} value={tx.homeExercise?.details}
                  onChange={(v) => updateTx('homeExercise.details', v)} placeholder={t('e.g., Core strengthening, stretching, walking program')}
                  suggestions={HEP_FOCUS} />
              </div>
            </div>
          </TreatmentToggle>

          <TreatmentToggle label={t('Chiropractic care')} tried={tx.chiropracticCare?.tried} onToggle={(v) => updateTx('chiropracticCare.tried', v)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="form-label text-sm">{t('Duration')}</label>
                <input type="text" value={tx.chiropracticCare?.duration || ''}
                  onChange={(e) => updateTx('chiropracticCare.duration', e.target.value)} placeholder={t('How long did you go?')} />
              </div>
              <HelpedSelect value={tx.chiropracticCare?.helped} onChange={(v) => updateTx('chiropracticCare.helped', v)} />
            </div>
          </TreatmentToggle>

          <TreatmentToggle label={t('Acupuncture')} tried={tx.acupuncture?.tried} onToggle={(v) => updateTx('acupuncture.tried', v)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="form-label text-sm">{t('Duration')}</label>
                <input type="text" value={tx.acupuncture?.duration || ''}
                  onChange={(e) => updateTx('acupuncture.duration', e.target.value)} placeholder={t('How long?')} />
              </div>
              <HelpedSelect value={tx.acupuncture?.helped} onChange={(v) => updateTx('acupuncture.helped', v)} />
            </div>
          </TreatmentToggle>

          <TreatmentToggle label={t('Back brace or cervical collar')} tried={tx.braces?.tried} onToggle={(v) => updateTx('braces.tried', v)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="form-label text-sm">{t('Type')}</label>
                <input type="text" value={tx.braces?.type || ''}
                  onChange={(e) => updateTx('braces.type', e.target.value)} placeholder={t('What kind?')} />
              </div>
              <HelpedSelect value={tx.braces?.helped} onChange={(v) => updateTx('braces.helped', v)} />
            </div>
          </TreatmentToggle>

          {/* Injections */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="text-base font-medium text-navy-600 mb-1">{t('Injections')}</h4>
            <p className="text-sm text-gray-400 mb-3">
              {t('Have you had any spine injections? Add each one with as much detail as you can — this is important for insurance authorization.')}
            </p>

            {(tx.injections || []).map((inj, i) => (
              <div key={i} className="flex items-start gap-2 mb-2 p-2 bg-teal-50 rounded-lg text-sm">
                <span className="flex-1 text-teal-700">
                  {inj.type}{inj.location && ` — ${inj.location}`} {inj.when && `(${inj.when})`}
                  {' — '}{inj.helped || 'unknown response'}
                  {inj.reliefDuration && `, relief lasted ${inj.reliefDuration}`}
                  {inj.count && `, ${inj.count}x`}
                  {inj.provider && ` · by ${inj.provider}`}
                </span>
                <button onClick={() => removeInjection(i)} className="text-gray-400 hover:text-red-500 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              <select value={newInjection.type} onChange={(e) => setNewInjection((p) => ({ ...p, type: e.target.value }))}>
                <option value="">{t('Injection type...')}</option>
                {INJECTION_TYPES.map((it) => (<option key={it} value={it}>{t(it)}</option>))}
              </select>
              <input type="text" value={newInjection.location}
                onChange={(e) => setNewInjection((p) => ({ ...p, location: e.target.value }))} placeholder={t('Where? (e.g., L4-L5, left side)')} />
              <input type="text" value={newInjection.provider}
                onChange={(e) => setNewInjection((p) => ({ ...p, provider: e.target.value }))} placeholder={t('Who did it? (doctor / clinic)')} />
              <input type="text" value={newInjection.when}
                onChange={(e) => setNewInjection((p) => ({ ...p, when: e.target.value }))} placeholder={t('When? (e.g., June 2024)')} />
              <input type="text" value={newInjection.count}
                onChange={(e) => setNewInjection((p) => ({ ...p, count: e.target.value }))} placeholder={t('How many? (e.g., 3)')} />
              <input type="text" value={newInjection.reliefDuration}
                onChange={(e) => setNewInjection((p) => ({ ...p, reliefDuration: e.target.value }))} placeholder={t('How long did relief last? (e.g., 2 weeks)')} />
              <select value={newInjection.helped} onChange={(e) => setNewInjection((p) => ({ ...p, helped: e.target.value }))} className="sm:col-span-2">
                <option value="">{t('Did it help?')}</option>
                <option value="Helped a lot">{t('Helped a lot')}</option>
                <option value="Helped temporarily">{t('Helped temporarily')}</option>
                <option value="Helped somewhat">{t('Helped somewhat')}</option>
                <option value="Did not help">{t('Did not help')}</option>
              </select>
            </div>
            <button onClick={addInjection} disabled={!newInjection.type} className="btn-secondary text-sm mt-3">
              {t('+ Add Injection')}
            </button>
            <RecordsNote text={t('Injection records or procedure notes: upload them at the Records step, or bring them to your visit.')} />
          </div>

          {/* Prior Imaging */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="text-base font-medium text-navy-600 mb-3">{t('Prior Imaging')}</h4>
            <p className="text-sm text-gray-400 mb-3">{t('What imaging studies have you had for your spine?')}</p>
            <div className="flex flex-wrap gap-2">
              {['X-rays', 'MRI', 'CT scan', 'Myelogram', 'Bone density scan (DEXA)', 'None'].map((img) => {
                const selected = (tx.priorImaging || []).includes(img);
                return (
                  <button key={img}
                    onClick={() => {
                      const current = tx.priorImaging || [];
                      setNested('hpiData.conservativeTreatments.priorImaging',
                        selected ? current.filter((x) => x !== img) : [...current, img]);
                    }}
                    className={`chip ${selected ? 'chip-selected' : 'chip-unselected'}`}>
                    {t(img)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* EMG */}
          <TreatmentToggle label={t('EMG or nerve conduction study')} tried={tx.priorEMG?.done} onToggle={(v) => updateTx('priorEMG.done', v)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <TextField label={t('When?')} value={tx.priorEMG?.when}
                onChange={(v) => updateTx('priorEMG.when', v)} placeholder={t('e.g., March 2024')} />
              <TextField label={t('Where? (facility & city)')} value={tx.priorEMG?.facility}
                onChange={(v) => updateTx('priorEMG.facility', v)} placeholder={t('e.g., Denver Neuro Clinic')} />
              <TextField label={t('Who did it?')} value={tx.priorEMG?.provider}
                onChange={(v) => updateTx('priorEMG.provider', v)} placeholder={t('Physician / provider name')} />
              <TextField label={t('Results (if known)')} value={tx.priorEMG?.results}
                onChange={(v) => updateTx('priorEMG.results', v)} placeholder={t('What did it show?')} />
            </div>
            <RecordsNote text={t('Your EMG / nerve study report: upload it at the Records step, or bring a copy to your visit.')} />
          </TreatmentToggle>
        </div>
      </div>

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext nextLabel={t('Continue to Additional Details')} />
    </div>
  );
}


/**
 * A text field that will answer itself.
 *
 * `suggestions` are the answers most patients actually give, one tap each.
 * Double-tapping the empty field adopts the greyed-out example instead — that
 * is where people's instinct sends them when they see ghost text they agree
 * with. Both paths leave the value completely editable afterwards.
 */
// The answers patients actually give. Kept short deliberately: a long row of
// chips is slower to read than typing, and the point is to save time.
const PT_DURATIONS = ['6 weeks', '3 months', '6 months', 'More than a year'];
const VISIT_FREQUENCIES = ['1x per week', '2x per week', '3x per week'];
const HEP_SOURCES = ['None', 'Printed handout', 'YouTube', 'Phone app'];
const HEP_FREQUENCIES = ['Daily', '3x per week', 'A few times a month'];
const HEP_FOCUS = ['Core strengthening', 'Stretching', 'Walking program'];

function TextField({ label, value, onChange, placeholder, suggestions }) {
  const adopt = useAdoptExample(value, placeholder, onChange);
  return (
    <div>
      <label className="form-label text-sm">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        title={!value ? placeholder : undefined}
        {...adopt}
      />
      <SuggestedAnswers suggestions={suggestions} value={value} onPick={onChange} />
    </div>
  );
}

function RecordsNote({ text }) {
  return (
    <p className="flex items-start gap-2 text-xs text-teal-700 bg-teal-50 rounded-lg px-3 py-2 mt-3">
      <span aria-hidden="true">📄</span>
      <span>{text}</span>
    </p>
  );
}

function HelpedSelect({ value, onChange, includeWorse }) {
  const lang = useLang();
  const t = makeT(COMMON, lang);
  return (
    <div>
      <label className="form-label text-sm">{t('Did it help?')}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t('Select...')}</option>
        <option value="Helped a lot">{t('Helped a lot')}</option>
        <option value="Helped somewhat">{t('Helped somewhat')}</option>
        <option value="Helped temporarily">{t('Helped temporarily')}</option>
        <option value="Did not help">{t('Did not help')}</option>
        {includeWorse && <option value="Made it worse">{t('Made it worse')}</option>}
      </select>
    </div>
  );
}

function TreatmentToggle({ label, tried, onToggle, children }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-base font-medium text-gray-700">{label}</span>
        <div className="flex gap-2">
          <button onClick={() => onToggle(true)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              tried === true ? 'bg-teal-100 text-teal-700 border border-teal-300' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}>Yes</button>
          <button onClick={() => onToggle(false)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              tried === false ? 'bg-gray-100 text-gray-700 border border-gray-300' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}>No</button>
        </div>
      </div>
      {tried && children}
    </div>
  );
}
