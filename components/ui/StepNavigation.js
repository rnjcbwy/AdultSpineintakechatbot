'use client';

export default function StepNavigation({
  onNext,
  onBack,
  canGoNext = true,
  nextLabel = 'Continue',
  backLabel = 'Back',
  showBack = true,
  showSkip = false,
  onSkip,
  skipLabel = 'Skip this section',
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-gray-100 gap-4">
      <div>
        {showBack && (
          <button onClick={onBack} className="btn-secondary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {backLabel}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showSkip && (
          <button
            onClick={onSkip || onNext}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {skipLabel}
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="btn-primary flex items-center gap-2"
        >
          {nextLabel}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
