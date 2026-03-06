import React, { useState, useEffect, useRef } from 'react';
import './Tests.css';

const TestTimer = ({ test, onClose, onSubmit }) => {
  const [timeLeft, setTimeLeft] = useState(test.timerDuration * 60); // Convert to seconds
  const [isRunning, setIsRunning] = useState(true);
  const [bodyCheckData, setBodyCheckData] = useState(test.bodyCheck || {});
  const [testResults, setTestResults] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSubmit();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = () => {
    setIsRunning(!isRunning);
  };

  const handleBodyCheckChange = (field, value) => {
    setBodyCheckData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    onSubmit({
      ...test,
      bodyCheck: bodyCheckData,
      testResults: testResults
    });
  };

  const getTimeColor = () => {
    const percentage = (timeLeft / (test.timerDuration * 60)) * 100;
    if (percentage > 50) return '#4ecdc4';
    if (percentage > 20) return '#f9ca24';
    return '#ff6b6b';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content test-timer-modal">
        <div className="test-timer-header">
          <h3>{test.testName}</h3>
          <div className="timer-display" style={{ color: getTimeColor() }}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="test-instructions">
          <h4>Test Instructions</h4>
          <p>Please complete the following measurements and answer the test questions.</p>
        </div>

        <div className="body-check-section">
          <h4>Body Check Measurements</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Temperature (°F):</label>
              <input
                type="text"
                value={bodyCheckData.temperature || ''}
                onChange={(e) => handleBodyCheckChange('temperature', e.target.value)}
                placeholder="98.6"
              />
            </div>
            <div className="form-group">
              <label>Blood Pressure:</label>
              <input
                type="text"
                value={bodyCheckData.bloodPressure || ''}
                onChange={(e) => handleBodyCheckChange('bloodPressure', e.target.value)}
                placeholder="120/80"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Heart Rate (bpm):</label>
              <input
                type="text"
                value={bodyCheckData.heartRate || ''}
                onChange={(e) => handleBodyCheckChange('heartRate', e.target.value)}
                placeholder="72"
              />
            </div>
            <div className="form-group">
              <label>Weight (kg):</label>
              <input
                type="text"
                value={bodyCheckData.weight || ''}
                onChange={(e) => handleBodyCheckChange('weight', e.target.value)}
                placeholder="70"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Height (cm):</label>
            <input
              type="text"
              value={bodyCheckData.height || ''}
              onChange={(e) => handleBodyCheckChange('height', e.target.value)}
              placeholder="170"
            />
          </div>
        </div>

        <div className="test-answers-section">
          <h4>Test Answers</h4>
          <div className="form-group">
            <label>Test Results/Answers:</label>
            <textarea
              value={testResults}
              onChange={(e) => setTestResults(e.target.value)}
              placeholder="Enter your test answers or results here..."
              rows="6"
            />
          </div>
        </div>

        <div className="test-timer-actions">
          <button
            onClick={handlePauseResume}
            className={`btn-${isRunning ? 'warning' : 'success'}`}
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary"
          >
            Submit Test
          </button>
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestTimer;
