'use client';

import { useIntake, useService } from '../../../lib/store';
import { useLang, makeT, COMMON } from '../../../lib/i18n';
import { PEDS_ORTHO_TEXT } from '../../../lib/services/peds-ortho/text';
import StepNavigation from '../../ui/StepNavigation';
import { Chips, CheckChips, TextField, TextArea } from '../../ui/Fields';

/**
 * The fracture clinic's second screen (the source app's "What has been done
 * so far?"): who has seen the injury, X-rays and what the family was told,
 * the cast, splint or surgery so far, anything for pain, previous broken
 * bones and what the child wants to get back to. Stored under
 * `pedsOrtho.injuryCare`. Nothing is required: "nothing yet" is an answer.
 */
export default function InjuryCare({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const svc = useService();
  const { SEEN_WHERE_CHIPS, IMAGING_DONE, FRACTURE_TREATMENT_CHIPS, STILL_ON } = svc.constants;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...PEDS_ORTHO_TEXT }, lang);

  const c = data.pedsOrtho?.injuryCare || {};
  const set = (k, v) => setNested(`pedsOrtho.injuryCare.${k}`, v);
  const seen = c.seenWhere || [];
  const treatment = c.treatment || [];
  const hadSomething = treatment.some((x) => x !== 'Nothing yet');

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('What has been done so far?')}</h2>
        <p className="section-subtitle">
          {t('If nothing has been done yet, that is a perfectly good answer — just say so and carry on.')}
        </p>
      </div>

      <div className="space-y-6">
        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('Who has seen it')}</h3>
          <CheckChips options={SEEN_WHERE_CHIPS} value={seen} onChange={(v) => set('seenWhere', v)} exclusive="Nowhere yet" />
          {seen.some((x) => x !== 'Nowhere yet') && (
            <TextField label="Which hospital, office or doctor?" value={c.seenWhereName} onChange={(v) => set('seenWhereName', v)} placeholder="Name of the place, and the doctor if you remember" />
          )}
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('X-rays and scans')}</h3>
          <Chips label="Has it been X-rayed or scanned?" options={IMAGING_DONE} value={c.imagingDone} onChange={(v) => set('imagingDone', v)} />
          {c.imagingDone === 'Yes' && (
            <>
              <TextField label="Where was it done?" value={c.imagingWhere} onChange={(v) => set('imagingWhere', v)} />
              <TextField label="What were you told it showed?" value={c.imagingTold} onChange={(v) => set('imagingTold', v)} placeholder="In whatever words you were given" />
              <p className="text-xs text-gray-500">
                {t('If you can, bring the actual images on a CD or USB — a report on its own is often not enough. Call wherever it was done and ask for a copy.')}
              </p>
            </>
          )}
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('Treatment so far')}</h3>
          <CheckChips options={FRACTURE_TREATMENT_CHIPS} value={treatment} onChange={(v) => set('treatment', v)} exclusive="Nothing yet" />
          {hadSomething && (
            <>
              <TextField label="When was it put on or done?" value={c.treatmentWhen} onChange={(v) => set('treatmentWhen', v)} placeholder="e.g. the same day, or 03/15" />
              <Chips label="Is it still on?" options={STILL_ON} value={c.stillOn} onChange={(v) => set('stillOn', v)} />
              <TextArea label="If there was surgery or the bone was set, what were you told about it?" value={c.surgeryDetail} onChange={(v) => set('surgeryDetail', v)} rows={2} />
            </>
          )}
          <TextField label="Anything given for pain?" value={c.painMeds} onChange={(v) => set('painMeds', v)} placeholder="e.g. ibuprofen, acetaminophen, nothing" />
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('A little background')}</h3>
          <TextField label="Has your child broken a bone before?" value={c.priorFractures} onChange={(v) => set('priorFractures', v)} placeholder="Which bone, roughly when, and how it was treated" />
          <TextArea
            label="What is your child hoping to get back to?"
            value={c.returnGoal}
            onChange={(v) => set('returnGoal', v)}
            placeholder="A sport, a season, a tryout, gym class, playing outside — whatever matters to them"
            rows={2}
          />
        </div>
      </div>

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext />
    </div>
  );
}
