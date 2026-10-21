'use client';

import StepNavigation from '../../ui/StepNavigation';

/** Placeholder: the pediatric 'fx-followup' step is being built. */
export default function FractureFollowUp({ onNext, onBack }) {
  return (
    <div className="animate-fade-in">
      <h2 className="section-title">FractureFollowUp</h2>
      <StepNavigation onNext={onNext} onBack={onBack} canGoNext />
    </div>
  );
}
