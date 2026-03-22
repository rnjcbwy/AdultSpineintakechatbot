'use client';

import { useIntake } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';

export default function SocialHistory({ onNext, onBack }) {
  const { data, setField } = useIntake();
  const sh = data.socialHistory;

  const update = (field, value) => setField('socialHistory', field, value);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">Social History</h2>
        <p className="section-subtitle">
          This information helps your surgeon understand your overall health and lifestyle.
          All responses are confidential.
        </p>
      </div>

      <div className="space-y-6">
        {/* Tobacco */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-3">Tobacco Use</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {['Never', 'Former smoker', 'Current smoker', 'Current vaping/e-cigarette', 'Smokeless tobacco'].map((opt) => (
              <button
                key={opt}
                onClick={() => update('tobaccoUse', opt)}
                className={`chip ${sh.tobaccoUse === opt ? 'chip-selected' : 'chip-unselected'}`}
              >
                {opt}
              </button>
            ))}
          </div>
          {(sh.tobaccoUse === 'Former smoker' || sh.tobaccoUse === 'Current smoker' || sh.tobaccoUse === 'Current vaping/e-cigarette') && (
            <input
              type="text"
              value={sh.tobaccoDetails || ''}
              onChange={(e) => update('tobaccoDetails', e.target.value)}
              placeholder={sh.tobaccoUse === 'Former smoker' ? 'How long did you smoke? When did you quit?' : 'How much and for how long?'}
            />
          )}
          {(sh.tobaccoUse === 'Current smoker' || sh.tobaccoUse === 'Current vaping/e-cigarette') && (
            <p className="text-xs text-amber-600 mt-2">
              Note: Tobacco use is an important factor in spine surgery healing and outcomes. Your surgeon may discuss this with you.
            </p>
          )}
        </div>

        {/* Alcohol */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-3">Alcohol Use</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {['None', 'Social/occasional', 'Moderate (a few per week)', 'Daily', 'Former heavy use'].map((opt) => (
              <button
                key={opt}
                onClick={() => update('alcoholUse', opt)}
                className={`chip ${sh.alcoholUse === opt ? 'chip-selected' : 'chip-unselected'}`}
              >
                {opt}
              </button>
            ))}
          </div>
          {sh.alcoholUse && sh.alcoholUse !== 'None' && (
            <input
              type="text"
              value={sh.alcoholDetails || ''}
              onChange={(e) => update('alcoholDetails', e.target.value)}
              placeholder="Any additional details (optional)"
            />
          )}
        </div>

        {/* Recreational drugs */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-3">Recreational Drug Use</h3>
          <p className="text-sm text-gray-400 mb-3">
            This is asked for your safety during medical care. Your responses are confidential.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {['None', 'Marijuana/cannabis', 'Other', 'Prefer not to answer'].map((opt) => (
              <button
                key={opt}
                onClick={() => update('drugUse', opt)}
                className={`chip ${sh.drugUse === opt ? 'chip-selected' : 'chip-unselected'}`}
              >
                {opt}
              </button>
            ))}
          </div>
          {(sh.drugUse === 'Marijuana/cannabis' || sh.drugUse === 'Other') && (
            <input
              type="text"
              value={sh.drugDetails || ''}
              onChange={(e) => update('drugDetails', e.target.value)}
              placeholder="Details (optional)"
            />
          )}
        </div>

        {/* Occupation & Work */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-3">Work & Occupation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Occupation</label>
              <input
                type="text"
                value={sh.occupation || ''}
                onChange={(e) => update('occupation', e.target.value)}
                placeholder="Your job or profession"
              />
            </div>
            <div>
              <label className="form-label">Current work status</label>
              <select value={sh.workStatus || ''} onChange={(e) => update('workStatus', e.target.value)}>
                <option value="">Select...</option>
                <option value="Working full-time">Working full-time</option>
                <option value="Working part-time">Working part-time</option>
                <option value="Working with restrictions">Working with restrictions</option>
                <option value="On medical leave">On medical leave</option>
                <option value="Not working due to symptoms">Not working due to symptoms</option>
                <option value="Retired">Retired</option>
                <option value="Disabled">Disabled</option>
                <option value="Student">Student</option>
                <option value="Homemaker">Homemaker</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="form-label">Disability status</label>
            <div className="flex flex-wrap gap-2">
              {['None', 'Applying for disability', 'On temporary disability', 'On permanent disability'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => update('disabilityStatus', opt)}
                  className={`chip ${sh.disabilityStatus === opt ? 'chip-selected' : 'chip-unselected'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Living Situation & Mobility */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-3">Living Situation & Mobility</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Living situation</label>
              <select value={sh.livingSituation || ''} onChange={(e) => update('livingSituation', e.target.value)}>
                <option value="">Select...</option>
                <option value="Live alone">Live alone</option>
                <option value="Live with spouse/partner">Live with spouse/partner</option>
                <option value="Live with family">Live with family</option>
                <option value="Live with roommate(s)">Live with roommate(s)</option>
                <option value="Assisted living facility">Assisted living facility</option>
                <option value="Nursing home">Nursing home</option>
              </select>
            </div>
            <div>
              <label className="form-label">Do you use any mobility aids?</label>
              <select value={sh.mobilityAids || ''} onChange={(e) => update('mobilityAids', e.target.value)}>
                <option value="">Select...</option>
                <option value="None">None</option>
                <option value="Cane">Cane</option>
                <option value="Walker">Walker</option>
                <option value="Wheelchair (sometimes)">Wheelchair (sometimes)</option>
                <option value="Wheelchair (always)">Wheelchair (always)</option>
                <option value="Motorized scooter">Motorized scooter</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exercise & Activity */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-3">Exercise & Activity</h3>
          <div className="space-y-4">
            <div>
              <label className="form-label">Current exercise level</label>
              <div className="flex flex-wrap gap-2">
                {['Sedentary', 'Light activity', 'Moderate exercise', 'Very active', 'Limited by symptoms'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => update('exerciseLevel', opt)}
                    className={`chip ${sh.exerciseLevel === opt ? 'chip-selected' : 'chip-unselected'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">Sports or hobbies affected by symptoms</label>
              <input
                type="text"
                value={sh.sports || ''}
                onChange={(e) => update('sports', e.target.value)}
                placeholder="e.g., Golf, gardening, hiking"
              />
            </div>
          </div>
        </div>

        {/* Compensation/Legal */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-3">Additional Context</h3>
          <p className="text-sm text-gray-400 mb-3">
            This information helps your care team understand the full picture. Your answers do not
            affect the quality of your care.
          </p>
          <div>
            <label className="form-label">Is your condition related to any of the following?</label>
            <div className="flex flex-wrap gap-2">
              {['Not applicable', 'Workers\' compensation claim', 'Motor vehicle accident', 'Personal injury case', 'Prefer not to answer'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => update('compensationCase', opt)}
                  className={`chip ${sh.compensationCase === opt ? 'chip-selected' : 'chip-unselected'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={true}
        nextLabel="Continue to Family History"
        showSkip={true}
      />
    </div>
  );
}
