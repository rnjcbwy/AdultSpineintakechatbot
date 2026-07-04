'use client';

import { useState, useRef, useEffect } from 'react';
import { useIntake } from '../../lib/store';
import { buildHPIChatContext } from '../../lib/prompts';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';

// Shared display-only translations for this step (both components use it).
const LOCAL = {
  "Anything Else You'd Like to Share?": {
    es: '¿Algo más que quiera compartir?',
    zh: '还有什么想告诉我们的吗？',
  },
  "This step is optional. If you'd like, you can chat with our assistant, which will ask a few further questions about your symptoms — and/or you can simply type any additional concerns or details about your symptoms that you'd like us to know.": {
    es: 'Este paso es opcional. Si lo desea, puede conversar con nuestro asistente, que le hará algunas preguntas más sobre sus síntomas, y/o simplemente puede escribir cualquier inquietud o detalle adicional sobre sus síntomas que quiera que sepamos.',
    zh: '此步骤为可选。如果您愿意，可以与我们的助手交谈，助手会就您的症状再问几个问题；您也可以直接输入任何想让我们了解的、关于您症状的其他顾虑或细节。',
  },
  'Additional concerns or details (optional)': {
    es: 'Inquietudes o detalles adicionales (opcional)',
    zh: '其他顾虑或细节（可选）',
  },
  'Feel free to share anything about your symptoms, your goals for the visit, or questions you have — in your own words.': {
    es: 'Puede compartir con sus propias palabras cualquier cosa sobre sus síntomas, sus objetivos para la consulta o las preguntas que tenga.',
    zh: '欢迎用您自己的话分享任何关于您的症状、就诊目标或您的疑问。',
  },
  "For example: I'm most worried about the numbness in my hand, and I'd like to understand my options before considering surgery...": {
    es: 'Por ejemplo: Lo que más me preocupa es el entumecimiento en la mano, y me gustaría entender mis opciones antes de considerar una cirugía...',
    zh: '例如：我最担心手部的麻木，希望在考虑手术之前先了解我的选择……',
  },
  'Continue to Past Medical History': {
    es: 'Continuar a los antecedentes médicos',
    zh: '继续填写既往病史',
  },
  'Skip — nothing to add': {
    es: 'Omitir — nada que agregar',
    zh: '跳过 — 没有要补充的',
  },
  'Optional: Chat with our Assistant': {
    es: 'Opcional: Converse con nuestro asistente',
    zh: '可选：与我们的助手交谈',
  },
  "If you'd like, our assistant can ask a few follow-up questions about your symptoms to make sure we have a complete picture. It works like a friendly conversation — and it's entirely up to you.": {
    es: 'Si lo desea, nuestro asistente puede hacerle algunas preguntas de seguimiento sobre sus síntomas para asegurarnos de tener un panorama completo. Funciona como una conversación amigable, y depende totalmente de usted.',
    zh: '如果您愿意，我们的助手可以就您的症状问几个后续问题，以确保我们全面了解情况。它就像一次友好的对话——完全由您决定是否进行。',
  },
  'Start Conversation': {
    es: 'Iniciar conversación',
    zh: '开始对话',
  },
  'Intake Assistant': {
    es: 'Asistente de admisión',
    zh: '接诊助手',
  },
  'Optional follow-up · gathering your symptom history': {
    es: 'Seguimiento opcional · recopilando el historial de sus síntomas',
    zh: '可选的后续问题 · 收集您的症状史',
  },
  'Type your response...': {
    es: 'Escriba su respuesta...',
    zh: '输入您的回复……',
  },
  'Answer in your own words. There are no wrong answers — and you can stop anytime.': {
    es: 'Responda con sus propias palabras. No hay respuestas incorrectas, y puede detenerse en cualquier momento.',
    zh: '用您自己的话回答。没有错误的答案——您可以随时停止。',
  },
};

/**
 * Additional Details & AI Follow-up — the final part of the symptom history.
 *
 * Everything here is OPTIONAL. The patient can:
 *   - type any additional concerns or details they want to share, and/or
 *   - chat with the AI assistant, which asks a few further questions.
 */
export default function AdditionalConcerns({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const hpi = data.hpiData;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t("Anything Else You'd Like to Share?")}</h2>
        <p className="section-subtitle">
          {t("This step is optional. If you'd like, you can chat with our assistant, which will ask a few further questions about your symptoms — and/or you can simply type any additional concerns or details about your symptoms that you'd like us to know.")}
        </p>
      </div>

      {/* Free-text additional concerns */}
      <div className="card mb-4">
        <label className="form-label text-base">{t('Additional concerns or details (optional)')}</label>
        <p className="text-sm text-gray-400 mb-3">
          {t('Feel free to share anything about your symptoms, your goals for the visit, or questions you have — in your own words.')}
        </p>
        <textarea
          value={hpi.additionalConcerns || ''}
          onChange={(e) => setNested('hpiData.additionalConcerns', e.target.value)}
          placeholder={t("For example: I'm most worried about the numbness in my hand, and I'd like to understand my options before considering surgery...")}
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 resize-none"
        />
      </div>

      {/* Optional AI chat */}
      <HPIChat intakeData={data} hpiData={hpi} setNested={setNested} />

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext
        nextLabel={t('Continue to Past Medical History')}
        showSkip
        skipLabel={t('Skip — nothing to add')}
      />
    </div>
  );
}


// ===========================================================================
// Optional AI chat for HPI follow-up
// ===========================================================================
function HPIChat({ intakeData, hpiData, setNested }) {
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const [messages, setMessages] = useState(hpiData.conversationHistory || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState((hpiData.conversationHistory || []).length > 0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      setNested('hpiData.conversationHistory', messages);
    }
  }, [messages]);

  const startChat = async () => {
    setChatStarted(true);
    setIsLoading(true);
    try {
      const context = buildHPIChatContext(intakeData);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Please begin the intake interview based on my information.' }],
          context,
        }),
      });
      const data = await res.json();
      if (data.reply) setMessages([{ role: 'assistant', content: data.reply }]);
    } catch {
      setMessages([{
        role: 'assistant',
        content: "I'm ready to help gather more details about your symptoms. Could you start by telling me more about when your symptoms first began and what happened?",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    try {
      const context = buildHPIChatContext(intakeData);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          context,
        }),
      });
      const data = await res.json();
      if (data.reply) setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I had trouble processing that. Could you please try again?",
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  if (!chatStarted) {
    return (
      <div className="card text-center py-10 border-dashed border-2 border-teal-200 bg-teal-50/40">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-400 to-navy-500 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-navy-600 mb-2">{t('Optional: Chat with our Assistant')}</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          {t("If you'd like, our assistant can ask a few follow-up questions about your symptoms to make sure we have a complete picture. It works like a friendly conversation — and it's entirely up to you.")}
        </p>
        <button onClick={startChat} className="btn-teal">
          {t('Start Conversation')}
        </button>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="bg-navy-600 text-white px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium">{t('Intake Assistant')}</p>
          <p className="text-xs text-white/60">{t('Optional follow-up · gathering your symptom history')}</p>
        </div>
      </div>

      <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} chat-message-enter`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-navy-600 text-white rounded-br-md'
                : 'bg-white text-gray-700 border border-gray-100 rounded-bl-md shadow-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-400 p-4 rounded-2xl rounded-bl-md border border-gray-100 shadow-sm">
              <div className="typing-dots"><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-3">
          <input ref={inputRef} type="text" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={t('Type your response...')}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
            disabled={isLoading} />
          <button onClick={sendMessage} disabled={!input.trim() || isLoading} className="btn-primary px-4">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          {t('Answer in your own words. There are no wrong answers — and you can stop anytime.')}
        </p>
      </div>
    </div>
  );
}
