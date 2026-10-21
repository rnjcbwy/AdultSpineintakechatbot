'use client';

import StepNavigation from '../../ui/StepNavigation';

/** Placeholder: the pediatric 'growth' step is being built. */
export default function Growth({ onNext, onBack }) {
  return (
    <div className="animate-fade-in">
      <h2 className="section-title">Growth</h2>
      <StepNavigation onNext={onNext} onBack={onBack} canGoNext />
    </div>
  );
}
