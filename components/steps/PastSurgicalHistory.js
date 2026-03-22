'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';

export default function PastSurgicalHistory({ onNext, onBack }) {
  const { data, setSection } = useIntake();
  const psh = data.pastSurgicalHistory;
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [form, setForm] = useState(emptySurgery());

  function emptySurgery() {
    return {
      type: '',
      bodyRegion: '',
      date: '',
      hospital: '',
      surgeon: '',
      complications: '',
      helped: '',
      isSpineSurgery: false,
      spineLevel: '',
    };
  }

  const saveSurgery = () => {
    if (!form.type) return;
    const surgeries = [...(psh.surgeries || [])];
    if (editIndex >= 0) {
      surgeries[editIndex] = form;
    } else {
      surgeries.push(form);
    }
    setSection('pastSurgicalHistory', { surgeries });
    setForm(emptySurgery());
    setShowForm(false);
    setEditIndex(-1);
  };

  const editSurgery = (index) => {
    setForm(psh.surgeries[index]);
    setEditIndex(index);
    setShowForm(true);
  };

  const removeSurgery = (index) => {
    const surgeries = (psh.surgeries || []).filter((_, i) => i !== index);
    setSection('pastSurgicalHistory', { surgeries });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">Past Surgical History</h2>
        <p className="section-subtitle">
          List any prior surgeries you've had, especially any spine surgeries.
        </p>
      </div>

      <div className="space-y-6">
        {/* Existing surgeries */}
        {(psh.surgeries || []).length > 0 && (
          <div className="space-y-3">
            {psh.surgeries.map((surgery, i) => (
              <div key={i} className={`card card-hover ${surgery.isSpineSurgery ? 'border-l-4 border-l-teal-400' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-navy-600">{surgery.type}</h4>
                    <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                      {surgery.bodyRegion && <p>Region: {surgery.bodyRegion}</p>}
                      {surgery.date && <p>Date: {surgery.date}</p>}
                      {surgery.hospital && <p>Hospital: {surgery.hospital}</p>}
                      {surgery.surgeon && <p>Surgeon: {surgery.surgeon}</p>}
                      {surgery.spineLevel && <p>Spine level: {surgery.spineLevel}</p>}
                      {surgery.helped && <p>Outcome: {surgery.helped}</p>}
                      {surgery.complications && <p>Complications: {surgery.complications}</p>}
                    </div>
                    {surgery.isSpineSurgery && (
                      <span className="inline-block mt-2 text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full">
                        Spine Surgery
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editSurgery(i)} className="text-gray-400 hover:text-teal-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => removeSurgery(i)} className="text-gray-400 hover:text-red-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add surgery form */}
        {showForm ? (
          <div className="card border-2 border-teal-200">
            <h3 className="text-lg font-medium text-navy-600 mb-4">
              {editIndex >= 0 ? 'Edit Surgery' : 'Add Surgery'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Surgery type *</label>
                <input
                  type="text"
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                  placeholder="e.g., Lumbar fusion, Knee replacement, Appendectomy"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Body region</label>
                  <select
                    value={form.bodyRegion}
                    onChange={(e) => setForm(prev => ({ ...prev, bodyRegion: e.target.value }))}
                  >
                    <option value="">Select...</option>
                    <option value="Cervical spine (neck)">Cervical spine (neck)</option>
                    <option value="Thoracic spine (upper back)">Thoracic spine (upper back)</option>
                    <option value="Lumbar spine (low back)">Lumbar spine (low back)</option>
                    <option value="Hip">Hip</option>
                    <option value="Knee">Knee</option>
                    <option value="Shoulder">Shoulder</option>
                    <option value="Abdomen">Abdomen</option>
                    <option value="Heart">Heart</option>
                    <option value="Brain/Head">Brain/Head</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Approximate date</label>
                  <input
                    type="text"
                    value={form.date}
                    onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                    placeholder="e.g., March 2022, or 2020"
                  />
                </div>
                <div>
                  <label className="form-label">Hospital (if known)</label>
                  <input
                    type="text"
                    value={form.hospital}
                    onChange={(e) => setForm(prev => ({ ...prev, hospital: e.target.value }))}
                    placeholder="Hospital name"
                  />
                </div>
                <div>
                  <label className="form-label">Surgeon (if known)</label>
                  <input
                    type="text"
                    value={form.surgeon}
                    onChange={(e) => setForm(prev => ({ ...prev, surgeon: e.target.value }))}
                    placeholder="Surgeon name"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-teal-50 rounded-xl">
                <input
                  type="checkbox"
                  checked={form.isSpineSurgery}
                  onChange={(e) => setForm(prev => ({ ...prev, isSpineSurgery: e.target.checked }))}
                />
                <span className="text-sm font-medium text-teal-700">This was a spine surgery</span>
              </label>

              {form.isSpineSurgery && (
                <div>
                  <label className="form-label">Spine level (if known)</label>
                  <input
                    type="text"
                    value={form.spineLevel}
                    onChange={(e) => setForm(prev => ({ ...prev, spineLevel: e.target.value }))}
                    placeholder="e.g., L4-L5, C5-C6"
                  />
                </div>
              )}

              <div>
                <label className="form-label">Did the surgery help?</label>
                <select
                  value={form.helped}
                  onChange={(e) => setForm(prev => ({ ...prev, helped: e.target.value }))}
                >
                  <option value="">Select...</option>
                  <option value="Helped significantly">Helped significantly</option>
                  <option value="Helped somewhat">Helped somewhat</option>
                  <option value="Helped initially then symptoms returned">Helped initially, then symptoms returned</option>
                  <option value="Did not help">Did not help</option>
                  <option value="Made things worse">Made things worse</option>
                  <option value="Not applicable">Not applicable</option>
                </select>
              </div>

              <div>
                <label className="form-label">Any complications?</label>
                <input
                  type="text"
                  value={form.complications}
                  onChange={(e) => setForm(prev => ({ ...prev, complications: e.target.value }))}
                  placeholder="e.g., Infection, blood clot, or None"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={saveSurgery} disabled={!form.type} className="btn-primary">
                  {editIndex >= 0 ? 'Save Changes' : 'Add Surgery'}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setForm(emptySurgery());
                    setEditIndex(-1);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)} className="card card-hover w-full text-center py-8 border-dashed border-2 border-gray-300">
            <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-gray-500 font-medium">Add a Surgery</p>
            <p className="text-xs text-gray-400 mt-1">Click to add a past surgery to your history</p>
          </button>
        )}

        {(psh.surgeries || []).length === 0 && !showForm && (
          <p className="text-sm text-gray-400 text-center">
            No surgeries added. If you have no prior surgeries, you can continue to the next section.
          </p>
        )}
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={true}
        nextLabel="Continue to Medications"
        showSkip={true}
      />
    </div>
  );
}
