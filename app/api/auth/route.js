import { cookies } from 'next/headers';
import { SESSION_COOKIE, expectedToken, verifyPassword, authStatus } from '../../../lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(authStatus());
}

export async function POST(request) {
  let password = '';
  try {
    ({ password } = await request.json());
  } catch {
    return Response.json({ error: 'Expected JSON body.' }, { status: 400 });
  }

  if (!verifyPassword(password)) {
    // Same message either way — do not reveal whether a passphrase is configured.
    return Response.json({ error: 'Incorrect passphrase.' }, { status: 401 });
  }

  cookies().set(SESSION_COOKIE, expectedToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return Response.json({ ok: true });
}

export async function DELETE() {
  cookies().delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
