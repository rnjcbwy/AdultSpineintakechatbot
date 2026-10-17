'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';

const LOCAL = {
  'Past Surgical History': { es: 'Antecedentes quirúrgicos', zh: '既往手术史' },
  "List any prior surgeries you've had, especially any spine surgeries.": {
    es: 'Enumere las cirugías que haya tenido, especialmente cualquier cirugía de la columna.',
    zh: '请列出您以前做过的任何手术，尤其是脊柱手术。',
  },
  'Region:': { es: 'Región:', zh: '部位：' },
  'Date:': { es: 'Fecha:', zh: '日期：' },
  'Hospital:': { es: 'Hospital:', zh: '医院：' },
  'Surgeon:': { es: 'Cirujano:', zh: '外科医生：' },
  'Spine level:': { es: 'Nivel de la columna:', zh: '脊柱节段：' },
  'Outcome:': { es: 'Resultado:', zh: '结果：' },
  'Complications:': { es: 'Complicaciones:', zh: '并发症：' },
  'Spine Surgery': { es: 'Cirugía de la columna', zh: '脊柱手术' },
  'Edit Surgery': { es: 'Editar cirugía', zh: '编辑手术' },
  'Add Surgery': { es: 'Agregar cirugía', zh: '添加手术' },
  'Surgery type *': { es: 'Tipo de cirugía *', zh: '手术类型 *' },
  'e.g., Lumbar fusion, Knee replacement, Appendectomy': {
    es: 'p. ej., fusión lumbar, reemplazo de rodilla, apendicectomía',
    zh: '例如：腰椎融合、膝关节置换、阑尾切除',
  },
  'Body region': { es: 'Región del cuerpo', zh: '身体部位' },
  'Cervical spine (neck)': { es: 'Columna cervical (cuello)', zh: '颈椎（脖子）' },
  'Thoracic spine (upper back)': { es: 'Columna torácica (espalda alta)', zh: '胸椎（上背部）' },
  'Lumbar spine (low back)': { es: 'Columna lumbar (espalda baja)', zh: '腰椎（下背部）' },
  'Hip': { es: 'Cadera', zh: '髋部' },
  'Knee': { es: 'Rodilla', zh: '膝盖' },
  'Shoulder': { es: 'Hombro', zh: '肩部' },
  'Abdomen': { es: 'Abdomen', zh: '腹部' },
  'Heart': { es: 'Corazón', zh: '心脏' },
  'Brain/Head': { es: 'Cerebro/Cabeza', zh: '脑部/头部' },
  'Other': { es: 'Otro', zh: '其他' },
  'Approximate date': { es: 'Fecha aproximada', zh: '大致日期' },
  'e.g., March 2022, or 2020': { es: 'p. ej., marzo de 2022, o 2020', zh: '例如：2022年3月，或2020年' },
  'Hospital (if known)': { es: 'Hospital (si lo sabe)', zh: '医院（如果知道）' },
  'Hospital name': { es: 'Nombre del hospital', zh: '医院名称' },
  'Surgeon (if known)': { es: 'Cirujano (si lo sabe)', zh: '外科医生（如果知道）' },
  'Surgeon name': { es: 'Nombre del cirujano', zh: '外科医生姓名' },
  'This was a spine surgery': { es: 'Esta fue una cirugía de la columna', zh: '这是一次脊柱手术' },
  'Spine level (if known)': { es: 'Nivel de la columna (si lo sabe)', zh: '脊柱节段（如果知道）' },
  'e.g., L4-L5, C5-C6': { es: 'p. ej., L4-L5, C5-C6', zh: '例如：L4-L5、C5-C6' },
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

export default function PastSurgicalHistory({ onNext, onBack }) {
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const { data, setSection } = useIntake();
  const psh = data.pastSurgicalHistory;
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [form, setForm] = useState(emptySurgery());

  function emptySurgery() {
    return {
      type: '',
      bodyRegion: '',
      date: '',
      hospital: '',
      surgeon: '',
      complications: '',
      helped: '',
      isSpineSurgery: false,
      spineLevel: '',
    };
  }

  const saveSurgery = () => {
    if (!form.type) return;
    const surgeries = [...(psh.surgeries || [])];
    if (editIndex >= 0) {
      surgeries[editIndex] = form;
    } else {
      surgeries.push(form);
    }
    setSection('pastSurgicalHistory', { surgeries });
    setForm(emptySurgery());
    setShowForm(false);
    setEditIndex(-1);
  };

  const editSurgery = (index) => {
    setForm(psh.surgeries[index]);
    setEditIndex(index);
    setShowForm(true);
  };

  const removeSurgery = (index) => {
    const surgeries = (psh.surgeries || []).filter((_, i) => i !== index);
    setSection('pastSurgicalHistory', { surgeries });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('Past Surgical History')}</h2>
        <p className="section-subtitle">
          {t("List any prior surgeries you've had, especially any spine surgeries.")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Existing surgeries */}
        {(psh.surgeries || []).length > 0 && (
          <div className="space-y-3">
            {psh.surgeries.map((surgery, i) => (
              <div key={i} className={`card card-hover ${surgery.isSpineSurgery ? 'border-l-4 border-l-teal-400' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-navy-600">{surgery.type}</h4>
                    <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                      {surgery.bodyRegion && <p>{t('Region:')} {t(surgery.bodyRegion)}</p>}
                      {surgery.date && <p>{t('Date:')} {surgery.date}</p>}
                      {surgery.hospital && <p>{t('Hospital:')} {surgery.hospital}</p>}
                      {surgery.surgeon && <p>{t('Surgeon:')} {surgery.surgeon}</p>}
                      {surgery.spineLevel && <p>{t('Spine level:')} {surgery.spineLevel}</p>}
                      {surgery.helped && <p>{t('Outcome:')} {t(surgery.helped)}</p>}
                      {surgery.complications && <p>{t('Complications:')} {surgery.complications}</p>}
                    </div>
                    {surgery.isSpineSurgery && (
                      <span className="inline-block mt-2 text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full">
                        {t('Spine Surgery')}
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
            <h3 className="text-lg font-medium text-navy-600 mb-4">
              {editIndex >= 0 ? t('Edit Surgery') : t('Add Surgery')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">{t('Surgery type *')}</label>
                <input
                  type="text"
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                  placeholder={t('e.g., Lumbar fusion, Knee replacement, Appendectomy')}
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
                    <option value="Cervical spine (neck)">{t('Cervical spine (neck)')}</option>
                    <option value="Thoracic spine (upper back)">{t('Thoracic spine (upper back)')}</option>
                    <option value="Lumbar spine (low back)">{t('Lumbar spine (low back)')}</option>
                    <option value="Hip">{t('Hip')}</option>
                    <option value="Knee">{t('Knee')}</option>
                    <option value="Shoulder">{t('Shoulder')}</option>
                    <option value="Abdomen">{t('Abdomen')}</option>
                    <option value="Heart">{t('Heart')}</option>
                    <option value="Brain/Head">{t('Brain/Head')}</option>
                    <option value="Other">{t('Other')}</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">{t('Approximate date')}</label>
                  <input
                    type="text"
                    value={form.date}
                    onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                    placeholder={t('e.g., March 2022, or 2020')}
                  />
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
                <span className="text-sm font-medium text-teal-700">{t('This was a spine surgery')}</span>
              </label>

              {form.isSpineSurgery && (
                <div>
                  <label className="form-label">{t('Spine level (if known)')}</label>
                  <input
                    type="text"
                    value={form.spineLevel}
                    onChange={(e) => setForm(prev => ({ ...prev, spineLevel: e.target.value }))}
                    placeholder={t('e.g., L4-L5, C5-C6')}
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
          <button onClick={() => setShowForm(true)} className="card card-hover w-full text-center py-8 border-dashed border-2 border-gray-300">
            <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-gray-500 font-medium">{t('Add a Surgery')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('Click to add a past surgery to your history')}</p>
          </button>
        )}

        {(psh.surgeries || []).length === 0 && !showForm && (
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
