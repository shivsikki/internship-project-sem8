import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../Toast/ToastProvider';
import './Tests.css';

const TestForm = ({ user, onClose, onSuccess }) => {
  const toast = useToast();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentId: '',
    testType: 'blood_test',
    testName: '',
    bodyCheck: {
      temperature: '',
      bloodPressure: '',
      heartRate: '',
      weight: '',
      height: ''
    },
    timerDuration: 30,
    maxScore: 100,
    notes: ''
  });

  useEffect(() => {
    if (user?.role === 'doctor') {
      fetchPatients();
      fetchAppointments();
    }
  }, [user]);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(response.data.patients || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/appointments/doctor', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data.appointments || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('bodyCheck.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bodyCheck: {
          ...prev.bodyCheck,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/tests/create', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Test created successfully');
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error creating test:', err);
      toast.error('Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  const testTypes = [
    'blood_test',
    'urine_test',
    'x_ray',
    'mri',
    'ct_scan',
    'ultrasound',
    'ecg',
    'eeg',
    'physical_exam',
    'vision_test',
    'hearing_test',
    'allergy_test',
    'diabetes_test',
    'cholesterol_test',
    'covid_test'
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Create Medical Test</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Patient:</label>
            <select
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              required
            >
              <option value="">Select Patient</option>
              {patients.map(patient => (
                <option key={patient._id} value={patient._id}>
                  {patient.name} ({patient.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Appointment (Optional):</label>
            <select
              name="appointmentId"
              value={formData.appointmentId}
              onChange={handleChange}
            >
              <option value="">Select Appointment</option>
              {appointments
                .filter(apt => apt.patient?._id === formData.patientId)
                .map(apt => (
                  <option key={apt._id} value={apt._id}>
                    {new Date(apt.appointmentDate).toLocaleDateString()} - {apt.reason}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label>Test Type:</label>
            <select
              name="testType"
              value={formData.testType}
              onChange={handleChange}
              required
            >
              {testTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Test Name:</label>
            <input
              type="text"
              name="testName"
              value={formData.testName}
              onChange={handleChange}
              placeholder="Enter test name"
              required
            />
          </div>

          <div className="form-group">
            <label>Timer Duration (minutes):</label>
            <input
              type="number"
              name="timerDuration"
              value={formData.timerDuration}
              onChange={handleChange}
              min="1"
              max="180"
            />
          </div>

          <div className="form-group">
            <label>Max Score:</label>
            <input
              type="number"
              name="maxScore"
              value={formData.maxScore}
              onChange={handleChange}
              min="1"
              max="1000"
            />
          </div>

          <div className="form-section">
            <h4>Body Check Parameters</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Temperature (°F):</label>
                <input
                  type="text"
                  name="bodyCheck.temperature"
                  value={formData.bodyCheck.temperature}
                  onChange={handleChange}
                  placeholder="98.6"
                />
              </div>
              <div className="form-group">
                <label>Blood Pressure:</label>
                <input
                  type="text"
                  name="bodyCheck.bloodPressure"
                  value={formData.bodyCheck.bloodPressure}
                  onChange={handleChange}
                  placeholder="120/80"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Heart Rate (bpm):</label>
                <input
                  type="text"
                  name="bodyCheck.heartRate"
                  value={formData.bodyCheck.heartRate}
                  onChange={handleChange}
                  placeholder="72"
                />
              </div>
              <div className="form-group">
                <label>Weight (kg):</label>
                <input
                  type="text"
                  name="bodyCheck.weight"
                  value={formData.bodyCheck.weight}
                  onChange={handleChange}
                  placeholder="70"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Height (cm):</label>
                <input
                  type="text"
                  name="bodyCheck.height"
                  value={formData.bodyCheck.height}
                  onChange={handleChange}
                  placeholder="170"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Notes:</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional instructions or notes"
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Test'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestForm;
