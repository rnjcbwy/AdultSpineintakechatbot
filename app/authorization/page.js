'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  extractEvidence, scoreReadiness, listPayers, listProcedures,
  EVIDENCE_LABELS, RULES_META,
} from '../../lib/authReadiness';
import { listDocuments, getDocumentBlob, DOCUMENT_CATEGORIES, formatBytes } from '../../lib/documents';
import { buildPacket } from '../../lib/packet';

const STORAGE_KEY = 'spine-intake-data';

const STATUS_STYLES = {
  ready: { dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50 border-green-200', label: 'Authorization-ready' },
  partial: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'Missing detail' },
  not_ready: { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Not authorization-ready' },
  unknown: { dot: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', label: 'Not scorable' },
};

export default function AuthorizationWorkbench() {
  // --- data source -------------------------------------------------------
  const [auth, setAuth] = useState(null);          // { configured, open, note }
  const [password, setPassword] = useState('');
  const [patients, setPatients] = useState([]);
  const [storageLabel, setStorageLabel] = useState('');
  const [intake, setIntake] = useState(null);
  const [source, setSource] = useState(null);      // 'browser' | 'cabinet'
  const [serverPatientId, setServerPatientId] = useState(null);

  // --- selection / output ------------------------------------------------
  const [payerId, setPayerId] = useState('');
  const [procIndex, setProcIndex] = useState(null);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refreshAuth = useCallback(async () => {
    try {
      const r = await fetch('/api/auth');
      const j = await r.json();
      setAuth(j);
      return j;
    } catch {
      // A failed probe must not be cached as "not configured" — that would
      // hide the sign-in form for the rest of the session. Leave `configured`
      // unknown so the form still renders and the user can retry.
      const unknown = { configured: null, open: false, note: 'Could not reach the API — try signing in.' };
      setAuth(unknown);
      return unknown;
    }
  }, []);

  const loadPatients = useCallback(async () => {
    try {
      const r = await fetch('/api/patients');
      if (r.status === 401 || r.status === 503) { setPatients([]); return; }
      const j = await r.json();
      setPatients(j.patients || []);
      setStorageLabel(j.storage || '');
    } catch { /* cabinet simply unavailable */ }
  }, []);

  useEffect(() => { refreshAuth(); }, [refreshAuth]);
  // Re-list whenever access opens, rather than only on the first probe.
  useEffect(() => { if (auth?.open) loadPatients(); }, [auth?.open, loadPatients]);

  const signIn = async () => {
    setError(''); setBusy('signin');
    try {
      const r = await fetch('/api/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!r.ok) { setError((await r.json()).error || 'Sign-in failed.'); return; }
      setPassword('');
      const a = await refreshAuth();
      if (a?.open) await loadPatients();
    } finally { setBusy(''); }
  };

  /** Load the intake sitting in THIS browser (the prototype flow). */
  const loadFromBrowser = async () => {
    setError(''); setResult(null);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) { setError('No intake found in this browser.'); return; }
      const parsed = JSON.parse(saved);
      parsed.documents = await listDocuments(parsed.sessionId);
      setIntake(parsed); setSource('browser'); setServerPatientId(null);
    } catch {
      setError('Could not read the local intake record.');
    }
  };

  const loadFromCabinet = async (id) => {
    setError(''); setResult(null); setBusy('load');
    try {
      const r = await fetch(`/api/patients/${id}`);
      if (!r.ok) { setError((await r.json()).error || 'Could not load patient.'); return; }
      const record = await r.json();
      setIntake(record); setSource('cabinet'); setServerPatientId(id);
    } finally { setBusy(''); }
  };

  /** Push the browser-held record and its files into the office cabinet. */
  const saveToCabinet = async () => {
    if (!intake) return;
    setError(''); setNotice(''); setBusy('save');
    try {
      const r = await fetch('/api/patients', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: serverPatientId || undefined, intake }),
      });
      if (!r.ok) { setError((await r.json()).error || 'Could not save.'); return; }
      const { id } = await r.json();

      // Upload any documents still living only in this browser.
      let uploaded = 0;
      if (source === 'browser') {
        for (const doc of intake.documents || []) {
          const blob = await getDocumentBlob(doc.id);
          if (!blob) continue;
          const fd = new FormData();
          fd.append('category', doc.category);
          fd.append('file', new File([blob], doc.name, { type: doc.type }));
          const up = await fetch(`/api/patients/${id}/documents`, { method: 'POST', body: fd });
          if (up.ok) uploaded++;
        }
      }
      setServerPatientId(id);
      setNotice(`Saved to the cabinet${uploaded ? ` with ${uploaded} document${uploaded === 1 ? '' : 's'}` : ''}.`);
      await loadPatients();
    } catch (e) {
      setError(e?.message || 'Could not save to the cabinet.');
    } finally { setBusy(''); }
  };

  // --- derived -----------------------------------------------------------
  const payers = useMemo(() => listPayers(), []);
  const procedures = useMemo(() => (payerId ? listProcedures(payerId) : []), [payerId]);
  const evidence = useMemo(() => (intake ? extractEvidence(intake) : null), [intake]);
  const readiness = useMemo(
    () => (evidence && payerId && procIndex != null ? scoreReadiness({ payerId, procedureIndex: procIndex, evidence }) : null),
    [evidence, payerId, procIndex]
  );
  const filtered = useMemo(() => {
    if (!filter.trim()) return procedures;
    const q = filter.toLowerCase();
    return procedures.filter((p) => `${p.procedure} ${p.indication}`.toLowerCase().includes(q));
  }, [procedures, filter]);

  const downloadPacket = async () => {
    setBusy('packet'); setError(''); setResult(null);
    try {
      const loadDocument = source === 'cabinet'
        ? async (meta) => {
            const r = await fetch(`/api/patients/${serverPatientId}/documents/${meta.id}`);
            return r.ok ? await r.blob() : null;
          }
        : undefined; // defaults to IndexedDB
      const { blob, filename, chapters, skipped } = await buildPacket({ intake, readiness, loadDocument });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setResult({ filename, size: blob.size, chapters: chapters.length, skipped });
    } catch (e) {
      setError(e?.message || 'Could not build the packet.');
    } finally { setBusy(''); }
  };

  const d = intake?.demographics || {};
  const docs = intake?.documents || [];
  const s = STATUS_STYLES[readiness?.status || 'unknown'];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-navy-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-semibold">Authorization Workbench</h1>
            <p className="text-sm text-white/60">
              Patient file cabinet &amp; packet assembly{storageLabel ? ` · ${storageLabel}` : ''}
            </p>
          </div>
          <div className="flex gap-3 text-sm items-center">
            {auth?.configured && auth?.open && (
              <button
                onClick={async () => { await fetch('/api/auth', { method: 'DELETE' }); await refreshAuth(); setPatients([]); }}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg"
              >Sign out</button>
            )}
            <a href="/clinician" className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg">Clinical summary</a>
            <a href="/" className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg">Intake</a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* ---------------- Source picker ---------------- */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-navy-600 mb-3">Patient file</h3>

          {auth && !auth.open && (
            <div className="flex gap-2 items-end mb-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Passphrase</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && signIn()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Clinician passphrase"
                />
              </div>
              <button onClick={signIn} disabled={busy === 'signin' || !password} className="btn-primary disabled:opacity-50">
                {busy === 'signin' ? 'Checking…' : 'Sign in'}
              </button>
            </div>
          )}

          {auth && auth.configured === false && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              {auth.note} Set <code className="font-mono">CLINICIAN_PASSWORD</code> in <code className="font-mono">.env.local</code> before this holds anything real.
            </p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-800 mb-1">This browser</p>
              <p className="text-xs text-gray-500 mb-3">The intake just completed on this device.</p>
              <button onClick={loadFromBrowser} className="btn-secondary text-sm">Load local intake</button>
            </div>

            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-800">Office cabinet</p>
                <span className="text-xs text-gray-400">{patients.length} patient{patients.length === 1 ? '' : 's'}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">Records saved on this machine's server.</p>
              {!auth?.open ? (
                <p className="text-xs text-gray-400">Sign in to view.</p>
              ) : patients.length === 0 ? (
                <p className="text-xs text-gray-400">Empty — load a local intake and save it here.</p>
              ) : (
                <div className="max-h-44 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
                  {patients.map((p) => (
                    <button key={p.id} onClick={() => loadFromCabinet(p.id)}
                      className={`w-full text-left px-3 py-2 hover:bg-teal-50 ${serverPatientId === p.id ? 'bg-teal-50' : ''}`}>
                      <p className="text-sm font-medium text-gray-800">
                        {[p.lastName, p.firstName].filter(Boolean).join(', ') || 'Unnamed'}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {[p.dob && `DOB ${p.dob}`, p.insuranceProvider, `${p.documentCount} doc${p.documentCount === 1 ? '' : 's'}`]
                          .filter(Boolean).join(' · ')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {intake && (
            <div className="mt-4 flex items-center justify-between flex-wrap gap-3 border-t border-gray-100 pt-4">
              <div>
                <p className="text-lg font-bold text-navy-600">
                  {[d.lastName, d.firstName].filter(Boolean).join(', ') || 'Unnamed patient'}
                </p>
                <p className="text-sm text-gray-500">
                  {[d.age && `${d.age} y/o`, d.sex, d.dob && `DOB ${d.dob}`, d.insuranceProvider].filter(Boolean).join(' · ') || '—'}
                  {' · '}<span className="text-xs">{source === 'cabinet' ? 'from cabinet' : 'from this browser'}</span>
                </p>
              </div>
              {auth?.open && (
                <button onClick={saveToCabinet} disabled={busy === 'save'} className="btn-secondary text-sm disabled:opacity-50">
                  {busy === 'save' ? 'Saving…' : serverPatientId ? 'Update in cabinet' : 'Save to office cabinet'}
                </button>
              )}
            </div>
          )}

          {notice && <p className="text-xs text-green-700 mt-3">{notice}</p>}
          {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
        </div>

        {!intake ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <p className="text-gray-500 text-sm">Load a patient file to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ---------------- Left ---------------- */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-semibold text-navy-600 mb-3">1 · Select payer and procedure</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Payer</label>
                    <select value={payerId}
                      onChange={(e) => { setPayerId(e.target.value); setProcIndex(null); setFilter(''); }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="">Select payer...</option>
                      {payers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.scoring === 'none' ? ' — criteria not published' : ''}
                          {p.scoring === 'indicative' ? ' — indicative only' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Filter procedures {procedures.length > 0 && <span className="text-gray-400">({filtered.length}/{procedures.length})</span>}
                    </label>
                    <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)}
                      placeholder="e.g. lumbar fusion, spondylolisthesis" disabled={!payerId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>

                {payerId && (() => {
                  const p = payers.find((x) => x.id === payerId);
                  if (!p?.note) return null;
                  const tone = p.scoring === 'full'
                    ? 'text-gray-600 bg-gray-50'
                    : 'text-amber-800 bg-amber-50 border border-amber-200';
                  return (
                    <p className={`mt-3 text-xs rounded-lg px-3 py-2 ${tone}`}>
                      {p.scoring === 'indicative' && <strong>Indicative only — </strong>}
                      {p.note}
                    </p>
                  );
                })()}

                {payerId && (
                  <div className="mt-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {filtered.length === 0 && <p className="text-sm text-gray-500 p-3">No matching procedure blocks.</p>}
                    {filtered.map((p) => (
                      <button key={p.index} onClick={() => setProcIndex(p.index)}
                        className={`w-full text-left px-3 py-2.5 hover:bg-teal-50 transition-colors ${procIndex === p.index ? 'bg-teal-50 border-l-4 border-teal-500' : ''}`}>
                        <p className="text-sm font-medium text-gray-800">{p.procedure}</p>
                        <p className="text-xs text-gray-500">{p.indication}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{p.policyId} · {p.requirementCount} requirements</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {readiness && (
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                    <div>
                      <h3 className="font-semibold text-navy-600">2 · Readiness</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{readiness.procedure}</p>
                      <p className="text-xs text-gray-400">{readiness.indication}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl border ${s.bg} flex items-center gap-2`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                      <span className={`text-sm font-semibold ${s.text}`}>
                        {s.label}{readiness.percent != null ? ` · ${readiness.percent}%` : ''}
                      </span>
                    </div>
                  </div>

                  {readiness.policy && (
                    <p className="text-xs text-gray-500 mb-4 bg-gray-50 rounded-lg px-3 py-2">
                      Per <strong>{readiness.policy.policyId}</strong>
                      {readiness.policy.effectiveDate && ` · effective ${readiness.policy.effectiveDate}`}
                      {readiness.policy.sourceUrl && (
                        <> · <a href={readiness.policy.sourceUrl} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">source</a></>
                      )}
                    </p>
                  )}

                  <ReqGroup title="Missing" rows={readiness.missing} tone="red" showGaps />
                  <ReqGroup title="Partial — needs more detail" rows={readiness.partial} tone="amber" showGaps />
                  <ReqGroup title="Satisfied" rows={readiness.satisfied} tone="green" />
                  <ReqGroup title="Surgeon supplies at booking" rows={readiness.clinician} tone="navy" />
                  <ReqGroup title="Advisory (worded as a recommendation, not a gate)" rows={readiness.advisory} tone="gray" />

                  <p className="text-xs text-gray-400 mt-4 border-t border-gray-100 pt-3">
                    Documentation completeness only — not a coverage determination. {RULES_META.disclaimer}
                  </p>
                </div>
              )}
            </div>

            {/* ---------------- Right ---------------- */}
            <div className="space-y-5">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-semibold text-navy-600 mb-3">Documents</h3>
                <p className="text-xs text-gray-500 mb-3">{docs.length} on file</p>
                <div className="space-y-3">
                  {DOCUMENT_CATEGORIES.map((cat) => {
                    const list = docs.filter((x) => x.category === cat.id);
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${list.length ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm text-gray-700">{cat.label}</span>
                          <span className="text-xs text-gray-400 ml-auto">{list.length || '—'}</span>
                        </div>
                        {list.map((f) => (
                          <p key={f.id} className="text-xs text-gray-500 ml-4 truncate">
                            {source === 'cabinet' ? (
                              <a href={`/api/patients/${serverPatientId}/documents/${f.id}`} target="_blank" rel="noreferrer"
                                className="hover:underline text-teal-600">{f.name}</a>
                            ) : f.name} · {formatBytes(f.size)}
                          </p>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-semibold text-navy-600 mb-1">3 · Export packet</h3>
                <p className="text-xs text-gray-500 mb-4">
                  ZIP with each document in its subfolder, plus a combined PDF with chapter bookmarks and a cover sheet.
                </p>
                <button onClick={downloadPacket} disabled={busy === 'packet'} className="w-full btn-primary disabled:opacity-50">
                  {busy === 'packet' ? 'Building packet…' : 'Build & download packet'}
                </button>
                {!readiness && <p className="text-xs text-amber-700 mt-2">Select a payer and procedure to include the readiness checklist.</p>}
                {result && (
                  <div className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="font-medium">{result.filename}</p>
                    <p>{formatBytes(result.size)} · {result.chapters} chapters</p>
                    {result.skipped?.length > 0 && (
                      <p className="text-amber-700 mt-1">{result.skipped.length} file(s) not merged into the PDF (still in the ZIP folders).</p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-semibold text-navy-600 mb-3">Evidence summary</h3>
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {evidence && Object.entries(evidence)
                    .filter(([, v]) => v.status !== 'unknown')
                    .map(([id, v]) => (
                      <div key={id} className="flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          v.status === 'present' ? 'bg-green-500' : v.status === 'partial' ? 'bg-amber-500' : 'bg-gray-300'
                        }`} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-700">{EVIDENCE_LABELS[id] || id}</p>
                          <p className="text-[11px] text-gray-500 break-words">{v.summary}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const TONES = {
  red: 'text-red-700', amber: 'text-amber-700', green: 'text-green-700',
  navy: 'text-navy-600', gray: 'text-gray-500',
};

function ReqGroup({ title, rows, tone, showGaps }) {
  const [open, setOpen] = useState(tone === 'red' || tone === 'amber');
  if (!rows?.length) return null;
  return (
    <div className="mb-3">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 w-full text-left">
        <span className={`text-sm font-semibold ${TONES[tone]}`}>{title}</span>
        <span className="text-xs text-gray-400">({rows.length})</span>
        <svg className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul className="mt-2 space-y-2">
          {rows.map((r, i) => (
            <li key={`${r.evidenceId}-${i}`} className="border border-gray-100 rounded-lg p-3 bg-gray-50/60">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-800">{r.label}</span>
                {r.durationRequired && (
                  <span className="text-[11px] font-medium text-navy-600 bg-navy-50 px-1.5 py-0.5 rounded">{r.durationRequired}</span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">{r.requirement}</p>
              <p className="text-xs text-gray-500 mt-1"><em>On file:</em> {r.summary}</p>
              {showGaps && (r.gaps || []).map((g, j) => (
                <p key={j} className="text-xs text-amber-700 mt-1">→ {g}</p>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
