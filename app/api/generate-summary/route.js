import { NextResponse } from 'next/server';
import { generateNote } from '../../../lib/server/intakeWorker';
import { limitOr429 } from '../../../lib/server/rateLimit';
import { logError } from '../../../lib/server/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Synchronous note generation.
 *
 * Kept for the prototype flow (no server-side submission) and for local
 * development. In the AWS deployment the note is written by the background
 * worker after the intake is stored, because the web tier's response window
 * is shorter than a careful note takes; see /api/intake/submit.
 */
export async function POST(request) {
  const limited = limitOr429(request, 'summary', 10, 10 * 60_000);
  if (limited) return limited;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Expected JSON body.' }, { status: 400 });
  }
  const { intakeData } = body || {};
  if (!intakeData || typeof intakeData !== 'object') {
    return NextResponse.json({ error: 'Missing intake data.' }, { status: 400 });
  }

  try {
    const note = await generateNote(intakeData);
    return NextResponse.json({ summary: note.narrative, generatedAt: note.generatedAt, model: note.modelId });
  } catch (err) {
    logError('summary.failed', err);
    return NextResponse.json({ error: 'Could not generate the summary right now. Your answers are saved; please try again in a moment.' }, { status: 502 });
  }
}
