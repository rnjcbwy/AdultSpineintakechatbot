'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import { FAMILY_CONDITIONS, FAMILY_RELATIONS } from '../../lib/constants';
import StepNavigation from '../ui/StepNavigation';

export default function FamilyHistory({ onNext, onBack }) {
  const { data, setSection } = useIntake();
  const fh = data.familyHistory;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ relation: '', condition: '', details: '' });

  const addEntry = () => {
    if (!form.relation || !form.condition) return;
    const entries = [...(fh.entries || []), { ...form }];
    setSection('familyHistory', { ...fh, entries, noRelevantHistory: false });
    setForm({ relation: '', condition: '', details: '' });
    setShowForm(false);
  };

  const removeEntry = (index) => {
    const entries = (fh.entries || []).filter((_, i) => i !== index);
    setSection('familyHistory', { ...fh, entries });
  };

  const toggleNoHistory = () => {
    setSection('familyHistory', {
      ...fh,
      noRelevantHistory: !fh.noRelevantHistory,
      entries: fh.noRelevantHistory ? fh.entries : [],
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">Family History</h2>
        <p className="section-subtitle">
          Do any close family members have conditions that might be relevant to your spine care?
          This is especially helpful for conditions like osteoporosis, scoliosis, or bleeding disorders.
        </p>
      </div>

      <div className="space-y-6">
        {/* No relevant history */}
        <div className="card">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={fh.noRelevantHistory || false}
              onChange={toggleNoHistory}
            />
            <span className="text-base font-medium text-gray-700">
              No relevant family history to report
            </span>
          </label>
        </div>

        {!fh.noRelevantHistory && (
          <>
            {/* Family history entries */}
            {(fh.entries || []).length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-navy-600 mb-3">
                  Family History ({(fh.entries || []).length})
                </h3>
                <div className="space-y-2">
                  {(fh.entries || []).map((entry, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {entry.relation}: {entry.condition}
                        </p>
                        {entry.details && (
                          <p className="text-xs text-gray-500 mt-0.5">{entry.details}</p>
                        )}
                      </div>
                      <button onClick={() => removeEntry(i)} className="text-gray-400 hover:text-red-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add entry form */}
            {showForm ? (
              <div className="card border-2 border-teal-200">
                <h3 className="text-lg font-medium text-navy-600 mb-4">Add Family History</h3>
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Family member *</label>
                    <div className="flex flex-wrap gap-2">
                      {FAMILY_RELATIONS.map((rel) => (
                        <button
                          key={rel}
                          onClick={() => setForm(prev => ({ ...prev, relation: rel }))}
                          className={`chip ${form.relation === rel ? 'chip-selected' : 'chip-unselected'}`}
                        >
                          {rel}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Condition *</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {FAMILY_CONDITIONS.map((cond) => (
                        <button
                          key={cond}
                          onClick={() => setForm(prev => ({ ...prev, condition: cond }))}
                          className={`chip ${form.condition === cond ? 'chip-selected' : 'chip-unselected'}`}
                        >
                          {cond}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={form.condition}
                      onChange={(e) => setForm(prev => ({ ...prev, condition: e.target.value }))}
                      placeholder="Or type a condition..."
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <label className="form-label">Details (optional)</label>
                    <input
                      type="text"
                      value={form.details}
                      onChange={(e) => setForm(prev => ({ ...prev, details: e.target.value }))}
                      placeholder="Any additional details"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={addEntry} disabled={!form.relation || !form.condition} className="btn-primary">
                      Add Entry
                    </button>
                    <button onClick={() => { setShowForm(false); setForm({ relation: '', condition: '', details: '' }); }} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="card card-hover w-full text-center py-8 border-dashed border-2 border-gray-300"
              >
                <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-gray-500 font-medium">Add Family History</p>
              </button>
            )}
          </>
        )}
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={true}
        nextLabel="Continue to Review of Systems"
        showSkip={true}
      />
    </div>
  );
}
