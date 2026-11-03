import { NextResponse } from 'next/server';
import { fromPracticeHub } from '../../../../lib/server/practicehubAuth';
import { applicableQuestionnaires } from '../../../../lib/server/phoneQuestionnaires';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/phone/questionnaires?service=adult_spine&regions=low-back,left-leg&dob=YYYY-MM-DD
 * Practice Hub only: the questionnaires this form would give, for the
 * assistant to read on a call to a patient who cannot use the website.
 */
export async function GET(request) {
  if (!(await fromPracticeHub(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const p = new URL(request.url).searchParams;
  const regions = (p.get('regions') || '').split(',').map((r) => r.trim()).filter(Boolean).slice(0, 30);
  const dob = /^\d{4}-\d{2}-\d{2}$/.test(p.get('dob') || '') ? p.get('dob') : '';
  return NextResponse.json({ questionnaires: applicableQuestionnaires(p.get('service') || '', regions, dob) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
