'use client';

import StepNavigation from '../../ui/StepNavigation';

/** Placeholder: the pediatric 'injury' step is being built. */
export default function Injury({ onNext, onBack }) {
  return (
    <div className="animate-fade-in">
      <h2 className="section-title">Injury</h2>
      <StepNavigation onNext={onNext} onBack={onBack} canGoNext />
    </div>
  );
}
