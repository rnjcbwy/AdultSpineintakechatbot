'use client';

import { useState } from 'react';

/**
 * A folded-away group of optional questions. The patient sees one line (the
 * title and how much of it is already filled) and opens it only if they want
 * to; nothing inside is required. Opens by itself when something in it has
 * already been answered, so a returning patient sees what they typed.
 */
export default function Collapsible({ title, hint, filled = 0, total = 0, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen || filled > 0);
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span>
          <span className="block text-base font-medium text-navy-600">{title}</span>
          {hint && <span className="block text-sm text-gray-400 mt-0.5">{hint}</span>}
        </span>
        <span className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-400">
          {total > 0 && <span>{filled} / {total}</span>}
          <svg className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {open && <div className="px-2 pb-2 space-y-4">{children}</div>}
    </div>
  );
}

/** How many of the given values are non-empty, for the "3 / 10" badge. */
export function countFilled(values) {
  return values.filter((v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== '')).length;
}
