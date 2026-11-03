import { NextResponse } from 'next/server';
import { fromPracticeHub } from '../../../../lib/server/practicehubAuth';
import { regionChoices } from '../../../../lib/server/phoneQuestionnaires';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/phone/catalog?service=adult_spine — Practice Hub only: the body regions questionnaires are chosen from. */
export async function GET(request) {
  if (!(await fromPracticeHub(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const service = new URL(request.url).searchParams.get('service') || '';
  return NextResponse.json({ regions: regionChoices(service) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
