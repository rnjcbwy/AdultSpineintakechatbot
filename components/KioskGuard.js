'use client';

// ============================================================================
// The clinic tablet (?kiosk=1): nothing one patient types or photographs is
// left for the next.
//
// - Whenever a new form starts (page load, Start a new form, the automatic
//   reset after submitting), files from any earlier form are deleted from the
//   tablet's storage.
// - After a few minutes without a touch, "Are you still there?" appears; if
//   nobody answers, the answers and files are erased and the tablet goes back
//   to the welcome screen in English for the next patient.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntake } from '../lib/store';
import { useLang, makeT } from '../lib/i18n';
import { clearDocumentsExcept } from '../lib/documents';

const IDLE_MS = 3 * 60_000; // no touch for this long while a form is open...
const WARN_SECONDS = 60; // ...then this long to answer before it is erased

const DICT = {
  'Are you still there?': { es: '¿Sigue ahí?', zh: '您还在吗？', ko: '아직 계십니까?' },
  'For your privacy, this form will be erased in {n} seconds.': {
    es: 'Por su privacidad, este formulario se borrará en {n} segundos.',
    zh: '为保护您的隐私，此表格将在 {n} 秒后清除。',
    ko: '개인정보 보호를 위해 이 양식은 {n}초 후에 삭제됩니다.',
  },
  "I'm still here": { es: 'Sigo aquí', zh: '我还在', ko: '계속하겠습니다' },
};

export default function KioskGuard() {
  const { data, resetIntake } = useIntake();
  const lang = useLang();
  const t = makeT(DICT, lang);
  const [left, setLeft] = useState(0); // seconds until erase; 0 = no warning
  const lastTouch = useRef(Date.now());

  // Files from any other form are removed as soon as this one starts.
  useEffect(() => {
    if (data.sessionId) clearDocumentsExcept(data.sessionId).catch(() => {});
  }, [data.sessionId]);

  // A form is "in use" once the patient is past the welcome screen, a clinic
  // code has filled it in, or it has been submitted.
  const inUse = data.currentStep > 0 || !!data.invite || !!data.submittedAt;

  const erase = useCallback(async () => {
    try {
      await clearDocumentsExcept(null);
    } catch {
      /* the reload below still clears the screen */
    }
    resetIntake();
    try {
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
    // A fresh page: no invite code in the address, English, the welcome screen.
    window.location.replace('/');
  }, [resetIntake]);

  useEffect(() => {
    const touched = () => {
      lastTouch.current = Date.now();
    };
    const events = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'];
    events.forEach((e) => window.addEventListener(e, touched, { passive: true, capture: true }));
    return () => events.forEach((e) => window.removeEventListener(e, touched, { capture: true }));
  }, []);

  useEffect(() => {
    if (!inUse) {
      setLeft(0);
      return undefined;
    }
    const id = setInterval(() => {
      const idle = Date.now() - lastTouch.current;
      if (idle < IDLE_MS) return setLeft(0);
      const remaining = Math.ceil((IDLE_MS + WARN_SECONDS * 1000 - idle) / 1000);
      if (remaining <= 0) {
        clearInterval(id);
        erase();
      } else setLeft(remaining);
    }, 1000);
    return () => clearInterval(id);
  }, [inUse, erase]);

  if (!left) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6" role="alertdialog" aria-modal="true" aria-labelledby="kiosk-idle-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <h2 id="kiosk-idle-title" className="text-2xl font-semibold text-navy-600">
          {t('Are you still there?')}
        </h2>
        <p className="mt-3 text-gray-600">{t('For your privacy, this form will be erased in {n} seconds.').replace('{n}', left)}</p>
        <button
          type="button"
          autoFocus
          onClick={() => {
            lastTouch.current = Date.now();
            setLeft(0);
          }}
          className="mt-6 w-full rounded-xl bg-navy-600 px-6 py-4 text-lg font-semibold text-white"
        >
          {t("I'm still here")}
        </button>
      </div>
    </div>
  );
}
