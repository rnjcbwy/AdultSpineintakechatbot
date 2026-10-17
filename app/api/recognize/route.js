import { NextResponse } from 'next/server';
import { limitOr429 } from '../../../lib/server/rateLimit';
import { logError, logEvent } from '../../../lib/server/log';
import { getApiKey, practiceHubConfigured, practiceHubUrl } from '../../../lib/server/practicehub';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/recognize — the patient says they have been here before.
 *
 * The details typed so far go to Practice Hub (server-to-server). If they
 * line up with one chart, Practice Hub emails a private link to the address
 * it has ON FILE for that chart and tells us only that it did. Nothing from
 * the chart ever comes back through this route, so knowing someone's name
 * and birthday is not enough to read their record: the link lands in their
 * own inbox.
 */
export async function POST(request) {
  const limited = limitOr429(request, 'recognize', 5, 60 * 60_000);
  if (limited) return limited;
  if (!practiceHubConfigured()) return NextResponse.json({ status: 'none' });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: 'none' });
  }
  const d = body?.demographics || {};
  const payload = {
    form: 'adult_spine',
    firstName: String(d.firstName || '').slice(0, 100),
    lastName: String(d.lastName || '').slice(0, 100),
    dob: String(d.dob || ''),
    phone: String(d.phone || '').slice(0, 40),
    email: String(d.email || '').slice(0, 200),
    address: [d.address, d.city, d.state, d.zip].filter(Boolean).join(' ').slice(0, 300),
    insuranceId: String(d.memberId || '').slice(0, 100),
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.dob) || !(payload.lastName || payload.firstName)) return NextResponse.json({ status: 'none' });
  try {
    const key = await getApiKey();
    const res = await fetch(`${practiceHubUrl()}/api/intake/recognize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return NextResponse.json({ status: 'none' });
    const data = await res.json();
    logEvent('recognize.asked', { status: data?.status || 'none' });
    return NextResponse.json({ status: data?.status || 'none', hint: data?.hint || '' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    logError('recognize.failed', err);
    return NextResponse.json({ status: 'none' });
  }
}
