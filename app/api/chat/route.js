import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { HPI_CHAT_SYSTEM_PROMPT } from '../../../lib/prompts';

// Lazy initialization to avoid build-time errors when env var is not set
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const openai = getOpenAI();
    const { messages, context } = await request.json();

    // Build the message array for OpenAI
    const chatMessages = [
      { role: 'system', content: HPI_CHAT_SYSTEM_PROMPT },
    ];

    // Add patient context as the first user message if provided
    if (context) {
      chatMessages.push({
        role: 'user',
        content: `[SYSTEM CONTEXT - Patient data already collected]\n${context}`,
      });
      chatMessages.push({
        role: 'assistant',
        content: "I have the patient's information. I'll now ask targeted follow-up questions to complete the history.",
      });
    }

    // Add conversation history
    for (const msg of messages) {
      chatMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0].message.content;

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from AI assistant.' },
      { status: 500 }
    );
  }
}
