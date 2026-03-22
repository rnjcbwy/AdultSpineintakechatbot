'use client';

export default function ProgressBar({ current, total, steps }) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      {/* Progress bar track */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-400 to-navy-500 rounded-full progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step dots - show on wider screens */}
      <div className="hidden md:flex justify-between mt-2 px-1">
        {steps.slice(1).map((step, i) => (
          <div
            key={step.id}
            className="flex flex-col items-center"
            style={{ width: `${100 / (steps.length - 1)}%` }}
          >
            <div
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i + 1 < current
                  ? 'bg-teal-400'
                  : i + 1 === current
                  ? 'bg-navy-500 ring-2 ring-navy-200'
                  : 'bg-gray-200'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
