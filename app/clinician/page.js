'use client';

import { useState, useEffect } from 'react';
import { SYMPTOM_REGIONS } from '../../lib/constants';
import { ODI, NDI, MJOA, SRS22R } from '../../lib/questionnaires';

const STORAGE_KEY = 'spine-intake-data';

/**
 * Clinician-facing dashboard page.
 * Shows structured data, generated narrative, and raw patient responses.
 */
export default function ClinicianDashboard() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setData(JSON.parse(saved));
    } catch {}
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Intake Data Found</h2>
          <p className="text-gray-500">The patient has not submitted an intake form yet.</p>
          <a href="/" className="text-teal-500 hover:underline mt-4 inline-block">Go to Intake Form</a>
        </div>
      </div>
    );
  }

  const summary = data.generatedSummary;
  const d = data.demographics;
  const redFlags = data.redFlags || [];

  const copyNote = async () => {
    if (summary?.narrative) {
      await navigator.clipboard.writeText(summary.narrative);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-navy-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold">Clinician Dashboard</h1>
                <p className="text-sm text-white/60">Spine Surgery Pre-Visit Summary</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {data.submittedAt && (
                <span className="text-xs text-white/50">
                  Submitted {new Date(data.submittedAt).toLocaleDateString()} at{' '}
                  {new Date(data.submittedAt).toLocaleTimeString()}
                </span>
              )}
              <button onClick={copyNote} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
                {copied ? 'Copied!' : 'Copy Full Note'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Patient banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-6">
              <div>
                <h2 className="text-xl font-bold text-navy-600">
                  {d.lastName}, {d.firstName}
                </h2>
                <p className="text-sm text-gray-500">
                  {d.age && `${d.age} y/o`} {d.sex} · DOB: {d.dob} · {d.visitReason}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {redFlags.filter(f => f.severity === 'urgent').length > 0 && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {redFlags.filter(f => f.severity === 'urgent').length} Red Flag(s)
                </span>
              )}
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Intake Complete
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-0">
            {[
              { id: 'summary', label: 'Generated Note' },
              { id: 'structured', label: 'Structured Data' },
              { id: 'raw', label: 'Raw Responses' },
              { id: 'chat', label: 'AI Conversation' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-400 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'summary' && <SummaryTab summary={summary} onCopy={copyNote} copied={copied} />}
        {activeTab === 'structured' && <StructuredTab data={data} />}
        {activeTab === 'raw' && <RawTab data={data} />}
        {activeTab === 'chat' && <ChatTab data={data} />}
      </div>
    </div>
  );
}


// ===========================================================================
// TAB: Generated Note
// ===========================================================================
function SummaryTab({ summary, onCopy, copied }) {
  if (!summary?.narrative) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-500">No summary generated yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="font-semibold text-navy-600">Pre-Visit Clinic Note Draft</h3>
        <button onClick={onCopy} className="px-4 py-2 bg-teal-50 text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors">
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>
      <div className="p-6">
        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-serif leading-relaxed">
          {summary.narrative}
        </pre>
      </div>
      <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <p className="text-xs text-gray-500">
          Generated {summary.generatedAt ? new Date(summary.generatedAt).toLocaleString() : ''}.
          This is an AI-generated draft based on patient-reported data.
          It should be reviewed and edited by the treating physician before inclusion in the medical record.
        </p>
      </div>
    </div>
  );
}


// ===========================================================================
// TAB: Structured Data
// ===========================================================================
function StructuredTab({ data }) {
  const redFlags = data.redFlags || [];

  return (
    <div className="space-y-6">
      {/* Red Flags */}
      {redFlags.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-red-600 mb-3">Red Flags Identified</h3>
          <div className="space-y-2">
            {redFlags.map((flag) => (
              <div key={flag.id} className={`p-3 rounded-lg ${
                flag.severity === 'urgent' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
              }`}>
                <p className={`text-sm font-medium ${flag.severity === 'urgent' ? 'text-red-700' : 'text-amber-700'}`}>
                  {flag.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chief Complaint */}
      <DataSection title="Chief Complaint">
        <DataRow label="Main Reason" value={data.chiefComplaint.mainReason} />
        <DataRow label="Duration" value={data.chiefComplaint.duration} />
        <DataRow label="Symptom Regions" value={data.chiefComplaint.symptomRegions.map(id =>
          SYMPTOM_REGIONS.find(r => r.id === id)?.label).filter(Boolean).join(', ')} />
        <DataRow label="Primary Concern" value={data.chiefComplaint.primaryConcern} />
        <DataRow label="Prior Spine Surgery" value={data.chiefComplaint.hasPriorSpineSurgery ? 'Yes' : 'No'} />
      </DataSection>

      {/* Symptoms by region */}
      {Object.entries(data.hpiData?.symptoms || {}).map(([region, symptoms]) => (
        <DataSection key={region} title={`Symptoms: ${SYMPTOM_REGIONS.find(r => r.id === region)?.label || region}`}>
          {Object.entries(symptoms).map(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return null;
            const displayValue = Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
            return <DataRow key={key} label={formatLabel(key)} value={String(displayValue)} />;
          })}
        </DataSection>
      ))}

      {/* Treatment History */}
      <DataSection title="Conservative Treatment History">
        <DataRow label="Physical Therapy" value={
          data.hpiData?.conservativeTreatments?.physicalTherapy?.tried ? `Yes — ${data.hpiData.conservativeTreatments.physicalTherapy.helped || 'unknown response'}` : 'No'
        } />
        <DataRow label="Chiropractic" value={
          data.hpiData?.conservativeTreatments?.chiropracticCare?.tried ? `Yes — ${data.hpiData.conservativeTreatments.chiropracticCare.helped || 'unknown response'}` : 'No'
        } />
        <DataRow label="Acupuncture" value={
          data.hpiData?.conservativeTreatments?.acupuncture?.tried ? 'Yes' : 'No'
        } />
        <DataRow label="Bracing" value={
          data.hpiData?.conservativeTreatments?.braces?.tried ? 'Yes' : 'No'
        } />
        <DataRow label="Prior Imaging" value={
          (data.hpiData?.conservativeTreatments?.priorImaging || []).join(', ') || 'None'
        } />
        <DataRow label="EMG/NCS" value={
          data.hpiData?.conservativeTreatments?.priorEMG?.done ? `Yes — ${data.hpiData.conservativeTreatments.priorEMG.results || 'results unknown'}` : 'No'
        } />
        {(data.hpiData?.conservativeTreatments?.injections || []).length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-gray-500 mb-1">Injections:</p>
            {data.hpiData.conservativeTreatments.injections.map((inj, i) => (
              <p key={i} className="text-sm text-gray-700 ml-4">
                {inj.type} {inj.when && `(${inj.when})`} — {inj.helped || 'response unknown'}{inj.count && `, ${inj.count}x`}
              </p>
            ))}
          </div>
        )}
      </DataSection>

      {/* PMH */}
      <DataSection title="Past Medical History">
        {(data.pastMedicalHistory.conditions || []).map((c, i) => (
          <DataRow key={i} label={c.name} value={[c.yearDiagnosed, c.details].filter(Boolean).join(' — ') || '—'} />
        ))}
        {(data.pastMedicalHistory.conditions || []).length === 0 && <p className="text-sm text-gray-500">None reported</p>}
        {(data.pastMedicalHistory.implantedDevices || []).length > 0 && (
          <DataRow label="Implanted Devices" value={data.pastMedicalHistory.implantedDevices.join(', ')} />
        )}
      </DataSection>

      {/* PSH */}
      <DataSection title="Past Surgical History">
        {(data.pastSurgicalHistory.surgeries || []).map((s, i) => (
          <DataRow key={i} label={s.type} value={[s.date, s.bodyRegion, s.helped].filter(Boolean).join(' · ')} />
        ))}
        {(data.pastSurgicalHistory.surgeries || []).length === 0 && <p className="text-sm text-gray-500">None reported</p>}
      </DataSection>

      {/* Medications */}
      <DataSection title="Medications">
        {data.medications.noMedications ? (
          <p className="text-sm text-gray-500">No medications</p>
        ) : (
          (data.medications.current || []).map((m, i) => (
            <DataRow key={i}
              label={`${m.name}${m.isAnticoagulant ? ' ⚠️' : ''}`}
              value={[m.dose, m.frequency, m.reason].filter(Boolean).join(' · ')}
            />
          ))
        )}
      </DataSection>

      {/* Allergies */}
      <DataSection title="Allergies">
        {data.allergies.nkda ? (
          <p className="text-sm text-gray-700 font-medium">NKDA</p>
        ) : (
          (data.allergies.entries || []).map((a, i) => (
            <DataRow key={i} label={a.allergen} value={`${a.type} — ${a.reaction || 'reaction not specified'} (${a.severity || 'severity unknown'})`} />
          ))
        )}
      </DataSection>

      {/* Social History */}
      <DataSection title="Social History">
        <DataRow label="Tobacco" value={data.socialHistory.tobaccoUse || '—'} />
        <DataRow label="Alcohol" value={data.socialHistory.alcoholUse || '—'} />
        <DataRow label="Drugs" value={data.socialHistory.drugUse || '—'} />
        <DataRow label="Occupation" value={data.socialHistory.occupation || '—'} />
        <DataRow label="Work Status" value={data.socialHistory.workStatus || '—'} />
        <DataRow label="Living Situation" value={data.socialHistory.livingSituation || '—'} />
        <DataRow label="Mobility Aids" value={data.socialHistory.mobilityAids || '—'} />
        <DataRow label="Exercise Level" value={data.socialHistory.exerciseLevel || '—'} />
        <DataRow label="Compensation/Legal" value={data.socialHistory.compensationCase || '—'} />
      </DataSection>

      {/* Family History */}
      <DataSection title="Family History">
        {data.familyHistory.noRelevantHistory ? (
          <p className="text-sm text-gray-500">No relevant family history</p>
        ) : (
          (data.familyHistory.entries || []).map((e, i) => (
            <DataRow key={i} label={e.relation} value={e.condition} />
          ))
        )}
      </DataSection>

      {/* ROS */}
      <DataSection title="Review of Systems">
        {Object.entries(data.reviewOfSystems || {}).map(([section, questions]) => {
          if (section === 'additionalNotes' || typeof questions !== 'object') return null;
          const positives = Object.entries(questions).filter(([, v]) => v === 'yes');
          if (positives.length === 0) return null;
          return positives.map(([q]) => (
            <DataRow key={`${section}-${q}`} label={formatLabel(q)} value="POSITIVE" className="text-amber-600 font-medium" />
          ));
        })}
      </DataSection>

      {/* PROMs */}
      {data.proms && Object.keys(data.proms).length > 0 && (
        <PromsSection proms={data.proms} />
      )}
    </div>
  );
}


// ===========================================================================
// TAB: Raw Responses
// ===========================================================================
function RawTab({ data }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold text-navy-600 mb-4">Raw Patient Data</h3>
      <pre className="text-xs text-gray-700 bg-gray-50 p-4 rounded-lg overflow-x-auto max-h-[600px] overflow-y-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}


// ===========================================================================
// TAB: AI Conversation
// ===========================================================================
function ChatTab({ data }) {
  const messages = data.hpiData?.conversationHistory || [];

  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-500">No AI conversation history available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-navy-600">AI Interview Transcript</h3>
        <p className="text-sm text-gray-500">{messages.length} messages</p>
      </div>
      <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
              msg.role === 'user'
                ? 'bg-navy-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}>
              <p className="text-xs font-medium mb-1 opacity-60">
                {msg.role === 'user' ? 'Patient' : 'AI Assistant'}
              </p>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ===========================================================================
// HELPER COMPONENTS
// ===========================================================================
function DataSection({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold text-navy-600 mb-3 pb-2 border-b border-gray-100">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function DataRow({ label, value, className = '' }) {
  if (!value || value === '—') return null;
  return (
    <div className="flex items-start gap-3 py-1">
      <span className="text-xs text-gray-500 w-40 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-gray-700 ${className}`}>{value}</span>
    </div>
  );
}

function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}


const PROM_LABELS = { odi: 'ODI', ndi: 'NDI', mjoa: 'mJOA', srs22r: 'SRS-22r' };
const PROM_FULL_NAMES = {
  odi: 'Oswestry Disability Index',
  ndi: 'Neck Disability Index',
  mjoa: 'Modified Japanese Orthopedic Association',
  srs22r: 'Scoliosis Research Society-22r',
};

function PromsSection({ proms }) {
  return (
    <DataSection title="Patient-Reported Outcome Measures (PROMs)">
      {Object.entries(proms).map(([id, entry]) => {
        const name = PROM_LABELS[id] || id;
        const fullName = PROM_FULL_NAMES[id] || '';
        if (!entry.score) {
          return <DataRow key={id} label={name} value="Not completed" />;
        }
        if (id === 'odi' || id === 'ndi') {
          return (
            <div key={id} className="py-2">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm font-semibold text-navy-600">{name}</span>
                <span className="text-xs text-gray-400">{fullName}</span>
              </div>
              <div className="flex items-center gap-4 ml-4">
                <span className="text-lg font-bold text-navy-600">{entry.score.percentage}%</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScoreBadge(entry.score.interpretation)}`}>
                  {entry.score.interpretation}
                </span>
                <span className="text-xs text-gray-400">({entry.score.sectionsAnswered} sections answered)</span>
              </div>
            </div>
          );
        }
        if (id === 'mjoa') {
          return (
            <div key={id} className="py-2">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm font-semibold text-navy-600">{name}</span>
                <span className="text-xs text-gray-400">{fullName}</span>
              </div>
              <div className="flex items-center gap-4 ml-4">
                <span className="text-lg font-bold text-navy-600">{entry.score.totalScore}/{entry.score.maxScore}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScoreBadge(entry.score.interpretation)}`}>
                  {entry.score.interpretation}
                </span>
              </div>
            </div>
          );
        }
        if (id === 'srs22r') {
          return (
            <div key={id} className="py-2">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm font-semibold text-navy-600">{name}</span>
                <span className="text-xs text-gray-400">{fullName}</span>
              </div>
              <div className="ml-4">
                {entry.score.totalScore && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-navy-600">{entry.score.totalScore}</span>
                    <span className="text-xs text-gray-400">/ 5.0 overall mean</span>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  {Object.values(entry.score.domainScores || {}).map((d) => (
                    <span key={d.name} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                      {d.name}: <strong>{d.score}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        return <DataRow key={id} label={name} value="Completed" />;
      })}
    </DataSection>
  );
}

function getScoreBadge(interpretation) {
  if (interpretation?.includes('Minimal') || interpretation?.includes('No ')) return 'bg-green-100 text-green-700';
  if (interpretation?.includes('Mild')) return 'bg-yellow-100 text-yellow-700';
  if (interpretation?.includes('Moderate')) return 'bg-orange-100 text-orange-700';
  if (interpretation?.includes('Severe') || interpretation?.includes('Crippled')) return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
}
