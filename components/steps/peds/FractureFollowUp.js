'use client';

import { useIntake, useService } from '../../../lib/store';
import { useLang, makeT, COMMON } from '../../../lib/i18n';
import { PEDS_ORTHO_TEXT } from '../../../lib/services/peds-ortho/text';
import StepNavigation from '../../ui/StepNavigation';
import { Chips, CheckChips, TextField, TextArea, PainScale } from '../../ui/Fields';

const YES = 'Yes, an injury or a broken bone';
const NO = 'No, something else';

/**
 * Two screens from the source app, one step:
 *
 * At a FOLLOW-UP (after the shared interval-history step) it opens with "Is
 * this visit about a broken bone or a recent injury?"; the answer is
 * `pedsOrtho.track`. For a fracture the rest is the cast check: what was
 * done, whether it is still on, trouble with the cast, pain and use of the
 * limb, the neurovascular warning signs, re-injury and imaging since. Stored
 * under `pedsOrtho.fxFollowUp`.
 *
 * At a POST-OPERATIVE visit (after the shared post-op step, which already
 * takes the operations, the incision, the complications, weight bearing,
 * therapy and opioids) it asks what the child's post-op screen asked and
 * the shared step does not: how the recovery is going, the wound and what
 * is covering it, pain medicine, the restrictions the family was given and
 * whether they could keep to them, anything else since, school and sport.
 * Stored under `pedsOrtho.postop`.
 */
export default function FractureFollowUp({ onNext, onBack }) {
  const { data } = useIntake();
  const postop = data.visit?.type === 'postop';
  return postop ? <PostOpExtras onNext={onNext} onBack={onBack} /> : <CastCheck onNext={onNext} onBack={onBack} />;
}

function CastCheck({ onNext, onBack }) {
  const { data, setNested, setField } = useIntake();
  const svc = useService();
  const {
    BODY_PART_CHIPS, BODY_PART_AREA, SIDE_CHIPS, FX_TREATMENT_CHIPS, FX_STILL_ON, CAST_PROBLEM_CHIPS,
    PAIN_TREND, USING_LIMB, IMAGING_SINCE, LIMB_WARNING_CHIPS,
  } = svc.constants;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...PEDS_ORTHO_TEXT }, lang);

  const track = data.pedsOrtho?.track || '';
  const f = data.pedsOrtho?.fxFollowUp || {};
  const set = (k, v) => setNested(`pedsOrtho.fxFollowUp.${k}`, v);
  const parts = f.bodyPart || [];

  const setTrack = (answer) => {
    setNested('pedsOrtho.track', answer === YES ? 'fracture' : answer === NO ? 'full' : '');
  };

  // The fracture follow-up skips the body map, so the part and side name
  // the regions for the note and the questionnaires.
  const syncRegions = (nextParts, nextSide) => {
    const sides = nextSide === 'Both' ? ['right', 'left'] : nextSide === 'Left' ? ['left'] : nextSide === 'Right' ? ['right'] : [];
    const regions = new Set(['trauma']);
    for (const part of nextParts) {
      const area = BODY_PART_AREA[part];
      if (area) for (const s of sides) regions.add(`${s}-${area}`);
    }
    setField('chiefComplaint', 'symptomRegions', [...regions]);
    const current = data.chiefComplaint?.mainReason || '';
    if (!current || /^(Follow-up of a known|Fracture follow-up)/i.test(current)) {
      const where = [nextSide && nextSide !== 'Not sure' ? nextSide.toLowerCase() : '', nextParts.map((p) => p.toLowerCase()).join(', ')].filter(Boolean).join(' ');
      setField('chiefComplaint', 'mainReason', where ? `Fracture follow-up: ${where}` : 'Fracture follow-up');
    }
  };

  const canGoNext = track === 'full' || (track === 'fracture' && parts.length > 0);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('How has it been since the injury?')}</h2>
        {track === 'fracture' && (
          <p className="section-subtitle">
            {t('A few questions about the break and how the last few weeks have gone. Tap whatever fits.')}
          </p>
        )}
      </div>

      <div className="space-y-6">
        <div className="card space-y-3">
          <Chips
            label="Is this visit about a broken bone or a recent injury?"
            options={[YES, NO]}
            value={track === 'fracture' ? YES : track === 'full' ? NO : ''}
            onChange={setTrack}
          />
          {track === 'full' && (
            <p className="text-sm text-gray-600">{t('Thank you. The next steps ask what has changed since the last visit in the usual way.')}</p>
          )}
        </div>

        {track === 'fracture' && (
          <>
            <div className="card space-y-4">
              <h3 className="text-lg font-medium text-navy-600">{t('What is hurt?')}</h3>
              <CheckChips label="Tap every part that is hurt" options={BODY_PART_CHIPS} value={parts} onChange={(v) => { set('bodyPart', v); syncRegions(v, f.side || ''); }} />
              <Chips label="Which side?" options={SIDE_CHIPS} value={f.side} onChange={(v) => { set('side', v); syncRegions(parts, v); }} />
              <TextField label="When was it broken or injured?" value={f.injuryDate} onChange={(v) => set('injuryDate', v)} placeholder="e.g. three weeks ago, or 09/18" />
            </div>

            <div className="card space-y-4">
              <h3 className="text-lg font-medium text-navy-600">{t('What was done for it?')}</h3>
              <CheckChips options={FX_TREATMENT_CHIPS} value={f.treatment || []} onChange={(v) => set('treatment', v)} exclusive="Nothing — just rest" />
              <Chips label="Is the cast, splint or brace still on?" options={FX_STILL_ON} value={f.stillOn} onChange={(v) => set('stillOn', v)} />
            </div>

            <div className="card space-y-4">
              <h3 className="text-lg font-medium text-navy-600">{t('Any trouble with the cast or splint?')}</h3>
              <p className="text-sm text-gray-500">
                {t('Tap anything that has happened, even if it seems small. If it has all been fine, say so and move on.')}
              </p>
              <CheckChips options={CAST_PROBLEM_CHIPS} value={f.castProblems || []} onChange={(v) => set('castProblems', v)} exclusive="No problems at all" />
            </div>

            <div className="card space-y-4">
              <h3 className="text-lg font-medium text-navy-600">{t('How is your child now?')}</h3>
              <PainScale label="Pain right now" value={f.painNow} onChange={(v) => set('painNow', v)} />
              <Chips label="Compared with the last visit" options={PAIN_TREND} value={f.painTrend} onChange={(v) => set('painTrend', v)} />
              <Chips label="Are they using the arm or leg?" options={USING_LIMB} value={f.usingLimb} onChange={(v) => set('usingLimb', v)} />
              <Chips label="Any new imaging since the last visit?" options={IMAGING_SINCE} value={f.imagingSince} onChange={(v) => set('imagingSince', v)} />
              <CheckChips label="Has your child had any of these?" options={LIMB_WARNING_CHIPS} value={f.warnings || []} onChange={(v) => set('warnings', v)} exclusive="None of these" />
              <Chips label="Has it been knocked or re-injured since?" options={['No', 'Yes']} value={f.reinjury} onChange={(v) => set('reinjury', v)} />
              {f.reinjury === 'Yes' && (
                <TextArea label="What happened?" value={f.reinjuryDetail} onChange={(v) => set('reinjuryDetail', v)} rows={2} />
              )}
              <TextField label="Anything given for pain since the last visit (optional)" value={f.medsSince} onChange={(v) => set('medsSince', v)} placeholder="e.g. ibuprofen for the first week" />
              <TextArea
                label="What is your child hoping to get back to?"
                value={f.returnGoal}
                onChange={(v) => set('returnGoal', v)}
                placeholder="A sport, a season, gym class, playing outside — whatever matters to them"
                rows={2}
              />
            </div>
          </>
        )}
      </div>

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext={canGoNext} />
    </div>
  );
}

function PostOpExtras({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const svc = useService();
  const {
    RECOVERY_TREND, WOUND_CHIPS, DRESSING, PAIN_TREND, POSTOP_PAIN_MEDS, THERAPY_STARTED,
    RESTRICTION_CHIPS, FOLLOWING_RESTRICTIONS, POSTOP_EVENT_CHIPS,
  } = svc.constants;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...PEDS_ORTHO_TEXT }, lang);

  const p = data.pedsOrtho?.postop || {};
  const set = (k, v) => setNested(`pedsOrtho.postop.${k}`, v);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('How has it gone since the operation?')}</h2>
        <p className="section-subtitle">
          {t('A few more questions about the wound and the days since. If you are unsure of a detail, leave it — it will be checked at the visit.')}
        </p>
      </div>

      <div className="space-y-6">
        <div className="card space-y-4">
          <Chips label="How is recovery going?" options={RECOVERY_TREND} value={p.recoveryTrend} onChange={(v) => set('recoveryTrend', v)} />
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('The wound')}</h3>
          <p className="text-sm text-gray-500">
            {t('Tap anything you have noticed. If it looks the way you were told to expect, tap the last one.')}
          </p>
          <CheckChips options={WOUND_CHIPS} value={p.wound || []} onChange={(v) => set('wound', v)} exclusive="The wound looks fine" />
          <Chips label="What is covering it now?" options={DRESSING} value={p.dressing} onChange={(v) => set('dressing', v)} />
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('Pain and medicine')}</h3>
          <Chips label="Compared with a few days ago" options={PAIN_TREND} value={p.painTrend} onChange={(v) => set('painTrend', v)} />
          <Chips label="Still taking something for pain?" options={POSTOP_PAIN_MEDS} value={p.painMeds} onChange={(v) => set('painMeds', v)} />
          {p.painMeds && p.painMeds !== 'No, nothing' && (
            <TextField label="Which medicine, and how often?" value={p.painMedsDetail} onChange={(v) => set('painMedsDetail', v)} placeholder="e.g. ibuprofen twice a day" />
          )}
          <Chips label="Has physical therapy started?" options={THERAPY_STARTED} value={p.therapy} onChange={(v) => set('therapy', v)} />
          {p.therapy === 'Yes' && (
            <TextField label="Where, and how often?" value={p.therapyWhere} onChange={(v) => set('therapyWhere', v)} placeholder="Clinic name, times a week" />
          )}
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('What you were told to do')}</h3>
          <CheckChips options={RESTRICTION_CHIPS} value={p.restrictions || []} onChange={(v) => set('restrictions', v)} exclusive="No restrictions given" />
          <Chips label="Has it been possible to stick to?" options={FOLLOWING_RESTRICTIONS} value={p.followingRestrictions} onChange={(v) => set('followingRestrictions', v)} />
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('Anything else since the operation?')}</h3>
          <CheckChips options={POSTOP_EVENT_CHIPS} value={p.events || []} onChange={(v) => set('events', v)} exclusive="Nothing like that" />
          <TextArea label="Anything you want to describe in your own words (optional)" value={p.eventDetail} onChange={(v) => set('eventDetail', v)} rows={2} />
          <TextArea label="How are school, sport and activities going?" value={p.activityStatus} onChange={(v) => set('activityStatus', v)} rows={2} />
          <TextArea
            label="What is your child hoping to get back to?"
            value={p.returnGoal}
            onChange={(v) => set('returnGoal', v)}
            placeholder="School, sport, playing outside — whatever matters to them"
            rows={2}
          />
        </div>
      </div>

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext />
    </div>
  );
}
