export default function DisclaimerBanner() {
  return (
    <div className="sticky top-0 z-50 bg-amber-500 text-amber-950 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-center">
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-xs sm:text-sm font-semibold leading-tight">
          <span className="font-bold">PROTOTYPE / DEMONSTRATION ONLY</span>
          <span className="hidden sm:inline"> — Do not enter real patient information. Use fictional names and details. Not HIPAA compliant.</span>
        </p>
      </div>
    </div>
  );
}
