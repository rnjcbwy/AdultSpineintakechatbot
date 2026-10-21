'use client';

import StepNavigation from '../../ui/StepNavigation';

/** Placeholder: the pediatric 'spine-history' step is being built. */
export default function SpineHistory({ onNext, onBack }) {
  return (
    <div className="animate-fade-in">
      <h2 className="section-title">SpineHistory</h2>
      <StepNavigation onNext={onNext} onBack={onBack} canGoNext />
    </div>
  );
}
