'use client';

import { useIntake } from '../../lib/store';
import { US_STATES, VISIT_REASONS } from '../../lib/constants';
import StepNavigation from '../ui/StepNavigation';

export default function Demographics({ onNext, onBack }) {
  const { data, setField } = useIntake();
  const d = data.demographics;

  const updateField = (field, value) => {
    setField('demographics', field, value);
  };

  // Auto-calculate age from DOB
  const handleDobChange = (dob) => {
    updateField('dob', dob);
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age >= 0 && age < 150) updateField('age', age.toString());
    }
  };

  const isValid = d.firstName && d.lastName && d.dob && d.sex && d.visitReason;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">Patient Information</h2>
        <p className="section-subtitle">
          Let's start with some basic information. Fields marked with * are required.
        </p>
      </div>

      <div className="space-y-6">
        {/* Name */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name *</label>
              <input
                type="text"
                value={d.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="First name"
              />
            </div>
            <div>
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                value={d.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="Last name"
              />
            </div>
            <div>
              <label className="form-label">Date of Birth *</label>
              <input
                type="date"
                value={d.dob}
                onChange={(e) => handleDobChange(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="form-label">Age</label>
              <input
                type="text"
                value={d.age}
                readOnly
                className="bg-gray-50"
                placeholder="Calculated from DOB"
              />
            </div>
            <div>
              <label className="form-label">Sex *</label>
              <select value={d.sex} onChange={(e) => updateField('sex', e.target.value)}>
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Phone</label>
              <input
                type="tel"
                value={d.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={d.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="patient@email.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Address</label>
              <input
                type="text"
                value={d.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="form-label">City</label>
              <input
                type="text"
                value={d.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">State</label>
                <select value={d.state} onChange={(e) => updateField('state', e.target.value)}>
                  <option value="">State</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">ZIP</label>
                <input
                  type="text"
                  value={d.zip}
                  onChange={(e) => updateField('zip', e.target.value)}
                  placeholder="ZIP code"
                  maxLength={10}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Insurance & Referral */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">Insurance & Referral</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Insurance Provider</label>
              <input
                type="text"
                value={d.insuranceProvider}
                onChange={(e) => updateField('insuranceProvider', e.target.value)}
                placeholder="Insurance company name"
              />
            </div>
            <div>
              <label className="form-label">Member ID</label>
              <input
                type="text"
                value={d.memberId}
                onChange={(e) => updateField('memberId', e.target.value)}
                placeholder="Member/Policy ID"
              />
            </div>
            <div>
              <label className="form-label">Referring Physician</label>
              <input
                type="text"
                value={d.referringPhysician}
                onChange={(e) => updateField('referringPhysician', e.target.value)}
                placeholder="Dr. who referred you"
              />
            </div>
            <div>
              <label className="form-label">Primary Care Physician</label>
              <input
                type="text"
                value={d.primaryCarePhysician}
                onChange={(e) => updateField('primaryCarePhysician', e.target.value)}
                placeholder="Your PCP"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Name</label>
              <input
                type="text"
                value={d.emergencyContactName}
                onChange={(e) => updateField('emergencyContactName', e.target.value)}
                placeholder="Emergency contact name"
              />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input
                type="tel"
                value={d.emergencyContactPhone}
                onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="form-label">Relationship</label>
              <input
                type="text"
                value={d.emergencyContactRelation}
                onChange={(e) => updateField('emergencyContactRelation', e.target.value)}
                placeholder="e.g., Spouse, Parent"
              />
            </div>
          </div>
        </div>

        {/* Visit Reason */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">Reason for Visit *</h3>
          <p className="text-sm text-gray-500 mb-3">What brings you to the spine surgery clinic?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VISIT_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  d.visitReason === reason
                    ? 'border-teal-400 bg-teal-50 text-teal-700'
                    : 'border-gray-200 hover:border-teal-200 hover:bg-teal-50/30'
                }`}
              >
                <input
                  type="radio"
                  name="visitReason"
                  value={reason}
                  checked={d.visitReason === reason}
                  onChange={(e) => updateField('visitReason', e.target.value)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  d.visitReason === reason ? 'border-teal-400' : 'border-gray-300'
                }`}>
                  {d.visitReason === reason && (
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                  )}
                </div>
                <span className="text-sm font-medium">{reason}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={isValid}
        nextLabel="Continue to Chief Complaint"
        showBack={true}
      />
    </div>
  );
}
