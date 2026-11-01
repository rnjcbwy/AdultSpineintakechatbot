'use client';

import { useState } from 'react';
import { useIntake } from '../lib/store';
import { useLang, makeT } from '../lib/i18n';

const LOCAL = {
  'Confirm the date of birth': { es: 'Confirme la fecha de nacimiento', zh: '请确认出生日期' },
  'To show the details the office already has on file, enter the patient\'s date of birth.': {
    es: 'Para mostrar los datos que el consultorio ya tiene, ingrese la fecha de nacimiento del paciente.',
    zh: '如需显示诊室已存档的信息，请输入患者的出生日期。',
  },
  'Date of birth': { es: 'Fecha de nacimiento', zh: '出生日期' },
  'Continue': { es: 'Continuar', zh: '继续' },
  'Checking…': { es: 'Comprobando…', zh: '正在核对…' },
  'Start with a blank form instead': { es: 'Empezar con un formulario en blanco', zh: '改为填写空白表格' },
  'That date of birth does not match. {n} tries left.': { es: 'Esa fecha de nacimiento no coincide. Quedan {n} intentos.', zh: '出生日期不符。还可以尝试 {n} 次。' },
  'Too many tries. Please continue with a blank form, or call the office.': {
    es: 'Demasiados intentos. Continúe con un formulario en blanco o llame al consultorio.',
    zh: '尝试次数过多。请填写空白表格，或致电诊室。',
  },
  'Could not check right now. Please try again, or continue with a blank form.': {
    es: 'No se pudo comprobar en este momento. Inténtelo de nuevo o continúe con un formulario en blanco.',
    zh: '暂时无法核对。请重试，或填写空白表格。',
  },
};

/**
 * A link from the office (email, copied link, clinic tablet) may pre-fill the
 * form with what the office has on file, but only after the patient's date of
 * birth is entered correctly (Practice Hub checks it; five tries, then a lock).
 * Skipping opens a blank form that still files to the right chart. Links sent
 * by text never reach this screen: they never pre-fill.
 */
export default function InviteDobGate() {
  const { data, unlockInvite, skipInvite } = useIntake();
  const t = makeT(LOCAL, useLang());
  const [dob, setDob] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const status = data.invite?.status;
  if (status !== 'needs_dob' && status !== 'locked') return null;
  const locked = status === 'locked';

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || busy) return;
    setBusy(true);
    setError('');
    const r = await unlockInvite(dob);
    setBusy(false);
    if (r.status === 'ok') return;
    if (r.status === 'dob_mismatch') setError(t('That date of birth does not match. {n} tries left.').replace('{n}', String(r.attemptsLeft ?? '')));
    else if (r.status !== 'locked') setError(t('Could not check right now. Please try again, or continue with a blank form.'));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="dob-gate-title">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4">
        <h2 id="dob-gate-title" className="text-lg font-semibold text-navy-600">{t('Confirm the date of birth')}</h2>
        {locked ? (
          <p className="text-sm text-red-600" role="alert">{t('Too many tries. Please continue with a blank form, or call the office.')}</p>
        ) : (
          <>
            <p className="text-sm text-gray-700">{t('To show the details the office already has on file, enter the patient\'s date of birth.')}</p>
            <div>
              <label className="form-label" htmlFor="dob-gate">{t('Date of birth')}</label>
              <input id="dob-gate" type="date" value={dob} onChange={(e) => setDob(e.target.value)} autoComplete="bday" required />
            </div>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <button type="submit" disabled={busy || !dob} className="btn-primary w-full disabled:opacity-60">{busy ? t('Checking…') : t('Continue')}</button>
          </>
        )}
        <button type="button" onClick={skipInvite} className="w-full text-sm text-gray-500 underline">{t('Start with a blank form instead')}</button>
      </form>
    </div>
  );
}
