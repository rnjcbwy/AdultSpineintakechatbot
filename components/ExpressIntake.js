'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useIntake, defaultIntakeData } from '../lib/store';
import { useLang, makeT, tx, COMMON, LANGUAGES, LANGUAGE_NAMES, isRtl } from '../lib/i18n';
import { buildExpressChatContext } from '../lib/prompts';
import {
  EXPRESS_SLOTS, EXPRESS_QUESTIONS, SAFETY_CHOICES, classifySafety, classifyLanguage,
  parseWho, parseContact, parseInsurance, isExpress, isExpressLead,
} from '../lib/express';
import { CONSENT_ITEMS, consentTextVia } from '../lib/consent';
import { detectRedFlags } from '../lib/redFlags';
import { fingerprintAnswers } from '../lib/noteFingerprint';
import { submitIntake, finalizeSubmission, pollStatus } from '../lib/submitClient';
import { IS_PRODUCTION_TIER, PRACTICE } from '../lib/deploymentTier';
import ChatPanel from './ui/ChatPanel';
import FinishLater from './FinishLater';

const LOCAL = {
  'Request an appointment': { es: 'Solicitar una cita', zh: '预约就诊' },
  "Dr. Aaron Wey's office": { es: 'Consultorio del Dr. Aaron Wey', zh: 'Aaron Wey 医生诊室' },
  'A short chat, about six questions. The office then contacts you within 24 to 48 hours to schedule.': {
    es: 'Una conversación corta, de unas seis preguntas. Después, el consultorio se comunica con usted en un plazo de 24 a 48 horas para programar la cita.',
    zh: '一次简短的对话，大约六个问题。之后诊室会在 24 到 48 小时内与您联系安排就诊。',
  },
  'Insurance': { es: 'Seguro médico', zh: '医疗保险' },
  'Member ID': { es: 'Número de miembro', zh: '会员编号' },
  'Plan name, or "none"': { es: 'Nombre del plan, o "ninguno"', zh: '保险计划名称，或“没有”' },
  'Please give both a phone number and an email address.': { es: 'Indique un número de teléfono y un correo electrónico.', zh: '请同时提供电话号码和电子邮箱。' },
  'Please enter a valid email address.': { es: 'Ingrese un correo electrónico válido.', zh: '请输入有效的电子邮箱。' },
  'Thank you for contacting us, {name}.': { es: 'Gracias por comunicarse con nosotros, {name}.', zh: '{name}，感谢您与我们联系。' },
  'The office will contact you for an appointment within 24 to 48 hours.': { es: 'El consultorio se comunicará con usted en un plazo de 24 a 48 horas para programar su cita.', zh: '诊室将在 24 到 48 小时内与您联系安排就诊。' },
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
  'Language': { es: 'Idioma', zh: '语言' },
  'Front desk assistant': { es: 'Asistente de recepción', zh: '前台助手' },
  'Question {n} of {total}': { es: 'Pregunta {n} de {total}', zh: '第 {n} 题，共 {total} 题' },
  'Type your answer...': { es: 'Escriba su respuesta...', zh: '输入您的回答……' },
  'Answer in your own words. This is not an emergency service: if you need help now, call 911.': {
    es: 'Responda con sus propias palabras. Esto no es un servicio de emergencia: si necesita ayuda ahora, llame al 911.',
    zh: '用您自己的话回答。这不是紧急服务：如需即时帮助，请拨打 911。',
  },
  'Thank you. Please check what I have below before it is sent to the office.': {
    es: 'Gracias. Revise lo que anoté abajo antes de enviarlo al consultorio.',
    zh: '谢谢。请在发送给诊室之前检查下面的内容。',
  },
  'Please check what we have': { es: 'Revise lo que tenemos', zh: '请核对以下信息' },
  'Correct anything that was misheard, then send it to the office.': {
    es: 'Corrija lo que se haya entendido mal y envíelo al consultorio.',
    zh: '如有理解错误请更正，然后发送给诊室。',
  },
  'First name': { es: 'Nombre', zh: '名' },
  'Last name': { es: 'Apellido', zh: '姓' },
  'Date of birth': { es: 'Fecha de nacimiento', zh: '出生日期' },
  'Phone': { es: 'Teléfono', zh: '电话' },
  'Email': { es: 'Correo electrónico', zh: '电子邮箱' },
  'In your words': { es: 'En sus palabras', zh: '您的描述' },
  'Language for the call': { es: 'Idioma para la llamada', zh: '来电使用的语言' },
  'Safety question': { es: 'Pregunta de seguridad', zh: '安全问题' },
  'Send to the office': { es: 'Enviar al consultorio', zh: '发送给诊室' },
  'Sending…': { es: 'Enviando…', zh: '正在发送……' },
  'Please enter your first and last name.': { es: 'Ingrese su nombre y apellido.', zh: '请输入您的姓和名。' },
  'Please enter your date of birth.': { es: 'Ingrese su fecha de nacimiento.', zh: '请输入您的出生日期。' },
  'Please give a phone number or an email address.': { es: 'Indique un número de teléfono o un correo electrónico.', zh: '请提供电话号码或电子邮箱。' },
  'Please tell us, in a few words, what is going on.': { es: 'Cuéntenos, en pocas palabras, qué le está pasando.', zh: '请简单说明您的情况。' },
  'Please check both boxes.': { es: 'Marque las dos casillas.', zh: '请勾选两个选项。' },
  'Could not send right now. Your answers are still on this device; please try again in a moment.': {
    es: 'No se pudo enviar en este momento. Sus respuestas siguen en este dispositivo; inténtelo de nuevo en un momento.',
    zh: '现在无法发送。您的回答仍保存在此设备上，请稍后重试。',
  },
  'Thank you, {name}.': { es: 'Gracias, {name}.', zh: '谢谢您，{name}。' },
  'Your request has reached the office.': { es: 'Su solicitud llegó al consultorio.', zh: '您的请求已送达诊室。' },
  'Our office will contact you within two business days to schedule your consultation.': {
    es: 'Nuestra oficina se comunicará con usted en un plazo de dos días hábiles para programar su consulta.',
    zh: '我们的办公室将在两个工作日内与您联系，安排您的会诊。',
  },
  'We will call {phone}.': { es: 'Le llamaremos al {phone}.', zh: '我们将拨打 {phone}。' },
  'We will write to {email}.': { es: 'Le escribiremos a {email}.', zh: '我们将发送邮件至 {email}。' },
  'You told us about symptoms that should not wait. If this is happening now, call 911 or go to the nearest emergency room. You can also call the office at {phone}.': {
    es: 'Nos contó síntomas que no deben esperar. Si le está pasando ahora, llame al 911 o acuda a la sala de emergencias más cercana. También puede llamar al consultorio al {phone}.',
    zh: '您提到的症状不宜等待。如果现在正在发生，请拨打 911 或前往最近的急诊室。您也可以致电诊室：{phone}。',
  },
  'Save time at your visit': { es: 'Ahorre tiempo en su visita', zh: '节省就诊时间' },
  'The full intake form takes about 15 minutes and lets Dr. Wey read your whole story before you arrive. You can do it now or later, on any device.': {
    es: 'El formulario completo toma unos 15 minutos y permite que el Dr. Wey lea toda su historia antes de que llegue. Puede hacerlo ahora o más tarde, en cualquier dispositivo.',
    zh: '完整的问诊表大约需要 15 分钟，可以让 Wey 医生在您到达之前了解您的全部情况。您可以现在填写，也可以稍后在任何设备上填写。',
  },
  'Continue to the full form': { es: 'Continuar al formulario completo', zh: '继续填写完整表格' },
  'Get a link to finish later': { es: 'Obtener un enlace para terminar más tarde', zh: '获取稍后完成的链接' },
  'Opening…': { es: 'Abriendo…', zh: '正在打开……' },
  'Not sure': { es: 'No estoy seguro/a', zh: '不确定' },
  'Start over': { es: 'Empezar de nuevo', zh: '重新开始' },
  '⚠️ Prototype for demonstration only. Please use fictional names and details.': {
    es: '⚠️ Prototipo solo para demostración. Use nombres y datos ficticios.',
    zh: '⚠️ 仅供演示的原型。请使用虚构的姓名和信息。',
  },
};

// The fallback questions, keyed by their English text so makeT can serve them.
const QUESTION_DICT = Object.fromEntries(Object.values(EXPRESS_QUESTIONS).map((q) => [q.en, { es: q.es, zh: q.zh }]));
const SAFETY_DICT = {
  'No, none of these': { es: 'No, ninguno de estos', zh: '没有，都没有' },
  'Yes, one or more of these': { es: 'Sí, uno o más de estos', zh: '有，一项或多项' },
  "I'm not sure": { es: 'No estoy seguro/a', zh: '我不确定' },
};

/**
 * The express request: a five-turn chat, a card to check, a "we will call
 * you" screen that leads into the full intake. Lives at /express; opened
 * from the "Chat with us" launcher on the practice website in a slide-over
 * panel, or on its own. State is the shared intake store, so the answers
 * carry straight into the full form.
 */
export default function ExpressIntake() {
  const { data, setNested, setSection, setLanguage, setRedFlags, setSummary, setSubmitted, resetIntake, dispatch } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL, ...QUESTION_DICT, ...SAFETY_DICT }, lang);
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
      setNested('express', { startedAt: new Date().toISOString(), phase: 'chat', answers: {}, transcript: [], safety: '', callLanguage: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.sessionId, data.express, data.submittedAt]);

  const x = data.express;
  const phase = data.submittedAt && isExpressLead(data) ? 'done' : (x?.phase || 'chat');

  return (
    <div className="min-h-screen bg-cream-100">
      <header className="bg-white/95 border-b border-gray-100">
        <div className={`mx-auto px-4 py-3 flex items-center gap-3 ${embedded ? 'justify-end max-w-xl py-2' : 'justify-between max-w-2xl'}`}>
          {/* Inside the website panel the panel's own header carries the title; only the language picker is kept. */}
          {embedded
            ? <h1 className="sr-only">{t('Request an appointment')}</h1>
            : <div>
                <h1 className="text-base font-semibold text-navy-600 leading-tight">{t('Request an appointment')}</h1>
                <p className="text-xs text-gray-400">{t("Dr. Aaron Wey's office")} · {PRACTICE.surgeon}</p>
              </div>}
          <label className="text-xs text-gray-500 flex items-center gap-2">
            <span className="sr-only">{t('Language')}</span>
            <select
              value={lang}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-sm py-1.5 px-2 rounded-lg border border-gray-300 bg-white w-auto"
              aria-label={t('Language')}
            >
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </label>
        </div>
      </header>

      <main className={`mx-auto px-4 py-5 ${embedded ? 'max-w-xl' : 'max-w-2xl'}`}>
        {!IS_PRODUCTION_TIER && (
          <div className="bg-amber-100 border border-amber-400 rounded-xl px-3 py-2 mb-4 text-xs font-semibold text-amber-800">
            {t('⚠️ Prototype for demonstration only. Please use fictional names and details.')}
          </div>
        )}
        {!x ? null
          : phase === 'done' ? <DoneScreen data={data} t={t} lang={lang} embedded={embedded} setNested={setNested} dispatch={dispatch} resetIntake={resetIntake} />
          : phase === 'confirm' ? <ConfirmCard data={data} t={t} lang={lang} setNested={setNested} setSection={setSection} setRedFlags={setRedFlags} setSummary={setSummary} setSubmitted={setSubmitted} />
          : <ExpressChat data={data} t={t} lang={lang} setNested={setNested} setLanguage={setLanguage} embedded={embedded} />}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The five turns.
// ---------------------------------------------------------------------------
function ExpressChat({ data, t, lang, setNested, setLanguage, embedded }) {
  const x = data.express;
  const answers = x.answers || {};
  const transcript = x.transcript || [];
  const slotIndex = EXPRESS_SLOTS.findIndex((s) => !answers[s]);
  const slot = slotIndex >= 0 ? EXPRESS_SLOTS[slotIndex] : null;
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const asking = useRef(false);

  // The assistant speaks whenever it is its turn: at the start, and after
  // each answer. The closing line, after the fifth answer, hands over to the
  // confirmation card.
  const last = transcript[transcript.length - 1];
  const assistantsTurn = !last || last.role === 'user';
  // One request per turn, guarded by a ref rather than an effect cleanup:
  // development mounts effects twice, and a cleanup flag would throw away the
  // reply from the first run and leave the chat waiting forever.
  useEffect(() => {
    if (!assistantsTurn || asking.current) return;
    asking.current = true;
    (async () => {
      setLoading(true);
      let reply = '';
      try {
        const context = buildExpressChatContext({
          slot,
          languageName: LANGUAGE_NAMES[lang] || 'English',
          answers,
          firstName: answers.who ? parseWho(answers.who).firstName : '',
        });
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'express', context, messages: transcript.map((m) => ({ role: m.role, content: m.content })) }),
        });
        const j = await res.json();
        if (res.ok && j.reply) reply = String(j.reply).trim();
      } catch {
        /* the fixed wording below is used */
      }
      if (!reply) reply = slot ? t(EXPRESS_QUESTIONS[slot].en) : t('Thank you. Please check what I have below before it is sent to the office.');
      const patch = { ...x, transcript: [...transcript, { role: 'assistant', content: reply, slot: slot || 'closing' }] };
      if (!slot) patch.phase = 'confirm';
      setNested('express', patch);
      setLoading(false);
      asking.current = false;
      if (slot) setTimeout(() => inputRef.current?.focus(), 50);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantsTurn, transcript.length]);

  const send = (text, value) => {
    const content = String(text || '').trim();
    if (!content || loading || !slot) return;
    const patch = { ...x, answers: { ...answers, [slot]: content }, transcript: [...transcript, { role: 'user', content, slot }] };
    if (slot === 'safety') patch.safety = value || classifySafety(content);
    if (slot === 'language') {
      const code = value || classifyLanguage(content, LANGUAGES);
      patch.callLanguage = code || '';
      // A caller who picks another language for the call most likely reads it
      // too; switch the card over unless they already chose a language here.
      if (code && code !== lang && lang === 'en') setLanguage(code);
    }
    setInput('');
    setNested('express', patch);
  };

  const quickReplies = slot === 'safety'
    ? SAFETY_CHOICES.map((c) => ({ label: t(c.label), value: c.value }))
    : slot === 'language'
      ? LANGUAGES.map((l) => ({ label: l.label, value: l.code }))
      : [];

  return (
    <div className="animate-fade-in">
      {!embedded && <p className="text-sm text-gray-500 mb-3">{t('A short chat, about six questions. The office then contacts you within 24 to 48 hours to schedule.')}</p>}
      <ChatPanel
        title={t('Front desk assistant')}
        subtitle={t('Question {n} of {total}').replace('{n}', String(Math.min(slotIndex < 0 ? EXPRESS_SLOTS.length : slotIndex + 1, EXPRESS_SLOTS.length))).replace('{total}', String(EXPRESS_SLOTS.length))}
        messages={transcript}
        isLoading={loading}
        input={input}
        onInputChange={setInput}
        onSend={() => send(input)}
        inputRef={inputRef}
        placeholder={t('Type your answer...')}
        hint={t('Answer in your own words. This is not an emergency service: if you need help now, call 911.')}
        sendLabel={t('Send')}
        quickReplies={quickReplies}
        onQuickReply={(q) => send(q.label, q.value)}
        height={embedded ? 'h-[min(52vh,420px)]' : 'h-[420px]'}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// The card: what was understood, for the patient to correct and send.
// ---------------------------------------------------------------------------
function ConfirmCard({ data, t, lang, setNested, setSection, setRedFlags, setSummary, setSubmitted }) {
  const x = data.express;
  const answers = x.answers || {};
  const d = data.demographics || {};
  const [form, setForm] = useState(() => {
    const who = parseWho(answers.who);
    const contact = parseContact(answers.contact);
    const insurance = parseInsurance(answers.insurance);
    return {
      firstName: d.firstName || who.firstName,
      lastName: d.lastName || who.lastName,
      dob: d.dob || who.dob,
      phone: d.phone || contact.phone,
      email: d.email || contact.email,
      insuranceProvider: d.insuranceProvider || insurance.provider,
      memberId: d.memberId || insurance.memberId,
      problem: data.chiefComplaint?.mainReason || answers.problem || '',
      safety: x.safety || classifySafety(answers.safety) || '',
      callLanguage: x.callLanguage || classifyLanguage(answers.language, LANGUAGES) || lang,
      accurate: false,
      contact: false,
    };
  });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const closing = [...(x.transcript || [])].reverse().find((m) => m.role === 'assistant');

  // The same safety check the full intake runs, over what will be sent.
  const preview = useMemo(() => ({
    ...data,
    chiefComplaint: { ...(data.chiefComplaint || {}), mainReason: form.problem },
    express: { ...x, safety: form.safety },
  }), [data, x, form.problem, form.safety]);
  const flags = useMemo(() => detectRedFlags(preview), [preview]);
  const urgent = form.safety === 'yes' || flags.some((f) => f.severity === 'urgent');

  const submit = async () => {
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
    if (!form.accurate || !form.contact) return setError(t('Please check both boxes.'));

    setSending(true);
    const now = new Date().toISOString();
    const demographics = { ...d, firstName, lastName, dob: form.dob, phone, email, insuranceProvider, memberId, visitReason: 'Express request from the website chat' };
    const chiefComplaint = { ...(data.chiefComplaint || {}), mainReason: problem };
    const consent = { ...(data.consent || {}), accurate: true, contact: true, signatureName: `${firstName} ${lastName}`, signedAt: now };
    let express = { ...x, safety: form.safety, callLanguage: form.callLanguage, completedAt: now, phase: 'done' };
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
      setNested('express', { ...express, completedAt: null, phase: 'confirm' });
      setError(err?.message || t('Could not send right now. Your answers are still on this device; please try again in a moment.'));
      setSending(false);
    }
  };

  const items = CONSENT_ITEMS.filter((i) => i.key === 'accurate' || i.key === 'contact');

  return (
    <div className="animate-fade-in space-y-4">
      {closing && (
        <div className="flex justify-start">
          <div className="max-w-[85%] p-4 rounded-2xl rounded-bl-md text-sm leading-relaxed bg-white text-gray-700 border border-gray-100 shadow-sm">{closing.content}</div>
        </div>
      )}
      <div className="card">
        <h2 className="text-lg font-semibold text-navy-600 mb-1">{t('Please check what we have')}</h2>
        <p className="text-sm text-gray-500 mb-5">{t('Correct anything that was misheard, then send it to the office.')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label" htmlFor="x-first">{t('First name')}</label>
            <input id="x-first" type="text" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" />
          </div>
          <div>
            <label className="form-label" htmlFor="x-last">{t('Last name')}</label>
            <input id="x-last" type="text" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" />
          </div>
          <div>
            <label className="form-label" htmlFor="x-dob">{t('Date of birth')}</label>
            <input id="x-dob" type="date" value={form.dob} onChange={set('dob')} max={new Date().toISOString().slice(0, 10)} autoComplete="bday" />
          </div>
          <div>
            <label className="form-label" htmlFor="x-lang">{t('Language for the call')}</label>
            <select id="x-lang" value={form.callLanguage} onChange={set('callLanguage')}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
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
            <input id="x-insurance" type="text" value={form.insuranceProvider} onChange={set('insuranceProvider')} placeholder={t('Plan name, or "none"')} />
          </div>
          <div>
            <label className="form-label" htmlFor="x-member">{t('Member ID')}</label>
            <input id="x-member" type="text" value={form.memberId} onChange={set('memberId')} autoComplete="off" />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label" htmlFor="x-problem">{t('In your words')}</label>
            <textarea id="x-problem" rows={4} value={form.problem} onChange={set('problem')} maxLength={2000} />
          </div>
          <div className="sm:col-span-2">
            <p className="form-label">{t('Safety question')}</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('Safety question')}>
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

        <button type="button" onClick={submit} disabled={sending} className="btn-primary w-full mt-5 disabled:opacity-60">
          {sending ? t('Sending…') : t('Send to the office')}
        </button>
      </div>
    </div>
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
