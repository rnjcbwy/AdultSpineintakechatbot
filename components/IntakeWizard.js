'use client';

import { useIntake } from '../lib/store';
import { INTAKE_STEPS } from '../lib/constants';
import ProgressBar from './ProgressBar';
import Welcome from './steps/Welcome';
import Demographics from './steps/Demographics';
import ChiefComplaint from './steps/ChiefComplaint';
import HPISection from './steps/HPISection';
import PastMedicalHistory from './steps/PastMedicalHistory';
import PastSurgicalHistory from './steps/PastSurgicalHistory';
import Medications from './steps/Medications';
import Allergies from './steps/Allergies';
import SocialHistory from './steps/SocialHistory';
import FamilyHistory from './steps/FamilyHistory';
import ReviewOfSystems from './steps/ReviewOfSystems';
import PROMs from './steps/PROMs';
import FinalReview from './steps/FinalReview';

// Map step index to component
const STEP_COMPONENTS = [
  Welcome,
  Demographics,
  ChiefComplaint,
  HPISection,
  PastMedicalHistory,
  PastSurgicalHistory,
  Medications,
  Allergies,
  SocialHistory,
  FamilyHistory,
  ReviewOfSystems,
  PROMs,
  FinalReview,
];

export default function IntakeWizard() {
  const { data, setStep, completeStep } = useIntake();
  const currentStep = data.currentStep;
  const StepComponent = STEP_COMPONENTS[currentStep];

  const goNext = () => {
    completeStep(currentStep);
    if (currentStep < INTAKE_STEPS.length - 1) {
      setStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (step) => {
    // Allow going back to completed steps or current step
    if (step <= currentStep || data.completedSteps.includes(step)) {
      setStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      {currentStep > 0 && (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-navy-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-navy-600">Spine Surgery Intake</h1>
                  <p className="text-xs text-gray-400">
                    Step {currentStep} of {INTAKE_STEPS.length - 1}
                    {' · '}
                    {INTAKE_STEPS[currentStep]?.label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Your progress is automatically saved. You can return later to continue.')) {
                    // Just close or show saved message
                  }
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Save & Exit
              </button>
            </div>
            <ProgressBar current={currentStep} total={INTAKE_STEPS.length - 1} steps={INTAKE_STEPS} />
          </div>
        </header>
      )}

      {/* Main content area */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="step-enter">
          <StepComponent
            onNext={goNext}
            onBack={goBack}
            onGoToStep={goToStep}
          />
        </div>
      </main>

      {/* Footer disclaimer */}
      {currentStep > 0 && currentStep < INTAKE_STEPS.length - 1 && (
        <footer className="max-w-4xl mx-auto px-4 pb-8">
          <p className="text-xs text-gray-400 text-center">
            This intake form is for information gathering only and does not replace direct medical evaluation.
            Your responses are saved automatically. If you need urgent medical attention, please call 911 or go to the nearest emergency room.
          </p>
        </footer>
      )}
    </div>
  );
}
