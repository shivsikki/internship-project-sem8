import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Tests.css';

const TestForm = ({ appointment, onSuccess }) => {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patientId: appointment?.patient?._id || '',
    appointmentId: appointment?._id || '',
    testType: 'laboratory',
    testName: '',
    bodyCheck: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
      height: '',
      bmi: '',
      oxygenLevel: '',
      other: ''
    },
    testResults: '',
    notes: '',
    status: 'pending'
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

  const handleBodyCheckChange = (field, value) => {
    setFormData({
      ...formData,
      bodyCheck: {
        ...formData.bodyCheck,
        [field]: value
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.testName) {
      setError('Please enter test name');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/tests/create', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('Test record created successfully!');
        setFormData({
          patientId: '',
          appointmentId: '',
          testType: 'laboratory',
          testName: '',
          bodyCheck: {
            bloodPressure: '',
            heartRate: '',
            temperature: '',
            weight: '',
            height: '',
            bmi: '',
            oxygenLevel: '',
            other: ''
          },
          testResults: '',
          notes: '',
          status: 'pending'
        });
        if (onSuccess) onSuccess();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create test record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-form-container">
      <h2 className="test-page-title">Create Test / Medical Record</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="test-form test-form-grid">
        <div className="test-actions">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Creating...' : 'Finalize Test Record'}
          </button>
        </div>

        <div className="test-card test-card-main">
          <h3 className="test-card-title">Test Details</h3>

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
            <label>Test Type</label>
            <select
              value={formData.testType}
              onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
              required
              className="form-select"
            >
              <option value="laboratory">Laboratory Test</option>
              <option value="body-check">Body Check</option>
              <option value="imaging">Imaging (X-Ray, MRI, etc.)</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Test Name</label>
            <input
              type="text"
              value={formData.testName}
              onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
              required
              placeholder="e.g., Blood Test, X-Ray, General Checkup"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Test Results</label>
            <textarea
              value={formData.testResults}
              onChange={(e) => setFormData({ ...formData, testResults: e.target.value })}
              placeholder="Enter test results..."
              className="form-textarea"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="form-select"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              className="form-textarea"
              rows="3"
            />
          </div>
        </div>

        <div className="test-card test-card-body-check">
          <h3 className="test-card-title">Body Check (Optional)</h3>
          <div className="body-check-grid">
            <div className="form-group">
              <label>Blood Pressure</label>
              <input
                type="text"
                value={formData.bodyCheck.bloodPressure}
                onChange={(e) => handleBodyCheckChange('bloodPressure', e.target.value)}
                placeholder="e.g., 120/80"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Heart Rate (bpm)</label>
              <input
                type="text"
                value={formData.bodyCheck.heartRate}
                onChange={(e) => handleBodyCheckChange('heartRate', e.target.value)}
                placeholder="e.g., 72"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Temperature (°F)</label>
              <input
                type="text"
                value={formData.bodyCheck.temperature}
                onChange={(e) => handleBodyCheckChange('temperature', e.target.value)}
                placeholder="e.g., 98.6"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Weight (kg)</label>
              <input
                type="text"
                value={formData.bodyCheck.weight}
                onChange={(e) => handleBodyCheckChange('weight', e.target.value)}
                placeholder="e.g., 70"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Height (cm)</label>
              <input
                type="text"
                value={formData.bodyCheck.height}
                onChange={(e) => handleBodyCheckChange('height', e.target.value)}
                placeholder="e.g., 175"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>BMI</label>
              <input
                type="text"
                value={formData.bodyCheck.bmi}
                onChange={(e) => handleBodyCheckChange('bmi', e.target.value)}
                placeholder="e.g., 22.5"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Oxygen Level (%)</label>
              <input
                type="text"
                value={formData.bodyCheck.oxygenLevel}
                onChange={(e) => handleBodyCheckChange('oxygenLevel', e.target.value)}
                placeholder="e.g., 98"
                className="form-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Other Observations</label>
            <textarea
              value={formData.bodyCheck.other}
              onChange={(e) => handleBodyCheckChange('other', e.target.value)}
              placeholder="Additional observations..."
              className="form-textarea"
              rows="2"
            />
          </div>
        </div>

        <div className="test-card test-card-rules">
          <h3 className="test-card-title">Rules</h3>
          <div className="info-section">
            <h3>Before You Order Tests</h3>
            <ul>
              <li>Confirm the clinical question you are trying to answer.</li>
              <li>Check for recent duplicate tests to avoid repetition.</li>
              <li>Explain the purpose of the test to the patient.</li>
            </ul>
          </div>
          <div className="info-section">
            <h3>Interpreting Results</h3>
            <ul>
              <li>Compare with reference ranges and previous results.</li>
              <li>Consider patient context, not just numbers.</li>
              <li>Document key findings clearly in the report.</li>
            </ul>
          </div>
          <div className="info-section">
            <h3>Follow Up</h3>
            <ul>
              <li>Communicate abnormal results to the patient promptly.</li>
              <li>Plan further investigations or treatment if needed.</li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TestForm;

