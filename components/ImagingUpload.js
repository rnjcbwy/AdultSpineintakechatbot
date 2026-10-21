'use client';

import { useState, useEffect } from 'react';
import { useIntake } from '../lib/store';
import { useLang, makeT, COMMON } from '../lib/i18n';
import { ACCEPTED_TYPES, addDocument, listDocuments, deleteDocument, formatBytes } from '../lib/documents';

const LOCAL = {
  // A new problem
  'Your Imaging': { es: 'Sus estudios de imagen', zh: '您的影像检查' },
  'If you have had X-rays, an MRI, a CT or an ultrasound for this problem, we would like to see it. Add the written report, a photo or a screenshot of the images here: upload a file, take a picture with your phone, choose from your camera roll, or paste a screenshot with Ctrl+V.': {
    es: 'Si se ha hecho radiografías, una resonancia, una tomografía o una ecografía por este problema, nos gustaría verlas. Agregue aquí el informe escrito, una foto o una captura de pantalla de las imágenes: suba un archivo, tome una foto con su teléfono, elija de su carrete de fotos o pegue una captura con Ctrl+V.',
    zh: '如果您曾因这个问题做过X光、核磁、CT或超声检查，我们希望看到它们。请在此添加书面报告、影像的照片或截图：上传文件、用手机拍照、从相册中选择，或用 Ctrl+V 粘贴截图。',
  },
  'Below, tap each kind of study you have had and add the approximate date and where it was done.': {
    es: 'Abajo, toque cada tipo de estudio que se haya hecho y agregue la fecha aproximada y el lugar donde se hizo.',
    zh: '请在下方点选您做过的每种检查，并填写大约日期和检查地点。',
  },
  'Please add the date and where each study was done below.': {
    es: 'Agregue abajo la fecha y el lugar donde se hizo cada estudio.',
    zh: '请在下方填写每项检查的日期和地点。',
  },
  "If you can get a copy of the actual images on a CD, or through the imaging center's patient portal, bringing them to your visit would be greatly appreciated.": {
    es: 'Si puede conseguir una copia de las imágenes reales en un CD, o a través del portal de pacientes del centro de imágenes, le agradeceríamos mucho que las trajera a su cita.',
    zh: '如果您能取得实际影像的光盘副本，或通过影像中心的患者门户获取，恳请您就诊时带来，我们将非常感谢。',
  },

  // A follow-up or post-operative visit
  'New imaging since your last visit': { es: 'Estudios de imagen nuevos desde su última visita', zh: '上次就诊以来的新影像检查' },
  'If you have had any X-rays, MRI, CT or ultrasound since your last visit or your surgery, especially at an outside facility, please share it here. Upload the radiology report or a photo or screenshot of the images, or take a picture with your phone. You can also paste a screenshot with Ctrl+V.': {
    es: 'Si se ha hecho radiografías, resonancia, tomografía o ecografía desde su última visita o su cirugía, sobre todo en un centro externo, compártalas aquí. Suba el informe de radiología o una foto o captura de las imágenes, o tome una foto con su teléfono. También puede pegar una captura con Ctrl+V.',
    zh: '如果您自上次就诊或手术以来做过X光、核磁、CT或超声检查，尤其是在外院做的，请在此分享。上传放射科报告，或影像的照片或截图，或用手机拍照。您也可以用 Ctrl+V 粘贴截图。',
  },
  "Please also bring the images themselves to your visit, on a CD or through the imaging center's patient portal, so your surgeon can review the images and not only the report.": {
    es: 'Traiga también las imágenes a su cita, en un CD o a través del portal de pacientes del centro de imágenes, para que su cirujano pueda revisar las imágenes y no solo el informe.',
    zh: '也请将影像本身带到就诊时，可以是光盘，或通过影像中心的患者门户提供，以便您的外科医生查看影像本身，而不仅仅是报告。',
  },

  'Upload files': { es: 'Subir archivos', zh: '上传文件' },
  'Take a photo': { es: 'Tomar una foto', zh: '拍照' },
  'Remove': { es: 'Eliminar', zh: '删除' },
};

const CATEGORY = 'imaging_reports';

/**
 * The imaging box: upload a report or a picture of the images, take a photo,
 * or paste a screenshot anywhere on the page. `interval` words it for a
 * follow-up or post-operative visit (new imaging since the last visit),
 * without the prompt to list the studies. `children` render under the prompt
 * (the study chips and the per-study date and facility fields on the Records
 * step); `hasListedImaging` says the patient has already tapped a study.
 */
export default function ImagingUpload({ interval = false, hasListedImaging = false, children }) {
  const { data, setNested } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    const list = await listDocuments(data.sessionId);
    setDocs(list.filter((d) => d.category === CATEGORY));
    setNested('documents', list);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.sessionId]);

  const addFiles = async (files) => {
    if (!files.length) return;
    setBusy(true);
    setError('');
    try {
      for (const file of files) await addDocument({ sessionId: data.sessionId, category: CATEGORY, file });
      await refresh();
    } catch (err) {
      setError(err?.message || 'Could not add that file.');
    } finally {
      setBusy(false);
    }
  };

  const pick = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-picking the same file
    addFiles(files);
  };

  // A screenshot pasted anywhere on the page goes in with the imaging.
  useEffect(() => {
    const onPaste = (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      const files = items
        .filter((it) => it.kind === 'file' && /^image\//.test(it.type))
        .map((it, i) => {
          const f = it.getAsFile();
          if (!f) return null;
          const ext = (f.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
          return new File([f], `pasted-image-${Date.now()}-${i + 1}.${ext}`, { type: f.type });
        })
        .filter(Boolean);
      if (!files.length) return;
      e.preventDefault();
      addFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.sessionId]);

  const remove = async (id) => {
    await deleteDocument(id);
    await refresh();
  };

  const btn = `btn-secondary text-sm py-2 px-4 cursor-pointer select-none ${busy ? 'opacity-50 pointer-events-none' : ''}`;

  return (
    <div className="card mb-4">
      <h3 className="text-base font-medium text-navy-600 mb-1">{t(interval ? 'New imaging since your last visit' : 'Your Imaging')}</h3>
      <p className="text-sm text-gray-500 mb-3">
        {interval
          ? t('If you have had any X-rays, MRI, CT or ultrasound since your last visit or your surgery, especially at an outside facility, please share it here. Upload the radiology report or a photo or screenshot of the images, or take a picture with your phone. You can also paste a screenshot with Ctrl+V.')
          : t('If you have had X-rays, an MRI, a CT or an ultrasound for this problem, we would like to see it. Add the written report, a photo or a screenshot of the images here: upload a file, take a picture with your phone, choose from your camera roll, or paste a screenshot with Ctrl+V.')}
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        <input id="imaging-files" type="file" multiple accept={ACCEPTED_TYPES} onChange={pick} className="hidden" />
        <label htmlFor="imaging-files" className={btn}>+ {t('Upload files')}</label>
        <input id="imaging-camera" type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />
        <label htmlFor="imaging-camera" className={btn}>{t('Take a photo')}</label>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>
      )}

      {docs.length > 0 && (
        <ul className="mb-3 space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="flex-1 text-sm text-gray-700 truncate">{d.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{formatBytes(d.size)}</span>
              <button type="button" onClick={() => remove(d.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0" title={t('Remove')}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600 space-y-2">
        {!interval && (
          <p>
            {t(hasListedImaging
              ? 'Please add the date and where each study was done below.'
              : 'Below, tap each kind of study you have had and add the approximate date and where it was done.')}
          </p>
        )}
        <p>
          {interval
            ? t("Please also bring the images themselves to your visit, on a CD or through the imaging center's patient portal, so your surgeon can review the images and not only the report.")
            : t("If you can get a copy of the actual images on a CD, or through the imaging center's patient portal, bringing them to your visit would be greatly appreciated.")}
        </p>
      </div>

      {children}
    </div>
  );
}
