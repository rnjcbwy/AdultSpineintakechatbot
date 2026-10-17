'use client';

import { useIntake } from '../../lib/store';
import { useLang, makeT, COMMON } from '../../lib/i18n';
import { VISIT_CHOICES, VISIT_LABEL } from '../../lib/flows';
import StepNavigation from '../ui/StepNavigation';
import { Chips } from '../ui/Fields';

const YES_NO = ['Yes', 'No'];

/**
 * Two choices: a new patient or a new problem, or a follow-up visit. One
 * follow-up question under each decides the exact set of steps: a work
 * injury with a compensation claim adds the claim step; a follow-up after
 * spine surgery adds the operation and recovery step. The patient never
 * sees those internal kinds; the office does.
 */
export default function VisitType({ onNext, onBack }) {
  const { data, setNested, setField } = useIntake();
  const lang = useLang();
  const t = makeT(COMMON, lang);
  const v = data.visit || {};
  const choice = v.choice || (v.type === 'workers_comp' || v.type === 'new' ? 'new' : v.type === 'postop' || v.type === 'followup' ? 'followup' : '');

  // The internal kind (lib/flows.js) follows the two answers.
  const apply = (next) => {
    const c = next.choice ?? choice;
    const work = next.workInjury ?? v.workInjury ?? '';
    const surgery = next.hadSurgery ?? v.hadSurgery ?? '';
    let type = '';
    if (c === 'new') type = work === 'Yes' ? 'workers_comp' : work === 'No' ? 'new' : '';
    if (c === 'followup') type = surgery === 'Yes' ? 'postop' : surgery === 'No' ? 'followup' : '';
    const changed = type && type !== v.type;
    if (next.choice !== undefined) setNested('visit.choice', next.choice);
    if (next.workInjury !== undefined) setNested('visit.workInjury', next.workInjury);
    if (next.hadSurgery !== undefined) setNested('visit.hadSurgery', next.hadSurgery);
    if (type) {
      setNested('visit.type', type);
      setField('demographics', 'visitReason', VISIT_LABEL[type]);
    }
    if (changed) {
      // The steps after this one differ by kind, so "completed" marks
      // beyond it no longer refer to the same steps.
      const here = data.currentStep || 0;
      setNested('completedSteps', (data.completedSteps || []).filter((i) => i <= here));
    }
  };

  const canGoNext = (choice === 'new' && !!v.workInjury) || (choice === 'followup' && !!v.hadSurgery);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('What kind of visit is this?')}</h2>
        <p className="section-subtitle">{t('This shapes the questions that follow, so you are only asked what matters for this visit.')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {VISIT_CHOICES.map((c) => {
          const active = choice === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => apply({ choice: c.id })}
              aria-pressed={active}
              className={`text-left p-5 rounded-2xl border-2 transition-all ${active ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-white hover:border-teal-200'}`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${active ? 'border-teal-400' : 'border-gray-300'}`}>
                  {active && <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />}
                </span>
                <span>
                  <span className="block text-base font-semibold text-navy-600">{t(c.label)}</span>
                  <span className="block text-sm text-gray-500 mt-1 leading-relaxed">{t(c.description)}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {choice === 'new' && (
        <div className="card mt-4 animate-fade-in">
          <Chips
            label="Is this a work-related injury with a workers' compensation claim?"
            options={YES_NO}
            value={v.workInjury || ''}
            onChange={(x) => apply({ workInjury: x })}
            hint="If yes, we will ask for the claim number and how the injury happened."
          />
        </div>
      )}

      {choice === 'followup' && (
        <div className="card mt-4 animate-fade-in">
          <Chips
            label="Have you had spine surgery?"
            options={YES_NO}
            value={v.hadSurgery || ''}
            onChange={(x) => apply({ hadSurgery: x })}
            hint="If yes, we will ask which operation, roughly when (month and year are fine), and whether it was done here."
          />
        </div>
      )}

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext={canGoNext} />
    </div>
  );
}
