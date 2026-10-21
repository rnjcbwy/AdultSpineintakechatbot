import { NextResponse } from 'next/server';
import { complete } from '../../../lib/server/llm';
import { limitOr429 } from '../../../lib/server/rateLimit';
import { logError } from '../../../lib/server/log';
import { TRIAGE_REGIONS, specialtyFromRegions } from '../../../lib/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

const SYSTEM = `You read a new message from a patient (or a parent) on the first screen of a surgical practice's intake form and work out which questionnaire fits. You do not diagnose and you never give advice.

Decide three things:

1. specialty
- "spine": neck, back, spine, scoliosis or posture, pain or numbness that comes from the spine into an arm or a leg (sciatica, a pinched nerve in the neck), a prior spine operation.
- "ortho": a bone or a joint other than the spine: shoulder, elbow, hand, wrist, fingers, hip, knee, ankle, foot; fractures and injuries to them; arthritis of a joint; tendons and ligaments.
- A limb pain WITHOUT a joint problem and WITH neck or back symptoms is "spine". A fall or injury to a limb is "ortho". If it cannot be told, "unsure".

2. visitKind
- "new": a problem this office has not seen (a first visit, a new problem, a second opinion, a referral). A patient seen here before for something ELSE is still "new" for this problem.
- "followup": coming back to the same doctor about a problem already seen, with no operation for it in between. A patient on a first visit with this doctor is always "new", even if another doctor at the office treated the problem.
- "postop": a visit after an operation on the problem (a check-up after surgery, wound check, "I had my fusion/replacement/repair and ...").
- "unsure" when nothing in the message says.

3. claim
- "workers_comp": hurt at work, on the job, a workers' compensation claim.
- "personal_injury": a crash, a fall on someone's property, an assault or another injury with an attorney, a lawsuit or an insurance claim against another party.
- "none" when the message says nothing of the kind. Never guess a claim from an injury alone: a fall at home is "none".

Reply with ONLY a JSON object:
{"specialty":"spine"|"ortho"|"unsure","visitKind":"new"|"followup"|"postop"|"unsure","claim":"none"|"workers_comp"|"personal_injury","reason":"<one short sentence, in the language named, restating what you understood, e.g. 'A swollen right knee after a fall at work last month.' No greeting, no pleasantries, no advice, no dashes.>"}`;

/**
 * What the patient's first words say about the visit: the specialty, the
 * kind of visit and any claim. Clear region taps settle the specialty on
 * their own (lib/service.js); the model reads the rest from the description.
 * It runs on Bedrock under the AWS BAA; nothing is logged beyond token counts.
 */
export async function POST(request) {
  const limited = limitOr429(request, 'triage', 30, 60_000);
  if (limited) return limited;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Expected JSON body.' }, { status: 400 }); }
  const description = String(body?.description || '').slice(0, 2000).trim();
  const regions = Array.isArray(body?.regions) ? body.regions.filter((r) => TRIAGE_REGIONS.some((x) => x.id === r)) : [];
  const language = String(body?.language || 'en').slice(0, 8);
  const settled = specialtyFromRegions(regions);

  if (!description) return NextResponse.json({ specialty: settled || 'unsure', visitKind: 'unsure', claim: 'none', reason: '' });

  const regionText = regions.map((r) => TRIAGE_REGIONS.find((x) => x.id === r)?.label).filter(Boolean).join(', ') || 'not given';
  const prompt = [
    `Language for the reason: ${language}`,
    `Who the form is for: ${String(body?.who || '').slice(0, 60) || 'not given'}`,
    `First visit with this doctor: ${String(body?.firstTime || '').slice(0, 80) || 'not given'}`,
    `Regions tapped: ${regionText}`,
    `What the patient wrote:\n"""${description}"""`,
  ].join('\n');
  try {
    const r = await complete({ purpose: 'chat', system: SYSTEM, messages: [{ role: 'user', content: prompt }], maxTokens: 250, temperature: 0 });
    const m = /\{[\s\S]*\}/.exec(r.text || '');
    const parsed = m ? JSON.parse(m[0]) : {};
    const specialty = settled || (['spine', 'ortho', 'unsure'].includes(parsed.specialty) ? parsed.specialty : 'unsure');
    const visitKind = ['new', 'followup', 'postop', 'unsure'].includes(parsed.visitKind) ? parsed.visitKind : 'unsure';
    const claim = ['none', 'workers_comp', 'personal_injury'].includes(parsed.claim) ? parsed.claim : 'none';
    return NextResponse.json({ specialty, visitKind, claim, reason: String(parsed.reason || '').slice(0, 300) });
  } catch (err) {
    logError('triage.failed', err);
    return NextResponse.json({ specialty: settled || 'unsure', visitKind: 'unsure', claim: 'none', reason: '' });
  }
}
