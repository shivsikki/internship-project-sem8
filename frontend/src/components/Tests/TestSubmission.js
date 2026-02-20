import React, { useState } from 'react';
import axios from 'axios';
import TestTimer from './TestTimer';
import { useToast } from '../Toast/ToastProvider';
import './Tests.css';

const TestSubmission = ({ test, onSuccess }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    testResults: test.testResults || '',
    bodyCheck: test.bodyCheck || {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/tests/${test._id}/submit`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        if (onSuccess) onSuccess();
        toast.success('Test submitted successfully');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit test');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUp = async () => {
    // Auto-submit when time is up
    if (!test.isSubmitted) {
      await handleSubmit({ preventDefault: () => {} });
    }
  };

  if (test.isSubmitted) {
    return (
      <div className="test-submission-container completed">
        <h3>Test Already Submitted</h3>
        <p>This test was submitted on {new Date(test.submittedAt).toLocaleString()}</p>
        {test.score !== null && test.maxScore !== null && (
          <div className="test-score-display">
            <h4>Your Score</h4>
            <div className="score-value">
              {test.score} / {test.maxScore}
            </div>
            <div className="score-percentage">
              {Math.round((test.score / test.maxScore) * 100)}%
            </div>
          </div>
        )}
        {test.testResults && (
          <div className="submitted-results">
            <h4>Submitted Results:</h4>
            <p>{test.testResults}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="test-submission-container">
      <div className="test-submission-header">
        <h3>{test.testName}</h3>
        <span className="test-type-badge">{test.testType}</span>
      </div>

      {test.timerDuration && (
        <TestTimer test={test} onTimeUp={handleTimeUp} />
      )}

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="test-submission-form">
        <div className="body-check-section">
          <h4>Body Check</h4>
          <div className="body-check-grid">
            <div className="form-group">
              <label>Blood Pressure</label>
              <input
                type="text"
                value={formData.bodyCheck.bloodPressure || ''}
                onChange={(e) => handleBodyCheckChange('bloodPressure', e.target.value)}
                placeholder="e.g., 120/80"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Heart Rate (bpm)</label>
              <input
                type="text"
                value={formData.bodyCheck.heartRate || ''}
                onChange={(e) => handleBodyCheckChange('heartRate', e.target.value)}
                placeholder="e.g., 72"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Temperature (°F)</label>
              <input
                type="text"
                value={formData.bodyCheck.temperature || ''}
                onChange={(e) => handleBodyCheckChange('temperature', e.target.value)}
                placeholder="e.g., 98.6"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Weight (kg)</label>
              <input
                type="text"
                value={formData.bodyCheck.weight || ''}
                onChange={(e) => handleBodyCheckChange('weight', e.target.value)}
                placeholder="e.g., 70"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Height (cm)</label>
              <input
                type="text"
                value={formData.bodyCheck.height || ''}
                onChange={(e) => handleBodyCheckChange('height', e.target.value)}
                placeholder="e.g., 175"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>BMI</label>
              <input
                type="text"
                value={formData.bodyCheck.bmi || ''}
                onChange={(e) => handleBodyCheckChange('bmi', e.target.value)}
                placeholder="e.g., 22.5"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Oxygen Level (%)</label>
              <input
                type="text"
                value={formData.bodyCheck.oxygenLevel || ''}
                onChange={(e) => handleBodyCheckChange('oxygenLevel', e.target.value)}
                placeholder="e.g., 98"
                className="form-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Other Observations</label>
            <textarea
              value={formData.bodyCheck.other || ''}
              onChange={(e) => handleBodyCheckChange('other', e.target.value)}
              placeholder="Additional observations..."
              className="form-textarea"
              rows="2"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Test Results</label>
          <textarea
            value={formData.testResults}
            onChange={(e) => setFormData({ ...formData, testResults: e.target.value })}
            placeholder="Enter test results..."
            className="form-textarea"
            rows="4"
            required
          />
        </div>

        <button type="submit" className="submit-button" disabled={loading || test.isSubmitted}>
          {loading ? 'Submitting...' : 'Submit Test'}
        </button>
      </form>
    </div>
  );
};

export default TestSubmission;
