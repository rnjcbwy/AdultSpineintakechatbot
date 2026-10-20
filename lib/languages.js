// ============================================================================
// The languages the intake speaks. A plain module with no React in it, so the
// server (the worker's lead note, the Practice Hub hand-off, the transcript
// PDF) can read the tables; lib/i18n.js re-exports them for the browser.
// ============================================================================

/**
 * Languages the patient can choose. Spanish and Chinese are written inline
 * next to most English strings; everything else, and any Spanish or Chinese
 * string without an inline entry, comes from lib/translations/<code>.json
 * (built by scripts/translate-ui.mjs), loaded on demand when chosen.
 */
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'pl', label: 'Polski' },
  { code: 'ar', label: 'العربية', rtl: true },
  { code: 'he', label: 'עברית', rtl: true },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ne', label: 'नेपाली' },
];

export const LANGUAGE_NAMES = {
  en: 'English', es: 'Spanish', zh: 'Mandarin Chinese', pt: 'Portuguese', ru: 'Russian',
  pl: 'Polish', ar: 'Arabic', he: 'Hebrew', ko: 'Korean', ja: 'Japanese', hi: 'Hindi', ne: 'Nepali',
};

export const isRtl = (lang) => !!LANGUAGES.find((l) => l.code === lang)?.rtl;
