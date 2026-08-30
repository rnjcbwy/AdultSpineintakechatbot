import { getStorage } from '../../../lib/server/storage';
import { requireAuth } from '../../../lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/patients — list every patient in the cabinet (summaries only). */
export async function GET() {
  const denied = requireAuth();
  if (denied) return denied;

  try {
    const storage = getStorage();
    const patients = await storage.listPatients();
    return Response.json({ patients, storage: storage.describe() });
  } catch (e) {
    return Response.json({ error: e?.message || 'Could not list patients.' }, { status: 500 });
  }
}

/** POST /api/patients — create or update a patient record. */
export async function POST(request) {
  const denied = requireAuth();
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Expected JSON body.' }, { status: 400 });
  }

  const { patientId, intake } = body || {};
  if (!intake || typeof intake !== 'object') {
    return Response.json({ error: 'Missing intake record.' }, { status: 400 });
  }

  try {
    const saved = await getStorage().savePatient({ patientId, intake });
    return Response.json(saved, { status: patientId ? 200 : 201 });
  } catch (e) {
    return Response.json({ error: e?.message || 'Could not save patient.' }, { status: 500 });
  }
}
