'use client';

import { useIntake } from '../../lib/store';
import { SYMPTOM_REGIONS } from '../../lib/constants';
import StepNavigation from '../ui/StepNavigation';

export default function ChiefComplaint({ onNext, onBack }) {
  const { data, setField, setSection } = useIntake();
  const cc = data.chiefComplaint;

  const updateField = (field, value) => {
    setField('chiefComplaint', field, value);
  };

  const toggleRegion = (regionId) => {
    const current = cc.symptomRegions || [];
    const updated = current.includes(regionId)
      ? current.filter((r) => r !== regionId)
      : [...current, regionId];
    updateField('symptomRegions', updated);
  };

  const isValid = cc.mainReason && cc.symptomRegions.length > 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">What Brings You In Today?</h2>
        <p className="section-subtitle">
          Tell us about your main concern. This helps us focus on what matters most to you.
        </p>
      </div>

      <div className="space-y-6">
        {/* Main reason */}
        <div className="card">
          <label className="form-label text-base">
            In your own words, what is the main reason for your visit? *
          </label>
          <p className="text-sm text-gray-400 mb-3">
            For example: "My low back hurts and the pain goes down my left leg" or
            "I was told I have a curved spine"
          </p>
          <textarea
            value={cc.mainReason}
            onChange={(e) => updateField('mainReason', e.target.value)}
            placeholder="Describe your main concern..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 resize-none"
          />
        </div>

        {/* Duration */}
        <div className="card">
          <label className="form-label text-base">
            How long have you been experiencing these symptoms?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {[
              'Less than 1 week',
              '1-4 weeks',
              '1-3 months',
              '3-6 months',
              '6-12 months',
              'More than 1 year',
              'More than 2 years',
              'More than 5 years',
              "I'm not sure",
            ].map((option) => (
              <button
                key={option}
                onClick={() => updateField('duration', option)}
                className={`p-3 rounded-xl border text-sm text-left transition-all ${
                  cc.duration === option
                    ? 'border-teal-400 bg-teal-50 text-teal-700 font-medium'
                    : 'border-gray-200 hover:border-teal-200 hover:bg-teal-50/30 text-gray-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Symptom regions */}
        <div className="card">
          <label className="form-label text-base">
            Which areas are affected? Select all that apply. *
          </label>
          <p className="text-sm text-gray-400 mb-4">
            Choose every area where you have pain, numbness, tingling, weakness, or other symptoms.
          </p>

          {/* Visual body region groups */}
          <div className="space-y-4">
            {/* Spine regions */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Spine & Back</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SYMPTOM_REGIONS.filter(r => ['neck', 'upper-back', 'low-back'].includes(r.id)).map((region) => (
                  <RegionButton
                    key={region.id}
                    region={region}
                    selected={cc.symptomRegions.includes(region.id)}
                    onClick={() => toggleRegion(region.id)}
                  />
                ))}
              </div>
            </div>

            {/* Arm/Leg regions */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Arms & Legs</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SYMPTOM_REGIONS.filter(r => ['right-arm', 'left-arm', 'right-leg', 'left-leg'].includes(r.id)).map((region) => (
                  <RegionButton
                    key={region.id}
                    region={region}
                    selected={cc.symptomRegions.includes(region.id)}
                    onClick={() => toggleRegion(region.id)}
                  />
                ))}
              </div>
            </div>

            {/* Neurologic symptoms */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Other Symptoms</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SYMPTOM_REGIONS.filter(r =>
                  ['numbness-tingling', 'weakness', 'balance', 'hand-clumsiness', 'walking-difficulty',
                   'posture-deformity', 'prior-surgery-pain', 'trauma'].includes(r.id)
                ).map((region) => (
                  <RegionButton
                    key={region.id}
                    region={region}
                    selected={cc.symptomRegions.includes(region.id)}
                    onClick={() => toggleRegion(region.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {cc.symptomRegions.length > 0 && (
            <div className="mt-4 p-3 bg-teal-50 rounded-xl">
              <p className="text-sm text-teal-700">
                <strong>Selected:</strong> {cc.symptomRegions.map(id =>
                  SYMPTOM_REGIONS.find(r => r.id === id)?.label
                ).filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Prior spine surgery flag */}
        <div className="card">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={cc.hasPriorSpineSurgery}
              onChange={(e) => updateField('hasPriorSpineSurgery', e.target.checked)}
              className="mt-1"
            />
            <div>
              <span className="text-base font-medium text-gray-700">
                I have had prior spine surgery
              </span>
              <p className="text-sm text-gray-400 mt-1">
                We'll ask you more details about this later in the form.
              </p>
            </div>
          </label>
        </div>

        {/* Primary concern */}
        <div className="card">
          <label className="form-label text-base">
            What bothers you the most right now?
          </label>
          <p className="text-sm text-gray-400 mb-3">
            If you have multiple symptoms, which one impacts your daily life the most?
          </p>
          <textarea
            value={cc.primaryConcern}
            onChange={(e) => updateField('primaryConcern', e.target.value)}
            placeholder="e.g., The pain in my right leg makes it hard to walk more than a block..."
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 resize-none"
          />
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={isValid}
        nextLabel="Continue to Symptom Details"
      />
    </div>
  );
}


function RegionButton({ region, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`region-btn flex items-center gap-3 p-3 rounded-xl border text-left ${
        selected ? 'selected' : 'border-gray-200 text-gray-600'
      }`}
    >
      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
        selected ? 'border-teal-400 bg-teal-400' : 'border-gray-300'
      }`}>
        {selected && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-sm font-medium">{region.label}</span>
    </button>
  );
}
