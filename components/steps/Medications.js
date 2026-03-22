'use client';

import { useState, useMemo } from 'react';
import { useIntake } from '../../lib/store';
import { COMMON_MEDICATIONS, ANTICOAGULANTS } from '../../lib/constants';
import StepNavigation from '../ui/StepNavigation';

export default function Medications({ onNext, onBack }) {
  const { data, setSection } = useIntake();
  const meds = data.medications;
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', dose: '', frequency: '', reason: '', status: 'current' });

  const isAnticoagulant = (name) => {
    const lower = name.toLowerCase();
    return ANTICOAGULANTS.some((ac) => lower.includes(ac));
  };

  const suggestions = useMemo(() => {
    if (search.length < 2) return [];
    const lower = search.toLowerCase();
    return COMMON_MEDICATIONS.filter((m) => m.toLowerCase().includes(lower)).slice(0, 8);
  }, [search]);

  const addMedication = (medName) => {
    if (!medName) return;
    const med = {
      name: medName,
      dose: form.dose,
      frequency: form.frequency,
      reason: form.reason,
      status: form.status,
      isAnticoagulant: isAnticoagulant(medName),
    };
    const current = meds.current || [];
    setSection('medications', {
      ...meds,
      current: [...current, med],
      noMedications: false,
    });
    setForm({ name: '', dose: '', frequency: '', reason: '', status: 'current' });
    setSearch('');
    setShowForm(false);
  };

  const removeMedication = (index) => {
    const current = [...(meds.current || [])];
    current.splice(index, 1);
    setSection('medications', { ...meds, current });
  };

  const toggleNoMeds = () => {
    setSection('medications', {
      ...meds,
      noMedications: !meds.noMedications,
      current: meds.noMedications ? meds.current : [],
    });
  };

  const anticoagMeds = (meds.current || []).filter((m) => m.isAnticoagulant);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">Medications</h2>
        <p className="section-subtitle">
          List all medications you currently take, including over-the-counter medications and supplements.
        </p>
      </div>

      <div className="space-y-6">
        {/* Anticoagulant warning */}
        {anticoagMeds.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">Blood Thinner / Antiplatelet Detected</p>
                <p className="text-sm text-amber-700 mt-1">
                  You've listed: {anticoagMeds.map(m => m.name).join(', ')}.
                  Your surgeon will need to discuss timing of these medications before any procedure.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No medications toggle */}
        <div className="card">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={meds.noMedications || false}
              onChange={toggleNoMeds}
            />
            <span className="text-base font-medium text-gray-700">
              I don't take any medications
            </span>
          </label>
        </div>

        {!meds.noMedications && (
          <>
            {/* Current medications list */}
            {(meds.current || []).length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-navy-600 mb-3">
                  Your Medications ({(meds.current || []).length})
                </h3>
                <div className="space-y-2">
                  {(meds.current || []).map((med, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${
                      med.isAnticoagulant ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                    }`}>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {med.name}
                          {med.isAnticoagulant && (
                            <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                              Blood thinner
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {[med.dose, med.frequency, med.reason].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <button onClick={() => removeMedication(i)} className="text-gray-400 hover:text-red-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add medication */}
            {showForm ? (
              <div className="card border-2 border-teal-200">
                <h3 className="text-lg font-medium text-navy-600 mb-4">Add Medication</h3>
                <div className="space-y-4">
                  <div className="relative">
                    <label className="form-label">Medication name *</label>
                    <input
                      type="text"
                      value={search || form.name}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setForm(prev => ({ ...prev, name: e.target.value }));
                      }}
                      placeholder="Start typing medication name..."
                      autoFocus
                    />
                    {suggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setForm(prev => ({ ...prev, name: s }));
                              setSearch('');
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">Dose (if known)</label>
                      <input
                        type="text"
                        value={form.dose}
                        onChange={(e) => setForm(prev => ({ ...prev, dose: e.target.value }))}
                        placeholder="e.g., 500mg"
                      />
                    </div>
                    <div>
                      <label className="form-label">Frequency</label>
                      <select value={form.frequency} onChange={(e) => setForm(prev => ({ ...prev, frequency: e.target.value }))}>
                        <option value="">Select...</option>
                        <option value="Once daily">Once daily</option>
                        <option value="Twice daily">Twice daily</option>
                        <option value="Three times daily">Three times daily</option>
                        <option value="As needed">As needed</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Reason (if known)</label>
                      <input
                        type="text"
                        value={form.reason}
                        onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="e.g., Back pain"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => addMedication(form.name)}
                      disabled={!form.name}
                      className="btn-primary"
                    >
                      Add Medication
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setForm({ name: '', dose: '', frequency: '', reason: '', status: 'current' });
                        setSearch('');
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
                <p className="text-gray-500 font-medium">Add a Medication</p>
                <p className="text-xs text-gray-400 mt-1">Don't worry about exact doses — do your best</p>
              </button>
            )}
          </>
        )}
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={true}
        nextLabel="Continue to Allergies"
        showSkip={true}
      />
    </div>
  );
}
