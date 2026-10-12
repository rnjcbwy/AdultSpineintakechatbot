'use client';

import { useState, useRef, useEffect } from 'react';
import { buildHPIChatContext } from '../lib/prompts';
import { useLang, makeT, COMMON } from '../lib/i18n';

const LOCAL = {
  'Tell it in your own words': { es: 'Cuéntelo con sus propias palabras', zh: '用您自己的话讲述' },
  'A short conversation, about five questions, about how your symptoms started and what they stop you doing. Answer however feels natural.': {
    es: 'Una conversación corta, de unas cinco preguntas, sobre cómo empezaron sus síntomas y qué le impiden hacer. Responda como le resulte natural.',
    zh: '一次简短的对话，大约五个问题，谈谈您的症状是如何开始的以及它们妨碍您做什么。随意作答即可。',
  },
  'Start': { es: 'Comenzar', zh: '开始' },
  'Intake Assistant': { es: 'Asistente de admisión', zh: '接诊助手' },
  'Question {n} of {total}': { es: 'Pregunta {n} de {total}', zh: '第 {n} 题，共 {total} 题' },
  'Type your response...': { es: 'Escriba su respuesta...', zh: '输入您的回复……' },
  'Answer in your own words. There are no wrong answers — and you can stop anytime.': {
    es: 'Responda con sus propias palabras. No hay respuestas incorrectas, y puede detenerse en cualquier momento.',
    zh: '用您自己的话回答。没有错误的答案——您可以随时停止。',
  },
  "That's everything we need from the conversation. You can add anything else on the next steps.": {
    es: 'Eso es todo lo que necesitamos de la conversación. Puede agregar cualquier otra cosa en los pasos siguientes.',
    zh: '对话部分到此为止。您可以在接下来的步骤中补充其他内容。',
  },
};

/**
 * The guided conversation: the assistant asks a few follow-up questions about
 * the symptoms and the patient answers in their own words. Capped at a small
 * number of patient turns so it stays a short chat rather than an interview;
 * on the last turn the assistant is told to wrap up and summarise.
 */
export default function HPIChat({ intakeData, hpiData, setNested, maxTurns = 5, autoStart = false }) {
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const [messages, setMessages] = useState(hpiData.conversationHistory || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(autoStart || (hpiData.conversationHistory || []).length > 0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const started = useRef(false);

  const answered = messages.filter((m) => m.role === 'user').length;
  const finished = answered >= maxTurns;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) setNested('hpiData.conversationHistory', messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const ask = async (history, { final = false } = {}) => {
    let context = buildHPIChatContext(intakeData);
    context += `\n\nCONVERSATION LENGTH: at most ${maxTurns} questions in total. Ask ONE question at a time, the most useful one next.`;
    if (final) context += '\n\nFINAL TURN: the patient has answered the last question. Do not ask anything further. Thank them in one sentence and give a brief summary of what they told you, in plain language.';
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.map((m) => ({ role: m.role, content: m.content })), context }),
    });
    const data = await res.json();
    return data.reply;
  };

  const startChat = async () => {
    if (started.current) return;
    started.current = true;
    setChatStarted(true);
    setIsLoading(true);
    try {
      const reply = await ask([{ role: 'user', content: 'Please begin the intake interview based on my information.' }]);
      if (reply) setMessages([{ role: 'assistant', content: reply }]);
    } catch {
      setMessages([{
        role: 'assistant',
        content: "I'm ready to help gather more details about your symptoms. Could you start by telling me more about when your symptoms first began and what happened?",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoStart && messages.length === 0) startChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || finished) return;
    const userMessage = { role: 'user', content: input.trim() };
    const updated = [...messages, userMessage];
    const isLast = updated.filter((m) => m.role === 'user').length >= maxTurns;
    setMessages(updated);
    setInput('');
    setIsLoading(true);
    try {
      const reply = await ask(updated, { final: isLast });
      if (reply) setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: "I'm sorry, I had trouble processing that. Could you please try again?" }]);
    } finally {
      setIsLoading(false);
      if (!isLast) inputRef.current?.focus();
    }
  };

  if (!chatStarted) {
    return (
      <div className="card text-center py-10 border-dashed border-2 border-teal-200 bg-teal-50/40">
        <h3 className="text-lg font-semibold text-navy-600 mb-2">{t('Tell it in your own words')}</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          {t('A short conversation, about five questions, about how your symptoms started and what they stop you doing. Answer however feels natural.')}
        </p>
        <button onClick={startChat} className="btn-teal">{t('Start')}</button>
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
          <p className="text-xs text-white/60">
            {t('Question {n} of {total}').replace('{n}', String(Math.min(answered + 1, maxTurns))).replace('{total}', String(maxTurns))}
          </p>
        </div>
      </div>

      <div className="h-[380px] overflow-y-auto p-4 space-y-4 bg-gray-50">
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
        {finished ? (
          <p className="text-sm text-teal-700 text-center">
            {t("That's everything we need from the conversation. You can add anything else on the next steps.")}
          </p>
        ) : (
          <>
            <div className="flex gap-3">
              <input ref={inputRef} type="text" value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={t('Type your response...')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                disabled={isLoading} />
              <button onClick={sendMessage} disabled={!input.trim() || isLoading} className="btn-primary px-4" aria-label={t('Send')}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {t('Answer in your own words. There are no wrong answers — and you can stop anytime.')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
