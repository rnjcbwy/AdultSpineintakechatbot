'use client';

import { useEffect, useRef, useState } from 'react';
import { useIntake } from '../lib/store';
import { useLang, makeT, COMMON } from '../lib/i18n';

const LOCAL = {
  'Finish later': { es: 'Terminar más tarde', zh: '稍后完成' },
  'Your answers are saved on this device. To pick up on another device, use a link.': {
    es: 'Sus respuestas están guardadas en este dispositivo. Para continuar en otro dispositivo, use un enlace.',
    zh: '您的回答已保存在此设备上。如需在其他设备上继续，请使用链接。',
  },
  'Saving your answers…': { es: 'Guardando sus respuestas…', zh: '正在保存您的回答……' },
  'Your link': { es: 'Su enlace', zh: '您的链接' },
  'Copy link': { es: 'Copiar enlace', zh: '复制链接' },
  'Copied': { es: 'Copiado', zh: '已复制' },
  'Email me the link': { es: 'Enviarme el enlace por correo', zh: '将链接发送到我的邮箱' },
  'Your email': { es: 'Su correo electrónico', zh: '您的电子邮箱' },
  'Send': { es: 'Enviar', zh: '发送' },
  'Sent. Check your inbox.': { es: 'Enviado. Revise su bandeja de entrada.', zh: '已发送，请查收邮箱。' },
  'Open in my mail app': { es: 'Abrir en mi aplicación de correo', zh: '在我的邮件应用中打开' },
  'The link opens your answers, so keep it to yourself. It works for 30 days and stops working once you submit.': {
    es: 'El enlace abre sus respuestas, así que no lo comparta. Funciona durante 30 días y deja de funcionar cuando envía el formulario.',
    zh: '该链接会打开您的回答，请勿与他人分享。链接有效期 30 天，提交表格后即失效。',
  },
  'Any files you attached stay on this device. On another device, attach them again or bring them to your visit.': {
    es: 'Los archivos que adjuntó permanecen en este dispositivo. En otro dispositivo, adjúntelos de nuevo o tráigalos a su visita.',
    zh: '您附加的文件保留在此设备上。在其他设备上，请重新附加或在就诊时携带。',
  },
  'Could not save right now. Your answers are still on this device; please try again in a moment.': {
    es: 'No se pudo guardar en este momento. Sus respuestas siguen en este dispositivo; inténtelo de nuevo en un momento.',
    zh: '现在无法保存。您的回答仍在此设备上，请稍后重试。',
  },
  'Please enter a valid email address.': { es: 'Ingrese una dirección de correo válida.', zh: '请输入有效的电子邮箱地址。' },
  'Email sending is not available; copy the link or open it in your mail app.': {
    es: 'El envío de correo no está disponible; copie el enlace o ábralo en su aplicación de correo.',
    zh: '邮件发送功能不可用；请复制链接或在您的邮件应用中打开。',
  },
  'Close': { es: 'Cerrar', zh: '关闭' },
  'Your link to finish your spine intake form': { es: 'Su enlace para terminar su formulario de columna', zh: '您完成脊柱问诊表的链接' },
};

/**
 * "Finish later": saves the answers so far under a private link the patient
 * can open on any device. The dialog saves as soon as it opens, shows the
 * link to copy, and can email it (through the practice's own mail service
 * when that is set up, otherwise through the patient's mail app).
 */
export default function FinishLater({ onClose }) {
  const { data, setNested } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const [link, setLink] = useState(data.draft?.url || '');
  const [saving, setSaving] = useState(!data.draft?.url);
  const [error, setError] = useState('');
  const [email, setEmail] = useState(data.demographics?.email || '');
  const [emailAvailable, setEmailAvailable] = useState(true);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const save = async (withEmail) => {
    const res = await fetch('/api/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intakeData: data, draft: data.draft ? { id: data.draft.id, token: data.draft.token } : undefined, email: withEmail || undefined }),
    });
    const r = await res.json();
    if (!res.ok || !r.url) throw new Error(r.error || 'save failed');
    setNested('draft', { id: r.id, token: r.token, url: r.url, savedAt: new Date().toISOString() });
    setLink(r.url);
    setEmailAvailable(!!r.emailAvailable);
    return r;
  };

  // Save once on open (React's development double-mount would otherwise make two drafts).
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    save().catch(() => setError(t('Could not save right now. Your answers are still on this device; please try again in a moment.'))).finally(() => setSaving(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* the link is visible to select by hand */ }
  };

  const send = async () => {
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError(t('Please enter a valid email address.'));
    setSending(true);
    try {
      const r = await save(email.trim());
      if (r.emailed) setSent(true);
      else if (r.emailError === 'not-configured') setError(t('Email sending is not available; copy the link or open it in your mail app.'));
      else setError(t('Could not save right now. Your answers are still on this device; please try again in a moment.'));
    } catch {
      setError(t('Could not save right now. Your answers are still on this device; please try again in a moment.'));
    } finally {
      setSending(false);
    }
  };

  const mailto = `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(t('Your link to finish your spine intake form'))}&body=${encodeURIComponent(link)}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-navy-900/40 p-0 sm:p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-lg font-semibold text-navy-600">{t('Finish later')}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">{t('Close')}</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{t('Your answers are saved on this device. To pick up on another device, use a link.')}</p>

        {saving ? (
          <p className="text-sm text-gray-500">{t('Saving your answers…')}</p>
        ) : link ? (
          <div className="space-y-4">
            <div>
              <label className="form-label">{t('Your link')}</label>
              <div className="flex gap-2">
                <input type="text" readOnly value={link} onFocus={(e) => e.target.select()} className="flex-1 text-xs" />
                <button type="button" onClick={copy} className="btn-secondary text-sm whitespace-nowrap">{copied ? t('Copied') : t('Copy link')}</button>
              </div>
            </div>
            <div>
              <label className="form-label">{t('Email me the link')}</label>
              <div className="flex gap-2">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('Your email')} className="flex-1" />
                {emailAvailable ? (
                  <button type="button" onClick={send} disabled={sending || sent} className="btn-teal text-sm whitespace-nowrap disabled:opacity-50">{sent ? t('Sent. Check your inbox.') : t('Send')}</button>
                ) : (
                  <a href={mailto} className="btn-teal text-sm whitespace-nowrap">{t('Open in my mail app')}</a>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400">{t('The link opens your answers, so keep it to yourself. It works for 30 days and stops working once you submit.')}</p>
            {(data.documents || []).length > 0 && (
              <p className="text-xs text-gray-400">{t('Any files you attached stay on this device. On another device, attach them again or bring them to your visit.')}</p>
            )}
          </div>
        ) : null}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
