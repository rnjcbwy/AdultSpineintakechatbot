'use client';

/**
 * The step timeline, and the way back to any step already reached.
 *
 * The intake runs in order — questions later on branch off earlier answers, so
 * skipping ahead would ask things it has no business asking yet. Going
 * BACKWARDS is different: a patient who remembers a surgery date four steps
 * later should not have to click Back nine times to fix it. Every step they
 * have already reached is therefore reachable, and everything ahead of them
 * stays inert rather than merely looking inert.
 *
 * On a wide screen that is a row of dots, one per step, named on hover. On a
 * phone fifteen or more dots do not fit in 375px without sideways scrolling,
 * so the row gives way to the thin bar (the header above it says "Step 4 of
 * 15 · Your symptoms") and a small menu that lists the steps already reached,
 * so the way back is still one tap.
 */
export default function ProgressBar({ current, total, steps, onGoToStep, canGoToStep, t = (x) => x }) {
  const percentage = Math.round((current / total) * 100);

  // steps[0] is the welcome screen, which has no dot; dot i maps to step i + 1.
  const dots = steps.slice(1);
  const reachableAt = (stepIndex) => (canGoToStep ? canGoToStep(stepIndex) : false);

  return (
    <div className="w-full">
      {/* Progress bar track */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-400 to-navy-500 rounded-full progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Phone: the steps as a menu. Only steps already reached can be chosen. */}
      <div className="mt-2 md:hidden">
        <select
          value={current}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (reachableAt(n)) onGoToStep?.(n);
          }}
          aria-label={t('Go to a step')}
          className="w-full !py-1.5 !px-2 !text-xs !rounded-lg text-gray-600 bg-white border border-gray-200"
        >
          {dots.map((step, i) => {
            const stepIndex = i + 1;
            return (
              <option key={step.id} value={stepIndex} disabled={!reachableAt(stepIndex)}>
                {`${stepIndex}. ${t(step.label)}`}
              </option>
            );
          })}
        </select>
      </div>

      {/* Wide screens: the dots, one per step. */}
      <div className="hidden md:flex mt-2 px-1">
        {dots.map((step, i) => {
          const stepIndex = i + 1;
          const reachable = reachableAt(stepIndex);
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
                // the padding gives it a finger-sized target on a tablet.
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
                  className="pointer-events-none absolute top-full z-50 mt-0.5 block
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
