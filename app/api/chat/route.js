import { NextResponse } from 'next/server';
import { HPI_CHAT_SYSTEM_PROMPT } from '../../../lib/prompts';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request) {
  try {
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

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('OpenAI API error:', res.status, err);
      return NextResponse.json(
        { error: `OpenAI API error: ${res.status}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    const reply = data.choices[0].message.content;

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error?.message || error);
    return NextResponse.json(
      { error: `Failed to get response: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
