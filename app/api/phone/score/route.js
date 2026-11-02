import { NextResponse } from 'next/server';
import { fromPracticeHub } from '../../../../lib/server/practicehubAuth';
import { scoreResponses } from '../../../../lib/server/phoneQuestionnaires';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/phone/score { service, responses: { questionnaireId: { itemId: score } } }
 * Practice Hub only: scores for questionnaires answered on a call, as the form scores them.
 */
export async function POST(request) {
  if (!(await fromPracticeHub(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const scores = scoreResponses(String(body?.service || ''), body?.responses).map(({ id, name, display }) => ({ id, name, display }));
  return NextResponse.json({ scores }, { headers: { 'Cache-Control': 'private, no-store' } });
}
