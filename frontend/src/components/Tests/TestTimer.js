import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../Toast/ToastProvider';
import './Tests.css';

const TestTimer = ({ test, onTimeUp, onSubmit }) => {
  const toast = useToast();
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [warning, setWarning] = useState(false);

  useEffect(() => {
    if (!test || !test.timerDuration) return;

    // Check if test is already started
    if (test.startTime && test.status === 'in_progress' && !test.isSubmitted) {
      setIsStarted(true);
      calculateTimeRemaining();
    }
  }, [test]);

  useEffect(() => {
    if (!isStarted || !test?.timerDuration || test?.isSubmitted) return;

    const interval = setInterval(() => {
      calculateTimeRemaining();
    }, 1000);

    return () => clearInterval(interval);
  }, [isStarted, test]);

  const calculateTimeRemaining = () => {
    if (!test.startTime || !test.timerDuration) return;

    const start = new Date(test.startTime);
    const now = new Date();
    const elapsed = Math.floor((now - start) / 1000 / 60); // minutes elapsed
    const remaining = test.timerDuration - elapsed;

    if (remaining <= 0) {
      setTimeRemaining(0);
      if (onTimeUp) onTimeUp();
      return;
    }

    setTimeRemaining(remaining);
    
    // Show warning when less than 5 minutes remain
    if (remaining <= 5 && !warning) {
      setWarning(true);
    }
  };

  const startTest = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/tests/${test._id}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setIsStarted(true);
        calculateTimeRemaining();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start test');
    }
  };

  const formatTime = (minutes) => {
    if (minutes === null || minutes === undefined) return '--:--';
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  if (!test.timerDuration) return null;

  if (test.isSubmitted) {
    return (
      <div className="test-timer-container completed">
        <div className="test-timer-label">Test Completed</div>
        <div className="test-timer-time">Submitted at {new Date(test.submittedAt).toLocaleTimeString()}</div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="test-timer-container not-started">
        <div className="test-timer-label">Test Duration: {formatTime(test.timerDuration)}</div>
        <button onClick={startTest} className="start-test-button">
          Start Test
        </button>
      </div>
    );
  }

  return (
    <div className={`test-timer-container ${warning ? 'warning' : ''} ${timeRemaining === 0 ? 'expired' : ''}`}>
      <div className="test-timer-label">Time Remaining</div>
      <div className={`test-timer-time ${warning ? 'warning-text' : ''}`}>
        {formatTime(timeRemaining)}
      </div>
      {warning && timeRemaining > 0 && (
        <div className="test-timer-warning">Less than 5 minutes remaining!</div>
      )}
      {timeRemaining === 0 && (
        <div className="test-timer-expired">
          Time's up! Test will be submitted automatically.
        </div>
      )}
    </div>
  );
};

export default TestTimer;
