import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { authorizeSubmission } from '../../../../../lib/server/submissionAuth';
import { loadIntake } from '../../../../../lib/server/submissionStore';
import { educationFor, willEmail } from '../../../../../lib/server/education';
import { limitOr429 } from '../../../../../lib/server/rateLimit';
import { logError } from '../../../../../lib/server/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const QR_OPTS = { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#123559', light: '#ffffff' } };

/** "m•••@example.com": enough for the patient to recognise, nothing more on screen. */
const maskEmail = (email) => {
  const [user, domain] = String(email || '').trim().split('@');
  if (!user || !domain) return '';
  return `${user.slice(0, 1)}${'•'.repeat(Math.min(Math.max(user.length - 1, 2), 6))}@${domain}`;
};

/**
 * GET /api/intake/:id/education — the patient-education guides chosen for
 * this submission, in the patient's language, with a QR code for each (the
 * clinic tablet shows them to scan). Same bearer token as the status route.
 */
export async function GET(request, { params }) {
  const limited = limitOr429(request, 'education', 20, 60_000);
  if (limited) return limited;
  const auth = await authorizeSubmission(request, params.id);
  if (auth.response) return auth.response;
  try {
    const intake = await loadIntake(params.id);
    if (!intake) return NextResponse.json({ guides: [] }, { status: 404 });
    const edu = await educationFor(params.id, intake);
    // The form itself never names the surgeon; a few care-plan descriptions on
    // the website do ("Dr. Wey's plan…"), so on this screen they show the title
    // and link only. The email, sent from the practice's own domain, keeps them.
    const guides = await Promise.all(edu.guides.map(async (g) => ({
      ...g,
      description: /\bWey\b/.test(g.description) ? '' : g.description,
      qr: await QRCode.toString(g.url, QR_OPTS),
    })));
    return NextResponse.json({
      lang: edu.lang,
      guides,
      email: guides.length && willEmail(intake) ? maskEmail(intake.demographics.email) : '',
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    logError('education.route_failed', err, { submissionId: params.id });
    return NextResponse.json({ guides: [] });
  }
}
