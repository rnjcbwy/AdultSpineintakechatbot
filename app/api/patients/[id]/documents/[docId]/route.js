import { getStorage } from '../../../../../../lib/server/storage';
import { requireAuth } from '../../../../../../lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/patients/:id/documents/:docId — stream the stored file back. */
export async function GET(_request, { params }) {
  const denied = requireAuth();
  if (denied) return denied;

  try {
    const found = await getStorage().getDocument({ patientId: params.id, docId: params.docId });
    if (!found) return Response.json({ error: 'Document not found.' }, { status: 404 });

    const { meta, bytes } = found;
    return new Response(bytes, {
      headers: {
        'Content-Type': meta.type || 'application/octet-stream',
        'Content-Length': String(bytes.length),
        // Inline so a PDF opens in the browser; the filename is quoted for spaces.
        'Content-Disposition': `inline; filename="${meta.name.replace(/"/g, '')}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    return Response.json({ error: e?.message || 'Could not read document.' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const denied = requireAuth();
  if (denied) return denied;

  try {
    const ok = await getStorage().deleteDocument({ patientId: params.id, docId: params.docId });
    if (!ok) return Response.json({ error: 'Document not found.' }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e?.message || 'Could not delete document.' }, { status: 500 });
  }
}
