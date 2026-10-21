'use client';

import { useEffect } from 'react';
import { useIntake, useService } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';

// The old adult spine site. The ortho service points a neck-or-back tap at
// it, as the ortho intake did; once the cutover (docs/UNIFIED-INTAKE.md)
// redirects that address here with the spine service pre-set, the link still
// lands the patient on the right questions.

const LOCAL = {
  'Your main concern': { es: 'Su principal preocupación', zh: '您的主要困扰' },
  'Check what you told us, then choose every area that is affected. The next step is the body map.': {
    es: 'Revise lo que nos contó y luego elija cada zona afectada. El siguiente paso es el mapa corporal.',
    zh: '请核对您告诉我们的内容，然后选择所有受影响的部位。下一步是身体图。',
  },
  'What you told us is going on': { es: 'Lo que nos contó que le pasa', zh: '您告诉我们的情况' },
  'In your own words, what is the main reason for your visit? *': {
    es: 'En sus propias palabras, ¿cuál es el motivo principal de su visita? *',
    zh: '请用您自己的话说明，您本次就诊的主要原因是什么？*',
  },
  'For example: "My low back hurts and the pain goes down my left leg" or "I was told I have a curved spine"': {
    es: 'Por ejemplo: "Me duele la parte baja de la espalda y el dolor baja por mi pierna izquierda" o "Me dijeron que tengo la columna curvada"',
    zh: '例如："我的下背部疼痛，疼痛蔓延到左腿" 或 "有人告诉我我的脊柱弯曲"',
  },
  'For example: "I twisted my knee playing soccer and it keeps giving way" or "My right shoulder aches at night and I cannot lift it overhead" or "I broke my wrist and want it checked"': {
    es: 'Por ejemplo: "Me torcí la rodilla jugando fútbol y se me dobla" o "Me duele el hombro derecho por la noche y no puedo levantar el brazo" o "Me fracturé la muñeca y quiero que la revisen"',
    zh: '例如："我踢足球时扭伤了膝盖，膝盖总是打软" 或 "我的右肩夜里疼，手臂抬不过头" 或 "我手腕骨折了，想检查一下"',
  },
  'Describe your main concern...': {
    es: 'Describa su principal preocupación...',
    zh: '请描述您主要的困扰……',
  },
  'Which areas are affected? Select all that apply. *': {
    es: '¿Qué áreas están afectadas? Seleccione todas las que correspondan. *',
    zh: '哪些部位受到影响？请选择所有适用项。*',
  },
  'Choose every area where you have pain, numbness, tingling or weakness. The next step asks what it feels like.': {
    es: 'Elija cada zona donde tenga dolor, entumecimiento, hormigueo o debilidad. El siguiente paso pregunta cómo se siente.',
    zh: '请选择所有出现疼痛、麻木、刺痛或无力的部位。下一步会询问具体感受。',
  },
  'Which joint or area is affected? Tap the side. *': {
    es: '¿Qué articulación o zona está afectada? Toque el lado. *',
    zh: '哪个关节或部位受到影响？请点选左右侧。*',
  },
  'Choose every joint where you have pain, swelling, stiffness, numbness or weakness. The next step asks what it feels like.': {
    es: 'Elija cada articulación donde tenga dolor, hinchazón, rigidez, entumecimiento o debilidad. El siguiente paso pregunta cómo se siente.',
    zh: '请选择所有出现疼痛、肿胀、僵硬、麻木或无力的关节。下一步会询问具体感受。',
  },
  'Which side? *': { es: '¿Qué lado? *', zh: '哪一侧？*' },
  'Tap the side for each joint you named on the first screen. Tap both if both sides are affected.': {
    es: 'Toque el lado de cada articulación que indicó en la primera pantalla. Toque ambos si los dos lados están afectados.',
    zh: '请为您在第一个屏幕上选择的每个关节点选左右侧。如果两侧都有问题，请都点选。',
  },
  'Any other joint?': { es: '¿Alguna otra articulación?', zh: '还有其他关节吗？' },
  'Spine & Back': { es: 'Columna y espalda', zh: '脊柱与背部' },
  'Arms & Legs': { es: 'Brazos y piernas', zh: '手臂与腿部' },
  'Other Symptoms': { es: 'Otros síntomas', zh: '其他症状' },
  'Joints': { es: 'Articulaciones', zh: '关节' },
  'Left': { es: 'Izquierdo', zh: '左' },
  'Right': { es: 'Derecho', zh: '右' },
  'What else describes it?': { es: '¿Qué más lo describe?', zh: '还有哪些描述符合？' },
  'Selected:': { es: 'Seleccionado:', zh: '已选择：' },
  'Neck and back problems have their own questions.': {
    es: 'Los problemas de cuello y espalda tienen sus propias preguntas.',
    zh: '颈部和背部问题有单独的问题。',
  },
  'If the neck or back is your main problem, switch to the spine questions.': {
    es: 'Si el cuello o la espalda es su problema principal, cambie a las preguntas de columna.',
    zh: '如果颈部或背部是您的主要问题，请切换到脊柱问题。',
  },
  'Switch to the spine questions': { es: 'Cambiar a las preguntas de columna', zh: '切换到脊柱问题' },
  'If a joint is the main problem and the back pain is on the side, carry on here.': {
    es: 'Si una articulación es el problema principal y el dolor de espalda es secundario, continúe aquí.',
    zh: '如果关节是主要问题、背痛只是附带的，请在此继续。',
  },
  'I have had prior spine surgery': {
    es: 'He tenido una cirugía de columna previa',
    zh: '我曾接受过脊柱手术',
  },
  'I have had surgery on this bone or joint before': {
    es: 'Ya me han operado este hueso o articulación',
    zh: '我以前做过这个骨骼或关节的手术',
  },
  "We'll ask you more details about this later in the form.": {
    es: 'Le pediremos más detalles sobre esto más adelante en el formulario.',
    zh: '我们将在表格后面询问您有关此事的更多详情。',
  },
  'Continue to the body map': {
    es: 'Continuar al mapa corporal',
    zh: '继续到身体图',
  },
};

/**
 * Chief complaint. What differs by service comes from the service's
 * constants module: the regions, how they are laid out (JOINT_ROWS is the
 * left/right joint grid of the ortho service and empty for the spine;
 * REGION_GROUPS the titled lists under it), the wording that names the
 * specialty (CHIEF_COMPLAINT_TEXT), and how the triage step's taps become
 * this service's regions (regionsFromTriage).
 *
 * Nothing the triage step already asked is asked again: the sentence the
 * patient typed there is shown as the main concern, editable in place, and
 * the regions they tapped are pre-selected. The ortho service's joints are
 * not sided on the triage step, so for those only the side is asked. How
 * long it has been going on is asked per problem on the symptom-details
 * step (the old duration chips and "what bothers you most" box are gone;
 * their fields stay in the data for older drafts and the office).
 */
export default function ChiefComplaint({ onNext, onBack }) {
  const { data, setField, setNested, setStep } = useIntake();
  const svc = useService();
  const { SYMPTOM_REGIONS, JOINT_ROWS, PELVIS_ROWS = [], REGION_GROUPS, CHIEF_COMPLAINT_TEXT: text, regionsFromTriage } = svc.constants;
  const cc = data.chiefComplaint;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

  const updateField = (field, value) => {
    setField('chiefComplaint', field, value);
  };

  const selected = cc.symptomRegions || [];
  const toggleRegion = (regionId) => {
    const updated = selected.includes(regionId)
      ? selected.filter((r) => r !== regionId)
      : [...selected, regionId];
    updateField('symptomRegions', updated);
  };

  // What the triage step said. Its regions pre-select this step's regions
  // once per set of triage answers (`triageSeed` remembers which set), so a
  // patient who goes back and changes the triage gets the new regions added,
  // while one who deliberately un-taps a region here is not overruled.
  const triageRegions = data.triage?.regions || [];
  const seedKey = triageRegions.join(',');
  const fromTriage = regionsFromTriage ? regionsFromTriage(triageRegions) : { regions: [], joints: [] };
  useEffect(() => {
    if (!seedKey || cc.triageSeed === seedKey) return;
    const next = [...new Set([...selected, ...fromTriage.regions])];
    if (next.length !== selected.length) updateField('symptomRegions', next);
    updateField('triageSeed', seedKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  // The joint rows the triage named (the side is still to be tapped) and the
  // rest; the same split for the pelvis rows (an SI tap still needs a side).
  const triageRows = JOINT_ROWS.filter((row) => fromTriage.joints.includes(row.joint));
  const otherRows = JOINT_ROWS.filter((row) => !fromTriage.joints.includes(row.joint));
  const triagePelvisRows = PELVIS_ROWS.filter((row) => row.joint && fromTriage.joints.includes(row.joint));
  const otherPelvisRows = PELVIS_ROWS.filter((row) => !triagePelvisRows.includes(row));

  const mainReason = String(cc.mainReason || '');
  const isValid = mainReason.trim() && selected.length > 0;

  // The ortho service accepts a neck-or-back tap but points it at the spine
  // questions; a service without that region (the spine) never shows the row.
  // A bone-or-joint region is anything with a place (a side, or the pelvis
  // and the tailbone); the quality and context chips do not count.
  const neckBack = SYMPTOM_REGIONS.find((r) => r.id === 'neck-back');
  const isPlace = (id) => /^(right|left)-/.test(id) || PELVIS_ROWS.some((row) => row.kind === 'wide' && row.id === id);
  const spineOnly = !!neckBack && selected.includes('neck-back') && !selected.some(isPlace);

  const jointRow = (row) => (
    <div key={row.joint} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
      <span className="text-sm font-medium text-gray-700 px-1">{t(row.joint)}</span>
      <SideButton label={t('Left')} selected={selected.includes(row.left)} onClick={() => toggleRegion(row.left)} />
      <SideButton label={t('Right')} selected={selected.includes(row.right)} onClick={() => toggleRegion(row.right)} />
    </div>
  );

  // A pelvis row: one wide button for a region with no side, or Left / Right
  // with a "Both" button beside the name that taps (or clears) both sides.
  const pelvisRow = (row) => {
    if (row.kind === 'wide') {
      const region = SYMPTOM_REGIONS.find((r) => r.id === row.id);
      if (!region) return null;
      return (
        <div key={row.id} className="grid grid-cols-[1fr_auto] gap-2 items-center">
          <span className="text-sm font-medium text-gray-700 px-1">{t(region.label)}</span>
          <SideButton label={t(region.label)} selected={selected.includes(region.id)} onClick={() => toggleRegion(region.id)} wide />
        </div>
      );
    }
    const both = selected.includes(row.left) && selected.includes(row.right);
    const toggleBoth = () => {
      const rest = selected.filter((r) => r !== row.left && r !== row.right);
      updateField('symptomRegions', both ? rest : [...rest, row.left, row.right]);
    };
    return (
      <div key={row.joint} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
        <span className="flex items-center gap-2 px-1">
          <span className="text-sm font-medium text-gray-700">{t(row.joint)}</span>
          <button
            type="button"
            onClick={toggleBoth}
            aria-pressed={both}
            className={`region-btn px-2.5 py-1 rounded-lg border text-xs font-medium ${both ? 'selected' : 'border-gray-200 text-gray-500'}`}
          >
            {t('Both')}
          </button>
        </span>
        <SideButton label={t('Left')} selected={selected.includes(row.left)} onClick={() => toggleRegion(row.left)} />
        <SideButton label={t('Right')} selected={selected.includes(row.right)} onClick={() => toggleRegion(row.right)} />
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('Your main concern')}</h2>
        <p className="section-subtitle">
          {t('Check what you told us, then choose every area that is affected. The next step is the body map.')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Main reason: the triage sentence, shown to check and edit. Only a
            patient who typed nothing there is asked the question outright. */}
        <div className="card">
          {mainReason.trim() ? (
            <>
              <label className="form-label text-base">{t('What you told us is going on')}</label>
              <p className="text-sm text-gray-400 mb-3">{t('From your first screen. Edit it if you like.')}</p>
            </>
          ) : (
            <>
              <label className="form-label text-base">
                {t('In your own words, what is the main reason for your visit? *')}
              </label>
              <p className="text-sm text-gray-400 mb-3">
                {t(text.example)}
              </p>
            </>
          )}
          <textarea
            value={mainReason}
            onChange={(e) => updateField('mainReason', e.target.value)}
            placeholder={t('Describe your main concern...')}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 resize-none"
          />
        </div>

        {/* Symptom regions */}
        <div className="card">
          <label className="form-label text-base">
            {t(text.regionsLabel)}
          </label>
          <p className="text-sm text-gray-400 mb-4">
            {t(text.regionsHint)}
          </p>

          <div className="space-y-4">
            {/* The joints the triage step named: only the side is missing (the ortho service) */}
            {(triageRows.length > 0 || triagePelvisRows.length > 0) && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-3">
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center mb-1 px-1">
                  <h4 className="text-sm font-medium text-navy-600">{t('Which side? *')}</h4>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 text-center">{t('Left')}</span>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 text-center">{t('Right')}</span>
                </div>
                <p className="text-xs text-gray-500 px-1 mb-2">{t('Tap the side for each joint you named on the first screen. Tap both if both sides are affected.')}</p>
                <div className="space-y-2">{triageRows.map(jointRow)}{triagePelvisRows.map(pelvisRow)}</div>
              </div>
            )}

            {/* Joints: a row per joint, left and right, then the pelvis rows (the ortho service) */}
            {(otherRows.length > 0 || otherPelvisRows.length > 0) && (
              <div>
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center mb-1 px-1">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{t(triageRows.length || triagePelvisRows.length ? 'Any other joint?' : 'Joints')}</h4>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 text-center">{t('Left')}</span>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 text-center">{t('Right')}</span>
                </div>
                <div className="space-y-2">
                  {otherRows.map(jointRow)}
                  {otherPelvisRows.map(pelvisRow)}
                  {neckBack && (
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center pt-1">
                      <span className="text-sm font-medium text-gray-700 px-1">{t(neckBack.label)}</span>
                      <SideButton label={t(neckBack.label)} selected={selected.includes(neckBack.id)} onClick={() => toggleRegion(neckBack.id)} wide />
                    </div>
                  )}
                </div>
              </div>
            )}

            {neckBack && selected.includes(neckBack.id) && (
              <div className={`rounded-xl px-4 py-3 text-sm ${spineOnly ? 'bg-amber-50 border border-amber-300 text-amber-900' : 'bg-gray-50 border border-gray-200 text-gray-600'}`}>
                <p className="font-medium">{t('Neck and back problems have their own questions.')}</p>
                <p className="mt-1">
                  {t('If the neck or back is your main problem, switch to the spine questions.')}{' '}
                  <button
                    type="button"
                    className="font-semibold underline text-teal-600 hover:text-teal-700"
                    onClick={() => {
                      // Same form, other service: the spine questions replace the joint ones from here on.
                      setNested('service', { ...(data.service || {}), specialty: 'spine', key: data.service?.patient === 'child' ? 'peds_spine' : 'adult_spine', how: 'manual' });
                      setField('chiefComplaint', 'symptomRegions', []);
                      setField('chiefComplaint', 'triageSeed', '');
                      const here = data.currentStep || 0;
                      setNested('completedSteps', (data.completedSteps || []).filter((i) => i < here));
                      setStep(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    {t('Switch to the spine questions')}
                  </button>
                </p>
                <p className="mt-1 text-xs opacity-80">{t('If a joint is the main problem and the back pain is on the side, carry on here.')}</p>
              </div>
            )}

            {/* Titled region groups: the spine's areas; the ortho qualities and context */}
            {REGION_GROUPS.map((group) => (
              <div key={group.id}>
                <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">{t(group.label)}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SYMPTOM_REGIONS.filter((r) => group.ids.includes(r.id)).map((region) => (
                    <RegionButton
                      key={region.id}
                      region={region}
                      label={t(region.label)}
                      selected={selected.includes(region.id)}
                      onClick={() => toggleRegion(region.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selected.length > 0 && (
            <div className="mt-4 p-3 bg-teal-50 rounded-xl">
              <p className="text-sm text-teal-700">
                <strong>{t('Selected:')}</strong> {selected.map((id) => {
                  const label = SYMPTOM_REGIONS.find((r) => r.id === id)?.label;
                  return label ? t(label) : null;
                }).filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Prior surgery on the spine, or on this bone or joint. One field for
            every service: Practice Hub stores it under this name, and the
            operations step starts from it. */}
        <div className="card">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!cc.hasPriorSpineSurgery}
              onChange={(e) => updateField('hasPriorSpineSurgery', e.target.checked)}
              className="mt-1"
            />
            <div>
              <span className="text-base font-medium text-gray-700">
                {t(text.priorSurgery)}
              </span>
              <p className="text-sm text-gray-400 mt-1">
                {t("We'll ask you more details about this later in the form.")}
              </p>
            </div>
          </label>
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={!!isValid}
        nextLabel={t('Continue to the body map')}
      />
    </div>
  );
}


function SideButton({ label, selected, onClick, wide }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`region-btn flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium ${wide ? 'w-[12.5rem]' : 'w-24'} ${
        selected ? 'selected' : 'border-gray-200 text-gray-600'
      }`}
    >
      <span className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
        selected ? 'border-teal-400 bg-teal-400' : 'border-gray-300'
      }`}>
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {wide ? label : null}
      {!wide && <span className="sr-only">{label}</span>}
    </button>
  );
}

function RegionButton({ region, label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`region-btn flex items-center gap-3 p-3 rounded-xl border text-left ${
        selected ? 'selected' : 'border-gray-200 text-gray-600'
      }`}
    >
      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
        selected ? 'border-teal-400 bg-teal-400' : 'border-gray-300'
      }`}>
        {selected && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-sm font-medium">{label ?? region.label}</span>
    </button>
  );
}
