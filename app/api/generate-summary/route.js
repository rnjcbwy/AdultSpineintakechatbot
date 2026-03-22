import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { NOTE_SUMMARY_SYSTEM_PROMPT, buildSummaryPrompt } from '../../../lib/prompts';

// Lazy initialization to avoid build-time errors when env var is not set
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const openai = getOpenAI();
    const { intakeData } = await request.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: NOTE_SUMMARY_SYSTEM_PROMPT },
        { role: 'user', content: buildSummaryPrompt(intakeData) },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const summary = completion.choices[0].message.content;

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate clinical summary.' },
      { status: 500 }
    );
  }
}
