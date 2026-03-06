import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from '../Toast/ToastProvider';
import './Tests.css';

const TestSubmission = ({ test, onClose, onSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    testResults: test.testResults || '',
    bodyCheck: test.bodyCheck || {},
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('bodyCheck.')) {
      const field = name.split('.')[1];
      setSubmissionData(prev => ({
        ...prev,
        bodyCheck: {
          ...prev.bodyCheck,
          [field]: value
        }
      }));
    } else {
      setSubmissionData(prev => ({
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
      const response = await axios.post(`/api/tests/${test._id}/submit`, submissionData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Test submitted successfully');
        onSuccess();
      }
    } catch (err) {
      console.error('Error submitting test:', err);
      toast.error('Failed to submit test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Submit Test - {test.testName}</h3>
        
        <div className="test-info">
          <p><strong>Patient:</strong> {test.patient?.name}</p>
          <p><strong>Doctor:</strong> Dr. {test.doctor?.name}</p>
          <p><strong>Test Type:</strong> {test.testType.replace('_', ' ').toUpperCase()}</p>
          <p><strong>Duration:</strong> {test.timerDuration} minutes</p>
          {test.maxScore && <p><strong>Max Score:</strong> {test.maxScore}</p>}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="body-check-section">
            <h4>Body Check Measurements</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Temperature (°F):</label>
                <input
                  type="text"
                  name="bodyCheck.temperature"
                  value={submissionData.bodyCheck.temperature || ''}
                  onChange={handleChange}
                  placeholder="98.6"
                />
              </div>
              <div className="form-group">
                <label>Blood Pressure:</label>
                <input
                  type="text"
                  name="bodyCheck.bloodPressure"
                  value={submissionData.bodyCheck.bloodPressure || ''}
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
                  value={submissionData.bodyCheck.heartRate || ''}
                  onChange={handleChange}
                  placeholder="72"
                />
              </div>
              <div className="form-group">
                <label>Weight (kg):</label>
                <input
                  type="text"
                  name="bodyCheck.weight"
                  value={submissionData.bodyCheck.weight || ''}
                  onChange={handleChange}
                  placeholder="70"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Height (cm):</label>
              <input
                type="text"
                name="bodyCheck.height"
                value={submissionData.bodyCheck.height || ''}
                onChange={handleChange}
                placeholder="170"
              />
            </div>
          </div>

          <div className="test-answers-section">
            <h4>Test Results</h4>
            <div className="form-group">
              <label>Your Answers/Results:</label>
              <textarea
                name="testResults"
                value={submissionData.testResults}
                onChange={handleChange}
                placeholder="Enter your test answers or results here..."
                rows="8"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Additional Notes:</label>
            <textarea
              name="notes"
              value={submissionData.notes}
              onChange={handleChange}
              placeholder="Any additional notes or comments..."
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Test'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestSubmission;
