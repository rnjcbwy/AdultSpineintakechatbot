'use client';

import { useLang, makeT, COMMON } from '../../lib/i18n';
import SuggestedAnswers, { useAdoptExample } from './SuggestedAnswers';

/**
 * Small field kit for the visit-type steps. Options are stored in English and
 * shown translated, so the note generator and the office always read the same
 * value whatever language the patient chose.
 */

export function Chips({ label, options, value, onChange, hint }) {
  const lang = useLang();
  const t = makeT(COMMON, lang);
  return (
    <div>
      {label && <label className="form-label">{t(label)}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(active ? '' : o)}
              aria-pressed={active}
              className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${
                active ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'
              }`}
            >
              {t(o)}
            </button>
          );
        })}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1.5">{t(hint)}</p>}
    </div>
  );
}

export function CheckChips({ label, options, value = [], onChange, hint, exclusive }) {
  const lang = useLang();
  const t = makeT(COMMON, lang);
  const toggle = (o) => {
    if (value.includes(o)) return onChange(value.filter((v) => v !== o));
    // An "exclusive" option (None, Not sure) clears the others, and vice versa.
    if (exclusive && o === exclusive) return onChange([o]);
    onChange([...value.filter((v) => v !== exclusive), o]);
  };
  return (
    <div>
      {label && <label className="form-label">{t(label)}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              aria-pressed={active}
              className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${
                active ? 'bg-teal-400 text-white border-teal-400' : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'
              }`}
            >
              {t(o)}
            </button>
          );
        })}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1.5">{t(hint)}</p>}
    </div>
  );
}

export function TextField({ label, value, onChange, placeholder, suggestions, type = 'text', required }) {
  const lang = useLang();
  const t = makeT(COMMON, lang);
  const ph = placeholder ? t(placeholder) : undefined;
  const adopt = useAdoptExample(value, ph, onChange);
  return (
    <div>
      {label && (
        <label className="form-label">
          {t(label)}
          {required && ' *'}
        </label>
      )}
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ph}
        title={!value && ph ? ph : undefined}
        {...(type === 'text' ? adopt : {})}
      />
      {type === 'text' && (
        <SuggestedAnswers example={ph} suggestions={(suggestions || []).map((s) => t(s))} value={value} onPick={onChange} />
      )}
    </div>
  );
}

export function TextArea({ label, value, onChange, placeholder, rows = 3, hint }) {
  const lang = useLang();
  const t = makeT(COMMON, lang);
  return (
    <div>
      {label && <label className="form-label">{t(label)}</label>}
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ? t(placeholder) : undefined}
        rows={rows}
      />
      {hint && <p className="text-xs text-gray-400 mt-1.5">{t(hint)}</p>}
    </div>
  );
}

export const PAIN_SCALE = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export function PainScale({ label, value, onChange }) {
  const lang = useLang();
  const t = makeT(COMMON, lang);
  return (
    <div>
      {label && <label className="form-label">{t(label)}</label>}
      <div className="flex flex-wrap gap-1.5">
        {PAIN_SCALE.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? '' : n)}
            aria-pressed={value === n}
            className={`w-10 h-10 rounded-lg text-sm font-medium border transition-colors ${
              value === n ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-gray-400 mt-1 max-w-[460px]">
        <span>{t('No pain')}</span>
        <span>{t('Worst imaginable')}</span>
      </div>
    </div>
  );
}
