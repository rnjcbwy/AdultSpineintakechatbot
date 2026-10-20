'use client';

import { useEffect, useRef } from 'react';

/**
 * The chat surface shared by the guided symptom interview (HPIChat) and the
 * express request (ExpressIntake): a navy header with a title and a line
 * under it, the message list, the typing indicator, and the input row with
 * optional one-tap replies. It holds no conversation logic of its own; the
 * caller owns the messages and decides what happens when one is sent.
 */
export default function ChatPanel({
  title,
  subtitle,
  messages,
  isLoading,
  input,
  onInputChange,
  onSend,
  inputRef,
  placeholder,
  hint,
  sendLabel = 'Send',
  finished = false,
  finishedContent = null,
  quickReplies = [],
  onQuickReply,
  height = 'h-[380px]',
}) {
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isLoading]);

  return (
    <div className="card p-0 overflow-hidden">
      <div className="bg-navy-600 text-white px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          {subtitle && <p className="text-xs text-white/60">{subtitle}</p>}
        </div>
      </div>

      <div className={`${height} overflow-y-auto p-4 space-y-4 bg-gray-50`} role="log" aria-live="polite">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} chat-message-enter`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
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
          finishedContent
        ) : (
          <>
            {quickReplies.length > 0 && !isLoading && (
              <div className="flex flex-wrap gap-2 mb-3">
                {quickReplies.map((q) => (
                  <button
                    key={q.value ?? q.label}
                    type="button"
                    onClick={() => onQuickReply?.(q)}
                    className="px-3 py-1.5 rounded-full border border-teal-300 bg-teal-50/70 text-sm text-teal-800 hover:bg-teal-100 hover:border-teal-400 transition-colors"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
                placeholder={placeholder}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                disabled={isLoading}
                autoComplete="off"
              />
              <button type="button" onClick={onSend} disabled={!input.trim() || isLoading} className="btn-primary px-4" aria-label={sendLabel}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            {hint && <p className="text-xs text-gray-400 mt-2 text-center">{hint}</p>}
          </>
        )}
      </div>
    </div>
  );
}
