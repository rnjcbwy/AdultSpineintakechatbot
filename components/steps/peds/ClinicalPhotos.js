'use client';

import { useEffect, useState } from 'react';
import { useIntake, useService } from '../../../lib/store';
import { useLang, makeT, COMMON } from '../../../lib/i18n';
import { addDocument, listDocuments, deleteDocument, getDocumentBlob, formatBytes } from '../../../lib/documents';
import StepNavigation from '../../ui/StepNavigation';

// The uploads step's machinery (lib/documents.js) holds the photos with the
// other records, under their own category, so they travel to the office with
// the rest of the submission.
const CATEGORY = 'clinical_photo';

// The views asked for, by specialty. The spine views follow the standard
// clinical photography of a spinal deformity: the two from behind are the
// ones that matter; the side views help when a prominence shows better
// from the side.
const SLOTS = {
  spine: [
    { id: 'standing-back', label: 'Standing, from behind', weight: 'Most important' },
    { id: 'bend-back', label: 'Bending forward, from behind', weight: 'Most important' },
    { id: 'standing-side', label: 'Standing, from the side', weight: 'Optional' },
    { id: 'bend-side', label: 'Bending forward, from the side', weight: 'Optional' },
  ],
  ortho: [
    { id: 'area-front', label: 'The affected area, from the front' },
    { id: 'area-side', label: 'The affected area, from the side' },
    { id: 'other-side', label: 'The other side, for comparison' },
    { id: 'standing', label: 'Standing or walking' },
  ],
};

const SPINE_STEPS = [
  'Good light, a plain background, and the whole back from the neck to the hips in the frame.',
  'Nothing on the trunk: no shirt, and no bra strap, tie or gown across the back, which would hide the curve. A girl can cover the chest with her arms or wear a halter top that leaves the back bare.',
  'Shorts or underwear pulled down below the waist, so the hips (the top of the pelvis) are visible.',
  'Long hair tied up, off the shoulders and the neck.',
  'The face is not needed: crop it out or leave it out of the frame.',
  'For the forward bend: feet together, knees straight, bend forward from the waist with the arms hanging down and the hands together, as if reaching for the toes.',
];

const ORTHO_STEPS = [
  'Good light, with the area uncovered and the whole limb in the frame.',
  'Take the same view of the other side, so the two can be compared.',
  'If there is a cast or a splint, a photo of it is useful too.',
  'The face is not needed.',
];

const LOCAL = {
  'Photos of the back (optional)': { es: 'Fotos de la espalda (opcional)', zh: '背部照片（可选）' },
  'Photos of the back help the team see the shape of the spine before the visit and compare it over time. They are optional. Like everything else in this form, they become part of the confidential medical record.': {
    es: 'Las fotos de la espalda ayudan al equipo a ver la forma de la columna antes de la visita y a compararla con el tiempo. Son opcionales. Como todo lo demás en este formulario, pasan a formar parte del expediente médico confidencial.',
    zh: '背部照片有助于团队在就诊前了解脊柱的形态，并随时间进行比较。照片是可选的。与本表格中的其他内容一样，它们将成为保密病历的一部分。',
  },
  'Photos of the problem area (optional)': { es: 'Fotos de la zona afectada (opcional)', zh: '患处照片（可选）' },
  'Photos of the limb or the area that hurts help the team see the shape, the swelling or the way it is held before the visit. They are optional and become part of the confidential medical record.': {
    es: 'Las fotos de la extremidad o de la zona que duele ayudan al equipo a ver la forma, la hinchazón o la postura antes de la visita. Son opcionales y pasan a formar parte del expediente médico confidencial.',
    zh: '患肢或疼痛部位的照片有助于团队在就诊前了解其形态、肿胀或姿势。照片是可选的，并将成为保密病历的一部分。',
  },
  'How to take them': { es: 'Cómo tomarlas', zh: '拍摄方法' },
  'Good light, a plain background, and the whole back from the neck to the hips in the frame.': {
    es: 'Buena luz, un fondo liso y toda la espalda, del cuello a las caderas, dentro del encuadre.',
    zh: '光线充足、背景简洁，整个背部从颈部到臀部都要在画面内。',
  },
  'Nothing on the trunk: no shirt, and no bra strap, tie or gown across the back, which would hide the curve. A girl can cover the chest with her arms or wear a halter top that leaves the back bare.': {
    es: 'Nada sobre el torso: sin camiseta, y sin tirantes de sostén, cintas ni batas que crucen la espalda y oculten la curva. Una niña puede cubrirse el pecho con los brazos o usar un top sin espalda.',
    zh: '上身不穿衣物：不穿上衣，背部也不要有胸罩带、系带或罩袍遮挡弯曲。女孩可以用手臂遮住胸部，或穿露背式吊带上衣。',
  },
  'Shorts or underwear pulled down below the waist, so the hips (the top of the pelvis) are visible.': {
    es: 'Los pantalones cortos o la ropa interior bajados por debajo de la cintura, para que se vean las caderas (la parte superior de la pelvis).',
    zh: '短裤或内裤拉到腰部以下，让髋部（骨盆上缘）可见。',
  },
  'Long hair tied up, off the shoulders and the neck.': { es: 'El pelo largo recogido, fuera de los hombros y del cuello.', zh: '长发扎起，不要遮住肩膀和颈部。' },
  'The face is not needed: crop it out or leave it out of the frame.': { es: 'La cara no es necesaria: recórtela o déjela fuera del encuadre.', zh: '不需要拍到脸：可以裁掉或不拍入画面。' },
  'For the forward bend: feet together, knees straight, bend forward from the waist with the arms hanging down and the hands together, as if reaching for the toes.': {
    es: 'Para la flexión hacia adelante: pies juntos, rodillas rectas, inclinarse hacia adelante desde la cintura con los brazos colgando y las manos juntas, como para tocarse los pies.',
    zh: '前屈动作：双脚并拢，膝盖伸直，从腰部向前弯，双臂自然下垂，双手并拢，像要摸脚尖一样。',
  },
  'The two photos from behind matter most; the side views help when a bump shows better from the side.': {
    es: 'Las dos fotos desde atrás son las más importantes; las de perfil ayudan cuando el bulto se ve mejor de lado.',
    zh: '从背后拍的两张照片最重要；侧面照片在隆起从侧面更明显时有帮助。',
  },
  'Good light, with the area uncovered and the whole limb in the frame.': { es: 'Buena luz, con la zona descubierta y toda la extremidad dentro del encuadre.', zh: '光线充足，患处裸露，整条肢体都在画面内。' },
  'Take the same view of the other side, so the two can be compared.': { es: 'Tome la misma vista del otro lado, para poder compararlos.', zh: '对另一侧拍同样角度的照片，以便比较。' },
  'If there is a cast or a splint, a photo of it is useful too.': { es: 'Si hay un yeso o una férula, una foto también es útil.', zh: '如果有石膏或夹板，也拍一张照片。' },
  'The face is not needed.': { es: 'La cara no es necesaria.', zh: '不需要拍到脸。' },
  'Standing, from behind': { es: 'De pie, desde atrás', zh: '站立，从背后拍' },
  'Bending forward, from behind': { es: 'Inclinado hacia adelante, desde atrás', zh: '前屈，从背后拍' },
  'Standing, from the side': { es: 'De pie, de perfil', zh: '站立，从侧面拍' },
  'Bending forward, from the side': { es: 'Inclinado hacia adelante, de perfil', zh: '前屈，从侧面拍' },
  'The affected area, from the front': { es: 'La zona afectada, de frente', zh: '患处，正面' },
  'The affected area, from the side': { es: 'La zona afectada, de perfil', zh: '患处，侧面' },
  'The other side, for comparison': { es: 'El otro lado, para comparar', zh: '另一侧，用于比较' },
  'Standing or walking': { es: 'De pie o caminando', zh: '站立或行走' },
  'Most important': { es: 'Más importante', zh: '最重要' },
  'Optional': { es: 'Opcional', zh: '可选' },
  'Take a photo': { es: 'Tomar una foto', zh: '拍照' },
  'Choose a photo': { es: 'Elegir una foto', zh: '选择照片' },
  'Remove': { es: 'Quitar', zh: '移除' },
  'More photos': { es: 'Más fotos', zh: '更多照片' },
  'Add any other photo that helps, such as an older one for comparison.': { es: 'Agregue cualquier otra foto que ayude, como una más antigua para comparar.', zh: '添加其他有帮助的照片，例如以前的照片以作比较。' },
  'Add photos': { es: 'Agregar fotos', zh: '添加照片' },
  'Could not add that photo.': { es: 'No se pudo agregar esa foto.', zh: '无法添加该照片。' },
  'Skip — no photos to add': { es: 'Omitir — no tengo fotos que agregar', zh: '跳过 — 没有照片要添加' },
};

/**
 * The optional clinical photos of a child's visit: the standard views of the
 * back for the spine, the limb and its other side for a bone or joint. Each
 * view has a slot; anything else goes under "More photos". The photos are
 * records like any other (lib/documents.js), under their own category, with
 * the view's id in the file name so the office can tell them apart.
 */
export default function ClinicalPhotos({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const service = useService();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const spine = service.specialty === 'spine';
  const slots = SLOTS[spine ? 'spine' : 'ortho'];
  const [docs, setDocs] = useState([]);
  const [urls, setUrls] = useState({});
  const [busy, setBusy] = useState('');
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

  // Thumbnails from the stored bytes; the object URLs are released when the
  // list changes or the step unmounts.
  useEffect(() => {
    let live = true;
    const made = {};
    (async () => {
      for (const d of docs) {
        if (!/^image\//.test(d.type || '')) continue;
        try {
          const blob = await getDocumentBlob(d.id);
          if (blob) made[d.id] = URL.createObjectURL(blob);
        } catch { /* no preview; the file is still attached */ }
      }
      if (live) setUrls(made);
      else Object.values(made).forEach((u) => URL.revokeObjectURL(u));
    })();
    return () => { live = false; Object.values(made).forEach((u) => URL.revokeObjectURL(u)); };
  }, [docs]);

  const add = async (files, slotId = '') => {
    if (!files.length) return;
    setBusy(slotId || 'more');
    setError('');
    try {
      // One photo per view: a new one replaces the old.
      if (slotId) for (const old of docs.filter((d) => d.note === slotId)) await deleteDocument(old.id);
      for (const file of files) {
        const named = slotId ? new File([file], `${slotId}-${file.name}`, { type: file.type }) : file;
        await addDocument({ sessionId: data.sessionId, category: CATEGORY, file: named, note: slotId });
      }
      await refresh();
    } catch (err) {
      setError(err?.message || t('Could not add that photo.'));
    } finally {
      setBusy('');
    }
  };

  const pick = (slotId) => (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    add(files, slotId);
  };

  const remove = async (id) => {
    await deleteDocument(id);
    await refresh();
  };

  const inSlot = (slotId) => docs.find((d) => d.note === slotId) || null;
  const extra = docs.filter((d) => !slots.some((s) => s.id === d.note));
  const btn = (disabled) => `btn-secondary text-sm py-2 px-4 cursor-pointer select-none ${disabled ? 'opacity-50 pointer-events-none' : ''}`;

  const thumb = (d) => (
    <div className="flex items-center gap-3">
      {urls[d.id] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urls[d.id]} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
      ) : (
        <div className="w-20 h-20 rounded-lg bg-gray-100 border border-gray-200 flex-shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-700 truncate">{d.name}</p>
        <p className="text-xs text-gray-400">{formatBytes(d.size)}</p>
        <button type="button" onClick={() => remove(d.id)} className="text-xs text-gray-400 hover:text-red-500 mt-1">{t('Remove')}</button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t(spine ? 'Photos of the back (optional)' : 'Photos of the problem area (optional)')}</h2>
        <p className="section-subtitle">
          {t(spine
            ? 'Photos of the back help the team see the shape of the spine before the visit and compare it over time. They are optional. Like everything else in this form, they become part of the confidential medical record.'
            : 'Photos of the limb or the area that hurts help the team see the shape, the swelling or the way it is held before the visit. They are optional and become part of the confidential medical record.')}
        </p>
      </div>

      <div className="card mb-4 bg-navy-50/40 border-navy-100">
        <h3 className="text-base font-medium text-navy-600 mb-2">{t('How to take them')}</h3>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-700">
          {(spine ? SPINE_STEPS : ORTHO_STEPS).map((s) => <li key={s}>{t(s)}</li>)}
        </ul>
        {spine && <p className="text-xs text-gray-500 mt-3">{t('The two photos from behind matter most; the side views help when a bump shows better from the side.')}</p>}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {slots.map((slot) => {
          const d = inSlot(slot.id);
          const working = busy === slot.id;
          return (
            <div key={slot.id} className={`border rounded-xl p-4 ${d ? 'border-teal-200 bg-teal-50/30' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="text-sm font-semibold text-navy-600">{t(slot.label)}</span>
                {slot.weight && (
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${slot.weight === 'Optional' ? 'text-gray-500 bg-gray-50 border-gray-200' : 'text-amber-800 bg-amber-100 border-amber-300'}`}>
                    {t(slot.weight)}
                  </span>
                )}
              </div>
              {d ? thumb(d) : (
                <div className="flex flex-wrap gap-2">
                  <input id={`photo-camera-${slot.id}`} type="file" accept="image/*" capture="environment" onChange={pick(slot.id)} className="hidden" />
                  <label htmlFor={`photo-camera-${slot.id}`} className={btn(working)}>{t('Take a photo')}</label>
                  <input id={`photo-file-${slot.id}`} type="file" accept="image/*" onChange={pick(slot.id)} className="hidden" />
                  <label htmlFor={`photo-file-${slot.id}`} className={btn(working)}>{t('Choose a photo')}</label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card mb-4">
        <h3 className="text-base font-medium text-navy-600 mb-1">{t('More photos')}</h3>
        <p className="text-sm text-gray-400 mb-3">{t('Add any other photo that helps, such as an older one for comparison.')}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <input id="photo-more" type="file" multiple accept="image/*" onChange={pick('')} className="hidden" />
          <label htmlFor="photo-more" className={btn(busy === 'more')}>+ {t('Add photos')}</label>
        </div>
        {extra.length > 0 && (
          <ul className="space-y-3">
            {extra.map((d) => <li key={d.id}>{thumb(d)}</li>)}
          </ul>
        )}
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext
        nextLabel={t('Continue')}
        showSkip={docs.length === 0}
        skipLabel={t('Skip — no photos to add')}
      />
    </div>
  );
}
