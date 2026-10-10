// ============================================================================
// Language-model access.
//
// Default provider is Amazon Bedrock (Anthropic Claude), because it is covered
// by the AWS Business Associate Addendum already in force on the account: no
// separate agreement, no API key to protect, and the request never leaves AWS.
// Credentials come from the runtime (Amplify SSR compute role, Lambda role, or
// the developer's AWS profile), never from environment secrets.
//
// OpenAI remains available as LLM_PROVIDER=openai for local experiments only.
// It is not under a BAA here and must not see real patient data.
//
// Two model slots: the pre-visit note (quality matters, runs in the background
// worker so latency does not) and the HPI chat (short turns, interactive).
// ============================================================================

import { logError, logEvent } from './log';

export const DEFAULT_MODELS = {
  note: 'us.anthropic.claude-opus-4-6-v1',
  chat: 'us.anthropic.claude-sonnet-4-6',
};

export function llmProvider() {
  const p = (process.env.LLM_PROVIDER || '').toLowerCase();
  if (p === 'openai' || p === 'bedrock') return p;
  // No explicit choice: use OpenAI only if that is the only thing configured.
  if (!process.env.OPENAI_API_KEY) return 'bedrock';
  return process.env.AWS_REGION || process.env.BEDROCK_REGION || process.env.AWS_EXECUTION_ENV ? 'bedrock' : 'openai';
}

export function modelFor(purpose) {
  if (purpose === 'note') return process.env.BEDROCK_NOTE_MODEL_ID || DEFAULT_MODELS.note;
  return process.env.BEDROCK_CHAT_MODEL_ID || DEFAULT_MODELS.chat;
}

/**
 * Bedrock's Converse API requires strictly alternating user/assistant turns
 * starting with a user turn. Chat histories do not always comply (the
 * interviewer speaks first), so consecutive same-role turns are merged and a
 * leading assistant turn gets a neutral user opener.
 */
function normalizeTurns(messages) {
  const out = [];
  for (const m of messages || []) {
    const role = m.role === 'assistant' ? 'assistant' : 'user';
    const text = String(m.content ?? '').trim();
    if (!text) continue;
    const last = out[out.length - 1];
    if (last && last.role === role) last.text += `\n\n${text}`;
    else out.push({ role, text });
  }
  if (!out.length || out[0].role !== 'user') out.unshift({ role: 'user', text: 'Please begin.' });
  if (out[out.length - 1].role !== 'user') out.push({ role: 'user', text: 'Please continue.' });
  return out;
}

let bedrockClient = null;
async function bedrock() {
  if (!bedrockClient) {
    const { BedrockRuntimeClient } = await import('@aws-sdk/client-bedrock-runtime');
    bedrockClient = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1' });
  }
  return bedrockClient;
}

async function completeBedrock({ purpose, system, messages, maxTokens, temperature }) {
  const { ConverseCommand } = await import('@aws-sdk/client-bedrock-runtime');
  const modelId = modelFor(purpose);
  const turns = normalizeTurns(messages);
  const t0 = Date.now();
  const res = await (await bedrock()).send(new ConverseCommand({
    modelId,
    system: system ? [{ text: system }] : undefined,
    messages: turns.map((t) => ({ role: t.role, content: [{ text: t.text }] })),
    inferenceConfig: { maxTokens, temperature },
  }));
  const text = (res.output?.message?.content || []).map((c) => c.text || '').join('').trim();
  logEvent('llm.complete', {
    provider: 'bedrock', purpose, modelId, ms: Date.now() - t0,
    inputTokens: res.usage?.inputTokens, outputTokens: res.usage?.outputTokens, stopReason: res.stopReason,
  });
  if (!text) throw Object.assign(new Error('Empty model response'), { name: 'EmptyModelResponse' });
  return { text, modelId, provider: 'bedrock', usage: res.usage || null };
}

async function completeOpenAI({ purpose, system, messages, maxTokens, temperature }) {
  const modelId = process.env.OPENAI_MODEL || 'gpt-4o';
  const t0 = Date.now();
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: modelId,
      messages: [...(system ? [{ role: 'system', content: system }] : []), ...messages.map((m) => ({ role: m.role, content: String(m.content ?? '') }))],
      temperature,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    // Deliberately not reading the body into the log: provider errors can echo
    // the prompt.
    throw Object.assign(new Error(`OpenAI HTTP ${res.status}`), { name: 'ProviderHttpError', status: res.status });
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  logEvent('llm.complete', { provider: 'openai', purpose, modelId, ms: Date.now() - t0, usage: data.usage });
  if (!text) throw Object.assign(new Error('Empty model response'), { name: 'EmptyModelResponse' });
  return { text, modelId, provider: 'openai', usage: data.usage || null };
}

/**
 * One completion.
 * @param {{purpose:'note'|'chat', system?:string, messages:{role:string,content:string}[], maxTokens?:number, temperature?:number}} req
 * @returns {Promise<{text:string, modelId:string, provider:string, usage:object|null}>}
 */
export async function complete(req) {
  const provider = llmProvider();
  const args = { maxTokens: 1024, temperature: 0.5, ...req };
  try {
    return provider === 'openai' ? await completeOpenAI(args) : await completeBedrock(args);
  } catch (err) {
    logError('llm.error', err, { provider, purpose: req.purpose });
    throw err;
  }
}
