import { NextResponse } from 'next/server';
import { NOTE_SUMMARY_SYSTEM_PROMPT, buildSummaryPrompt } from '../../../lib/prompts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request) {
  try {
    const { intakeData } = await request.json();

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: NOTE_SUMMARY_SYSTEM_PROMPT },
          { role: 'user', content: buildSummaryPrompt(intakeData) },
        ],
        temperature: 0.3,
        max_tokens: 4000,
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
    const summary = data.choices[0].message.content;

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary generation error:', error?.message || error);
    return NextResponse.json(
      { error: `Failed to generate summary: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
