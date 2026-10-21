'use client';

import StepNavigation from '../../ui/StepNavigation';

/** Placeholder: the pediatric 'clinical-photos' step is being built. */
export default function ClinicalPhotos({ onNext, onBack }) {
  return (
    <div className="animate-fade-in">
      <h2 className="section-title">ClinicalPhotos</h2>
      <StepNavigation onNext={onNext} onBack={onBack} canGoNext />
    </div>
  );
}
