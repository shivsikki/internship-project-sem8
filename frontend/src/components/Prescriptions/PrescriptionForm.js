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
      const response = await axios.get('/api/users/patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPatients(response.data.patients || []);
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
      const response = await axios.post('/api/prescriptions/create', {
        ...formData,
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
      <div className="prescription-card">
        <h2>Create Prescription</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="prescription-form">
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

          <div className="medications-section">
            <div className="section-header">
              <h3>Medications</h3>
              <button type="button" onClick={addMedication} className="add-button">
                + Add Medication
              </button>
            </div>

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

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Creating...' : 'Create Prescription'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionForm;

