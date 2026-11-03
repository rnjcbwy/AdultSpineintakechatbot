'use client';

import { useLang, makeT } from '../lib/i18n';

const LOCAL = {
  'Your intake code': { es: 'Su código de admisión', zh: '您的登记代码' },
  'Call': { es: 'Llame al', zh: '请拨打' },
  'the office line': { es: 'la línea del consultorio', zh: '诊室电话' },
  'choose your language on the keypad, then key in this code and the date of birth.': {
    es: 'elija su idioma en el teclado y luego marque este código y la fecha de nacimiento.',
    zh: '在键盘上选择语言，然后输入此代码和出生日期。',
  },
  'The office\'s automated assistant answers any time, day or night.': {
    es: 'El asistente automático del consultorio contesta a cualquier hora, de día o de noche.',
    zh: '诊室的自动助理全天候接听。',
  },
  'The code works for {n} days. Please write it down.': { es: 'El código sirve durante {n} días. Por favor, anótelo.', zh: '此代码{n}天内有效。请记下来。' },
  'Languages:': { es: 'Idiomas:', zh: '语言：' },
};

/** The code to key in on a call to the office's assistant, with how to use it. */
export default function PhoneCodeCard({ code, phone, days, languages, children }) {
  const t = makeT(LOCAL, useLang());
  const spaced = `${String(code).slice(0, 3)} ${String(code).slice(3)}`;
  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50/60 px-5 py-4 text-left">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">{t('Your intake code')}</p>
      <p className="mt-1 font-mono text-[2.2rem] font-semibold tracking-[0.25em] text-navy-600" aria-label={String(code).split('').join(' ')}>{spaced}</p>
      <p className="mt-2 text-base text-gray-700">
        {t('Call')} {phone ? <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="font-semibold text-navy-600 underline">{phone}</a> : t('the office line')}, {t('choose your language on the keypad, then key in this code and the date of birth.')}
      </p>
      <p className="mt-2 text-sm text-gray-600">{t('The office\'s automated assistant answers any time, day or night.')}</p>
      {Array.isArray(languages) && languages.length > 1 && <p className="mt-1 text-sm text-gray-600">{t('Languages:')} {languages.join(' · ')}</p>}
      <p className="mt-2 text-sm font-medium text-gray-700">{t('The code works for {n} days. Please write it down.').replace('{n}', String(days || 14))}</p>
      {children}
    </div>
  );
}
