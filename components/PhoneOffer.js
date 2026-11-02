'use client';

import { useState } from 'react';
import { useIntake } from '../lib/store';
import { useLang, makeT } from '../lib/i18n';
import { LOCKED_SERVICE } from '../lib/siteLock';
import PhoneCodeCard from './PhoneCodeCard';

const LOCAL = {
  'Rather do this by phone?': { es: '¿Prefiere hacerlo por teléfono?', zh: '想通过电话完成吗？' },
  'Have a code from a phone call? Continue here': { es: '¿Tiene un código de una llamada? Continúe aquí', zh: '有电话中获得的代码？在此继续' },
  'The office\'s assistant can take the history over the phone, in English, Spanish, Mandarin, Portuguese, Korean or Arabic. You will finish the rest here afterwards with the same code. First, the patient\'s name and date of birth:': {
    es: 'El asistente del consultorio puede tomar la historia por teléfono, en inglés, español, mandarín, portugués, coreano o árabe. Después terminará el resto aquí con el mismo código. Primero, el nombre y la fecha de nacimiento del paciente:',
    zh: '诊室助理可以通过电话（英语、西班牙语、普通话、葡萄牙语、韩语或阿拉伯语）采集病史。之后您可用同一代码在此完成其余部分。首先，请填写患者的姓名和出生日期：',
  },
  'First name': { es: 'Nombre', zh: '名' },
  'Last name': { es: 'Apellido', zh: '姓' },
  'Date of birth': { es: 'Fecha de nacimiento', zh: '出生日期' },
  'Get my code': { es: 'Obtener mi código', zh: '获取代码' },
  'Getting a code…': { es: 'Obteniendo el código…', zh: '正在获取代码……' },
  'Could not make a code right now. Please try again, or fill in the form here.': {
    es: 'No se pudo crear un código en este momento. Inténtelo de nuevo o llene el formulario aquí.',
    zh: '暂时无法生成代码。请重试，或在此填写表格。',
  },
  'Cancel': { es: 'Cancelar', zh: '取消' },
};

/**
 * The welcome screen's two phone links (Practice Hub, server/intake-journeys.ts):
 * "Rather do this by phone?" asks the patient's name and date of birth and
 * shows an intake code to key in on a call; "Have a code?" opens app/continue
 * to finish the rest after a call.
 */
export default function PhoneOffer() {
  const { data } = useIntake();
  const lang = useLang();
  const t = makeT(LOCAL, lang);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '' });
  const [state, setState] = useState({ busy: false, error: '', result: null });
  const ready = (form.firstName.trim() || form.lastName.trim()) && /^\d{4}-\d{2}-\d{2}$/.test(form.dob);

  const submit = async (e) => {
    e.preventDefault();
    if (!ready || state.busy) return;
    setState({ busy: true, error: '', result: null });
    try {
      const res = await fetch('/api/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'web_phone_first', ...form, service: data.service?.key || LOCKED_SERVICE || '', language: lang }),
      });
      const r = await res.json().catch(() => ({}));
      if (!res.ok || !r.code) throw new Error('no code');
      setState({ busy: false, error: '', result: r });
    } catch {
      setState({ busy: false, error: t('Could not make a code right now. Please try again, or fill in the form here.'), result: null });
    }
  };

  return (
    <div className="mt-6 text-sm text-gray-600 space-y-2">
      {!open && (
        <p>
          <button type="button" onClick={() => setOpen(true)} className="font-semibold text-teal-500 underline hover:text-teal-600">
            {t('Rather do this by phone?')}
          </button>
        </p>
      )}
      <p>
        <a href="/continue" className="font-semibold text-teal-500 underline hover:text-teal-600">{t('Have a code from a phone call? Continue here')}</a>
      </p>
      {open && !state.result && (
        <form onSubmit={submit} className="mx-auto mt-3 max-w-md space-y-3 rounded-2xl border border-navy-100 bg-white p-4 text-left">
          <p className="text-gray-700">{t('The office\'s assistant can take the history over the phone, in English, Spanish, Mandarin, Portuguese, Korean or Arabic. You will finish the rest here afterwards with the same code. First, the patient\'s name and date of birth:')}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label" htmlFor="po-first">{t('First name')}</label>
              <input id="po-first" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} autoComplete="given-name" />
            </div>
            <div>
              <label className="form-label" htmlFor="po-last">{t('Last name')}</label>
              <input id="po-last" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} autoComplete="family-name" />
            </div>
          </div>
          <div>
            <label className="form-label" htmlFor="po-dob">{t('Date of birth')}</label>
            <input id="po-dob" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} autoComplete="bday" required />
          </div>
          {state.error && <p className="text-red-600" role="alert">{state.error}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={!ready || state.busy} className="btn-primary px-6 py-2.5 disabled:opacity-60">{state.busy ? t('Getting a code…') : t('Get my code')}</button>
            <button type="button" onClick={() => setOpen(false)} className="text-gray-500 underline">{t('Cancel')}</button>
          </div>
        </form>
      )}
      {state.result && (
        <div className="mx-auto mt-3 max-w-md">
          <PhoneCodeCard code={state.result.code} phone={state.result.phone} days={state.result.days} languages={state.result.languages} />
        </div>
      )}
    </div>
  );
}
