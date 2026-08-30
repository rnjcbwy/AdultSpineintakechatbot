import { getStorage } from '../../../../lib/server/storage';
import { requireAuth } from '../../../../lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/patients/:id — full record plus document metadata. */
export async function GET(_request, { params }) {
  const denied = requireAuth();
  if (denied) return denied;

  try {
    const record = await getStorage().getPatient(params.id);
    if (!record) return Response.json({ error: 'Patient not found.' }, { status: 404 });
    return Response.json(record);
  } catch (e) {
    return Response.json({ error: e?.message || 'Could not read patient.' }, { status: 500 });
  }
}

/** DELETE /api/patients/:id — remove the record and every stored file. */
export async function DELETE(_request, { params }) {
  const denied = requireAuth();
  if (denied) return denied;

  try {
    const storage = getStorage();
    const existing = await storage.getPatient(params.id);
    if (!existing) return Response.json({ error: 'Patient not found.' }, { status: 404 });
    await storage.deletePatient(params.id);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e?.message || 'Could not delete patient.' }, { status: 500 });
  }
}
