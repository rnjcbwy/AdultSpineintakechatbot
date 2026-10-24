'use client';

import { useEffect, useMemo, useState } from 'react';
import { useIntake, useService, defaultIntakeData } from '../lib/store';
import { useLang, makeT, tx, COMMON, LANGUAGES, isRtl } from '../lib/i18n';
import { SAFETY_CHOICES, isExpress, isExpressLead } from '../lib/express';
import { CONSENT_ITEMS, consentTextVia } from '../lib/consent';
import { fingerprintAnswers } from '../lib/noteFingerprint';
import { submitIntake, finalizeSubmission, pollStatus } from '../lib/submitClient';
import { IS_PRODUCTION_TIER, PRACTICE } from '../lib/deploymentTier';
import FinishLater from './FinishLater';

const LOCAL = {
  'Request an appointment': { es: 'Solicitar una cita', zh: '预约就诊' },
  "Dr. Aaron Wey's office": { es: 'Consultorio del Dr. Aaron Wey', zh: 'Aaron Wey 医生诊室' },
  'Language': { es: 'Idioma', zh: '语言' },
  'First name': { es: 'Nombre', zh: '名' },
  'Last name': { es: 'Apellido', zh: '姓' },
  'Date of birth': { es: 'Fecha de nacimiento', zh: '出生日期' },
  'Phone': { es: 'Teléfono', zh: '电话' },
  'Email': { es: 'Correo electrónico', zh: '电子邮箱' },
  'Insurance': { es: 'Seguro médico', zh: '医疗保险' },
  'Member ID': { es: 'Número de miembro', zh: '会员编号' },
  'What brings you in?': { es: '¿Qué le trae a consulta?', zh: '您因为什么来就诊？' },
  // The symptoms that should not wait, asked as one question on the form.
  'Right now, do you have any of these: new trouble controlling your bladder or bowels, numbness around the groin or inner thighs, weakness that is getting worse quickly, or a fever with back pain?': {
    es: 'En este momento, ¿tiene alguno de estos síntomas: dificultad nueva para controlar la vejiga o el intestino, entumecimiento en la ingle o la parte interna de los muslos, debilidad que empeora rápidamente, o fiebre con dolor de espalda?',
    zh: '您现在是否有以下任何情况：新出现的大小便控制困难、腹股沟或大腿内侧麻木、迅速加重的无力，或发烧伴背痛？',
  },
  'Send to the office': { es: 'Enviar al consultorio', zh: '发送给诊室' },
  'Sending…': { es: 'Enviando…', zh: '正在发送……' },
  'Please enter your first and last name.': { es: 'Ingrese su nombre y apellido.', zh: '请输入您的姓和名。' },
  'Please enter your date of birth.': { es: 'Ingrese su fecha de nacimiento.', zh: '请输入您的出生日期。' },
  'Please give both a phone number and an email address.': { es: 'Indique un número de teléfono y un correo electrónico.', zh: '请同时提供电话号码和电子邮箱。' },
  'Please enter a valid email address.': { es: 'Ingrese un correo electrónico válido.', zh: '请输入有效的电子邮箱。' },
  'Please tell us, in a few words, what is going on.': { es: 'Cuéntenos, en pocas palabras, qué le está pasando.', zh: '请简单说明您的情况。' },
  'Please answer the question about symptoms.': { es: 'Responda la pregunta sobre los síntomas.', zh: '请回答关于症状的问题。' },
  'Please check both boxes.': { es: 'Marque las dos casillas.', zh: '请勾选两个选项。' },
  'Could not send right now. Your answers are still on this device; please try again in a moment.': {
    es: 'No se pudo enviar en este momento. Sus respuestas siguen en este dispositivo; inténtelo de nuevo en un momento.',
    zh: '现在无法发送。您的回答仍保存在此设备上，请稍后重试。',
  },
  'Thank you for contacting us, {name}.': { es: 'Gracias por comunicarse con nosotros, {name}.', zh: '{name}，感谢您与我们联系。' },
  'Your request has reached the office.': { es: 'Su solicitud llegó al consultorio.', zh: '您的请求已送达诊室。' },
  'The office will contact you for an appointment within 24 to 48 hours.': { es: 'El consultorio se comunicará con usted en un plazo de 24 a 48 horas para programar su cita.', zh: '诊室将在 24 到 48 小时内与您联系安排就诊。' },
  'We will call {phone}.': { es: 'Le llamaremos al {phone}.', zh: '我们将拨打 {phone}。' },
  'We will write to {email}.': { es: 'Le escribiremos a {email}.', zh: '我们将发送邮件至 {email}。' },
  'We emailed your questionnaire link to {email}.': { es: 'Le enviamos el enlace de su cuestionario a {email}.', zh: '我们已将问卷链接发送至 {email}。' },
  'We could not email the link; keep it from here instead.': { es: 'No pudimos enviar el enlace por correo; guárdelo desde aquí.', zh: '链接无法通过邮件发送，请在此保存。' },
  'Your questionnaire link': { es: 'El enlace de su cuestionario', zh: '您的问卷链接' },
  'Copy link': { es: 'Copiar enlace', zh: '复制链接' },
  'Copied': { es: 'Copiado', zh: '已复制' },
  'Finish your pre-visit questionnaire': { es: 'Complete su cuestionario previo a la visita', zh: '完成您的就诊前问卷' },
  'It takes about 15 minutes and really helps our team prepare for your visit. You can continue right now, or later from the link on any device.': {
    es: 'Toma unos 15 minutos y ayuda mucho a nuestro equipo a prepararse para su visita. Puede continuar ahora mismo, o más tarde desde el enlace en cualquier dispositivo.',
    zh: '大约需要 15 分钟，能切实帮助我们的团队为您的就诊做好准备。您可以现在继续，也可以稍后在任何设备上通过链接继续。',
  },
  'Continue the questionnaire': { es: 'Continuar el cuestionario', zh: '继续填写问卷' },
  'You told us about symptoms that should not wait. If this is happening now, call 911 or go to the nearest emergency room. You can also call the office at {phone}.': {
    es: 'Nos contó síntomas que no deben esperar. Si le está pasando ahora, llame al 911 o acuda a la sala de emergencias más cercana. También puede llamar al consultorio al {phone}.',
    zh: '您提到的症状不宜等待。如果现在正在发生，请拨打 911 或前往最近的急诊室。您也可以致电诊室：{phone}。',
  },
  'Get a link to finish later': { es: 'Obtener un enlace para terminar más tarde', zh: '获取稍后完成的链接' },
  'Opening…': { es: 'Abriendo…', zh: '正在打开……' },
  'Start over': { es: 'Empezar de nuevo', zh: '重新开始' },
  '⚠️ Prototype for demonstration only. Please use fictional names and details.': {
    es: '⚠️ Prototipo solo para demostración. Use nombres y datos ficticios.',
    zh: '⚠️ 仅供演示的原型。请使用虚构的姓名和信息。',
  },
};

const SAFETY_DICT = {
  'No, none of these': { es: 'No, ninguno de estos', zh: '没有，都没有' },
  'Yes, one or more of these': { es: 'Sí, uno o más de estos', zh: '有，一项或多项' },
  "I'm not sure": { es: 'No estoy seguro/a', zh: '我不确定' },
};

/**
 * The appointment request: one short form (name, date of birth, phone,
 * email, insurance, what brings you in, the safety question), then a
 * "we will contact you" screen that leads into the full pre-visit
 * questionnaire. The languages sit as buttons above the form so a patient
 * sees their own language at once. Lives at /express; opened from every
 * "Request an Appointment" button on the practice website in a slide-over
 * panel, or on its own. State is the shared intake store, so the answers
 * carry straight into the questionnaire.
 */
export default function ExpressIntake() {
  const { data, setNested, setSection, setLanguage, setRedFlags, setSummary, setSubmitted, resetIntake, dispatch } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL, ...SAFETY_DICT }, lang);
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    setEmbedded(window.self !== window.top);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
  }, [lang]);

  // Attach the express section once the store has loaded. A form submitted
  // earlier on this device (not an express request) belongs to the past.
  useEffect(() => {
    if (!data.sessionId) return;
    if (data.submittedAt && !isExpress(data)) { resetIntake(); return; }
    if (!isExpress(data)) {
      setNested('express', { startedAt: new Date().toISOString(), phase: 'form', channel: 'form', safety: '', callLanguage: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.sessionId, data.express, data.submittedAt]);

  const x = data.express;
  const done = data.submittedAt && isExpressLead(data);

  return (
    <div className="min-h-screen bg-cream-100">
      <header className="bg-white/95 border-b border-gray-100">
        <div className={`mx-auto px-4 ${embedded ? 'max-w-xl py-3' : 'max-w-2xl py-4'}`}>
          {/* Inside the website panel the panel's own header carries the title. */}
          {embedded
            ? <h1 className="sr-only">{t('Request an appointment')}</h1>
            : <div className="mb-3">
                <h1 className="text-base font-semibold text-navy-600 leading-tight">{t('Request an appointment')}</h1>
                <p className="text-xs text-gray-400">{t("Dr. Aaron Wey's office")} · {PRACTICE.surgeon}</p>
              </div>}
          <nav aria-label={t('Language')} className="flex flex-wrap gap-1.5">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                lang={l.code}
                dir={l.rtl ? 'rtl' : 'ltr'}
                aria-pressed={lang === l.code}
                onClick={() => setLanguage(l.code)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  lang === l.code
                    ? 'border-navy-600 bg-navy-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-navy-400'
                }`}
              >
                {l.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className={`mx-auto px-4 py-5 ${embedded ? 'max-w-xl' : 'max-w-2xl'}`}>
        {!IS_PRODUCTION_TIER && (
          <div className="bg-amber-100 border border-amber-400 rounded-xl px-3 py-2 mb-4 text-xs font-semibold text-amber-800">
            {t('⚠️ Prototype for demonstration only. Please use fictional names and details.')}
          </div>
        )}
        {!x ? null
          : done ? <DoneScreen data={data} t={t} lang={lang} embedded={embedded} setNested={setNested} dispatch={dispatch} resetIntake={resetIntake} />
          : <RequestForm data={data} t={t} lang={lang} setNested={setNested} setSection={setSection} setRedFlags={setRedFlags} setSummary={setSummary} setSubmitted={setSubmitted} />}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The form.
// ---------------------------------------------------------------------------
function RequestForm({ data, t, lang, setNested, setSection, setRedFlags, setSummary, setSubmitted }) {
  // The red-flag rules for this intake's service (lib/service.js).
  const { detectRedFlags } = useService().redFlags;
  const x = data.express;
  const d = data.demographics || {};
  const [form, setForm] = useState(() => ({
    firstName: d.firstName || '',
    lastName: d.lastName || '',
    dob: d.dob || '',
    phone: d.phone || '',
    email: d.email || '',
    insuranceProvider: d.insuranceProvider || '',
    memberId: d.memberId || '',
    problem: data.chiefComplaint?.mainReason || '',
    safety: x.safety || '',
    accurate: false,
    contact: false,
  }));
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // The same safety check the full intake runs, over what will be sent.
  const preview = useMemo(() => ({
    ...data,
    chiefComplaint: { ...(data.chiefComplaint || {}), mainReason: form.problem },
    express: { ...x, safety: form.safety },
  }), [data, x, form.problem, form.safety]);
  const flags = useMemo(() => detectRedFlags(preview), [preview, detectRedFlags]);
  const urgent = form.safety === 'yes' || flags.some((f) => f.severity === 'urgent');

  const submit = async (e) => {
    e?.preventDefault();
    setError('');
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    const problem = form.problem.trim();
    const insuranceProvider = form.insuranceProvider.trim();
    const memberId = form.memberId.trim();
    if (!firstName || !lastName) return setError(t('Please enter your first and last name.'));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dob)) return setError(t('Please enter your date of birth.'));
    if (!phone || !email) return setError(t('Please give both a phone number and an email address.'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(t('Please enter a valid email address.'));
    if (!problem) return setError(t('Please tell us, in a few words, what is going on.'));
    if (!form.safety) return setError(t('Please answer the question about symptoms.'));
    if (!form.accurate || !form.contact) return setError(t('Please check both boxes.'));

    setSending(true);
    const now = new Date().toISOString();
    const demographics = { ...d, firstName, lastName, dob: form.dob, phone, email, insuranceProvider, memberId, visitReason: 'Appointment request from the website form' };
    const chiefComplaint = { ...(data.chiefComplaint || {}), mainReason: problem };
    const consent = { ...(data.consent || {}), accurate: true, contact: true, signatureName: `${firstName} ${lastName}`, signedAt: now };
    // The office calls in the language the patient chose at the top.
    let express = { ...x, channel: 'form', safety: form.safety, callLanguage: lang, completedAt: now, phase: 'done' };
    let intake = { ...data, demographics, chiefComplaint, consent, express, language: lang };
    setSection('demographics', demographics);
    setSection('chiefComplaint', chiefComplaint);
    setSection('consent', consent);
    setNested('express', express);
    const redFlags = detectRedFlags(intake);
    setRedFlags(redFlags);
    try {
      let sub = data.submission;
      let draft = data.draft?.id ? { id: data.draft.id, token: data.draft.token } : null;
      if (!sub?.id) {
        // The pre-visit questionnaire link first, emailed to the patient, so
        // the lead note can say whether the email went out. The link only
        // ever travels to the patient: the submission carries the outcome,
        // never the link itself.
        const sent = await saveQuestionnaireLink(continuationOf(intake, null), draft, email).catch(() => null);
        if (sent) {
          draft = { id: sent.id, token: sent.token };
          setNested('draft', { id: sent.id, token: sent.token, url: sent.url, savedAt: now });
          express = { ...express, linkEmailed: !!sent.emailed, linkEmailError: sent.emailed ? '' : (sent.emailError || '') };
        } else {
          express = { ...express, linkEmailed: false, linkEmailError: 'save-failed' };
        }
        intake = { ...intake, express };
        setNested('express', express);
        const r = await submitIntake(intake);
        sub = { id: r.id, token: r.token, submittedAt: now };
        setNested('submission', sub);
        // The saved questionnaire now knows which lead it belongs to.
        if (draft) saveQuestionnaireLink(continuationOf(intake, sub.id), draft).catch(() => {});
      } else {
        await finalizeSubmission(sub.id, sub.token).catch(() => {});
      }
      const st = await pollStatus(sub.id, sub.token, { until: (s) => !!s.note || !!s.error, timeoutMs: 45_000, intervalMs: 1500 });
      setSummary({ narrative: st?.note?.narrative || '', generatedAt: st?.note?.generatedAt || null, redFlags, sourceFingerprint: fingerprintAnswers(intake), pending: !st?.note });
      setSubmitted();
    } catch (err) {
      if (err?.submission) setNested('submission', { ...err.submission, submittedAt: now });
      setNested('express', { ...express, completedAt: null, phase: 'form' });
      setError(err?.message || t('Could not send right now. Your answers are still on this device; please try again in a moment.'));
      setSending(false);
    }
  };

  const items = CONSENT_ITEMS.filter((i) => i.key === 'accurate' || i.key === 'contact');

  return (
    <form className="animate-fade-in card" onSubmit={submit} noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label" htmlFor="x-first">{t('First name')}</label>
          <input id="x-first" type="text" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" />
        </div>
        <div>
          <label className="form-label" htmlFor="x-last">{t('Last name')}</label>
          <input id="x-last" type="text" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" />
        </div>
        <div className="sm:col-span-2">
          <label className="form-label" htmlFor="x-dob">{t('Date of birth')}</label>
          <input id="x-dob" type="date" value={form.dob} onChange={set('dob')} max={new Date().toISOString().slice(0, 10)} autoComplete="bday" className="sm:max-w-[50%]" />
        </div>
        <div>
          <label className="form-label" htmlFor="x-phone">{t('Phone')}</label>
          <input id="x-phone" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" />
        </div>
        <div>
          <label className="form-label" htmlFor="x-email">{t('Email')}</label>
          <input id="x-email" type="email" value={form.email} onChange={set('email')} autoComplete="email" inputMode="email" />
        </div>
        <div>
          <label className="form-label" htmlFor="x-insurance">{t('Insurance')}</label>
          <input id="x-insurance" type="text" value={form.insuranceProvider} onChange={set('insuranceProvider')} />
        </div>
        <div>
          <label className="form-label" htmlFor="x-member">{t('Member ID')}</label>
          <input id="x-member" type="text" value={form.memberId} onChange={set('memberId')} autoComplete="off" />
        </div>
        <div className="sm:col-span-2">
          <label className="form-label" htmlFor="x-problem">{t('What brings you in?')}</label>
          <textarea id="x-problem" rows={4} value={form.problem} onChange={set('problem')} maxLength={2000} />
        </div>
        <div className="sm:col-span-2">
          <p className="form-label" id="x-safety">{t('Right now, do you have any of these: new trouble controlling your bladder or bowels, numbness around the groin or inner thighs, weakness that is getting worse quickly, or a fever with back pain?')}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="x-safety">
            {SAFETY_CHOICES.map((c) => (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={form.safety === c.value}
                onClick={() => setForm((f) => ({ ...f, safety: c.value }))}
                className={`chip ${form.safety === c.value ? 'chip-selected' : 'chip-unselected'}`}
              >
                {t(c.label)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {urgent && <UrgentNotice t={t} />}

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <label key={item.key} className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" className="mt-1" checked={form[item.key]} onChange={(e) => setForm((f) => ({ ...f, [item.key]: e.target.checked }))} />
            <span>{consentTextVia(item, lang, tx)}</span>
          </label>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}

      <button type="submit" disabled={sending} className="btn-primary w-full mt-5 disabled:opacity-60">
        {sending ? t('Sending…') : t('Send to the office')}
      </button>
    </form>
  );
}

function UrgentNotice({ t }) {
  return (
    <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800" role="alert">
      {t('You told us about symptoms that should not wait. If this is happening now, call 911 or go to the nearest emergency room. You can also call the office at {phone}.').replace('{phone}', PRACTICE.officePhone)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// "We will call you", and the way into the full intake.
// ---------------------------------------------------------------------------
/**
 * The pre-visit questionnaire (the full intake), starting from what the lead
 * already holds. The lead itself stays on this device as submitted; the
 * continuation is what the emailed link opens, and what "Continue" opens.
 */
function continuationOf(data, leadId) {
  return {
    ...data,
    submittedAt: null,
    submission: undefined,
    generatedSummary: null,
    redFlags: [],
    currentStep: 1,
    completedSteps: [],
    draft: null,
    consent: { ...defaultIntakeData.consent },
    express: { ...(data.express || {}), leadId: leadId || data.submission?.id || null },
  };
}

/**
 * Saves the questionnaire under a private link (the same one when `draft` is
 * given) and, with `email`, sends the link to the patient. Resolves to the
 * draft route's answer: { id, token, url, emailed, emailError }.
 */
async function saveQuestionnaireLink(intake, draft, email) {
  const res = await fetch('/api/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intakeData: intake, draft: draft || undefined, email: email || undefined, purpose: 'express' }),
  });
  const r = await res.json();
  if (!res.ok || !r.url) throw new Error(r.error || 'save failed');
  return r;
}

function DoneScreen({ data, t, lang, embedded, setNested, dispatch, resetIntake }) {
  const x = data.express || {};
  const d = data.demographics || {};
  const [finishLater, setFinishLater] = useState(false);
  const [opening, setOpening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const urgent = x.safety === 'yes' || (data.redFlags || []).some((f) => f.severity === 'urgent');
  const link = data.draft?.url || '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* the link is visible to select by hand */ }
  };

  const continueNow = async () => {
    setError('');
    setOpening(true);
    try {
      const continuedAt = new Date().toISOString();
      const next = { ...continuationOf(data, null), express: { ...continuationOf(data, null).express, continuedAt } };
      const r = await saveQuestionnaireLink(next, data.draft?.id ? { id: data.draft.id, token: data.draft.token } : null);
      setNested('draft', { id: r.id, token: r.token, url: r.url, savedAt: continuedAt });
      setNested('express.continuedAt', continuedAt);
      if (embedded) {
        // Inside the website's panel the full form needs the whole window:
        // the finish-later link carries the answers into a new tab.
        window.open(r.url, '_blank', 'noopener');
        setOpening(false);
      } else {
        window.location.href = r.url;
      }
    } catch {
      setOpening(false);
      setError(t('Could not send right now. Your answers are still on this device; please try again in a moment.'));
    }
  };

  const reach = d.phone ? t('We will call {phone}.').replace('{phone}', d.phone) : d.email ? t('We will write to {email}.').replace('{email}', d.email) : '';

  return (
    <div className="animate-fade-in">
      <div className="card text-center">
        <div className="w-14 h-14 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-serif text-[1.7rem] font-semibold text-navy-600 mb-2 leading-tight">{t('Thank you for contacting us, {name}.').replace('{name}', d.firstName || '')}</h2>
        <p className="text-gray-600">{t('Your request has reached the office.')}</p>
        <p className="text-navy-600 font-medium mt-2">{t('The office will contact you for an appointment within 24 to 48 hours.')}</p>
        {reach && <p className="text-sm text-gray-500 mt-1">{reach}</p>}
        {urgent && <UrgentNotice t={t} />}
      </div>

      <div className="card mt-4">
        <h3 className="font-semibold text-navy-600 mb-1">{t('Finish your pre-visit questionnaire')}</h3>
        <p className="text-sm text-gray-500 mb-4">{t('It takes about 15 minutes and really helps our team prepare for your visit. You can continue right now, or later from the link on any device.')}</p>
        {link && (
          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-2">
              {x.linkEmailed && d.email
                ? t('We emailed your questionnaire link to {email}.').replace('{email}', d.email)
                : t('We could not email the link; keep it from here instead.')}
            </p>
            <label className="form-label" htmlFor="x-link">{t('Your questionnaire link')}</label>
            <div className="flex gap-2">
              <input id="x-link" type="text" readOnly value={link} onFocus={(e) => e.target.select()} className="flex-1 text-xs" />
              <button type="button" onClick={copy} className="btn-secondary text-sm whitespace-nowrap">{copied ? t('Copied') : t('Copy link')}</button>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={continueNow} disabled={opening} className="btn-primary flex-1 disabled:opacity-60">
            {opening ? t('Opening…') : t('Continue the questionnaire')}
          </button>
          <button type="button" onClick={() => setFinishLater(true)} className="btn-secondary flex-1">{t('Get a link to finish later')}</button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
      </div>

      {finishLater && <FinishLater onClose={() => setFinishLater(false)} intake={continuationOf(data, null)} />}

      <p className="text-center mt-6">
        <button type="button" onClick={() => { if (confirm(t('This will clear all data and start a new patient intake form. Are you sure?'))) resetIntake(); }} className="text-xs text-gray-400 hover:text-gray-600">
          {t('Start over')}
        </button>
      </p>
    </div>
  );
}
