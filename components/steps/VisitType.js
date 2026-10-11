'use client';

import { useIntake } from '../../lib/store';
import { useLang, makeT, COMMON } from '../../lib/i18n';
import { VISIT_TYPES } from '../../lib/flows';
import StepNavigation from '../ui/StepNavigation';

/**
 * Which kind of visit this is. It decides everything that follows: a new
 * problem gets the full history, a follow-up asks what changed, a visit after
 * surgery asks about the operation and the recovery, and a work injury adds
 * the claim details before the history.
 */
export default function VisitType({ onNext, onBack }) {
  const { data, setNested, setField } = useIntake();
  const lang = useLang();
  const t = makeT(COMMON, lang);
  const current = data.visit?.type || '';

  const choose = (v) => {
    if (v.id === current) return;
    setNested('visit.type', v.id);
    // The office's summary still reads the old free-text field; keep it in step.
    setField('demographics', 'visitReason', v.label);
    // The steps after this one are different for each kind of visit, so
    // "completed" marks beyond it no longer refer to the same steps.
    const here = data.currentStep || 0;
    setNested('completedSteps', (data.completedSteps || []).filter((i) => i <= here));
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('What kind of visit is this?')}</h2>
        <p className="section-subtitle">
          {t('This shapes the questions that follow, so you are only asked what matters for this visit. If you are not sure, choose the first one.')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {VISIT_TYPES.map((v) => {
          const active = current === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => choose(v)}
              aria-pressed={active}
              className={`text-left p-5 rounded-2xl border-2 transition-all ${
                active ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-white hover:border-teal-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${active ? 'border-teal-400' : 'border-gray-300'}`}>
                  {active && <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />}
                </span>
                <span>
                  <span className="block text-base font-semibold text-navy-600">{t(v.label)}</span>
                  <span className="block text-sm text-gray-500 mt-1 leading-relaxed">{t(v.description)}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext={!!current} />
    </div>
  );
}
