import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './Prescriptions.css';

const PrescriptionForm = ({ appointment, onSuccess }) => {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patientId: appointment?.patient?._id || '',
    appointmentId: appointment?._id || '',
    diagnosis: '',
    notes: '',
    allergies: '',
    history: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!appointment) {
      fetchPatients();
    } else {
      setFormData(prev => ({
        ...prev,
        patientId: appointment.patient._id,
        appointmentId: appointment._id
      }));
    }
  }, [appointment]);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/appointments/doctor', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const uniquePatients = [...new Map(response.data.appointments.map(a => [a.patient._id, a.patient])).values()];
        setPatients(uniquePatients);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  const handleMedicationChange = (index, field, value) => {
    const newMedications = [...formData.medications];
    newMedications[index][field] = value;
    setFormData({ ...formData, medications: newMedications });
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  const removeMedication = (index) => {
    const newMedications = formData.medications.filter((_, i) => i !== index);
    setFormData({ ...formData, medications: newMedications });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate medications
    const validMedications = formData.medications.filter(m => m.name && m.dosage && m.frequency && m.duration);
    if (validMedications.length === 0) {
      setError('Please add at least one medication');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const { allergies, history, ...rest } = formData;

      const noteParts = [];
      if (rest.notes && rest.notes.trim()) noteParts.push(`Notes: ${rest.notes.trim()}`);
      if (allergies && allergies.trim()) noteParts.push(`Allergies: ${allergies.trim()}`);
      if (history && history.trim()) noteParts.push(`History: ${history.trim()}`);
      const combinedNotes = noteParts.join('\n');

      const response = await axios.post('/api/prescriptions/create', {
        ...rest,
        notes: combinedNotes,
        medications: validMedications
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('Prescription created successfully!');
        setFormData({
          patientId: '',
          appointmentId: '',
          diagnosis: '',
          notes: '',
          allergies: '',
          history: '',
          medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
        });
        if (onSuccess) onSuccess();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prescription-form-container">
      <header className="prescriptions-list-hero">
        <div className="prescriptions-hero-bg" aria-hidden="true" />
        <div className="prescriptions-hero-content">
          <p className="prescriptions-hero-eyebrow">Prescriptions</p>
          <AnimatedHeading text="Create prescription" />
          <p className="prescriptions-hero-subtitle">Write and finalize a new prescription.</p>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="custom-prescription-grid">

        {/* LEFT COLUMN: SETUP */}
        <div className="prescription-col-left">
          <div className="v2-section-group" style={{ marginBottom: '24px' }}>
            <span className="v2-label">Patient</span>
            {!appointment ? (
              <div className="patient-pill-selector">
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  required
                  className="patient-select-pill"
                >
                  <option value="">Choose a patient...</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
                <div className="patient-select-caret">⌄</div>
              </div>
            ) : (
              <div className="patient-pill-card">
                <div className="patient-pill-avatar">
                  {appointment.patient?.name?.charAt(0) || 'P'}
                </div>
                <div className="patient-pill-info">
                  <strong>{appointment.patient?.name || 'Patient'}</strong>
                  <span>ID: #{appointment.patient?._id?.substring(0, 6).toUpperCase() || 'UNKNOWN'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="v2-section-group" style={{ marginBottom: '24px' }}>
            <span className="v2-label">Primary Diagnosis</span>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              required
              placeholder="Search ICD-10 codes or enter diagnosis..."
              className="v2-input-pill"
            />
            {formData.diagnosis && (
              <div className="diagnosis-pill-list">
                <span className="diagnosis-pill-item">{formData.diagnosis}</span>
                <button type="button" className="add-mini-pill">+ Add Diagnosis</button>
              </div>
            )}
          </div>

          <div className="v2-section-group" style={{ marginBottom: '24px' }}>
            <span className="v2-label">Known Allergies</span>
            <textarea
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="E.g., Penicillin, Sulfa Drugs, Peanuts"
              className="v2-input-pill"
              rows="2"
              style={{ resize: 'none' }}
            />
          </div>

          <div className="v2-section-group clinician-notes-box">
            <span className="v2-label">Clinician Notes</span>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observations and patient guidance..."
              className="clinician-textarea"
            />
          </div>
        </div>

        {/* CENTER COLUMN: PRESCRIBED REGIMEN */}
        <div className="prescription-col-center">
          <div className="center-header">
            <div className="v2-section-group">
              <span className="v2-label">Prescribed Regimen</span>
              <h3 className="center-title">Active Medications</h3>
            </div>
            <button type="button" onClick={addMedication} className="add-drug-pill">
              + Add New Drug
            </button>
          </div>

          <div className="medications-deck">
            {formData.medications.map((med, index) => (
              <div key={index} className="floating-med-card">
                <div className="med-card-top">
                  <div className="med-icon-circle">
                    <span className="med-icon">💊</span>
                  </div>
                  <div className="med-header-info">
                    <span className="med-grid-label">Medication Name</span>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                      placeholder="Medication Name"
                      className="med-title-input"
                      required
                    />
                  </div>
                  {formData.medications.length > 1 && (
                    <button type="button" onClick={() => removeMedication(index)} className="med-remove-btn" title="Remove Medication">
                      🗑
                    </button>
                  )}
                </div>

                <div className="med-card-grid">
                  <div className="med-grid-item">
                    <span className="med-grid-label">FREQUENCY</span>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                      placeholder="Once daily"
                      className="med-grid-input"
                      required
                    />
                  </div>
                  <div className="med-grid-item">
                    <span className="med-grid-label">DURATION</span>
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                      placeholder="90 Days"
                      className="med-grid-input"
                      required
                    />
                  </div>
                  <div className="med-grid-item">
                    <span className="med-grid-label">REFILLS</span>
                    <input
                      type="text"
                      placeholder="3 Remaining"
                      className="med-grid-input"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  value={med.instructions}
                  onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                  placeholder="***NOTES***"
                  className="med-instructions-input"
                />
              </div>
            ))}

            <div className="add-med-dashed" onClick={addMedication}>
              <div className="dashed-plus-circle">+</div>
              <span>Include Additional Medication</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RULES & INSIGHTS */}
        <div className="prescription-col-right">
          <div className="prescription-actions-top">
            <button type="submit" className="finalize-pill-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Finalize Prescription'}
            </button>
          </div>

          <div className="rules-sage-card">
            <div className="rules-header">
              <span className="rules-icon">☑</span>
              <span className="v2-label">Rules Before Prescribing</span>
            </div>
            <ul className="rules-checklist">
              <li className="checked">Check for cross-reactivity with Sulfa allergy.</li>
              <li className="checked">Verify recent Renal Function tests (eGFR &gt; 60).</li>
              <li>Counsel patient on dietary grapefruit interaction.</li>
              <li>Confirm pregnancy status (Category D risk).</li>
            </ul>
          </div>

          <div className="insight-white-card">
            <div className="insight-header">
              <span className="insight-icon">ℹ</span>
              <span className="v2-label">Medication Insight</span>
            </div>
            <div className="insight-content">
              <span className="insight-label">INTERACTIONS FOUND</span>
              <strong className="insight-title">Moderate: Lisinopril + Spironolactone</strong>
              <p className="insight-desc">May lead to increased hyperkalemia risk.</p>
            </div>
            <div className="insight-placeholder-block">
              <div className="insight-pill-icon">💊</div>
            </div>
            <div className="insight-footer">
              <strong>View Full Pharmacology Reference</strong>
              <span>Open Clinician's Desk ↗</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PrescriptionForm;

