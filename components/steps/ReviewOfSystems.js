'use client';

import { useIntake } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';

// ROS questions grouped by system
const ROS_SECTIONS = [
  {
    id: 'constitutional',
    title: 'General / Constitutional',
    questions: [
      { id: 'fevers', label: 'Fevers or chills?' },
      { id: 'nightSweats', label: 'Night sweats?' },
      { id: 'unexplainedWeightLoss', label: 'Unexplained weight loss (more than 10 lbs)?' },
      { id: 'fatigue', label: 'Unusual fatigue or malaise?' },
    ],
  },
  {
    id: 'cardiovascular',
    title: 'Heart & Circulation',
    questions: [
      { id: 'chestPain', label: 'Chest pain or pressure?' },
      { id: 'shortnessOfBreath', label: 'Shortness of breath?' },
      { id: 'swelling', label: 'Leg swelling?' },
    ],
  },
  {
    id: 'neurological',
    title: 'Neurological',
    questions: [
      { id: 'headaches', label: 'Frequent headaches?' },
      { id: 'dizziness', label: 'Dizziness or lightheadedness?' },
      { id: 'seizures', label: 'Seizures?' },
      { id: 'memoryIssues', label: 'Memory or concentration problems?' },
    ],
  },
  {
    id: 'gastrointestinal',
    title: 'Digestive',
    questions: [
      { id: 'bowelChanges', label: 'Changes in bowel habits?' },
      { id: 'nausea', label: 'Nausea or vomiting?' },
      { id: 'abdominalPain', label: 'Abdominal pain?' },
    ],
  },
  {
    id: 'genitourinary',
    title: 'Bladder & Urinary',
    questions: [
      { id: 'bladderChanges', label: 'Changes in bladder function?' },
      { id: 'urinaryFrequency', label: 'Increased urinary frequency or urgency?' },
      { id: 'urinaryRetention', label: 'Difficulty starting or maintaining urination?' },
    ],
  },
  {
    id: 'musculoskeletal',
    title: 'Musculoskeletal',
    questions: [
      { id: 'jointPain', label: 'Joint pain or swelling (besides your spine symptoms)?' },
      { id: 'muscleWeakness', label: 'General muscle weakness?' },
      { id: 'falls', label: 'Recent falls?' },
    ],
  },
  {
    id: 'general',
    title: 'Safety Screening',
    questions: [
      { id: 'recentInfections', label: 'Any recent infections?' },
      { id: 'woundIssues', label: 'Any current wounds or skin issues?' },
      { id: 'cancerHistory', label: 'Any history of cancer?' },
    ],
  },
];

export default function ReviewOfSystems({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const ros = data.reviewOfSystems;

  const updateROS = (section, questionId, value) => {
    setNested(`reviewOfSystems.${section}.${questionId}`, value);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">Review of Systems</h2>
        <p className="section-subtitle">
          Please answer these quick yes/no screening questions. These help identify any other
          health concerns that may be important for your care.
        </p>
      </div>

      <div className="space-y-4">
        {ROS_SECTIONS.map((section) => (
          <div key={section.id} className="card">
            <h3 className="text-lg font-medium text-navy-600 mb-4">{section.title}</h3>
            <div className="space-y-3">
              {section.questions.map((q) => {
                const value = ros[section.id]?.[q.id];
                return (
                  <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700 flex-1 pr-4">{q.label}</span>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {['yes', 'no'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => updateROS(section.id, q.id, opt)}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            value === opt
                              ? opt === 'yes'
                                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                : 'bg-green-100 text-green-700 border border-green-300'
                              : 'bg-gray-50 border border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {opt === 'yes' ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Additional notes */}
        <div className="card">
          <label className="form-label">Anything else you'd like to mention?</label>
          <textarea
            value={ros.additionalNotes || ''}
            onChange={(e) => setNested('reviewOfSystems.additionalNotes', e.target.value)}
            placeholder="Any other symptoms or concerns not covered above..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none"
          />
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={true}
        nextLabel="Continue to Final Review"
      />
    </div>
  );
}
