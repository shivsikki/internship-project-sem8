import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
      <h2 className="prescription-page-title">Create Prescription</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="prescription-form prescription-form-grid">
        <div className="prescription-actions">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Creating...' : 'Finalize Prescription'}
          </button>
        </div>

        <div className="prescription-card prescription-card-prescription">
          <h3 className="prescription-card-title">Prescription</h3>
            {!appointment && (
              <div className="form-group">
                <label>Select Patient</label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  required
                  className="form-select"
                >
                  <option value="">Choose a patient...</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name} - {patient.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Diagnosis</label>
              <input
                type="text"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                required
                placeholder="Enter diagnosis"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Allergies</label>
              <textarea
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="Known drug or food allergies..."
                className="form-textarea"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes for the patient..."
                className="form-textarea"
                rows="3"
              />
            </div>
        </div>

        <div className="prescription-card prescription-card-medications">
          <div className="section-header">
            <h3 className="prescription-card-title">Medications</h3>
            <button type="button" onClick={addMedication} className="add-button">
              + Add Medication
            </button>
          </div>

          <div className="medications-section">
            {formData.medications.map((med, index) => (
              <div key={index} className="medication-item">
                <div className="medication-header">
                  <strong>Medication {index + 1}</strong>
                  {formData.medications.length > 1 && (
                    <button type="button" onClick={() => removeMedication(index)} className="remove-button">
                      Remove
                    </button>
                  )}
                </div>
                <div className="medication-grid">
                  <div className="form-group">
                    <label>Medicine Name</label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                      required
                      placeholder="e.g., Paracetamol"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Dosage</label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                      required
                      placeholder="e.g., 500mg"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Frequency</label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                      required
                      placeholder="e.g., Twice daily"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                      required
                      placeholder="e.g., 7 days"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Instructions</label>
                    <textarea
                      value={med.instructions}
                      onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                      placeholder="Additional instructions..."
                      className="form-textarea"
                      rows="2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="prescription-card prescription-card-rules">
          <h3 className="prescription-card-title">Rules</h3>
              <div className="info-section">
                <h3>Before You Prescribe</h3>
                <ul>
                  <li>Confirm patient identity and allergies.</li>
                  <li>Review current medications to avoid interactions.</li>
                  <li>Adjust dosage for age, weight, and renal/hepatic function.</li>
                </ul>
              </div>
              <div className="info-section">
                <h3>Medication Details</h3>
                <ul>
                  <li>Include clear dosage, frequency, and total duration.</li>
                  <li>Use simple language for patient instructions.</li>
                  <li>Note any food or timing restrictions (e.g., after meals).</li>
                </ul>
              </div>
        </div>

      </form>
    </div>
  );
};

export default PrescriptionForm;

