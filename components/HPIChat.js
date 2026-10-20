'use client';

import { useState, useRef, useEffect } from 'react';
import { buildHPIChatContext } from '../lib/prompts';
import { useLang, makeT, COMMON } from '../lib/i18n';
import ChatPanel from './ui/ChatPanel';

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
 *
 * The chat surface itself is components/ui/ChatPanel, shared with the express
 * request; this component owns the interview logic.
 */
export default function HPIChat({ intakeData, hpiData, setNested, maxTurns = 5, autoStart = false }) {
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const [messages, setMessages] = useState(hpiData.conversationHistory || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(autoStart || (hpiData.conversationHistory || []).length > 0);
  const inputRef = useRef(null);
  const started = useRef(false);

  const answered = messages.filter((m) => m.role === 'user').length;
  const finished = answered >= maxTurns;

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
    <ChatPanel
      title={t('Intake Assistant')}
      subtitle={t('Question {n} of {total}').replace('{n}', String(Math.min(answered + 1, maxTurns))).replace('{total}', String(maxTurns))}
      messages={messages}
      isLoading={isLoading}
      input={input}
      onInputChange={setInput}
      onSend={sendMessage}
      inputRef={inputRef}
      placeholder={t('Type your response...')}
      hint={t('Answer in your own words. There are no wrong answers — and you can stop anytime.')}
      sendLabel={t('Send')}
      finished={finished}
      finishedContent={
        <p className="text-sm text-teal-700 text-center">
          {t("That's everything we need from the conversation. You can add anything else on the next steps.")}
        </p>
      }
    />
  );
}
