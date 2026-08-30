import { getStorage } from '../../../../../lib/server/storage';
import { requireAuth } from '../../../../../lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 25 * 1024 * 1024;

/** GET /api/patients/:id/documents — metadata for every stored file. */
export async function GET(_request, { params }) {
  const denied = requireAuth();
  if (denied) return denied;
  try {
    return Response.json({ documents: await getStorage().listDocuments(params.id) });
  } catch (e) {
    return Response.json({ error: e?.message || 'Could not list documents.' }, { status: 500 });
  }
}

/**
 * POST /api/patients/:id/documents — multipart upload.
 * Fields: file (one or many), category
 */
export async function POST(request, { params }) {
  const denied = requireAuth();
  if (denied) return denied;

  let form;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Expected multipart/form-data.' }, { status: 400 });
  }

  const category = String(form.get('category') || 'other');
  const files = form.getAll('file').filter((f) => typeof f === 'object' && f);
  if (!files.length) return Response.json({ error: 'No file supplied.' }, { status: 400 });

  try {
    const storage = getStorage();
    if (!(await storage.getPatient(params.id))) {
      return Response.json({ error: 'Patient not found.' }, { status: 404 });
    }

    const saved = [];
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        return Response.json(
          { error: `"${file.name}" exceeds the ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB limit.` },
          { status: 413 }
        );
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      saved.push(await storage.addDocument({
        patientId: params.id,
        category,
        name: file.name,
        type: file.type,
        bytes,
      }));
    }
    return Response.json({ documents: saved }, { status: 201 });
  } catch (e) {
    return Response.json({ error: e?.message || 'Could not store document.' }, { status: 500 });
  }
}
