'use client';

/**
 * The short form's building blocks: one question per card, big buttons, big
 * text. `t` is the step's own translator so option labels translate too.
 */

export function Card({ title, children }) {
  return (
    <div className="card space-y-4">
      {title && <p className="text-lg font-semibold text-navy-600 leading-snug">{title}</p>}
      {children}
    </div>
  );
}

export function BigChoice({ options, value, onChange, t, multi = false }) {
  const selected = multi ? (value || []) : value;
  const isOn = (v) => (multi ? selected.includes(v) : selected === v);
  const pick = (v) => {
    if (!multi) { onChange(v); return; }
    onChange(isOn(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.id;
        const label = typeof o === 'string' ? o : o.label;
        const on = isOn(v);
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            onClick={() => pick(v)}
            className={`min-h-[56px] px-5 py-3 rounded-2xl border-2 text-lg font-medium text-left transition-all ${on ? 'border-teal-400 bg-teal-50 text-navy-600' : 'border-gray-200 bg-white text-gray-700 hover:border-teal-200'}`}
          >
            <span className="inline-flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${on ? 'border-teal-400 bg-teal-400' : 'border-gray-300'}`} aria-hidden="true">
                {on && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
              </span>
              {t(label)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function YesNo({ value, onChange, t }) {
  return (
    <div className="flex gap-3">
      {['No', 'Yes'].map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`flex-1 min-h-[56px] rounded-2xl border-2 text-lg font-semibold transition-all ${value === o ? 'border-teal-400 bg-teal-50 text-navy-600' : 'border-gray-200 bg-white text-gray-700 hover:border-teal-200'}`}
        >
          {t(o)}
        </button>
      ))}
    </div>
  );
}

export function PainNumbers({ value, onChange }) {
  return (
    <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
      {Array.from({ length: 11 }, (_, n) => (
        <button
          key={n}
          type="button"
          aria-pressed={String(value) === String(n)}
          onClick={() => onChange(n)}
          className={`min-h-[52px] rounded-xl border-2 text-xl font-semibold ${String(value) === String(n) ? 'border-teal-400 bg-teal-50 text-navy-600' : 'border-gray-200 bg-white text-gray-700'}`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
