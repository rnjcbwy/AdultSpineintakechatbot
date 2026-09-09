'use client';

import { useLang, makeT, COMMON } from '../../lib/i18n';

const LOCAL = {
  'Tap to fill, then edit': { es: 'Toque para rellenar y luego edite', zh: '点击填入，然后修改' },
};

/**
 * One-tap answers for a free-text field.
 *
 * Most of what this form asks has a small number of overwhelmingly common
 * answers — physical therapy runs "2x per week", allergies are "No known drug
 * allergies", a home programme came from a phone app. Typing those out on a
 * phone is the slowest part of the intake and the reason free-text boxes come
 * back blank, which costs more than the keystrokes: a blank field is missing
 * documentation at prior-authorisation time.
 *
 * So the common answers are offered as chips. Tapping one fills the field and
 * leaves it fully editable — the patient is confirming an answer rather than
 * composing one. Chips disappear once the field has content so they never
 * compete with something the patient actually wrote.
 */
export default function SuggestedAnswers({ example, suggestions = [], value, onPick, className = '' }) {
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

  // The greyed-out example is offered as the first chip. It is the answer the
  // patient is already reading, and it was previously reachable only by
  // double-tapping the field — an affordance nobody discovers. As a chip it is
  // one visible tap, and still fully editable afterwards.
  const exampleText = example ? stripExamplePrefix(example) : '';
  const chips = [];
  if (exampleText) chips.push(exampleText);
  for (const s of suggestions) {
    const label = typeof s === 'string' ? s : s.label;
    if (label && label !== exampleText) chips.push(s);
  }

  if (!chips.length || (value && value.trim())) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 mt-1.5 ${className}`}>
      <span className="text-[11px] text-gray-400 mr-0.5">{t('Tap to fill, then edit')}:</span>
      {chips.map((s) => {
        const label = typeof s === 'string' ? s : s.label;
        const fill = typeof s === 'string' ? s : s.value ?? s.label;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onPick(fill)}
            className="px-2 py-0.5 rounded-full border border-dashed border-teal-300 bg-teal-50/60
                       text-[11px] text-teal-700 hover:bg-teal-100 hover:border-teal-400
                       transition-colors"
          >
            {t(label)}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Adopt the greyed-out example by double-clicking (or double-tapping) the
 * empty field itself, which is where a patient's instinct sends them.
 *
 * Spread the result onto an <input> or <textarea>. It only fires on an empty
 * field, so it can never overwrite something already typed.
 */
export function useAdoptExample(value, example, onChange) {
  const adopt = () => {
    if (!example) return;
    if (value && value.trim()) return;
    onChange(stripExamplePrefix(example));
  };
  return { onDoubleClick: adopt };
}

/**
 * Turn a placeholder into the answer it is illustrating.
 *
 * Placeholders read as prompts ("e.g., 2x per week", "Where? (e.g., L4-L5)"),
 * and pasting that verbatim into the chart would be worse than leaving it
 * blank — nobody wants "e.g.," in a prior-auth packet.
 */
export function stripExamplePrefix(text) {
  if (!text) return '';
  // Greedy to the LAST closing bracket, not the first. Examples that model the
  // detail we want contain their own brackets — a phone number, "(303) 555-0142"
  // — and stopping at the first ")" hands the patient a truncated number that
  // looks deliberate.
  const parenthesised = /\(\s*(?:e\.g\.|for example|ex\.)[,:]?\s*(.*)\)\s*$/i.exec(text);
  if (parenthesised) return parenthesised[1].trim();
  return text
    .replace(/^\s*(?:e\.g\.|eg\.|for example|example|ex\.)[,:]?\s*/i, '')
    .replace(/\.\.\.$/, '')
    .trim();
}
