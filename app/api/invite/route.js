import { NextResponse } from 'next/server';
import { limitOr429 } from '../../../lib/server/rateLimit';
import { logError } from '../../../lib/server/log';
import { getApiKey, practiceHubConfigured, practiceHubUrl } from '../../../lib/server/practicehub';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/invite?token=… — the office sent the patient a link from their chart
 * in Practice Hub. Ask Practice Hub (server-to-server, with the service key the
 * browser never sees) what the code stands for: which form, and the chart's
 * demographics to pre-fill. Clinical data is never returned.
 */
export async function GET(request) {
  const limited = limitOr429(request, 'invite', 30, 10 * 60_000);
  if (limited) return limited;
  const token = new URL(request.url).searchParams.get('token') || '';
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return NextResponse.json({ status: 'unknown' });
  if (!practiceHubConfigured()) return NextResponse.json({ status: 'unknown' });
  try {
    const key = await getApiKey();
    const res = await fetch(`${practiceHubUrl()}/api/intake/invite?token=${encodeURIComponent(token)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return NextResponse.json({ status: 'unknown' });
    const data = await res.json();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    logError('invite.lookup_failed', err);
    return NextResponse.json({ status: 'unknown' });
  }
}
