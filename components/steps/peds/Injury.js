'use client';

import { useIntake, useService } from '../../../lib/store';
import { useLang, makeT, COMMON } from '../../../lib/i18n';
import { PEDS_ORTHO_TEXT } from '../../../lib/services/peds-ortho/text';
import StepNavigation from '../../ui/StepNavigation';
import { Chips, CheckChips, TextField, TextArea, PainScale } from '../../ui/Fields';

const YES = 'Yes, an injury or a broken bone';
const NO = 'No, something else';

/**
 * The first question of a child's new problem: is this the fracture clinic?
 * The answer is `pedsOrtho.track` ('fracture' | 'full') and the flow
 * (lib/services/peds-ortho/flow.js) reshapes itself around it. For a
 * fracture the rest of this step is the source app's "What happened?"
 * screen: what is hurt and which side, when, hand dominance for an arm,
 * how it happened, and what was noticed right afterwards.
 */
export default function Injury({ onNext, onBack }) {
  const { data, setNested, setField } = useIntake();
  const svc = useService();
  const {
    BODY_PART_CHIPS, UPPER_LIMB_PARTS, BODY_PART_AREA, SIDE_CHIPS, HAND_DOMINANCE,
    MECHANISM_CHIPS, USE_AFTER, POP_CRACK, SWELLING_CHIPS,
  } = svc.constants;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...PEDS_ORTHO_TEXT }, lang);

  const track = data.pedsOrtho?.track || '';
  const inj = data.pedsOrtho?.injury || {};
  const set = (k, v) => setNested(`pedsOrtho.injury.${k}`, v);
  const parts = inj.bodyPart || [];
  const upperLimb = parts.some((p) => UPPER_LIMB_PARTS.includes(p));

  const setTrack = (answer) => {
    setNested('pedsOrtho.track', answer === YES ? 'fracture' : answer === NO ? 'full' : '');
  };

  /**
   * The fracture track skips the chief-complaint step, so the body part and
   * side name the complaint here: the region ids steer the questionnaires
   * and the note, and the one-line reason heads the chief complaint.
   */
  const syncComplaint = (nextParts, nextSide) => {
    const sides = nextSide === 'Both' ? ['right', 'left'] : nextSide === 'Left' ? ['left'] : nextSide === 'Right' ? ['right'] : [];
    const regions = new Set(['trauma']);
    for (const part of nextParts) {
      const area = BODY_PART_AREA[part];
      if (area) for (const s of sides) regions.add(`${s}-${area}`);
    }
    setField('chiefComplaint', 'symptomRegions', [...regions]);
    const current = data.chiefComplaint?.mainReason || '';
    if (!current || /^Recent injury/i.test(current)) {
      const where = [nextSide && nextSide !== 'Not sure' ? nextSide.toLowerCase() : '', nextParts.map((p) => p.toLowerCase()).join(', ')].filter(Boolean).join(' ');
      setField('chiefComplaint', 'mainReason', where ? `Recent injury: ${where}` : 'Recent injury or broken bone');
    }
  };

  const canGoNext = track === 'full' || (track === 'fracture' && parts.length > 0);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('What Happened')}</h2>
        {track === 'fracture' && (
          <p className="section-subtitle">
            {t('Tap whatever fits. If something is not listed, write it in your own words — that is often the most useful part.')}
          </p>
        )}
      </div>

      <div className="space-y-6">
        <div className="card space-y-3">
          {data.mode === 'fracture' ? null : track ? (
            <p className="text-sm text-gray-600">
              {t(track === 'fracture' ? 'You said this is about an injury or a broken bone.' : 'You said this is not about an injury or a broken bone.')}{' '}
              <button type="button" className="underline text-teal-600" onClick={() => setTrack('')}>{t('Change')}</button>
            </p>
          ) : (
            <Chips
              label="Is this about a recent injury or a broken bone?"
              options={[YES, NO]}
              value=""
              onChange={setTrack}
            />
          )}
          <p className="text-xs text-gray-400">
            {t('A recent fall, twist, knock or sports injury, or a bone that has been broken or may be broken. The questions that follow are short and about the injury.')}
          </p>
          {track === 'full' && (
            <p className="text-sm text-gray-600">{t('Thank you. The next steps ask about the problem in the usual way.')}</p>
          )}
        </div>

        {track === 'fracture' && (
          <>
            <div className="card space-y-4">
              <h3 className="text-lg font-medium text-navy-600">{t('What is hurt?')}</h3>
              <CheckChips
                label="Tap every part that is hurt"
                options={BODY_PART_CHIPS}
                value={parts}
                onChange={(v) => { set('bodyPart', v); syncComplaint(v, inj.side || ''); }}
              />
              <Chips label="Which side?" options={SIDE_CHIPS} value={inj.side} onChange={(v) => { set('side', v); syncComplaint(parts, v); }} />
              <TextField label="When did it happen?" value={inj.injuryDate} onChange={(v) => set('injuryDate', v)} placeholder="e.g. last Saturday, or 03/14" />
              {upperLimb && (
                <Chips label="Which hand does your child write with?" options={HAND_DOMINANCE} value={inj.handDominance} onChange={(v) => set('handDominance', v)} />
              )}
            </div>

            <div className="card space-y-4">
              <h3 className="text-lg font-medium text-navy-600">{t('How did it happen?')}</h3>
              <CheckChips options={MECHANISM_CHIPS} value={inj.mechanismChips || []} onChange={(v) => set('mechanismChips', v)} />
              <TextArea
                label="In your own words"
                value={inj.mechanism}
                onChange={(v) => set('mechanism', v)}
                placeholder="What were they doing, and what happened? Even small details help — which way it twisted, how far they fell, whether anyone saw it."
                rows={3}
              />
            </div>

            <div className="card space-y-4">
              <h3 className="text-lg font-medium text-navy-600">{t('Right afterwards')}</h3>
              <Chips label="Could they use it or put weight on it?" options={USE_AFTER} value={inj.useAfter} onChange={(v) => set('useAfter', v)} />
              <Chips label="Did anyone hear or feel a pop or crack?" options={POP_CRACK} value={inj.popCrack} onChange={(v) => set('popCrack', v)} />
              <CheckChips label="Anything you noticed (tap all that apply)" options={SWELLING_CHIPS} value={inj.signs || []} onChange={(v) => set('signs', v)} />
              <PainScale label="How much does it hurt right now?" value={inj.painNow} onChange={(v) => set('painNow', v)} />
            </div>
          </>
        )}
      </div>

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext={canGoNext} />
    </div>
  );
}
