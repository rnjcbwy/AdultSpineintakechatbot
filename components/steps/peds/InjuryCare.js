'use client';

import StepNavigation from '../../ui/StepNavigation';

/** Placeholder: the pediatric 'injury-care' step is being built. */
export default function InjuryCare({ onNext, onBack }) {
  return (
    <div className="animate-fade-in">
      <h2 className="section-title">InjuryCare</h2>
      <StepNavigation onNext={onNext} onBack={onBack} canGoNext />
    </div>
  );
}
