'use client';

import { useRef, useState } from 'react';
import { useIntake } from '../lib/store';
import { useLang, makeT, COMMON } from '../lib/i18n';
import { addDocument, listDocuments } from '../lib/documents';

const LOCAL = {
  'Have a list already?': { es: '¿Ya tiene una lista?', zh: '已经有清单了？' },
  'Take a photo of your medication list, pill bottles or a pharmacy printout, or upload a PDF or Word document, and we will fill this in for you to check.': {
    es: 'Tome una foto de su lista de medicamentos, de los frascos o de un impreso de la farmacia, o suba un PDF o un documento de Word, y lo completaremos para que usted lo revise.',
    zh: '拍下您的药物清单、药瓶或药房打印单，或上传 PDF 或 Word 文档，我们会帮您填好，供您核对。',
  },
  'Is your medical history written down somewhere?': { es: '¿Tiene su historial médico escrito en algún lugar?', zh: '您的病史是否已记录在某处？' },
  'If you have a long list of conditions, it may be easier to take a photo of it or upload the document. We will read it and fill in what fits, and you just confirm it.': {
    es: 'Si tiene una lista larga de afecciones, puede ser más fácil tomarle una foto o subir el documento. Lo leeremos, completaremos lo que corresponda y usted solo lo confirma.',
    zh: '如果您的病史清单很长，拍照或上传文档可能更方便。我们会读取并填入相关内容，您只需确认即可。',
  },
  'Have your insurance card handy?': { es: '¿Tiene a mano su tarjeta del seguro?', zh: '手边有保险卡吗？' },
  'Take a photo of the front of the card and we will fill in the plan and the numbers for you to check. The photo is kept with your form so the office has it.': {
    es: 'Tome una foto del frente de la tarjeta y completaremos el plan y los números para que usted los revise. La foto se guarda con su formulario para que la oficina la tenga.',
    zh: '拍下保险卡正面，我们会帮您填入保险计划和号码，供您核对。照片会随表格保存，以便办公室查看。',
  },
  'Filled in {n} insurance details': { es: 'Se completaron {n} datos del seguro', zh: '已填入 {n} 项保险信息' },
  'Could not read the card. You can try a clearer photo, or type the details instead.': {
    es: 'No se pudo leer la tarjeta. Pruebe con una foto más clara o escriba los datos.',
    zh: '无法读取保险卡。您可以尝试更清晰的照片，或改为手动输入。',
  },
  'Take a photo': { es: 'Tomar una foto', zh: '拍照' },
  'Upload a file': { es: 'Subir un archivo', zh: '上传文件' },
  'Reading your document…': { es: 'Leyendo su documento…', zh: '正在读取您的文档……' },
  'Added {n} medications': { es: 'Se agregaron {n} medicamentos', zh: '已添加 {n} 种药物' },
  'Added {n} allergies': { es: 'Se agregaron {n} alergias', zh: '已添加 {n} 项过敏' },
  'Added {n} conditions': { es: 'Se agregaron {n} afecciones', zh: '已添加 {n} 项病史' },
  'Added {n} surgeries': { es: 'Se agregaron {n} cirugías', zh: '已添加 {n} 项手术' },
  'Nothing to add from that document.': { es: 'No había nada que agregar de ese documento.', zh: '该文档中没有可添加的内容。' },
  'Please check what was added and correct anything that is wrong. The document itself is attached to your form as a record.': {
    es: 'Revise lo que se agregó y corrija lo que no sea correcto. El documento queda adjunto a su formulario como registro.',
    zh: '请核对已添加的内容并更正错误之处。该文档本身已作为记录附在您的表格中。',
  },
  'Could not read that document. You can try a clearer photo, or type the list instead.': {
    es: 'No se pudo leer ese documento. Pruebe con una foto más clara o escriba la lista.',
    zh: '无法读取该文档。您可以尝试更清晰的照片，或改为手动输入。',
  },
};

const ACCEPT = 'image/*,.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';
const lower = (v) => String(v || '').trim().toLowerCase();

/**
 * "Fill this in from a photo or a file." The patient photographs their
 * medication list (or uploads a PDF or Word document), the server reads it
 * with the model, and whatever it names is added to the medications,
 * allergies, conditions and surgeries lists, wherever each belongs, for the
 * patient to check. The file is also kept as an attached record so the
 * office receives the original.
 */
export default function UploadToFill({ section = 'medications' }) {
  const { data, setSection, setNested } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const merge = (found) => {
    const added = [];
    if (found.insurance) {
      // The card's fields land on the demographics step, filling only what is empty.
      const d = data.demographics || {};
      const ins = found.insurance;
      const map = { insuranceProvider: [ins.insurer, ins.planName].filter(Boolean).join(' '), memberId: ins.memberId, groupNumber: ins.groupNumber, insurancePhone: ins.memberServicesPhone, policyHolderName: ins.policyHolderName };
      const next = { ...d };
      let n = 0;
      for (const [k, v] of Object.entries(map)) { if (v && !String(d[k] || '').trim()) { next[k] = v; n += 1; } }
      if (n) { setSection('demographics', next); added.push(t('Filled in {n} insurance details').replace('{n}', n)); }
      return added;
    }
    if (found.medications?.length) {
      const current = data.medications?.current || [];
      const have = new Set(current.map((m) => lower(m.name)));
      const fresh = found.medications.filter((m) => !have.has(lower(m.name))).map((m) => ({ name: m.name, dose: m.dose, frequency: m.frequency, reason: m.reason, status: 'current', isAnticoagulant: /warfarin|coumadin|apixaban|eliquis|rivaroxaban|xarelto|dabigatran|pradaxa|clopidogrel|plavix|heparin|enoxaparin|lovenox|prasugrel|ticagrelor|aspirin/i.test(m.name) }));
      if (fresh.length) { setSection('medications', { ...data.medications, current: [...current, ...fresh], noMedications: false }); added.push(t('Added {n} medications').replace('{n}', fresh.length)); }
    }
    if (found.allergies?.length) {
      const entries = data.allergies?.entries || [];
      const have = new Set(entries.map((a) => lower(a.allergen)));
      const fresh = found.allergies.filter((a) => !have.has(lower(a.allergen))).map((a) => ({ allergen: a.allergen, reaction: a.reaction, severity: '', type: a.type || 'Medication' }));
      if (fresh.length) { setSection('allergies', { ...data.allergies, entries: [...entries, ...fresh], nkda: false }); added.push(t('Added {n} allergies').replace('{n}', fresh.length)); }
    }
    if (found.conditions?.length) {
      const conditions = data.pastMedicalHistory?.conditions || [];
      const have = new Set(conditions.map((c) => lower(c.name)));
      const fresh = found.conditions.filter((c) => !have.has(lower(c.name))).map((c) => ({ name: c.name, yearDiagnosed: c.yearDiagnosed, details: c.details }));
      if (fresh.length) { setSection('pastMedicalHistory', { ...data.pastMedicalHistory, conditions: [...conditions, ...fresh] }); added.push(t('Added {n} conditions').replace('{n}', fresh.length)); }
    }
    if (found.surgeries?.length) {
      const surgeries = data.pastSurgicalHistory?.surgeries || [];
      const have = new Set(surgeries.map((s) => lower(s.type) + '|' + lower(s.date)));
      const fresh = found.surgeries.filter((s) => !have.has(lower(s.type) + '|' + lower(s.date))).map((s) => ({ type: s.type, bodyRegion: s.bodyRegion, date: s.date, hospital: s.hospital, surgeon: s.surgeon, complications: '', helped: '', isSpineSurgery: /spine|spinal|lumbar|cervical|thoracic|fusion|discectomy|laminectomy|scoliosis|kyphoplasty/i.test(`${s.type} ${s.bodyRegion}`), spineLevel: '' }));
      if (fresh.length) { setSection('pastSurgicalHistory', { ...data.pastSurgicalHistory, surgeries: [...surgeries, ...fresh] }); added.push(t('Added {n} surgeries').replace('{n}', fresh.length)); }
    }
    return added;
  };

  const handle = async (file) => {
    if (!file) return;
    setBusy(true);
    setError('');
    setResult('');
    try {
      const fd = new FormData();
      fd.append('file', file, file.name);
      if (section === 'insurance') fd.append('kind', 'insurance');
      const res = await fetch('/api/extract', { method: 'POST', body: fd });
      const found = await res.json();
      if (!res.ok) throw new Error(found.error || 'failed');
      const added = merge(found);
      // Keep the original with the attached records, so the office gets it.
      try {
        await addDocument({ sessionId: data.sessionId, category: section === 'insurance' ? 'insurance_card' : 'other', file, note: `Uploaded on the ${section} step` });
        setNested('documents', await listDocuments(data.sessionId));
      } catch { /* the answers were still filled in */ }
      setResult(added.length ? `${added.join(', ')}. ${t('Please check what was added and correct anything that is wrong. The document itself is attached to your form as a record.')}` : t('Nothing to add from that document.'));
    } catch (err) {
      setError(t(section === 'insurance' ? 'Could not read the card. You can try a clearer photo, or type the details instead.' : 'Could not read that document. You can try a clearer photo, or type the list instead.'));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
      if (cameraRef.current) cameraRef.current.value = '';
    }
  };

  const meds = section === 'medications';
  const insurance = section === 'insurance';
  return (
    <div className={`rounded-2xl border border-dashed border-teal-200 bg-teal-50/40 px-5 py-4 mb-6`}>
      <p className="text-base font-medium text-navy-600">{insurance ? t('Have your insurance card handy?') : meds ? t('Have a list already?') : t('Is your medical history written down somewhere?')}</p>
      <p className="text-sm text-gray-500 mt-1 leading-relaxed">
        {insurance
          ? t('Take a photo of the front of the card and we will fill in the plan and the numbers for you to check. The photo is kept with your form so the office has it.')
          : meds
            ? t('Take a photo of your medication list, pill bottles or a pharmacy printout, or upload a PDF or Word document, and we will fill this in for you to check.')
            : t('If you have a long list of conditions, it may be easier to take a photo of it or upload the document. We will read it and fill in what fits, and you just confirm it.')}
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
        <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
        <button type="button" onClick={() => cameraRef.current?.click()} disabled={busy} className="btn-teal text-sm disabled:opacity-50">{t('Take a photo')}</button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="btn-secondary text-sm disabled:opacity-50">{t('Upload a file')}</button>
      </div>
      {busy && <p className="text-sm text-teal-700 mt-3">{t('Reading your document…')}</p>}
      {result && <p className="text-sm text-teal-800 mt-3">{result}</p>}
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  );
}
