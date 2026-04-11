import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Auth.css';

const TokenDisplay = () => {
  const location = useLocation();
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const token = location.state?.token || '';

  useEffect(() => {
    if (!token) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [token]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const accessUrl = `${window.location.origin}/${token}`;

  if (!token) {
    return (
      <div className="auth-page">
        <div className="token-display-container">
          <div className="token-error">
            <h2>Invalid Access</h2>
            <p>No valid token found. Please sign in again.</p>
            <Link to="/signin" className="auth-link-btn">Go to Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="token-display-container">
        <div className="token-card">
          <div className="token-icon">🔐</div>
          <h2>Admin Verification Required</h2>
          <p className="token-subtitle">
            For security, please use the unique URL below to complete your login.
          </p>

          <div className="token-box">
            <label>Your Secure Access URL:</label>
            <div className="token-url">
              <input
                type="text"
                value={accessUrl}
                readOnly
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={() => navigator.clipboard.writeText(accessUrl)}
                className="copy-btn"
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
            <a href={accessUrl} className="open-link-btn">
              Open Link Now →
            </a>
          </div>

          <div className="token-timer">
            <span className="timer-label">Expires in:</span>
            <span className={`timer-value ${timeLeft < 60 ? 'urgent' : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <div className="token-instructions">
            <p>🔗 Click the URL above or type it in your browser</p>
            <p>🔑 Enter the admin password on the next page</p>
            <p>⏰ This link can only be used once and expires in 5 minutes</p>
          </div>

          <div className="token-footer">
            <Link to="/signin" className="back-link">← Back to Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDisplay;
