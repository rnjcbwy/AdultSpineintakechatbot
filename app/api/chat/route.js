import { NextResponse } from 'next/server';
import { HPI_CHAT_SYSTEM_PROMPT, EXPRESS_CHAT_SYSTEM_PROMPT } from '../../../lib/prompts';
import { complete } from '../../../lib/server/llm';
import { limitOr429 } from '../../../lib/server/rateLimit';
import { logError } from '../../../lib/server/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_MESSAGES = 80;
const MAX_CHARS = 4000;

/**
 * One turn of the guided HPI interview. The model runs on Amazon Bedrock
 * under the AWS BAA (see lib/server/llm.js); nothing about the exchange is
 * logged beyond token counts.
 */
export async function POST(request) {
  const limited = limitOr429(request, 'chat', 60, 60_000);
  if (limited) return limited;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Expected JSON body.' }, { status: 400 });
  }
  const { messages, context, mode } = body || {};
  if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) {
    return NextResponse.json({ error: 'Invalid conversation.' }, { status: 400 });
  }
  // 'express': the five-turn appointment request (lib/express.js). Same model,
  // same route, a different system prompt; the context names the question.
  const express = mode === 'express';

  const turns = [];
  if (context && express) {
    turns.push({ role: 'user', content: `[SYSTEM CONTEXT]\n${String(context).slice(0, 4000)}` });
    turns.push({ role: 'assistant', content: 'Understood. I will ask only the question named for this turn, in the language given.' });
  } else if (context) {
    turns.push({ role: 'user', content: `[SYSTEM CONTEXT - Patient data already collected]\n${String(context).slice(0, 20_000)}` });
    turns.push({ role: 'assistant', content: "I have the patient's information. I'll now ask targeted follow-up questions to complete the history." });
  }
  for (const m of messages) {
    if (!m || typeof m.content !== 'string') continue;
    turns.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.slice(0, MAX_CHARS) });
  }

  try {
    const r = await complete({ purpose: 'chat', system: express ? EXPRESS_CHAT_SYSTEM_PROMPT : HPI_CHAT_SYSTEM_PROMPT, messages: turns, maxTokens: express ? 300 : 500, temperature: express ? 0.5 : 0.7 });
    return NextResponse.json({ reply: r.text });
  } catch (err) {
    logError('chat.failed', err);
    return NextResponse.json({ error: 'The interview assistant is unavailable right now. You can continue with the form and come back to this step.' }, { status: 502 });
  }
}
