'use client';

import { useState } from 'react';
import { useIntake } from '../lib/store';
import { useLang, makeT } from '../lib/i18n';
import PhoneCodeCard from './PhoneCodeCard';

const LOCAL = {
  'Would you like to tell your doctor more in your own words?': { es: '¿Le gustaría contarle más a su médico con sus propias palabras?', zh: '您想用自己的话向医生多讲一些吗？' },
  'Some things are easier to say than to type. Call the office\'s assistant with a code: it has read your form, asks a few more questions about your symptoms, and adds what you say, in your own words, to your form. About ten minutes, any time.': {
    es: 'Algunas cosas son más fáciles de decir que de escribir. Llame al asistente del consultorio con un código: ya leyó su formulario, le hace algunas preguntas más sobre sus síntomas y agrega lo que usted diga, con sus propias palabras, a su formulario. Unos diez minutos, a cualquier hora.',
    zh: '有些事说出来比打字容易。凭代码致电诊室助理：它已读过您的表格，会再问几个关于症状的问题，并把您亲口说的话加入您的表格。大约十分钟，随时可以。',
  },
  'Get a code to call': { es: 'Obtener un código para llamar', zh: '获取来电代码' },
  'Getting a code…': { es: 'Obteniendo el código…', zh: '正在获取代码……' },
  'Could not make a code right now. Please try again later.': { es: 'No se pudo crear un código en este momento. Inténtelo más tarde.', zh: '暂时无法生成代码，请稍后再试。' },
  'This is optional. Your form is already complete.': { es: 'Esto es opcional. Su formulario ya está completo.', zh: '此项为可选。您的表格已经完成。' },
};

/**
 * After submitting: an optional call to the office's assistant to say more in
 * the patient's own words (Practice Hub, server/intake-journeys.ts,
 * "web_elaborate"). The code is tied to this submission; what is said on the
 * call is added to the same intake.
 */
export default function ElaborateOffer({ submission }) {
  const { kiosk, data } = useIntake();
  const t = makeT(LOCAL, useLang());
  const [state, setState] = useState({ busy: false, error: '', result: null });
  // Not on the clinic tablet, not for an intake that began on the phone, not without a submission.
  if (kiosk || data.journey?.ref || !submission?.id || !submission?.token) return null;

  const get = async () => {
    setState({ busy: true, error: '', result: null });
    try {
      const res = await fetch('/api/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${submission.token}` },
        body: JSON.stringify({ kind: 'web_elaborate', submissionId: submission.id }),
      });
      const r = await res.json().catch(() => ({}));
      if (!res.ok || !r.code) throw new Error('no code');
      setState({ busy: false, error: '', result: r });
    } catch {
      setState({ busy: false, error: t('Could not make a code right now. Please try again later.'), result: null });
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-navy-100 bg-white p-5 text-left">
      <p className="text-lg font-semibold text-navy-600">{t('Would you like to tell your doctor more in your own words?')}</p>
      <p className="mt-1 text-sm text-gray-600 leading-relaxed">{t('Some things are easier to say than to type. Call the office\'s assistant with a code: it has read your form, asks a few more questions about your symptoms, and adds what you say, in your own words, to your form. About ten minutes, any time.')}</p>
      {state.result ? (
        <div className="mt-3">
          <PhoneCodeCard code={state.result.code} phone={state.result.phone} days={state.result.days} languages={state.result.languages} />
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={get} disabled={state.busy} className="btn-secondary px-6 py-2.5 disabled:opacity-60">{state.busy ? t('Getting a code…') : t('Get a code to call')}</button>
          <span className="text-xs text-gray-500">{t('This is optional. Your form is already complete.')}</span>
        </div>
      )}
      {state.error && <p className="mt-2 text-sm text-red-600" role="alert">{state.error}</p>}
    </div>
  );
}
