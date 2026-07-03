'use client';

import { useIntake } from '../../lib/store';

const INTAKE_STEPS = [
  'Basic demographic information',
  'A guided conversation about your symptoms',
  'Structured medical history forms',
  'Quality of life questionnaires',
  'Review and submission',
];

function SpineLogo() {
  const vertebrae = [10, 25, 40, 55, 70, 85, 100];
  return (
    <svg viewBox="0 0 100 120" className="spine-logo mx-auto" aria-label="Spine logo">
      <defs>
        <linearGradient id="spineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2A5A8C" />
          <stop offset="100%" stopColor="#1A3A5C" />
        </linearGradient>
      </defs>
      {vertebrae.map((y, i) => (
        <rect
          key={y}
          x="30"
          y={y}
          width="40"
          height="12"
          rx="6"
          fill="url(#spineGrad)"
          className="vertebra"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </svg>
  );
}

export default function Welcome({ onNext }) {
  const { data, resetIntake } = useIntake();
  const hasExisting = data.lastUpdated && data.demographics?.firstName;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-[600px] w-full mx-auto text-center animate-fade-in">
        {/* Animated spine logo */}
        <div className="mb-8">
          <SpineLogo />
        </div>

        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-navy-600 mb-1">
          Comprehensive Spine &amp; Scoliosis Center
        </h1>
        <p className="text-lg font-medium text-teal-400 tracking-wide mb-2">
          Aaron Wey, MD, FAAOS, FACS
        </p>
        <h2 className="text-xl font-normal text-gray-500 mb-6">
          New Patient Intake
        </h2>

        {/* Prototype banner */}
        <div className="bg-amber-100 border-2 border-amber-500 rounded-xl px-4 py-3 mb-3 text-sm font-semibold text-amber-800 leading-snug">
          ⚠️ PROTOTYPE / DEMONSTRATION ONLY — Please do not enter real patient
          information. Use fictional names and details for testing purposes.
        </div>

        {/* Under-18 redirect */}
        <p className="text-sm text-gray-600 mb-6">
          Patient under 18 years old?{' '}
          <a
            href="https://peds-spine-intake.vercel.app/"
            className="font-semibold text-teal-500 underline hover:text-teal-600"
          >
            Please use our pediatric intake form
          </a>
          .
        </p>

        <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-6">
          Welcome! This intake form helps us learn about you before your appointment.
          The process takes about 15–25 minutes and includes:
        </p>

        <ul className="bg-white rounded-2xl shadow-sm p-6 mb-8 text-left divide-y divide-cream-200">
          {INTAKE_STEPS.map((label, i) => (
            <li key={i} className="flex items-center gap-4 py-3 text-gray-600">
              <span className="flex items-center justify-center w-7 h-7 flex-shrink-0 bg-navy-600 text-white rounded-full text-sm font-semibold">
                {i + 1}
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ul>

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
              : 'btn-primary inline-flex items-center justify-center gap-3 text-lg px-10 py-4 mx-auto'
            }
          >
            {hasExisting ? 'Start New Form' : (
              <>
                Begin Intake
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>

        <p className="mt-8 text-sm font-medium text-amber-600">
          🚧 This is a prototype — not HIPAA compliant
        </p>
      </div>
    </div>
  );
}
