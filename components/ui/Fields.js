'use client';

import { useEffect, useRef, useState } from 'react';

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

const SPEECH_LANG = { en: 'en-US', es: 'es-US', zh: 'zh-CN', pt: 'pt-BR', ru: 'ru-RU', pl: 'pl-PL', ar: 'ar-SA', he: 'he-IL', ko: 'ko-KR', ja: 'ja-JP', hi: 'hi-IN', ne: 'ne-NP' };

/**
 * "Say it instead": the browser's own speech recognition, where it exists
 * (Chrome, Edge, Safari), in the form's language. Nothing is sent anywhere
 * by this form; the browser does the listening. Typing always works too.
 */
const DICTATION_ERRORS = {
  'not-allowed': 'The browser blocked the microphone. Allow it for this site (the lock icon in the address bar) and try again.',
  'service-not-allowed': 'The browser blocked the microphone. Allow it for this site (the lock icon in the address bar) and try again.',
  'audio-capture': 'No microphone was found.',
  network: 'Dictation needs an internet connection in this browser.',
  'no-speech': 'Nothing was heard. Tap again and speak after the button turns red.',
  'language-not-supported': 'This browser cannot take dictation in this language.',
};

export function DictateButton({ onText, lang }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [note, setNote] = useState('');
  const [interim, setInterim] = useState('');
  const recRef = useRef(null);
  const t = makeT(COMMON, lang);
  useEffect(() => {
    setSupported(typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
    return () => { try { recRef.current?.abort(); } catch { /* ignore */ } };
  }, []);
  if (!supported) return null;
  const stop = () => { try { recRef.current?.stop(); } catch { /* ignore */ } setListening(false); setInterim(''); };
  const toggle = () => {
    if (listening) { stop(); return; }
    setNote('');
    if (typeof window !== 'undefined' && window.isSecureContext === false) { setNote(t('Dictation only works on a secure (https) page.')); return; }
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Rec();
    rec.lang = SPEECH_LANG[lang] || 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let finalText = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const r = e.results[i];
        if (r.isFinal) finalText += `${r[0]?.transcript || ''} `;
        else interimText += r[0]?.transcript || '';
      }
      if (finalText.trim()) onText(finalText.trim());
      setInterim(interimText.trim());
    };
    rec.onend = () => { setListening(false); setInterim(''); };
    rec.onerror = (e) => {
      setListening(false);
      setInterim('');
      if (e?.error === 'aborted') return;
      setNote(t(DICTATION_ERRORS[e?.error] || 'Dictation did not work in this browser. You can type instead.'));
    };
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); setNote(t('Dictation did not work in this browser. You can type instead.')); }
  };
  return (
    <div className="flex flex-col items-end gap-1 max-w-[60%]">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={listening}
        className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 border transition-colors ${listening ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300'}`}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
        </svg>
        {listening ? t('Listening… tap to stop') : t('Say it instead')}
      </button>
      {listening && <p className="text-xs text-gray-400 text-right">{interim || t('Speak now; the words appear when you pause.')}</p>}
      {note && <p className="text-xs text-amber-700 text-right">{note}</p>}
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
      <div className="flex items-start justify-between gap-3 mt-1.5">
        {hint ? <p className="text-xs text-gray-400">{t(hint)}</p> : <span />}
        <DictateButton lang={lang} onText={(text) => onChange(`${String(value || '').trim()}${value ? ' ' : ''}${text}`)} />
      </div>
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
