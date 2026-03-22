'use client';

import { useIntake } from '../../lib/store';

export default function Welcome({ onNext }) {
  const { data, resetIntake } = useIntake();
  const hasExisting = data.lastUpdated && data.demographics?.firstName;

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center animate-fade-in">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-navy-600 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-navy-600 mb-4">
          Spine Surgery Clinic
        </h1>
        <h2 className="text-xl md:text-2xl font-medium text-navy-400 mb-6">
          Patient Intake Form
        </h2>

        <div className="card max-w-xl mx-auto mb-8 text-left">
          <p className="text-gray-600 mb-4 leading-relaxed">
            Welcome! This form helps us gather your medical history before your appointment.
            Your responses help your surgeon better understand your symptoms and prepare for
            your visit.
          </p>
          <div className="space-y-3 text-sm text-gray-500">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Takes approximately 15-25 minutes to complete</span>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Your progress is saved automatically — you can return anytime</span>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Your information is used only for your clinical care</span>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Answers don't need to be perfect — do your best and we'll fill in the rest at your visit</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {hasExisting && (
            <button onClick={onNext} className="btn-primary text-lg px-10 py-4 w-full max-w-xs mx-auto block">
              Continue Where You Left Off
            </button>
          )}
          <button
            onClick={() => {
              if (hasExisting) {
                if (confirm('This will start a new form and clear your previous answers. Continue?')) {
                  resetIntake();
                  setTimeout(onNext, 100);
                }
              } else {
                onNext();
              }
            }}
            className={hasExisting
              ? 'btn-secondary text-base px-8 py-3 w-full max-w-xs mx-auto block'
              : 'btn-primary text-lg px-10 py-4 w-full max-w-xs mx-auto block'
            }
          >
            {hasExisting ? 'Start New Form' : 'Begin Intake Form'}
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mt-10 p-4 bg-amber-50 border border-amber-200 rounded-xl max-w-xl mx-auto">
          <p className="text-xs text-amber-700">
            <strong>Prototype Notice:</strong> This is a clinical intake tool prototype.
            This form does not replace direct medical evaluation or provide medical advice.
            If you are experiencing a medical emergency, call 911.
          </p>
        </div>
      </div>
    </div>
  );
}
