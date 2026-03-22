'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import { INTAKE_STEPS, SYMPTOM_REGIONS } from '../../lib/constants';
import { detectRedFlags } from '../../lib/redFlags';

export default function FinalReview({ onBack, onGoToStep }) {
  const { data, setSubmitted, setSummary, setRedFlags } = useIntake();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitted, setIsSubmittedLocal] = useState(!!data.submittedAt);
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setIsGenerating(true);
    setError('');

    try {
      // Detect red flags
      const flags = detectRedFlags(data);
      setRedFlags(flags);

      // Generate clinical summary
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeData: data }),
      });

      const result = await res.json();

      if (result.error) {
        setError(result.error);
      } else {
        setSummary({
          narrative: result.summary,
          generatedAt: new Date().toISOString(),
          redFlags: flags,
        });
        setSubmitted();
        setIsSubmittedLocal(true);
      }
    } catch (err) {
      setError('Failed to generate summary. Your data has been saved. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Red flags detected
  const currentFlags = detectRedFlags(data);

  if (isSubmitted && data.generatedSummary) {
    return <SubmittedView data={data} />;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">Review & Submit</h2>
        <p className="section-subtitle">
          Please review your information below. You can go back to any section to make changes.
          When everything looks correct, submit your intake form.
        </p>
      </div>

      {/* Red flag alerts */}
      {currentFlags.length > 0 && (
        <div className="mb-6 space-y-3">
          {currentFlags.filter(f => f.severity === 'urgent').map((flag) => (
            <div key={flag.id} className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">{flag.label}</p>
                  <p className="text-sm text-red-700 mt-1">{flag.patientMessage}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section summaries */}
      <div className="space-y-4">
        {/* Demographics */}
        <ReviewCard
          title="Patient Information"
          step={1}
          onEdit={() => onGoToStep(1)}
          items={[
            { label: 'Name', value: `${data.demographics.firstName} ${data.demographics.lastName}` },
            { label: 'DOB', value: data.demographics.dob },
            { label: 'Sex', value: data.demographics.sex },
            { label: 'Phone', value: data.demographics.phone },
            { label: 'Visit reason', value: data.demographics.visitReason },
          ]}
        />

        {/* Chief Complaint */}
        <ReviewCard
          title="Chief Complaint"
          step={2}
          onEdit={() => onGoToStep(2)}
          items={[
            { label: 'Main concern', value: data.chiefComplaint.mainReason },
            { label: 'Duration', value: data.chiefComplaint.duration },
            { label: 'Symptom areas', value: data.chiefComplaint.symptomRegions.map(id =>
              SYMPTOM_REGIONS.find(r => r.id === id)?.label).filter(Boolean).join(', ')
            },
          ]}
        />

        {/* HPI Summary */}
        <ReviewCard
          title="Symptom Details & Treatment History"
          step={3}
          onEdit={() => onGoToStep(3)}
          items={[
            { label: 'Symptom regions documented', value: Object.keys(data.hpiData.symptoms || {}).length.toString() },
            { label: 'AI conversation messages', value: (data.hpiData.conversationHistory || []).length.toString() },
            { label: 'Injections recorded', value: (data.hpiData.conservativeTreatments?.injections || []).length.toString() },
          ]}
        />

        {/* PMH */}
        <ReviewCard
          title="Past Medical History"
          step={4}
          onEdit={() => onGoToStep(4)}
          items={[
            { label: 'Conditions', value: (data.pastMedicalHistory.conditions || []).map(c => c.name).join(', ') || 'None listed' },
            { label: 'Implanted devices', value: (data.pastMedicalHistory.implantedDevices || []).join(', ') || 'None' },
          ]}
        />

        {/* PSH */}
        <ReviewCard
          title="Past Surgical History"
          step={5}
          onEdit={() => onGoToStep(5)}
          items={[
            { label: 'Surgeries', value: (data.pastSurgicalHistory.surgeries || []).map(s => s.type).join(', ') || 'None listed' },
          ]}
        />

        {/* Medications */}
        <ReviewCard
          title="Medications"
          step={6}
          onEdit={() => onGoToStep(6)}
          items={[
            {
              label: 'Current medications',
              value: data.medications.noMedications
                ? 'No medications'
                : (data.medications.current || []).map(m => m.name).join(', ') || 'None listed',
            },
          ]}
        />

        {/* Allergies */}
        <ReviewCard
          title="Allergies"
          step={7}
          onEdit={() => onGoToStep(7)}
          items={[
            {
              label: 'Allergies',
              value: data.allergies.nkda
                ? 'No Known Drug Allergies (NKDA)'
                : (data.allergies.entries || []).map(a => a.allergen).join(', ') || 'None listed',
            },
          ]}
        />

        {/* Social History */}
        <ReviewCard
          title="Social History"
          step={8}
          onEdit={() => onGoToStep(8)}
          items={[
            { label: 'Tobacco', value: data.socialHistory.tobaccoUse || 'Not specified' },
            { label: 'Occupation', value: data.socialHistory.occupation || 'Not specified' },
            { label: 'Work status', value: data.socialHistory.workStatus || 'Not specified' },
          ]}
        />

        {/* Family History */}
        <ReviewCard
          title="Family History"
          step={9}
          onEdit={() => onGoToStep(9)}
          items={[
            {
              label: 'Family history',
              value: data.familyHistory.noRelevantHistory
                ? 'No relevant history'
                : (data.familyHistory.entries || []).map(e => `${e.relation}: ${e.condition}`).join(', ') || 'None listed',
            },
          ]}
        />

        {/* ROS */}
        <ReviewCard
          title="Review of Systems"
          step={10}
          onEdit={() => onGoToStep(10)}
          items={[
            { label: 'Completed', value: 'Yes' },
          ]}
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <p className="text-sm text-gray-600">
          By submitting this form, you confirm that the information provided is accurate to the best
          of your knowledge. This intake form is for information gathering only and does not constitute
          medical advice or replace a direct medical evaluation. Your surgeon will review this information
          and may ask additional questions during your visit.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit button */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-gray-100 gap-4">
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isGenerating}
          className="btn-teal text-lg px-10 py-4 flex items-center gap-3"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating Summary...
            </>
          ) : (
            'Submit Intake Form'
          )}
        </button>
      </div>
    </div>
  );
}


function ReviewCard({ title, step, onEdit, items }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-navy-600">{title}</h3>
        <button onClick={onEdit} className="text-sm text-teal-500 hover:text-teal-600 font-medium">
          Edit
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-xs text-gray-400 w-36 flex-shrink-0 pt-0.5">{item.label}:</span>
            <span className="text-sm text-gray-700">{item.value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


function SubmittedView({ data }) {
  const [copied, setCopied] = useState(false);
  const summary = data.generatedSummary;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary.narrative);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = summary.narrative;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto text-center">
      <div className="mb-8">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-navy-600 mb-2">Thank You!</h2>
        <p className="text-gray-500">
          Your intake form has been submitted successfully. Your surgeon's team will review
          your information before your visit.
        </p>
        {data.submittedAt && (
          <p className="text-xs text-gray-400 mt-2">
            Submitted at {new Date(data.submittedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Red flags summary for patient */}
      {(summary.redFlags || []).filter(f => f.severity === 'urgent').length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 text-left">
          <p className="text-sm font-medium text-amber-800 mb-2">Important Reminders</p>
          {summary.redFlags.filter(f => f.severity === 'urgent').map((flag) => (
            <p key={flag.id} className="text-sm text-amber-700 mt-1">{flag.patientMessage}</p>
          ))}
        </div>
      )}

      {/* Generated summary preview */}
      <div className="card text-left mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-navy-600">Clinical Summary (Preview)</h3>
          <button
            onClick={copyToClipboard}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Note
              </>
            )}
          </button>
        </div>
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed bg-gray-50 p-4 rounded-xl">
            {summary.narrative}
          </pre>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <a
          href="/clinician"
          target="_blank"
          className="btn-primary flex items-center gap-2"
        >
          Open Clinician Dashboard
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      <p className="text-xs text-gray-400 mt-8">
        The clinician dashboard provides a full structured summary for your care team.
      </p>
    </div>
  );
}
