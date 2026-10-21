'use client';

import { useState, useEffect, useMemo } from 'react';
import { useIntake, useService } from '../../lib/store';
import { useLang, makeT, COMMON } from '../../lib/i18n';
import { stepsForVisit } from '../../lib/flows';
import StepNavigation from '../ui/StepNavigation';
import ImagingUpload from '../ImagingUpload';
import SuggestedAnswers from '../ui/SuggestedAnswers';
import {
  documentCategoriesFor,
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

/**
 * What a medication on the patient's list says about the classes above, so a
 * class the patient already takes is ticked for them rather than asked again.
 */
const MED_CLASS_PATTERNS = {
  'Anti-inflammatories (NSAIDs)': /ibuprofen|advil|motrin|naproxen|aleve|naprosyn|meloxicam|mobic|diclofenac|voltaren|celecoxib|celebrex|ketorolac|toradol|indomethacin|etodolac|nabumetone|piroxicam|aspirin|nsaid/i,
  'Acetaminophen (Tylenol)': /acetaminophen|tylenol|paracetamol/i,
  'Oral steroids': /prednisone|prednisolone|methylprednisolone|medrol|dexamethasone/i,
  'Nerve pain medication (gabapentin, pregabalin)': /gabapentin|neurontin|gralise|pregabalin|lyrica|duloxetine|cymbalta|amitriptyline|nortriptyline/i,
  'Muscle relaxants': /cyclobenzaprine|flexeril|methocarbamol|robaxin|tizanidine|zanaflex|baclofen|carisoprodol|soma\b|metaxalone|skelaxin/i,
  'Opioid pain medication': /oxycodone|oxycontin|percocet|hydrocodone|vicodin|norco|tramadol|ultram|morphine|codeine|tapentadol|nucynta|hydromorphone|dilaudid|fentanyl|methadone|buprenorphine|suboxone/i,
};

const medClassOf = (name) => MED_CLASSES.find((cls) => MED_CLASS_PATTERNS[cls].test(String(name || ''))) || '';

/** The studies the Records step offers, by specialty. Stored in English. */
const IMAGING_STUDIES = {
  spine: ['X-rays', 'MRI', 'CT scan', 'Myelogram', 'Bone density scan (DEXA)'],
  ortho: ['X-rays', 'MRI', 'CT scan', 'Ultrasound', 'Bone density scan (DEXA)'],
};

/** The kinds of visit that ask about the care before this one (not a follow-up or a post-operative visit). */
const NEW_KINDS = ['new', 'new_problem', 'workers_comp', 'personal_injury'];

const LOCAL = {
  'Records & Documents': { es: 'Registros y documentos', zh: '记录与文件' },
  'Insurance companies require proof of what you have already tried before they will approve spine treatment. The more of this you can give us now, the less likely your care is delayed later.':
    {
      es: 'Las compañías de seguros exigen pruebas de lo que ya ha intentado antes de aprobar un tratamiento de columna. Cuanto más pueda darnos ahora, menos probable será que su atención se retrase.',
      zh: '保险公司在批准脊柱治疗前，需要您已尝试过哪些治疗的证明。您现在提供得越多，日后您的治疗被延误的可能性就越小。',
    },
  'Insurance companies require proof of what you have already tried before they will approve joint surgery, injections or advanced imaging. The more of this you can give us now, the less likely your care is delayed later.':
    {
      es: 'Las compañías de seguros exigen pruebas de lo que ya ha intentado antes de aprobar una cirugía articular, inyecciones o estudios de imagen avanzados. Cuanto más pueda darnos ahora, menos probable será que su atención se retrase.',
      zh: '保险公司在批准关节手术、注射或高级影像检查前，需要您已尝试过哪些治疗的证明。您现在提供得越多，日后您的治疗被延误的可能性就越小。',
    },

  // Imaging
  'Which imaging have you had for this problem? Tap all that apply.': {
    es: '¿Qué estudios de imagen se ha hecho para este problema? Toque todos los que apliquen.',
    zh: '您为这个问题做过哪些影像检查？请点选所有适用项。',
  },
  'No imaging yet': { es: 'Ninguno todavía', zh: '尚未做过' },
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
  'Ticked from your medication list. Add how long you took it and whether it helped.': {
    es: 'Marcado a partir de su lista de medicamentos. Agregue cuánto tiempo lo tomó y si le ayudó.',
    zh: '已根据您的用药清单勾选。请补充服用了多久以及是否有帮助。',
  },
  'From your medication list': { es: 'De su lista de medicamentos', zh: '来自您的用药清单' },
  'How long did you take it?': { es: '¿Por cuánto tiempo lo tomó?', zh: '您服用了多久？' },
  'e.g., 6 weeks': { es: 'p. ej., 6 semanas', zh: '例如 6周' },
  '2 weeks': { es: '2 semanas', zh: '2周' },
  '6 weeks': { es: '6 semanas', zh: '6周' },
  '3 months': { es: '3 meses', zh: '3个月' },
  '6 months': { es: '6 meses', zh: '6个月' },
  'More than a year': { es: 'Más de un año', zh: '一年以上' },

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
  'Taken from the dates you gave for your treatments. Change it if that is wrong.': {
    es: 'Tomado de las fechas que indicó para sus tratamientos. Cámbielo si no es correcto.',
    zh: '根据您为各项治疗填写的日期得出。如有误请修改。',
  },

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
  "Upload what you have. Anything you cannot find, you can bring to your appointment.": {
    es: 'Suba lo que tenga. Lo que no encuentre, puede traerlo a su cita.',
    zh: '有什么就上传什么。找不到的材料，可以在就诊时带来。',
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
  "If you have pictures or screenshots of your X-rays or other imaging, feel free to upload them here. If the imaging was done at a facility outside our system, please also try to get the actual images on a CD and bring it to your appointment. If you have the radiologist's report, please upload that here too.": {
    es: 'Si tiene fotos o capturas de pantalla de sus radiografías u otras imágenes, puede subirlas aquí. Si las imágenes se hicieron en un centro fuera de nuestro sistema, intente también conseguir las imágenes reales en un CD y tráigalo a su cita. Si tiene el informe del radiólogo, súbalo aquí también.',
    zh: '如果您有 X 光或其他影像的照片或截图，欢迎在此上传。如果影像是在我们系统以外的机构做的，也请尽量取得刻录了实际影像的光盘并带到就诊时。如果您有放射科医生的报告，也请在此上传。',
  },
  'EMG / nerve conduction study': { es: 'EMG / estudio de conducción nerviosa', zh: '肌电图／神经传导检查' },
  'The full report from your nerve study.': { es: 'El informe completo de su estudio nervioso.', zh: '您神经检查的完整报告。' },
  'Prior operative reports': { es: 'Informes quirúrgicos previos', zh: '既往手术记录' },
  'Operative notes from any previous spine surgery.': {
    es: 'Notas quirúrgicas de cualquier cirugía de columna previa.',
    zh: '任何既往脊柱手术的手术记录。',
  },
  'Operative notes from any previous bone or joint surgery.': {
    es: 'Notas quirúrgicas de cualquier cirugía previa de huesos o articulaciones.',
    zh: '任何既往骨骼或关节手术的手术记录。',
  },
  'Imaging reports (X-ray, MRI, CT, ultrasound)': { es: 'Informes de imágenes (radiografía, resonancia, tomografía, ecografía)', zh: '影像报告（X光、核磁、CT、超声）' },
  'Procedure notes showing the joint injected, the date, and how long relief lasted.': {
    es: 'Notas del procedimiento que muestren la articulación inyectada, la fecha y cuánto duró el alivio.',
    zh: '显示注射的关节、日期以及缓解持续时间的操作记录。',
  },
  'Office notes from your primary care doctor, the emergency room or urgent care, a rheumatologist, pain management, or a physical therapist.': {
    es: 'Notas de su médico de cabecera, de la sala de emergencias o de urgencias, de un reumatólogo, de manejo del dolor o de un fisioterapeuta.',
    zh: '您的初级保健医生、急诊室或急症护理、风湿科医生、疼痛科或物理治疗师的门诊记录。',
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

  // Imaging study names
  'X-rays': { es: 'Radiografías', zh: 'X光片' },
  'MRI': { es: 'Resonancia magnética (MRI)', zh: '磁共振（MRI）' },
  'CT scan': { es: 'Tomografía (TC)', zh: 'CT扫描' },
  'Myelogram': { es: 'Mielografía', zh: '脊髓造影' },
  'Ultrasound': { es: 'Ecografía', zh: '超声' },
  'Bone density scan (DEXA)': { es: 'Densitometría ósea (DEXA)', zh: '骨密度扫描（DEXA）' },

  // Navigation: the next step's name is filled in from the flow
  'Continue to {step}': { es: 'Continuar a {step}', zh: '继续到{step}' },
  'Additional Details': { es: 'Detalles adicionales', zh: '其他详情' },
  'Past Medical History': { es: 'Antecedentes médicos', zh: '既往病史' },
  'Medications': { es: 'Medicamentos', zh: '药物' },
  'Skip — I have no records to add': { es: 'Omitir — no tengo registros que agregar', zh: '跳过 — 我没有记录要添加' },
};

// ---------------------------------------------------------------------------
// Reading a month and year out of what the patient typed about a treatment
// ("3 months, spring 2024", "June 2024", "03/2024", "2023"), so the start of
// non-surgical care can be worked out instead of asked again.
// ---------------------------------------------------------------------------
const MONTH_NAMES = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const SEASONS = { spring: 3, summer: 6, fall: 9, autumn: 9, winter: 12, early: 1, mid: 6, late: 10 };

function monthYearIn(text) {
  const s = String(text || '').toLowerCase();
  const year = (y) => parseInt(y, 10);
  let m = /\b([a-z]+)\.?,?\s+((?:19|20)\d{2})\b/.exec(s);
  if (m) {
    const word = m[1];
    const idx = word.length >= 3 ? MONTH_NAMES.findIndex((name) => name.startsWith(word)) : -1;
    if (idx >= 0) return { y: year(m[2]), m: idx + 1 };
    if (SEASONS[word]) return { y: year(m[2]), m: SEASONS[word] };
  }
  m = /\b(\d{1,2})\/((?:19|20)\d{2})\b/.exec(s);
  if (m && +m[1] >= 1 && +m[1] <= 12) return { y: year(m[2]), m: +m[1] };
  m = /\b((?:19|20)\d{2})-(\d{1,2})\b/.exec(s);
  if (m && +m[2] >= 1 && +m[2] <= 12) return { y: year(m[1]), m: +m[2] };
  m = /\b((?:19|20)\d{2})\b/.exec(s);
  if (m) return { y: year(m[1]), m: 0 };
  return null;
}

/** The earliest month/year among the texts, as "June 2024" or "2024"; '' when none holds a date. */
function earliestDate(texts, MONTHS) {
  const found = texts.map(monthYearIn).filter(Boolean);
  if (!found.length) return '';
  found.sort((a, b) => a.y - b.y || (a.m || 7) - (b.m || 7));
  const first = found[0];
  return first.m ? `${MONTHS[first.m - 1]} ${first.y}` : String(first.y);
}

const MED_DURATIONS = ['2 weeks', '6 weeks', '3 months', '6 months', 'More than a year'];

export default function RecordsUpload({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const svc = useService();
  const categories = documentCategoriesFor(svc.specialty);
  const ortho = svc.specialty === 'ortho';
  const { MONTHS } = svc.operations;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

  const ev = data.authEvidence || {};
  const tx = data.hpiData?.conservativeTreatments || {};
  const priorImaging = tx.priorImaging || [];
  const selectedImaging = priorImaging.filter((i) => i && i !== 'None');
  const noImaging = priorImaging.includes('None') && selectedImaging.length === 0;
  const studies = IMAGING_STUDIES[svc.specialty] || IMAGING_STUDIES.spine;
  // A follow-up or post-operative visit is asked only about new imaging since
  // the last visit; the medicines tried and the care window belong to a new problem.
  const newKind = NEW_KINDS.includes(data.visit?.type || 'new');
  const interval = !newKind;
  const suggested = suggestedCategories(data);

  // The step after this one, by name, so the button says where it goes.
  const steps = stepsForVisit(data.visit?.type, svc, data);
  const nextStep = steps[steps.findIndex((s) => s.id === 'records') + 1];
  const nextLabel = nextStep ? t('Continue to {step}').replace('{step}', t(nextStep.label)) : t('Continue');

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

  const addFiles = async (files, category) => {
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

  const handleFiles = (e, category) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-picking the same file
    return addFiles(files, category);
  };

  const removeDoc = async (id) => {
    await deleteDocument(id);
    const list = await listDocuments(data.sessionId);
    setDocs(list);
    setNested('documents', list);
  };

  // --- Imaging: which studies, then the detail of each ------------------
  // The list of studies is the field the Prior Treatments step used to write
  // (hpiData.conservativeTreatments.priorImaging), so the note, the PDF, the
  // readiness engine and the document suggestions read it unchanged.
  const setPriorImaging = (list) => setNested('hpiData.conservativeTreatments.priorImaging', list);
  const toggleStudy = (study) => {
    const on = selectedImaging.includes(study);
    setPriorImaging(on ? selectedImaging.filter((s) => s !== study) : [...selectedImaging, study]);
  };
  const tapNoImaging = () => setPriorImaging(noImaging ? [] : ['None']);

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

  // --- Medication trials: pre-ticked from the medication list ----------
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

  // A class the patient already takes (the medication list, when it exists:
  // from the chart, an upload, or a draft) is ticked for them, once per
  // medication, so an untick is not undone the next time the step opens.
  const medNames = (data.medications?.current || []).map((m) => String(m?.name || '').trim()).filter(Boolean).join('|');
  useEffect(() => {
    if (!newKind || !medNames) return;
    const seeded = ev.medicationTrialsSeeded || [];
    const current = ev.medicationTrials || [];
    const add = [];
    const newlySeeded = [];
    for (const name of medNames.split('|')) {
      if (seeded.includes(name)) continue;
      newlySeeded.push(name);
      const cls = medClassOf(name);
      if (!cls || current.some((m) => m.drugClass === cls) || add.some((m) => m.drugClass === cls)) continue;
      add.push({ drugClass: cls, name, duration: '', helped: '' });
    }
    if (!newlySeeded.length) return;
    updateEv('medicationTrialsSeeded', [...seeded, ...newlySeeded]);
    if (add.length) updateEv('medicationTrials', [...current, ...add]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medNames, newKind]);

  // --- Care window: the start from the earliest treatment date given -----
  const derivedStart = useMemo(() => earliestDate([
    tx.physicalTherapy?.tried && tx.physicalTherapy.duration,
    tx.homeExercise?.tried && tx.homeExercise.duration,
    tx.chiropracticCare?.tried && tx.chiropracticCare.duration,
    tx.acupuncture?.tried && tx.acupuncture.duration,
    tx.braces?.tried && tx.braces.type,
    ...(tx.injections || []).map((i) => i?.when),
    tx.priorEMG?.done && tx.priorEMG.when,
    ...selectedImaging.map((s) => imagingEntry(s).date),
  ].filter(Boolean), MONTHS), [tx, ev.imagingStudies, MONTHS]); // eslint-disable-line react-hooks/exhaustive-deps

  // Written into the same field the patient used to type into, so nothing
  // downstream changes. A value the patient typed or cleared is left alone.
  useEffect(() => {
    if (!newKind || !derivedStart) return;
    if (ev.conservativeCareStartDerived === false) return;
    if (ev.conservativeCareStart && !ev.conservativeCareStartDerived) return;
    if (ev.conservativeCareStart === derivedStart) return;
    updateEv('conservativeCareStart', derivedStart);
    updateEv('conservativeCareStartDerived', true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedStart, newKind]);
  const startDerived = !!derivedStart && ev.conservativeCareStartDerived === true && ev.conservativeCareStart === derivedStart;
  const setStart = (value) => {
    updateEv('conservativeCareStart', value);
    updateEv('conservativeCareStartDerived', false);
  };

  const docsIn = (categoryId) => docs.filter((d) => d.category === categoryId);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('Records & Documents')}</h2>
        <p className="section-subtitle">
          {t(ortho
            ? 'Insurance companies require proof of what you have already tried before they will approve joint surgery, injections or advanced imaging. The more of this you can give us now, the less likely your care is delayed later.'
            : 'Insurance companies require proof of what you have already tried before they will approve spine treatment. The more of this you can give us now, the less likely your care is delayed later.')}
        </p>
      </div>

      {/* ---------------- Imaging ---------------- */}
      <ImagingUpload interval={interval} hasListedImaging={selectedImaging.length > 0}>
        {!interval && (
        <div className="mt-4">
          <label className="form-label text-sm">{t('Which imaging have you had for this problem? Tap all that apply.')}</label>
          <div className="flex flex-wrap gap-2">
            {studies.map((study) => {
              const on = selectedImaging.includes(study);
              return (
                <button key={study} type="button" onClick={() => toggleStudy(study)} aria-pressed={on}
                  className={`chip ${on ? 'chip-selected' : 'chip-unselected'}`}>
                  {t(study)}
                </button>
              );
            })}
            <button type="button" onClick={tapNoImaging} aria-pressed={noImaging}
              className={`px-3.5 py-2.5 rounded-full text-sm border transition-colors ${noImaging ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'}`}>
              {t('No imaging yet')}
            </button>
          </div>
        </div>
        )}
        {!interval && selectedImaging.length > 0 && (
        <div className="space-y-4 mt-4">
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
        )}
      </ImagingUpload>

      {/* ---------------- Medication trials (a new problem only) ---------------- */}
      {newKind && (
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
                  {entry?.name && (
                    <span className="text-[11px] text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full" title={entry.name}>
                      {t('From your medication list')}: {entry.name}
                    </span>
                  )}
                </label>
                {entry && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pl-8">
                    <div>
                      <label className="form-label text-sm">{t('How long did you take it?')}</label>
                      <input type="text" value={entry.duration || ''}
                        onChange={(e) => updateMed(cls, 'duration', e.target.value)}
                        placeholder={t('e.g., 6 weeks')} />
                      <SuggestedAnswers suggestions={MED_DURATIONS} value={entry.duration} onPick={(v) => updateMed(cls, 'duration', v)} />
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
      )}

      {/* ---------------- Conservative care window (a new problem only) ---------------- */}
      {newKind && (
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
              onChange={(e) => setStart(e.target.value)}
              placeholder={t('e.g., June 2025')} />
            {startDerived && (
              <p className="text-xs text-teal-700 mt-1.5">{t('Taken from the dates you gave for your treatments. Change it if that is wrong.')}</p>
            )}
          </div>
          <div>
            <label className="form-label text-sm">{t('Most recent treatment')}</label>
            <input type="text" value={ev.conservativeCareEnd || ''}
              onChange={(e) => updateEv('conservativeCareEnd', e.target.value)}
              placeholder={t('Still ongoing')} />
            <SuggestedAnswers suggestions={['Still ongoing']} value={ev.conservativeCareEnd} onPick={(v) => updateEv('conservativeCareEnd', v)} />
          </div>
        </div>
      </div>
      )}

      {/* ---------------- Uploads ---------------- */}
      <div className="card mb-4">
        <h3 className="text-base font-medium text-navy-600 mb-1">{t('Upload Your Records')}</h3>
        <p className="text-sm text-gray-400 mb-2">
          {t('Add any documents you have. Photos of paper records are fine — just make sure the text is readable.')}
        </p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="space-y-3">
          {categories.filter((cat) => cat.id !== 'imaging_reports').map((cat) => {
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
            {categories.filter((c) => suggested.has(c.id)).map((cat) => {
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
            {t("Upload what you have. Anything you cannot find, you can bring to your appointment.")}
          </p>
        </div>
      )}

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext
        nextLabel={nextLabel}
        showSkip
        skipLabel={t('Skip — I have no records to add')}
      />
    </div>
  );
}
