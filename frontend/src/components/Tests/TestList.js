import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useRealTimeSync from '../../hooks/useRealTimeSync';
import GlitchText from '../GlitchText/GlitchText';
import TestTimer from './TestTimer';
import TestSubmission from './TestSubmission';
import { useToast } from '../Toast/ToastProvider';
import './Tests.css';

const TestList = ({ patientId, userRole }) => {
  const toast = useToast();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [submissionTest, setSubmissionTest] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    testResults: '',
    notes: '',
    status: ''
  });

  // Real-time sync hook
  const { registerCallback, triggerRefresh } = useRealTimeSync(patientId, userRole);

  useEffect(() => {
    fetchTests();
  }, [patientId]);

  // Register real-time callbacks
  useEffect(() => {
    if (!patientId) return;

    // Register callbacks for real-time updates
    const unregisterTestUpdate = registerCallback('onTestUpdate', (data) => {
      console.log('TestList: Test updated', data);
      fetchTests(); // Refresh tests list
    });

    // Cleanup on unmount
    return () => {
      unregisterTestUpdate?.();
    };
  }, [patientId, registerCallback]);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleStartTest = async (testId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/tests/${testId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Test started successfully');
        setSelectedTest(response.data.test);
      }
    } catch (err) {
      console.error('Error starting test:', err);
      toast.error('Failed to start test');
    }
  };

  const handleSubmitTest = (test) => {
    setSubmissionTest(test);
  };

  const handleUpdateTest = async (testId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/tests/${testId}`, updateForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Test updated successfully');
        setSelectedTest(null);
        setUpdateForm({ testResults: '', notes: '', status: '' });
        fetchTests();
      }
    } catch (err) {
      console.error('Error updating test:', err);
      toast.error('Failed to update test');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f9ca24';
      case 'in_progress': return '#0984e3';
      case 'completed': return '#00b894';
      case 'cancelled': return '#d63031';
      default: return '#636e72';
    }
  };

  if (loading) {
    return <div className="loading">Loading tests...</div>;
  }

  return (
    <div className="tests-container">
      <h2>Medical Tests</h2>

      {tests.length === 0 ? (
        <div className="empty-state-center">
          <GlitchText speed={1} enableShadows enableOnHover={false}>
            No Tests Available
          </GlitchText>
        </div>
      ) : (
        <div className="tests-grid">
          {tests.map((test) => (
            <div key={test._id} className="test-card">
              <div className="test-header">
                <div>
                  <strong>Date:</strong> {formatDate(test.testDate)}
                </div>
                {test.doctor && (
                  <div>
                    <strong>Doctor:</strong> Dr. {test.doctor.name}
                  </div>
                )}
              </div>

              <div className="test-body">
                <div className="test-type">
                  <strong>Type:</strong> {test.testType}
                </div>
                <div className="test-name">
                  <strong>Test Name:</strong> {test.testName}
                </div>
                {test.testResults && (
                  <div className="test-results">
                    <strong>Results:</strong>
                    <p>{test.testResults}</p>
                  </div>
                )}
                <div className="test-status" style={{ color: getStatusColor(test.status) }}>
                  <strong>Status:</strong> {test.status.replace('_', ' ')}
                </div>
                {test.score !== null && (
                  <div className="test-score">
                    <strong>Score:</strong> {test.score}/{test.maxScore}
                  </div>
                )}
              </div>

              <div className="test-actions">
                {userRole === 'patient' && test.status === 'pending' && (
                  <button
                    onClick={() => handleStartTest(test._id)}
                    className="btn-primary"
                  >
                    Start Test
                  </button>
                )}
                {userRole === 'patient' && test.status === 'in_progress' && (
                  <button
                    onClick={() => setSelectedTest(test)}
                    className="btn-primary"
                  >
                    Continue Test
                  </button>
                )}
                {userRole === 'doctor' && (
                  <button
                    onClick={() => setSelectedTest(test)}
                    className="btn-secondary"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test Timer Modal */}
      {selectedTest && userRole === 'patient' && (
        <TestTimer
          test={selectedTest}
          onClose={() => setSelectedTest(null)}
          onSubmit={handleSubmitTest}
        />
      )}

      {/* Test Submission Modal */}
      {submissionTest && (
        <TestSubmission
          test={submissionTest}
          onClose={() => setSubmissionTest(null)}
          onSuccess={() => {
            setSubmissionTest(null);
            fetchTests();
          }}
        />
      )}

      {/* Test Update Modal for Doctors */}
      {selectedTest && userRole === 'doctor' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Update Test Results</h3>
            <div className="test-details">
              <p><strong>Patient:</strong> {selectedTest.patient?.name}</p>
              <p><strong>Test:</strong> {selectedTest.testName}</p>
              <p><strong>Type:</strong> {selectedTest.testType}</p>
              <p><strong>Date:</strong> {formatDate(selectedTest.testDate)}</p>
            </div>
            
            <div className="form-group">
              <label>Test Results:</label>
              <textarea
                value={updateForm.testResults}
                onChange={(e) => setUpdateForm({...updateForm, testResults: e.target.value})}
                placeholder="Enter test results"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Notes:</label>
              <textarea
                value={updateForm.notes}
                onChange={(e) => setUpdateForm({...updateForm, notes: e.target.value})}
                placeholder="Additional notes"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Status:</label>
              <select
                value={updateForm.status}
                onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
              >
                <option value="">Select Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => handleUpdateTest(selectedTest._id)}
                className="btn-primary"
              >
                Update Test
              </button>
              <button
                onClick={() => setSelectedTest(null)}
                className="btn-secondary"
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
