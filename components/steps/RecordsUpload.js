'use client';

import { useState, useEffect } from 'react';
import { useIntake } from '../../lib/store';
import { useLang, makeT, COMMON } from '../../lib/i18n';
import StepNavigation from '../ui/StepNavigation';
import {
  DOCUMENT_CATEGORIES,
  ACCEPTED_TYPES,
  addDocument,
  listDocuments,
  deleteDocument,
  formatBytes,
  suggestedCategories,
} from '../../lib/documents';

const MED_CLASSES = [
  'Anti-inflammatories (NSAIDs)',
  'Acetaminophen (Tylenol)',
  'Oral steroids',
  'Nerve pain medication (gabapentin, pregabalin)',
  'Muscle relaxants',
  'Opioid pain medication',
];

const LOCAL = {
  'Records & Documents': { es: 'Registros y documentos', zh: '记录与文件' },
  'Insurance companies require proof of what you have already tried before they will approve spine treatment. The more of this you can give us now, the less likely your care is delayed later.':
    {
      es: 'Las compañías de seguros exigen pruebas de lo que ya ha intentado antes de aprobar un tratamiento de columna. Cuanto más pueda darnos ahora, menos probable será que su atención se retrase.',
      zh: '保险公司在批准脊柱治疗前，需要您已尝试过哪些治疗的证明。您现在提供得越多，日后您的治疗被延误的可能性就越小。',
    },

  // Imaging
  'Your Imaging': { es: 'Sus estudios de imagen', zh: '您的影像检查' },
  'You told us you have had the studies below. Insurers need the date and where it was done.':
    {
      es: 'Nos indicó que se realizó los estudios siguientes. Las aseguradoras necesitan la fecha y el lugar donde se realizaron.',
      zh: '您告诉我们您做过以下检查。保险公司需要知道检查日期和地点。',
    },
  'You have not told us about any imaging yet. You can go back and add it, or upload reports below.':
    {
      es: 'Aún no nos ha informado sobre ningún estudio de imagen. Puede volver atrás y agregarlo, o subir los informes abajo.',
      zh: '您尚未告诉我们任何影像检查。您可以返回添加，或在下方上传报告。',
    },
  'Approximate date': { es: 'Fecha aproximada', zh: '大约日期' },
  'Where was it done?': { es: '¿Dónde se realizó?', zh: '在哪里做的？' },
  'e.g., June 2025': { es: 'p. ej., junio de 2025', zh: '例如 2025年6月' },
  'Facility or imaging center': { es: 'Centro médico o de imágenes', zh: '医疗机构或影像中心' },
  'I have the written report': { es: 'Tengo el informe escrito', zh: '我有书面报告' },
  'I have the images (CD/portal)': { es: 'Tengo las imágenes (CD/portal)', zh: '我有影像（光盘/门户）' },

  // Medications
  'Medications You Have Tried for This Problem': {
    es: 'Medicamentos que ha probado para este problema',
    zh: '您为此问题尝试过的药物',
  },
  'Insurers usually want to see that medication was tried before surgery. Select any you have used for these symptoms.':
    {
      es: 'Las aseguradoras suelen querer ver que se probaron medicamentos antes de la cirugía. Seleccione los que haya usado para estos síntomas.',
      zh: '保险公司通常希望看到手术前曾尝试过药物治疗。请选择您为这些症状使用过的药物。',
    },
  'How long did you take it?': { es: '¿Por cuánto tiempo lo tomó?', zh: '您服用了多久？' },
  'e.g., 6 weeks': { es: 'p. ej., 6 semanas', zh: '例如 6周' },

  // Conservative care window
  'When did you start and stop non-surgical treatment?': {
    es: '¿Cuándo comenzó y terminó el tratamiento no quirúrgico?',
    zh: '您何时开始和结束非手术治疗？',
  },
  'Many plans require a minimum period of documented non-surgical care. Approximate dates are fine.':
    {
      es: 'Muchos planes exigen un período mínimo de atención no quirúrgica documentada. Las fechas aproximadas son suficientes.',
      zh: '许多保险计划要求有记录的非手术治疗达到最短时长。大致日期即可。',
    },
  'Started around': { es: 'Comenzó alrededor de', zh: '大约开始于' },
  'Most recent treatment': { es: 'Tratamiento más reciente', zh: '最近一次治疗' },
  'Still ongoing': { es: 'Aún en curso', zh: '仍在进行' },

  // Nicotine
  'Nicotine Use': { es: 'Consumo de nicotina', zh: '尼古丁使用情况' },
  'Some spine procedures have specific nicotine requirements, so we need a little more detail than usual.':
    {
      es: 'Algunos procedimientos de columna tienen requisitos específicos sobre la nicotina, por lo que necesitamos un poco más de detalle de lo habitual.',
      zh: '某些脊柱手术对尼古丁有特定要求，因此我们需要比平时更详细的信息。',
    },
  'Do you currently use any nicotine?': { es: '¿Consume nicotina actualmente?', zh: '您目前使用尼古丁吗？' },
  'Never used': { es: 'Nunca he consumido', zh: '从未使用' },
  'Yes, currently': { es: 'Sí, actualmente', zh: '是，目前在用' },
  'Quit in the past': { es: 'Lo dejé en el pasado', zh: '过去已戒除' },
  'What product?': { es: '¿Qué producto?', zh: '哪种产品？' },
  'Cigarettes, vape, chew, patch, etc.': { es: 'Cigarrillos, vapeador, tabaco de mascar, parche, etc.', zh: '香烟、电子烟、嚼烟、贴片等' },
  'When did you quit?': { es: '¿Cuándo lo dejó?', zh: '您何时戒除的？' },
  'Would you be willing to stop before surgery?': {
    es: '¿Estaría dispuesto a dejarlo antes de la cirugía?',
    zh: '您愿意在手术前戒除吗？',
  },
  'Not sure': { es: 'No estoy seguro', zh: '不确定' },

  // Uploads
  'Upload Your Records': { es: 'Suba sus registros', zh: '上传您的记录' },
  'Add any documents you have. Photos of paper records are fine — just make sure the text is readable.':
    {
      es: 'Agregue los documentos que tenga. Las fotos de registros en papel son aceptables, solo asegúrese de que el texto sea legible.',
      zh: '请添加您拥有的任何文件。纸质记录的照片也可以，只要文字清晰可读即可。',
    },
  'Recommended for you': { es: 'Recomendado para usted', zh: '建议您提供' },
  'Add files': { es: 'Agregar archivos', zh: '添加文件' },
  'Remove': { es: 'Quitar', zh: '移除' },
  'No files added': { es: 'No se agregaron archivos', zh: '未添加文件' },
  'Anything else we should know about these records?': {
    es: '¿Algo más que debamos saber sobre estos registros?',
    zh: '关于这些记录，还有什么需要我们了解的吗？',
  },
  "For example: my PT records are at a clinic that closed, or I've requested my MRI report but don't have it yet.":
    {
      es: 'Por ejemplo: mis registros de fisioterapia están en una clínica que cerró, o solicité mi informe de resonancia pero aún no lo tengo.',
      zh: '例如：我的物理治疗记录在一家已关闭的诊所，或者我已申请磁共振报告但尚未收到。',
    },

  // Readiness
  'Documentation Checklist': { es: 'Lista de documentación', zh: '文件清单' },
  'Based on what you have told us, these are the records most likely to be requested by your insurance.':
    {
      es: 'Según lo que nos ha contado, estos son los registros que su seguro probablemente solicitará.',
      zh: '根据您告诉我们的信息，以下是您的保险最可能索取的记录。',
    },
  'Received': { es: 'Recibido', zh: '已收到' },
  'Still needed': { es: 'Aún se necesita', zh: '仍需提供' },
  "Don't worry if you can't find everything — our office can request records on your behalf.":
    {
      es: 'No se preocupe si no encuentra todo: nuestra oficina puede solicitar los registros en su nombre.',
      zh: '如果您找不到所有材料也不用担心——我们的办公室可以代您索取记录。',
    },
  'These files stay on this device only and are not uploaded to a server.': {
    es: 'Estos archivos permanecen solo en este dispositivo y no se suben a ningún servidor.',
    zh: '这些文件仅保存在本设备上，不会上传到服务器。',
  },

  // Med classes
  'Anti-inflammatories (NSAIDs)': { es: 'Antiinflamatorios (AINE)', zh: '消炎药（非甾体抗炎药）' },
  'Acetaminophen (Tylenol)': { es: 'Acetaminofén (Tylenol)', zh: '对乙酰氨基酚（泰诺）' },
  'Oral steroids': { es: 'Esteroides orales', zh: '口服类固醇' },
  'Nerve pain medication (gabapentin, pregabalin)': {
    es: 'Medicamentos para el dolor nervioso (gabapentina, pregabalina)',
    zh: '神经痛药物（加巴喷丁、普瑞巴林）',
  },
  'Muscle relaxants': { es: 'Relajantes musculares', zh: '肌肉松弛剂' },
  'Opioid pain medication': { es: 'Analgésicos opioides', zh: '阿片类止痛药' },

  // Document categories
  'Physical therapy notes': { es: 'Notas de fisioterapia', zh: '物理治疗记录' },
  'Visit notes, evaluation, or discharge summary showing dates, frequency, and your response.': {
    es: 'Notas de visitas, evaluación o resumen de alta que muestren fechas, frecuencia y su respuesta.',
    zh: '显示日期、频率和您的治疗反应的就诊记录、评估或出院小结。',
  },
  'Injection & procedure records': { es: 'Registros de inyecciones y procedimientos', zh: '注射与操作记录' },
  'Procedure notes showing the level injected, the date, and how long relief lasted.': {
    es: 'Notas del procedimiento que muestren el nivel inyectado, la fecha y cuánto duró el alivio.',
    zh: '显示注射节段、日期以及缓解持续时间的操作记录。',
  },
  'Imaging reports (MRI, CT, X-ray)': { es: 'Informes de imágenes (RM, TC, radiografía)', zh: '影像报告（磁共振、CT、X光）' },
  'The written radiology report is what matters most — not the images themselves.': {
    es: 'Lo que más importa es el informe escrito de radiología, no las imágenes en sí.',
    zh: '最重要的是书面放射科报告，而不是影像本身。',
  },
  'EMG / nerve conduction study': { es: 'EMG / estudio de conducción nerviosa', zh: '肌电图／神经传导检查' },
  'The full report from your nerve study.': { es: 'El informe completo de su estudio nervioso.', zh: '您神经检查的完整报告。' },
  'Prior operative reports': { es: 'Informes quirúrgicos previos', zh: '既往手术记录' },
  'Operative notes from any previous spine surgery.': {
    es: 'Notas quirúrgicas de cualquier cirugía de columna previa.',
    zh: '任何既往脊柱手术的手术记录。',
  },
  'Other provider notes': { es: 'Notas de otros proveedores', zh: '其他医疗提供者的记录' },
  'Office notes from your primary care doctor, pain management, chiropractor, or neurologist.': {
    es: 'Notas de consulta de su médico de cabecera, manejo del dolor, quiropráctico o neurólogo.',
    zh: '您的家庭医生、疼痛科、脊椎推拿师或神经科医生的门诊记录。',
  },
  'Anything else': { es: 'Cualquier otra cosa', zh: '其他材料' },
  'Any other records you think would help.': {
    es: 'Cualquier otro registro que crea que pueda ayudar.',
    zh: '您认为有帮助的任何其他记录。',
  },

  // Imaging study names (mirrors the options offered in Prior Treatments)
  'X-rays': { es: 'Radiografías', zh: 'X光片' },
  'MRI': { es: 'Resonancia magnética (MRI)', zh: '磁共振（MRI）' },
  'CT scan': { es: 'Tomografía (TC)', zh: 'CT扫描' },
  'Myelogram': { es: 'Mielografía', zh: '脊髓造影' },
  'Bone density scan (DEXA)': { es: 'Densitometría ósea (DEXA)', zh: '骨密度扫描（DEXA）' },

  'Continue to Additional Details': { es: 'Continuar a detalles adicionales', zh: '继续到其他详情' },
  'Skip — I have no records to add': { es: 'Omitir — no tengo registros que agregar', zh: '跳过 — 我没有记录要添加' },
};

export default function RecordsUpload({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

  const ev = data.authEvidence || {};
  const tx = data.hpiData?.conservativeTreatments || {};
  const selectedImaging = (tx.priorImaging || []).filter((i) => i && i !== 'None');
  const suggested = suggestedCategories(data);

  const [docs, setDocs] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Load any previously added files for this session.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listDocuments(data.sessionId);
      if (!cancelled) {
        setDocs(list);
        setNested('documents', list);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateEv = (field, value) => setNested(`authEvidence.${field}`, value);

  const handleFiles = async (e, category) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-picking the same file
    if (!files.length || !category) return;
    setError('');

    setBusy(true);
    setError('');
    try {
      for (const file of files) {
        await addDocument({ sessionId: data.sessionId, category, file });
      }
      const list = await listDocuments(data.sessionId);
      setDocs(list);
      setNested('documents', list);
    } catch (err) {
      setError(err?.message || 'Could not add that file.');
    } finally {
      setBusy(false);
    }
  };

  const removeDoc = async (id) => {
    await deleteDocument(id);
    const list = await listDocuments(data.sessionId);
    setDocs(list);
    setNested('documents', list);
  };

  // --- Imaging detail helpers -------------------------------------------
  const imagingEntry = (study) =>
    (ev.imagingStudies || []).find((s) => s.study === study) || {};

  const updateImaging = (study, field, value) => {
    const current = ev.imagingStudies || [];
    const idx = current.findIndex((s) => s.study === study);
    const next = [...current];
    if (idx === -1) next.push({ study, [field]: value });
    else next[idx] = { ...next[idx], [field]: value };
    updateEv('imagingStudies', next);
  };

  // --- Medication trial helpers -----------------------------------------
  const medEntry = (cls) => (ev.medicationTrials || []).find((m) => m.drugClass === cls) || null;

  const toggleMed = (cls) => {
    const current = ev.medicationTrials || [];
    const exists = current.some((m) => m.drugClass === cls);
    updateEv(
      'medicationTrials',
      exists ? current.filter((m) => m.drugClass !== cls) : [...current, { drugClass: cls, duration: '', helped: '' }]
    );
  };

  const updateMed = (cls, field, value) => {
    const current = ev.medicationTrials || [];
    updateEv('medicationTrials', current.map((m) => (m.drugClass === cls ? { ...m, [field]: value } : m)));
  };

  const docsIn = (categoryId) => docs.filter((d) => d.category === categoryId);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('Records & Documents')}</h2>
        <p className="section-subtitle">
          {t('Insurance companies require proof of what you have already tried before they will approve spine treatment. The more of this you can give us now, the less likely your care is delayed later.')}
        </p>
      </div>

      {/* ---------------- Imaging details ---------------- */}
      <div className="card mb-4">
        <h3 className="text-base font-medium text-navy-600 mb-1">{t('Your Imaging')}</h3>
        <p className="text-sm text-gray-400 mb-4">
          {selectedImaging.length
            ? t('You told us you have had the studies below. Insurers need the date and where it was done.')
            : t('You have not told us about any imaging yet. You can go back and add it, or upload reports below.')}
        </p>

        <div className="space-y-4">
          {selectedImaging.map((study) => {
            const entry = imagingEntry(study);
            return (
              <div key={study} className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-navy-600 mb-3">{t(study)}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label text-sm">{t('Approximate date')}</label>
                    <input type="text" value={entry.date || ''}
                      onChange={(e) => updateImaging(study, 'date', e.target.value)}
                      placeholder={t('e.g., June 2025')} />
                  </div>
                  <div>
                    <label className="form-label text-sm">{t('Where was it done?')}</label>
                    <input type="text" value={entry.facility || ''}
                      onChange={(e) => updateImaging(study, 'facility', e.target.value)}
                      placeholder={t('Facility or imaging center')} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={!!entry.hasReport}
                      onChange={(e) => updateImaging(study, 'hasReport', e.target.checked)} />
                    {t('I have the written report')}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={!!entry.hasImages}
                      onChange={(e) => updateImaging(study, 'hasImages', e.target.checked)} />
                    {t('I have the images (CD/portal)')}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------- Medication trials ---------------- */}
      <div className="card mb-4">
        <h3 className="text-base font-medium text-navy-600 mb-1">
          {t('Medications You Have Tried for This Problem')}
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          {t('Insurers usually want to see that medication was tried before surgery. Select any you have used for these symptoms.')}
        </p>
        <div className="space-y-3">
          {MED_CLASSES.map((cls) => {
            const entry = medEntry(cls);
            return (
              <div key={cls} className="border border-gray-200 rounded-xl p-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={!!entry} onChange={() => toggleMed(cls)} />
                  <span className="text-sm font-medium text-gray-700">{t(cls)}</span>
                </label>
                {entry && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pl-8">
                    <div>
                      <label className="form-label text-sm">{t('How long did you take it?')}</label>
                      <input type="text" value={entry.duration || ''}
                        onChange={(e) => updateMed(cls, 'duration', e.target.value)}
                        placeholder={t('e.g., 6 weeks')} />
                    </div>
                    <div>
                      <label className="form-label text-sm">{t('Did it help?')}</label>
                      <select value={entry.helped || ''} onChange={(e) => updateMed(cls, 'helped', e.target.value)}>
                        <option value="">{t('Select...')}</option>
                        {['Helped a lot', 'Helped somewhat', 'Helped temporarily', 'Did not help'].map((o) => (
                          <option key={o} value={o}>{t(o)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------- Conservative care window ---------------- */}
      <div className="card mb-4">
        <h3 className="text-base font-medium text-navy-600 mb-1">
          {t('When did you start and stop non-surgical treatment?')}
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          {t('Many plans require a minimum period of documented non-surgical care. Approximate dates are fine.')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label text-sm">{t('Started around')}</label>
            <input type="text" value={ev.conservativeCareStart || ''}
              onChange={(e) => updateEv('conservativeCareStart', e.target.value)}
              placeholder={t('e.g., June 2025')} />
          </div>
          <div>
            <label className="form-label text-sm">{t('Most recent treatment')}</label>
            <input type="text" value={ev.conservativeCareEnd || ''}
              onChange={(e) => updateEv('conservativeCareEnd', e.target.value)}
              placeholder={t('Still ongoing')} />
          </div>
        </div>
      </div>

      {/* ---------------- Nicotine ---------------- */}
      <div className="card mb-4">
        <h3 className="text-base font-medium text-navy-600 mb-1">{t('Nicotine Use')}</h3>
        <p className="text-sm text-gray-400 mb-4">
          {t('Some spine procedures have specific nicotine requirements, so we need a little more detail than usual.')}
        </p>
        <label className="form-label">{t('Do you currently use any nicotine?')}</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {['Never used', 'Yes, currently', 'Quit in the past'].map((opt) => (
            <button key={opt} onClick={() => updateEv('nicotineCurrent', opt)}
              className={`chip ${ev.nicotineCurrent === opt ? 'chip-selected' : 'chip-unselected'}`}>
              {t(opt)}
            </button>
          ))}
        </div>

        {ev.nicotineCurrent === 'Yes, currently' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label text-sm">{t('What product?')}</label>
              <input type="text" value={ev.nicotineProduct || ''}
                onChange={(e) => updateEv('nicotineProduct', e.target.value)}
                placeholder={t('Cigarettes, vape, chew, patch, etc.')} />
            </div>
            <div>
              <label className="form-label text-sm">{t('Would you be willing to stop before surgery?')}</label>
              <select value={ev.nicotineWillingToQuit || ''}
                onChange={(e) => updateEv('nicotineWillingToQuit', e.target.value)}>
                <option value="">{t('Select...')}</option>
                {['Yes', 'No', 'Not sure'].map((o) => (
                  <option key={o} value={o}>{t(o)}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {ev.nicotineCurrent === 'Quit in the past' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label text-sm">{t('When did you quit?')}</label>
              <input type="text" value={ev.nicotineQuitDate || ''}
                onChange={(e) => updateEv('nicotineQuitDate', e.target.value)}
                placeholder={t('e.g., June 2025')} />
            </div>
            <div>
              <label className="form-label text-sm">{t('What product?')}</label>
              <input type="text" value={ev.nicotineProduct || ''}
                onChange={(e) => updateEv('nicotineProduct', e.target.value)}
                placeholder={t('Cigarettes, vape, chew, patch, etc.')} />
            </div>
          </div>
        )}
      </div>

      {/* ---------------- Uploads ---------------- */}
      <div className="card mb-4">
        <h3 className="text-base font-medium text-navy-600 mb-1">{t('Upload Your Records')}</h3>
        <p className="text-sm text-gray-400 mb-2">
          {t('Add any documents you have. Photos of paper records are fine — just make sure the text is readable.')}
        </p>
        <p className="text-xs text-teal-700 bg-teal-50 rounded-lg px-3 py-2 mb-4">
          🔒 {t('These files stay on this device only and are not uploaded to a server.')}
        </p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="space-y-3">
          {DOCUMENT_CATEGORIES.map((cat) => {
            const catDocs = docsIn(cat.id);
            const isSuggested = suggested.has(cat.id);
            return (
              <div key={cat.id}
                className={`border rounded-xl p-4 ${isSuggested && catDocs.length === 0 ? 'border-amber-300 bg-amber-50/40' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-navy-600">{t(cat.label)}</span>
                      {isSuggested && (
                        <span className="text-[11px] font-medium text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                          {t('Recommended for you')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{t(cat.hint)}</p>
                  </div>
                  <input
                    id={`file-input-${cat.id}`}
                    data-testid={`file-input-${cat.id}`}
                    type="file"
                    multiple
                    accept={ACCEPTED_TYPES}
                    onChange={(e) => handleFiles(e, cat.id)}
                    className="hidden"
                  />
                  <label
                    htmlFor={`file-input-${cat.id}`}
                    className={`btn-secondary text-sm py-2 px-4 cursor-pointer select-none ${busy ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    + {t('Add files')}
                  </label>
                </div>

                {catDocs.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {catDocs.map((d) => (
                      <li key={d.id} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2">
                        <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="flex-1 text-sm text-gray-700 truncate">{d.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{formatBytes(d.size)}</span>
                        <button onClick={() => removeDoc(d.id)}
                          className="text-gray-400 hover:text-red-500 flex-shrink-0" title={t('Remove')}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5">
          <label className="form-label text-sm">{t('Anything else we should know about these records?')}</label>
          <textarea
            value={ev.recordsNotes || ''}
            onChange={(e) => updateEv('recordsNotes', e.target.value)}
            placeholder={t("For example: my PT records are at a clinic that closed, or I've requested my MRI report but don't have it yet.")}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 resize-none"
          />
        </div>
      </div>

      {/* ---------------- Checklist ---------------- */}
      {suggested.size > 0 && (
        <div className="card mb-4 bg-navy-50/40 border-navy-100">
          <h3 className="text-base font-medium text-navy-600 mb-1">{t('Documentation Checklist')}</h3>
          <p className="text-sm text-gray-500 mb-4">
            {t('Based on what you have told us, these are the records most likely to be requested by your insurance.')}
          </p>
          <ul className="space-y-2">
            {DOCUMENT_CATEGORIES.filter((c) => suggested.has(c.id)).map((cat) => {
              const have = docsIn(cat.id).length > 0;
              return (
                <li key={cat.id} className="flex items-center gap-3 text-sm">
                  {have ? (
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex-shrink-0" />
                  )}
                  <span className="text-gray-700">{t(cat.label)}</span>
                  <span className={`text-xs font-medium ${have ? 'text-green-700' : 'text-amber-700'}`}>
                    {have ? t('Received') : t('Still needed')}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-gray-500 mt-4">
            {t("Don't worry if you can't find everything — our office can request records on your behalf.")}
          </p>
        </div>
      )}

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext
        nextLabel={t('Continue to Additional Details')}
        showSkip
        skipLabel={t('Skip — I have no records to add')}
      />
    </div>
  );
}
