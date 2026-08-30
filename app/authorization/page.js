'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  extractEvidence, scoreReadiness, listPayers, listProcedures,
  EVIDENCE_LABELS, RULES_META,
} from '../../lib/authReadiness';
import { listDocuments, DOCUMENT_CATEGORIES, formatBytes } from '../../lib/documents';
import { buildPacket } from '../../lib/packet';

const STORAGE_KEY = 'spine-intake-data';

const STATUS_STYLES = {
  ready: { dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50 border-green-200', label: 'Authorization-ready' },
  partial: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'Missing detail' },
  not_ready: { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Not authorization-ready' },
  unknown: { dot: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', label: 'Not scorable' },
};

export default function AuthorizationWorkbench() {
  const [intake, setIntake] = useState(null);
  const [payerId, setPayerId] = useState('');
  const [procIndex, setProcIndex] = useState(null);
  const [filter, setFilter] = useState('');
  const [building, setBuilding] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Load the intake record plus any documents held in IndexedDB.
  useEffect(() => {
    (async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const parsed = JSON.parse(saved);
        parsed.documents = await listDocuments(parsed.sessionId);
        setIntake(parsed);
      } catch (e) {
        setError('Could not read the intake record.');
      }
    })();
  }, []);

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

  const download = async () => {
    setBuilding(true); setError(''); setResult(null);
    try {
      const { blob, filename, chapters, skipped } = await buildPacket({ intake, readiness });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setResult({ filename, size: blob.size, chapters: chapters.length, skipped });
    } catch (e) {
      setError(e?.message || 'Could not build the packet.');
    } finally {
      setBuilding(false);
    }
  };

  if (!intake) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No patient file loaded</h2>
          <p className="text-gray-500 text-sm mb-4">
            {error || 'This prototype reads the intake completed in this same browser. Complete an intake first.'}
          </p>
          <a href="/" className="text-teal-600 hover:underline text-sm">Go to the intake form</a>
        </div>
      </div>
    );
  }

  const d = intake.demographics || {};
  const docs = intake.documents || [];
  const s = STATUS_STYLES[readiness?.status || 'unknown'];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-navy-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-semibold">Authorization Workbench</h1>
            <p className="text-sm text-white/60">Pre-authorization packet assembly · prototype</p>
          </div>
          <div className="flex gap-3 text-sm">
            <a href="/clinician" className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg">Clinical summary</a>
            <a href="/" className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg">Intake</a>
          </div>
        </div>
      </header>

      {/* Patient banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <h2 className="text-xl font-bold text-navy-600">
            {[d.lastName, d.firstName].filter(Boolean).join(', ') || 'Unnamed patient'}
          </h2>
          <p className="text-sm text-gray-500">
            {[d.age && `${d.age} y/o`, d.sex, d.dob && `DOB ${d.dob}`, d.insuranceProvider].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---------------- Left: selection + readiness ---------------- */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-navy-600 mb-3">1 · Select payer and procedure</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payer</label>
                <select
                  value={payerId}
                  onChange={(e) => { setPayerId(e.target.value); setProcIndex(null); setFilter(''); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select payer...</option>
                  {payers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{!p.scorable ? ' — criteria not published' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Filter procedures {procedures.length > 0 && <span className="text-gray-400">({filtered.length}/{procedures.length})</span>}
                </label>
                <input
                  type="text" value={filter} onChange={(e) => setFilter(e.target.value)}
                  placeholder="e.g. lumbar fusion, spondylolisthesis"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={!payerId}
                />
              </div>
            </div>

            {payerId && (() => {
              const p = payers.find((x) => x.id === payerId);
              return p?.note ? (
                <p className={`mt-3 text-xs rounded-lg px-3 py-2 ${p.scorable ? 'text-gray-600 bg-gray-50' : 'text-amber-800 bg-amber-50 border border-amber-200'}`}>
                  {p.note}
                </p>
              ) : null;
            })()}

            {payerId && (
              <div className="mt-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {filtered.length === 0 && <p className="text-sm text-gray-500 p-3">No matching procedure blocks.</p>}
                {filtered.map((p) => (
                  <button
                    key={p.index}
                    onClick={() => setProcIndex(p.index)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-teal-50 transition-colors ${procIndex === p.index ? 'bg-teal-50 border-l-4 border-teal-500' : ''}`}
                  >
                    <p className="text-sm font-medium text-gray-800">{p.procedure}</p>
                    <p className="text-xs text-gray-500">{p.indication}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{p.policyId} · {p.requirementCount} requirements</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Readiness */}
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

        {/* ---------------- Right: documents + export ---------------- */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-navy-600 mb-3">Patient file</h3>
            <p className="text-xs text-gray-500 mb-3">{docs.length} document{docs.length === 1 ? '' : 's'} on this device</p>
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
                      <p key={f.id} className="text-xs text-gray-500 ml-4 truncate">{f.name} · {formatBytes(f.size)}</p>
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
            <button
              onClick={download}
              disabled={building}
              className="w-full btn-primary disabled:opacity-50"
            >
              {building ? 'Building packet…' : 'Build & download packet'}
            </button>
            {!readiness && (
              <p className="text-xs text-amber-700 mt-2">
                Select a payer and procedure first to include the readiness checklist.
              </p>
            )}
            {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
            {result && (
              <div className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="font-medium">{result.filename}</p>
                <p>{formatBytes(result.size)} · {result.chapters} chapters</p>
                {result.skipped?.length > 0 && (
                  <p className="text-amber-700 mt-1">
                    {result.skipped.length} file(s) not merged into the PDF (still in the ZIP folders).
                  </p>
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
