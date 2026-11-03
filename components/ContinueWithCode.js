'use client';

import { useEffect, useState } from 'react';
import { useIntake } from '../lib/store';
import { useLang, makeT } from '../lib/i18n';
import { belongsElsewhere, siteUrl } from '../lib/siteLock';

const LOCAL = {
  'Finish your intake': { es: 'Termine su admisión', zh: '完成您的登记' },
  'Enter your code (from your phone call, text or email) and the patient\'s date of birth. Anything already done is skipped; you will only see what is left.': {
    es: 'Ingrese su código (de su llamada, mensaje de texto o correo electrónico) y la fecha de nacimiento del paciente. Lo que ya está hecho se omite; solo verá lo que falta.',
    zh: '请输入您的代码（来自通话、短信或电子邮件）和患者的出生日期。已完成的部分会被跳过，您只会看到剩余部分。',
  },
  'Code': { es: 'Código', zh: '代码' },
  'Date of birth': { es: 'Fecha de nacimiento', zh: '出生日期' },
  'Continue': { es: 'Continuar', zh: '继续' },
  'Checking…': { es: 'Comprobando…', zh: '正在核对……' },
  'That code did not work. Check the digits, or call the office.': { es: 'Ese código no funcionó. Revise los números o llame al consultorio.', zh: '代码无效。请核对数字，或致电诊室。' },
  'That date of birth does not match. {n} tries left.': { es: 'Esa fecha de nacimiento no coincide. Quedan {n} intentos.', zh: '出生日期不符。还可以尝试 {n} 次。' },
  'Too many tries. Please call the office.': { es: 'Demasiados intentos. Por favor, llame al consultorio.', zh: '尝试次数过多。请致电诊室。' },
  'This intake is already complete. Thank you; there is nothing more to do.': { es: 'Esta admisión ya está completa. Gracias; no hay nada más que hacer.', zh: '此登记已完成。谢谢，无需再做任何事。' },
  'Could not check right now. Please try again.': { es: 'No se pudo comprobar en este momento. Inténtelo de nuevo.', zh: '暂时无法核对，请重试。' },
};

/**
 * app/continue: the code from a phone call with the office's assistant and
 * the date of birth open the rest of the intake (Practice Hub,
 * server/intake-journeys.ts). Only which sections were done on the call comes
 * back, never the answers. A text message link carries the code (?c=).
 */
export default function ContinueWithCode() {
  const { data, startJourney } = useIntake();
  const t = makeT(LOCAL, useLang());
  const [code, setCode] = useState('');
  const [dob, setDob] = useState('');
  const [state, setState] = useState({ busy: false, message: '' });
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('c') || '';
    if (/^\d{6}$/.test(c)) setCode(c);
    try { window.history.replaceState(null, '', window.location.pathname); } catch { /* ignore */ }
  }, []);

  // Once the new form is saved on this device, open it.
  useEffect(() => {
    if (!started || !data.journey?.ref) return undefined;
    // A moment for the provider to save the new form on this device first.
    const timer = setTimeout(() => window.location.replace('/'), 200);
    return () => clearTimeout(timer);
  }, [started, data.journey?.ref]);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code) || !/^\d{4}-\d{2}-\d{2}$/.test(dob) || state.busy) return;
    setState({ busy: true, message: '' });
    const res = await fetch(`/api/journey?code=${code}&dob=${dob}`, { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ status: 'error' }));
    if (res.status === 'ok' && res.ref) {
      // A code for another service's form: finish it on that service's site.
      if (belongsElsewhere(res.form)) {
        window.location.replace(siteUrl(res.form, `?c=${code}`, '/continue'));
        return;
      }
      startJourney(res, code, dob);
      setStarted(true);
      return;
    }
    const message =
      res.status === 'dob_mismatch' ? t('That date of birth does not match. {n} tries left.').replace('{n}', String(res.attemptsLeft ?? '')) :
      res.status === 'locked' ? t('Too many tries. Please call the office.') :
      res.status === 'done' ? t('This intake is already complete. Thank you; there is nothing more to do.') :
      res.status === 'unknown' ? t('That code did not work. Check the digits, or call the office.') :
      t('Could not check right now. Please try again.');
    setState({ busy: false, message });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4">
        <h1 className="font-serif text-[1.8rem] font-semibold text-navy-600">{t('Finish your intake')}</h1>
        <p className="text-gray-700">{t('Enter your code (from your phone call, text or email) and the patient\'s date of birth. Anything already done is skipped; you will only see what is left.')}</p>
        <div>
          <label className="form-label" htmlFor="cw-code">{t('Code')}</label>
          <input
            id="cw-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            autoComplete="one-time-code"
            className="text-center text-2xl tracking-[0.4em] font-mono"
            required
          />
        </div>
        <div>
          <label className="form-label" htmlFor="cw-dob">{t('Date of birth')}</label>
          <input id="cw-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} autoComplete="bday" required />
        </div>
        {state.message && <p className="text-sm text-red-600" role="alert">{state.message}</p>}
        <button type="submit" disabled={state.busy || code.length !== 6 || !dob} className="btn-primary w-full disabled:opacity-60">{state.busy ? t('Checking…') : t('Continue')}</button>
      </form>
    </div>
  );
}
