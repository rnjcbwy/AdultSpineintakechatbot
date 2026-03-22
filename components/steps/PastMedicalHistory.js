'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import { COMMON_CONDITIONS, IMPLANTED_DEVICES } from '../../lib/constants';
import StepNavigation from '../ui/StepNavigation';

export default function PastMedicalHistory({ onNext, onBack }) {
  const { data, setSection } = useIntake();
  const pmh = data.pastMedicalHistory;
  const [searchTerm, setSearchTerm] = useState('');
  const [customCondition, setCustomCondition] = useState('');

  const toggleCondition = (condition) => {
    const current = pmh.conditions || [];
    const exists = current.find((c) => c.name === condition);
    if (exists) {
      setSection('pastMedicalHistory', {
        ...pmh,
        conditions: current.filter((c) => c.name !== condition),
      });
    } else {
      setSection('pastMedicalHistory', {
        ...pmh,
        conditions: [...current, { name: condition, details: '', yearDiagnosed: '' }],
      });
    }
  };

  const updateConditionDetail = (conditionName, field, value) => {
    const updated = (pmh.conditions || []).map((c) =>
      c.name === conditionName ? { ...c, [field]: value } : c
    );
    setSection('pastMedicalHistory', { ...pmh, conditions: updated });
  };

  const addCustomCondition = () => {
    if (customCondition.trim()) {
      const current = pmh.conditions || [];
      if (!current.find((c) => c.name === customCondition.trim())) {
        setSection('pastMedicalHistory', {
          ...pmh,
          conditions: [...current, { name: customCondition.trim(), details: '', yearDiagnosed: '' }],
        });
      }
      setCustomCondition('');
    }
  };

  const toggleDevice = (device) => {
    const current = pmh.implantedDevices || [];
    setSection('pastMedicalHistory', {
      ...pmh,
      implantedDevices: current.includes(device)
        ? current.filter((d) => d !== device)
        : [...current, device],
    });
  };

  const filteredConditions = searchTerm
    ? COMMON_CONDITIONS.filter((c) => c.toLowerCase().includes(searchTerm.toLowerCase()))
    : COMMON_CONDITIONS;

  const selectedConditions = pmh.conditions || [];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">Past Medical History</h2>
        <p className="section-subtitle">
          Select any medical conditions you have been diagnosed with. This helps your surgeon
          plan your care safely.
        </p>
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div className="card">
          <label className="form-label">Search conditions</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to search... e.g., diabetes, osteoporosis"
          />
        </div>

        {/* Condition checklist */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">Medical Conditions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
            {filteredConditions.map((condition) => {
              const isSelected = selectedConditions.some((c) => c.name === condition);
              return (
                <label
                  key={condition}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-teal-400 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-200 hover:bg-teal-50/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCondition(condition)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-teal-400 bg-teal-400' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">{condition}</span>
                </label>
              );
            })}
          </div>

          {/* Add custom condition */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomCondition()}
              placeholder="Add another condition not listed above..."
              className="flex-1"
            />
            <button onClick={addCustomCondition} disabled={!customCondition.trim()}
              className="btn-secondary text-sm whitespace-nowrap">
              + Add
            </button>
          </div>
        </div>

        {/* Selected conditions with details */}
        {selectedConditions.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-medium text-navy-600 mb-4">
              Your Selected Conditions ({selectedConditions.length})
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Optionally add details or year diagnosed. You can skip these if you're unsure.
            </p>
            <div className="space-y-3">
              {selectedConditions.map((condition) => (
                <div key={condition.name} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{condition.name}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <input
                        type="text"
                        value={condition.yearDiagnosed || ''}
                        onChange={(e) => updateConditionDetail(condition.name, 'yearDiagnosed', e.target.value)}
                        placeholder="Year diagnosed"
                        className="text-sm py-2"
                      />
                      <input
                        type="text"
                        value={condition.details || ''}
                        onChange={(e) => updateConditionDetail(condition.name, 'details', e.target.value)}
                        placeholder="Details (optional)"
                        className="text-sm py-2"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCondition(condition.name)}
                    className="text-gray-400 hover:text-red-500 mt-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Implanted devices */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-2">Implanted Devices</h3>
          <p className="text-sm text-gray-400 mb-4">
            Do you have any implanted medical devices? (Important for surgical planning and imaging)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {IMPLANTED_DEVICES.map((device) => {
              const isSelected = (pmh.implantedDevices || []).includes(device);
              return (
                <label
                  key={device}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleDevice(device)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-amber-400 bg-amber-400' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">{device}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Additional notes */}
        <div className="card">
          <label className="form-label">Anything else about your medical history?</label>
          <textarea
            value={pmh.additionalNotes || ''}
            onChange={(e) => setSection('pastMedicalHistory', { ...pmh, additionalNotes: e.target.value })}
            placeholder="Any other conditions or details you'd like to mention..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none"
          />
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={true}
        nextLabel="Continue to Surgical History"
        showSkip={true}
      />
    </div>
  );
}
