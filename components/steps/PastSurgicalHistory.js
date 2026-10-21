'use client';

import { useState } from 'react';
import { useIntake, useService } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';

const LOCAL = {
  'Past Surgical History': { es: 'Antecedentes quirúrgicos', zh: '既往手术史' },
  "List any prior surgeries you've had, especially any bone, joint, tendon or ligament surgery.": {
    es: 'Enumere las cirugías que haya tenido, especialmente cualquier cirugía de huesos, articulaciones, tendones o ligamentos.',
    zh: '请列出您以前做过的任何手术，尤其是骨骼、关节、肌腱或韧带手术。',
  },
  "List any prior surgeries you've had, especially any spine surgeries.": {
    es: 'Enumere las cirugías que haya tenido, especialmente cualquier cirugía de la columna.',
    zh: '请列出您以前做过的任何手术，尤其是脊柱手术。',
  },
  'You told us you have had spine surgery before. Tell us what it was and roughly when; the rest is optional.': {
    es: 'Nos indicó que ya le han operado de la columna. Díganos qué fue y aproximadamente cuándo; el resto es opcional.',
    zh: '您告诉我们您以前做过脊柱手术。请告诉我们是什么手术以及大约什么时候；其余内容可选填。',
  },
  'You told us you have had an operation on this bone or joint before. Tell us what it was and roughly when; the rest is optional.': {
    es: 'Nos indicó que ya le han operado este hueso o articulación. Díganos qué fue y aproximadamente cuándo; el resto es opcional.',
    zh: '您告诉我们您以前做过这个骨骼或关节的手术。请告诉我们是什么手术以及大约什么时候；其余内容可选填。',
  },
  'Region:': { es: 'Región:', zh: '部位：' },
  'Date:': { es: 'Fecha:', zh: '日期：' },
  'Hospital:': { es: 'Hospital:', zh: '医院：' },
  'Surgeon:': { es: 'Cirujano:', zh: '外科医生：' },
  'Spine level:': { es: 'Nivel de la columna:', zh: '脊柱节段：' },
  'Side / site:': { es: 'Lado / sitio:', zh: '侧别／部位：' },
  'Outcome:': { es: 'Resultado:', zh: '结果：' },
  'Complications:': { es: 'Complicaciones:', zh: '并发症：' },
  'Spine Surgery': { es: 'Cirugía de la columna', zh: '脊柱手术' },
  'Bone or Joint Surgery': { es: 'Cirugía de huesos o articulaciones', zh: '骨骼或关节手术' },
  'Edit Surgery': { es: 'Editar cirugía', zh: '编辑手术' },
  'Add Surgery': { es: 'Agregar cirugía', zh: '添加手术' },
  'Surgery type *': { es: 'Tipo de cirugía *', zh: '手术类型 *' },
  'e.g., Lumbar fusion, Knee replacement, Appendectomy': {
    es: 'p. ej., fusión lumbar, reemplazo de rodilla, apendicectomía',
    zh: '例如：腰椎融合、膝关节置换、阑尾切除',
  },
  'e.g., ACL reconstruction, Knee replacement, Appendectomy': {
    es: 'p. ej., reconstrucción del LCA, reemplazo de rodilla, apendicectomía',
    zh: '例如：前交叉韧带重建、膝关节置换、阑尾切除',
  },
  'Body region': { es: 'Región del cuerpo', zh: '身体部位' },
  'Cervical spine (neck)': { es: 'Columna cervical (cuello)', zh: '颈椎（脖子）' },
  'Thoracic spine (upper back)': { es: 'Columna torácica (espalda alta)', zh: '胸椎（上背部）' },
  'Lumbar spine (low back)': { es: 'Columna lumbar (espalda baja)', zh: '腰椎（下背部）' },
  'Elbow': { es: 'Codo', zh: '肘部' },
  'Hand or wrist': { es: 'Mano o muñeca', zh: '手或手腕' },
  'Ankle or foot': { es: 'Tobillo o pie', zh: '踝或足' },
  'Spine (neck or back)': { es: 'Columna (cuello o espalda)', zh: '脊柱（颈或背）' },
  'Hip': { es: 'Cadera', zh: '髋部' },
  'Knee': { es: 'Rodilla', zh: '膝盖' },
  'Shoulder': { es: 'Hombro', zh: '肩部' },
  'Abdomen': { es: 'Abdomen', zh: '腹部' },
  'Heart': { es: 'Corazón', zh: '心脏' },
  'Brain/Head': { es: 'Cerebro/Cabeza', zh: '脑部/头部' },
  'Other': { es: 'Otro', zh: '其他' },
  'When was it? (if known)': { es: '¿Cuándo fue? (si lo sabe)', zh: '什么时候做的？（如果知道）' },
  'Year': { es: 'Año', zh: '年' },
  'Month (if known)': { es: 'Mes (si lo sabe)', zh: '月（如果知道）' },
  'Or write the date another way': { es: 'O escriba la fecha de otra manera', zh: '或以其他方式填写日期' },
  'e.g., About 10 years ago': { es: 'p. ej., hace unos 10 años', zh: '例如：大约10年前' },
  'January': { es: 'Enero', zh: '一月' },
  'February': { es: 'Febrero', zh: '二月' },
  'March': { es: 'Marzo', zh: '三月' },
  'April': { es: 'Abril', zh: '四月' },
  'May': { es: 'Mayo', zh: '五月' },
  'June': { es: 'Junio', zh: '六月' },
  'July': { es: 'Julio', zh: '七月' },
  'August': { es: 'Agosto', zh: '八月' },
  'September': { es: 'Septiembre', zh: '九月' },
  'October': { es: 'Octubre', zh: '十月' },
  'November': { es: 'Noviembre', zh: '十一月' },
  'December': { es: 'Diciembre', zh: '十二月' },
  'Hospital (if known)': { es: 'Hospital (si lo sabe)', zh: '医院（如果知道）' },
  'Hospital name': { es: 'Nombre del hospital', zh: '医院名称' },
  'Surgeon (if known)': { es: 'Cirujano (si lo sabe)', zh: '外科医生（如果知道）' },
  'Surgeon name': { es: 'Nombre del cirujano', zh: '外科医生姓名' },
  'This was a spine surgery': { es: 'Esta fue una cirugía de la columna', zh: '这是一次脊柱手术' },
  'Spine level (if known)': { es: 'Nivel de la columna (si lo sabe)', zh: '脊柱节段（如果知道）' },
  'e.g., L4-L5, C5-C6': { es: 'p. ej., L4-L5, C5-C6', zh: '例如：L4-L5、C5-C6' },
  'This was a bone, joint, tendon or ligament surgery': { es: 'Esta fue una cirugía de hueso, articulación, tendón o ligamento', zh: '这是一次骨骼、关节、肌腱或韧带手术' },
  'Which side, and what exactly? (if known)': { es: '¿Qué lado y qué exactamente? (si lo sabe)', zh: '哪一侧，具体是什么？（如果知道）' },
  'e.g., Right knee, plate and screws in the left wrist': { es: 'p. ej., rodilla derecha, placa y tornillos en la muñeca izquierda', zh: '例如：右膝，左腕钢板和螺钉' },
  'Did the surgery help?': { es: '¿Le ayudó la cirugía?', zh: '手术有帮助吗？' },
  'Helped significantly': { es: 'Ayudó significativamente', zh: '帮助很大' },
  'Helped somewhat': { es: 'Ayudó un poco', zh: '有一些帮助' },
  'Helped initially, then symptoms returned': {
    es: 'Ayudó al principio, luego los síntomas regresaron',
    zh: '起初有帮助，后来症状又出现了',
  },
  'Helped initially then symptoms returned': {
    es: 'Ayudó al principio, luego los síntomas regresaron',
    zh: '起初有帮助，后来症状又出现了',
  },
  'Did not help': { es: 'No ayudó', zh: '没有帮助' },
  'Made things worse': { es: 'Empeoró las cosas', zh: '使情况变得更糟' },
  'Not applicable': { es: 'No aplica', zh: '不适用' },
  'Any complications?': { es: '¿Alguna complicación?', zh: '有任何并发症吗？' },
  'e.g., Infection, blood clot, or None': {
    es: 'p. ej., infección, coágulo de sangre, o ninguna',
    zh: '例如：感染、血栓，或无',
  },
  'Save Changes': { es: 'Guardar cambios', zh: '保存更改' },
  'Cancel': { es: 'Cancelar', zh: '取消' },
  'Add a Surgery': { es: 'Agregar una cirugía', zh: '添加一次手术' },
  'Click to add a past surgery to your history': {
    es: 'Haga clic para agregar una cirugía anterior a su historial',
    zh: '点击将既往手术添加到您的病史中',
  },
  'No surgeries added. If you have no prior surgeries, you can continue to the next section.': {
    es: 'No se agregaron cirugías. Si no tiene cirugías previas, puede continuar a la siguiente sección.',
    zh: '未添加任何手术。如果您没有既往手术，可以继续下一部分。',
  },
  'Continue to Medications': { es: 'Continuar a medicamentos', zh: '继续填写药物' },
};

/**
 * What the two services word differently. The `isSpineSurgery` and
 * `spineLevel` fields keep their names in the stored data for both: for the
 * bone-and-joint service they flag an orthopaedic operation and hold the
 * side and site.
 */
const COPY = {
  spine: {
    subtitle: "List any prior surgeries you've had, especially any spine surgeries.",
    priorHint: 'You told us you have had spine surgery before. Tell us what it was and roughly when; the rest is optional.',
    typePlaceholder: 'e.g., Lumbar fusion, Knee replacement, Appendectomy',
    regions: ['Cervical spine (neck)', 'Thoracic spine (upper back)', 'Lumbar spine (low back)', 'Hip', 'Knee', 'Shoulder', 'Abdomen', 'Heart', 'Brain/Head', 'Other'],
    flagLabel: 'This was a spine surgery',
    badge: 'Spine Surgery',
    levelLabel: 'Spine level (if known)',
    levelPlaceholder: 'e.g., L4-L5, C5-C6',
    levelLine: 'Spine level:',
  },
  ortho: {
    subtitle: "List any prior surgeries you've had, especially any bone, joint, tendon or ligament surgery.",
    priorHint: 'You told us you have had an operation on this bone or joint before. Tell us what it was and roughly when; the rest is optional.',
    typePlaceholder: 'e.g., ACL reconstruction, Knee replacement, Appendectomy',
    regions: ['Shoulder', 'Elbow', 'Hand or wrist', 'Hip', 'Knee', 'Ankle or foot', 'Spine (neck or back)', 'Abdomen', 'Heart', 'Brain/Head', 'Other'],
    flagLabel: 'This was a bone, joint, tendon or ligament surgery',
    badge: 'Bone or Joint Surgery',
    levelLabel: 'Which side, and what exactly? (if known)',
    levelPlaceholder: 'e.g., Right knee, plate and screws in the left wrist',
    levelLine: 'Side / site:',
  },
};

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => String(THIS_YEAR - i));

function emptySurgery(isSpineSurgery = false) {
  return {
    type: '',
    bodyRegion: '',
    date: '',
    hospital: '',
    surgeon: '',
    complications: '',
    helped: '',
    isSpineSurgery,
    spineLevel: '',
  };
}

export default function PastSurgicalHistory({ onNext, onBack }) {
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const { data, setSection } = useIntake();
  const svc = useService();
  const { MONTHS, monthYearText, monthYearParts } = svc.operations;
  const copy = COPY[svc.specialty] || COPY.spine;
  const psh = data.pastSurgicalHistory;
  const surgeries = psh.surgeries || [];
  // The chief complaint already said there was a spine (or joint) operation:
  // open with that entry started, flagged, so only the what and when are asked.
  const priorKnown = !!data.chiefComplaint?.hasPriorSpineSurgery && surgeries.length === 0;
  const [showForm, setShowForm] = useState(priorKnown);
  const [editIndex, setEditIndex] = useState(-1);
  const [form, setForm] = useState(() => emptySurgery(priorKnown));
  // The date as the picker holds it; `date` on the entry stays the text the
  // note, the PDF and the office read ("March 2022", "2022", or as typed).
  const [when, setWhen] = useState({ year: '', month: '' });

  const openForm = (entry, index = -1) => {
    setForm(entry);
    setWhen(monthYearParts(entry.date));
    setEditIndex(index);
    setShowForm(true);
  };

  const setPicker = (patch) => {
    const next = { ...when, ...patch };
    setWhen(next);
    setForm((prev) => ({ ...prev, date: next.year ? monthYearText(next.year, next.month) : '' }));
  };
  const setDateText = (text) => {
    setWhen(monthYearParts(text));
    setForm((prev) => ({ ...prev, date: text }));
  };

  const saveSurgery = () => {
    if (!form.type) return;
    const next = [...surgeries];
    if (editIndex >= 0) {
      next[editIndex] = form;
    } else {
      next.push(form);
    }
    setSection('pastSurgicalHistory', { surgeries: next });
    setForm(emptySurgery());
    setWhen({ year: '', month: '' });
    setShowForm(false);
    setEditIndex(-1);
  };

  const editSurgery = (index) => openForm(surgeries[index], index);

  const removeSurgery = (index) => {
    setSection('pastSurgicalHistory', { surgeries: surgeries.filter((_, i) => i !== index) });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('Past Surgical History')}</h2>
        <p className="section-subtitle">
          {t(copy.subtitle)}
        </p>
      </div>

      <div className="space-y-6">
        {/* Existing surgeries */}
        {surgeries.length > 0 && (
          <div className="space-y-3">
            {surgeries.map((surgery, i) => (
              <div key={i} className={`card card-hover ${surgery.isSpineSurgery ? 'border-l-4 border-l-teal-400' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-navy-600">{surgery.type}</h4>
                    <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                      {surgery.bodyRegion && <p>{t('Region:')} {t(surgery.bodyRegion)}</p>}
                      {surgery.date && <p>{t('Date:')} {surgery.date}</p>}
                      {surgery.hospital && <p>{t('Hospital:')} {surgery.hospital}</p>}
                      {surgery.surgeon && <p>{t('Surgeon:')} {surgery.surgeon}</p>}
                      {surgery.spineLevel && <p>{t(copy.levelLine)} {surgery.spineLevel}</p>}
                      {surgery.helped && <p>{t('Outcome:')} {t(surgery.helped)}</p>}
                      {surgery.complications && <p>{t('Complications:')} {surgery.complications}</p>}
                    </div>
                    {surgery.isSpineSurgery && (
                      <span className="inline-block mt-2 text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full">
                        {t(copy.badge)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editSurgery(i)} className="text-gray-400 hover:text-teal-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => removeSurgery(i)} className="text-gray-400 hover:text-red-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add surgery form */}
        {showForm ? (
          <div className="card border-2 border-teal-200">
            <h3 className="text-lg font-medium text-navy-600 mb-1">
              {editIndex >= 0 ? t('Edit Surgery') : t('Add Surgery')}
            </h3>
            {priorKnown && editIndex < 0 && form.isSpineSurgery && (
              <p className="text-sm text-teal-700 mb-4">{t(copy.priorHint)}</p>
            )}
            <div className="space-y-4 mt-3">
              <div>
                <label className="form-label">{t('Surgery type *')}</label>
                <input
                  type="text"
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                  placeholder={t(copy.typePlaceholder)}
                  autoFocus={priorKnown}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t('Body region')}</label>
                  <select
                    value={form.bodyRegion}
                    onChange={(e) => setForm(prev => ({ ...prev, bodyRegion: e.target.value }))}
                  >
                    <option value="">{t('Select...')}</option>
                    {copy.regions.map((r) => <option key={r} value={r}>{t(r)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">{t('When was it? (if known)')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={when.year} onChange={(e) => setPicker({ year: e.target.value })} aria-label={t('Year')}>
                      <option value="">{t('Year')}</option>
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={when.month} onChange={(e) => setPicker({ month: e.target.value })} aria-label={t('Month (if known)')} disabled={!when.year}>
                      <option value="">{t('Month (if known)')}</option>
                      {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{t(m)}</option>)}
                    </select>
                  </div>
                  {!when.year && (
                    <div className="mt-2">
                      <label className="form-label text-sm">{t('Or write the date another way')}</label>
                      <input
                        type="text"
                        value={form.date}
                        onChange={(e) => setDateText(e.target.value)}
                        placeholder={t('e.g., About 10 years ago')}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="form-label">{t('Hospital (if known)')}</label>
                  <input
                    type="text"
                    value={form.hospital}
                    onChange={(e) => setForm(prev => ({ ...prev, hospital: e.target.value }))}
                    placeholder={t('Hospital name')}
                  />
                </div>
                <div>
                  <label className="form-label">{t('Surgeon (if known)')}</label>
                  <input
                    type="text"
                    value={form.surgeon}
                    onChange={(e) => setForm(prev => ({ ...prev, surgeon: e.target.value }))}
                    placeholder={t('Surgeon name')}
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-teal-50 rounded-xl">
                <input
                  type="checkbox"
                  checked={form.isSpineSurgery}
                  onChange={(e) => setForm(prev => ({ ...prev, isSpineSurgery: e.target.checked }))}
                />
                <span className="text-sm font-medium text-teal-700">{t(copy.flagLabel)}</span>
              </label>

              {form.isSpineSurgery && (
                <div>
                  <label className="form-label">{t(copy.levelLabel)}</label>
                  <input
                    type="text"
                    value={form.spineLevel}
                    onChange={(e) => setForm(prev => ({ ...prev, spineLevel: e.target.value }))}
                    placeholder={t(copy.levelPlaceholder)}
                  />
                </div>
              )}

              <div>
                <label className="form-label">{t('Did the surgery help?')}</label>
                <select
                  value={form.helped}
                  onChange={(e) => setForm(prev => ({ ...prev, helped: e.target.value }))}
                >
                  <option value="">{t('Select...')}</option>
                  <option value="Helped significantly">{t('Helped significantly')}</option>
                  <option value="Helped somewhat">{t('Helped somewhat')}</option>
                  <option value="Helped initially then symptoms returned">{t('Helped initially, then symptoms returned')}</option>
                  <option value="Did not help">{t('Did not help')}</option>
                  <option value="Made things worse">{t('Made things worse')}</option>
                  <option value="Not applicable">{t('Not applicable')}</option>
                </select>
              </div>

              <div>
                <label className="form-label">{t('Any complications?')}</label>
                <input
                  type="text"
                  value={form.complications}
                  onChange={(e) => setForm(prev => ({ ...prev, complications: e.target.value }))}
                  placeholder={t('e.g., Infection, blood clot, or None')}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={saveSurgery} disabled={!form.type} className="btn-primary">
                  {editIndex >= 0 ? t('Save Changes') : t('Add Surgery')}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setForm(emptySurgery());
                    setWhen({ year: '', month: '' });
                    setEditIndex(-1);
                  }}
                  className="btn-secondary"
                >
                  {t('Cancel')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => openForm(emptySurgery())} className="card card-hover w-full text-center py-8 border-dashed border-2 border-gray-300">
            <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-gray-500 font-medium">{t('Add a Surgery')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('Click to add a past surgery to your history')}</p>
          </button>
        )}

        {surgeries.length === 0 && !showForm && (
          <p className="text-sm text-gray-400 text-center">
            {t('No surgeries added. If you have no prior surgeries, you can continue to the next section.')}
          </p>
        )}
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={true}
        nextLabel={t('Continue to Medications')}
        showSkip={true}
      />
    </div>
  );
}
