import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlitchText from '../GlitchText/GlitchText';
import './Tests.css';

const TestList = ({ patientId, userRole }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    testResults: '',
    notes: '',
    status: ''
  });

  useEffect(() => {
    fetchTests();
  }, [patientId]);

  const fetchTests = async () => {
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';

      if (userRole === 'patient') {
        endpoint = `/api/tests/patient/${patientId}`;
      } else if (userRole === 'doctor') {
        endpoint = '/api/tests/doctor';
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setTests(response.data.tests);
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (testId) => {
    try {
      const token = localStorage.getItem('token');
      const updateData = {};
      if (updateForm.testResults) updateData.testResults = updateForm.testResults;
      if (updateForm.notes !== undefined) updateData.notes = updateForm.notes;
      if (updateForm.status) updateData.status = updateForm.status;

      const response = await axios.put(`/api/tests/${testId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedTest(null);
        setUpdateForm({ testResults: '', notes: '', status: '' });
        fetchTests();
        alert('Test updated successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update test');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  if (loading) {
    return <div className="loading">Loading tests...</div>;
  }

  return (
    <div className="tests-list-container">
      <h2>Tests & Medical Records</h2>

      {tests.length === 0 ? (
        <div className="empty-state-center">
          <GlitchText speed={1} enableShadows enableOnHover={false}>
            No Tests
          </GlitchText>
        </div>
      ) : (
        <div className="tests-grid">
          {tests.map((test) => (
            <div key={test._id} className="test-card-item">
              <div className="test-header">
                <div>
                  <strong>{test.testName}</strong>
                  <span className="test-type">{test.testType}</span>
                </div>
                <div className="test-status" style={{ backgroundColor: getStatusColor(test.status) }}>
                  {test.status.toUpperCase()}
                </div>
              </div>

              <div className="test-body">
                <div className="test-info">
                  <p><strong>Date:</strong> {formatDate(test.testDate)}</p>
                  {test.doctor && (
                    <p><strong>Doctor:</strong> Dr. {test.doctor.name}</p>
                  )}
                </div>

                {Object.keys(test.bodyCheck || {}).some(key => test.bodyCheck[key]) && (
                  <div className="body-check-display">
                    <strong>Body Check:</strong>
                    <div className="body-check-values">
                      {test.bodyCheck.bloodPressure && <span>BP: {test.bodyCheck.bloodPressure}</span>}
                      {test.bodyCheck.heartRate && <span>HR: {test.bodyCheck.heartRate} bpm</span>}
                      {test.bodyCheck.temperature && <span>Temp: {test.bodyCheck.temperature}°F</span>}
                      {test.bodyCheck.weight && <span>Weight: {test.bodyCheck.weight} kg</span>}
                      {test.bodyCheck.height && <span>Height: {test.bodyCheck.height} cm</span>}
                      {test.bodyCheck.bmi && <span>BMI: {test.bodyCheck.bmi}</span>}
                      {test.bodyCheck.oxygenLevel && <span>O2: {test.bodyCheck.oxygenLevel}%</span>}
                    </div>
                    {test.bodyCheck.other && (
                      <p className="other-obs">{test.bodyCheck.other}</p>
                    )}
                  </div>
                )}

                {test.testResults && (
                  <div className="test-results">
                    <strong>Results:</strong>
                    <p>{test.testResults}</p>
                  </div>
                )}

                {test.notes && (
                  <div className="test-notes">
                    <strong>Notes:</strong>
                    <p>{test.notes}</p>
                  </div>
                )}
              </div>

              {userRole === 'doctor' && (
                <div className="test-actions">
                  <button onClick={() => setSelectedTest(test)} className="update-button">
                    Update
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Update Modal */}
      {selectedTest && userRole === 'doctor' && (
        <div className="modal-overlay" onClick={() => setSelectedTest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Update Test Record</h3>
            <div className="form-group">
              <label>Test Results</label>
              <textarea
                value={updateForm.testResults || selectedTest.testResults || ''}
                onChange={(e) => setUpdateForm({ ...updateForm, testResults: e.target.value })}
                className="form-textarea"
                rows="4"
                placeholder="Enter test results..."
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={updateForm.status || selectedTest.status}
                onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                className="form-select"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={updateForm.notes !== '' ? updateForm.notes : (selectedTest.notes || '')}
                onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                className="form-textarea"
                rows="3"
                placeholder="Additional notes..."
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => handleUpdate(selectedTest._id)} className="submit-button">
                Update Test
              </button>
              <button
                onClick={() => {
                  setSelectedTest(null);
                  setUpdateForm({ testResults: '', notes: '', status: '' });
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestList;

