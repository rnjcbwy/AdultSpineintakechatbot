'use client';

/**
 * The step timeline, and the way back to any step already reached.
 *
 * The intake runs in order — questions later on branch off earlier answers, so
 * skipping ahead would ask things it has no business asking yet. Going
 * BACKWARDS is different: a patient who remembers a surgery date four steps
 * later should not have to click Back nine times to fix it. Every step they
 * have already reached is therefore a button, and everything ahead of them
 * stays inert rather than merely looking inert.
 *
 * The dots used to be plain divs on md and up. On a phone — where most of
 * these forms are actually filled in — there was no way back at all except the
 * Back button, so the strip now scrolls horizontally instead of disappearing.
 */
export default function ProgressBar({ current, total, steps, onGoToStep, canGoToStep, t = (x) => x }) {
  const percentage = Math.round((current / total) * 100);

  // steps[0] is the welcome screen, which has no dot; dot i maps to step i + 1.
  const dots = steps.slice(1);

  return (
    <div className="w-full">
      {/* Progress bar track */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-400 to-navy-500 rounded-full progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step dots. Horizontally scrollable so all of them stay reachable on a
          narrow screen rather than being hidden below the md breakpoint. */}
      <div
        className="flex mt-2 px-1 overflow-x-auto md:overflow-visible
                   [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {dots.map((step, i) => {
          const stepIndex = i + 1;
          const reachable = canGoToStep ? canGoToStep(stepIndex) : false;
          const isCurrent = stepIndex === current;
          const isPast = stepIndex < current;
          const label = t(step.label);

          return (
            <div
              key={step.id}
              className="group relative flex flex-col items-center flex-1 min-w-[24px]"
            >
              <button
                type="button"
                onClick={() => reachable && onGoToStep?.(stepIndex)}
                disabled={!reachable}
                aria-label={label}
                aria-current={isCurrent ? 'step' : undefined}
                title={reachable ? label : undefined}
                // The dot is small on purpose, but the tappable area is not:
                // the padding gives it a finger-sized target on a phone.
                className={`p-2 -m-0.5 rounded-full transition-transform ${
                  reachable
                    ? 'cursor-pointer hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400'
                    : 'cursor-default'
                }`}
              >
                <span
                  className={`block w-2 h-2 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'bg-navy-500 ring-2 ring-navy-200'
                      : isPast
                      ? 'bg-teal-400'
                      : reachable
                      ? 'bg-teal-200'
                      : 'bg-gray-200'
                  }`}
                />
              </button>

              {/* Name the step on hover / keyboard focus, so the timeline is
                  navigable without guessing which dot is which. */}
              {reachable && (
                <span
                  className="pointer-events-none absolute top-full z-50 mt-0.5 hidden md:block
                             whitespace-nowrap rounded-md bg-navy-600 px-2 py-1 text-[11px] font-medium
                             text-white opacity-0 shadow-lg transition-opacity
                             group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
