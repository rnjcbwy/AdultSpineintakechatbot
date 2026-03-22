'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';

export default function Allergies({ onNext, onBack }) {
  const { data, setSection } = useIntake();
  const allergies = data.allergies;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ allergen: '', reaction: '', severity: '', type: 'Medication' });

  const addAllergy = () => {
    if (!form.allergen) return;
    const entries = [...(allergies.entries || []), { ...form }];
    setSection('allergies', { ...allergies, entries, nkda: false });
    setForm({ allergen: '', reaction: '', severity: '', type: 'Medication' });
    setShowForm(false);
  };

  const removeAllergy = (index) => {
    const entries = (allergies.entries || []).filter((_, i) => i !== index);
    setSection('allergies', { ...allergies, entries });
  };

  const toggleNKDA = () => {
    setSection('allergies', {
      ...allergies,
      nkda: !allergies.nkda,
      entries: allergies.nkda ? allergies.entries : [],
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">Allergies</h2>
        <p className="section-subtitle">
          List any known allergies, including medications, foods, and environmental allergies.
        </p>
      </div>

      <div className="space-y-6">
        {/* NKDA toggle */}
        <div className="card">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allergies.nkda || false}
              onChange={toggleNKDA}
            />
            <div>
              <span className="text-base font-medium text-gray-700">No Known Drug Allergies (NKDA)</span>
              <p className="text-sm text-gray-400">Check this if you have no known allergies to medications</p>
            </div>
          </label>
        </div>

        {!allergies.nkda && (
          <>
            {/* Allergy list */}
            {(allergies.entries || []).length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-navy-600 mb-3">
                  Your Allergies ({(allergies.entries || []).length})
                </h3>
                <div className="space-y-2">
                  {(allergies.entries || []).map((allergy, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${
                      allergy.severity === 'Severe/Anaphylaxis'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-gray-50'
                    }`}>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {allergy.allergen}
                          <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            {allergy.type}
                          </span>
                          {allergy.severity === 'Severe/Anaphylaxis' && (
                            <span className="ml-1 text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                              Severe
                            </span>
                          )}
                        </p>
                        {allergy.reaction && (
                          <p className="text-xs text-gray-500 mt-0.5">Reaction: {allergy.reaction}</p>
                        )}
                      </div>
                      <button onClick={() => removeAllergy(i)} className="text-gray-400 hover:text-red-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add allergy form */}
            {showForm ? (
              <div className="card border-2 border-teal-200">
                <h3 className="text-lg font-medium text-navy-600 mb-4">Add Allergy</h3>
                <div className="space-y-4">
                  <div>
                    <label className="form-label">What are you allergic to? *</label>
                    <input
                      type="text"
                      value={form.allergen}
                      onChange={(e) => setForm(prev => ({ ...prev, allergen: e.target.value }))}
                      placeholder="e.g., Penicillin, Shellfish, Latex"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="form-label">Type of allergen</label>
                    <div className="flex flex-wrap gap-2">
                      {['Medication', 'Food', 'Environmental', 'Latex', 'Other'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setForm(prev => ({ ...prev, type: t }))}
                          className={`chip ${form.type === t ? 'chip-selected' : 'chip-unselected'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">What reaction do you have?</label>
                    <input
                      type="text"
                      value={form.reaction}
                      onChange={(e) => setForm(prev => ({ ...prev, reaction: e.target.value }))}
                      placeholder="e.g., Rash, Hives, Swelling, Difficulty breathing"
                    />
                  </div>

                  <div>
                    <label className="form-label">Severity</label>
                    <div className="flex flex-wrap gap-2">
                      {['Mild (rash, itching)', 'Moderate (significant symptoms)', 'Severe/Anaphylaxis', 'Intolerance (side effect, not true allergy)', 'Unknown'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setForm(prev => ({ ...prev, severity: s }))}
                          className={`chip ${form.severity === s ? 'chip-selected' : 'chip-unselected'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={addAllergy} disabled={!form.allergen} className="btn-primary">
                      Add Allergy
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setForm({ allergen: '', reaction: '', severity: '', type: 'Medication' });
                      }}
                      className="btn-secondary"
                    >
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
                <p className="text-gray-500 font-medium">Add an Allergy</p>
              </button>
            )}
          </>
        )}
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={true}
        nextLabel="Continue to Social History"
        showSkip={true}
      />
    </div>
  );
}
