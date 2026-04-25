import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DoctorVerification.css';

const VerificationPending = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);

  const checkVerificationStatus = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get('/api/auth/verification-status', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStatus(response.data.verificationStatus);
      }
    } catch (err) {
      console.error('Error checking verification status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkVerificationStatus();
  }, [checkVerificationStatus]);

  useEffect(() => {
    // Poll every 10 seconds for status updates
    const interval = setInterval(() => {
      checkVerificationStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [checkVerificationStatus]);

  useEffect(() => {
    // If verified, start countdown and redirect
    if (status === 'verified') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/signin');
  };

  const statusConfig = {
    pending: {
      icon: '⏳',
      title: 'Verification Pending',
      message: 'Your documents have been submitted and are under review.',
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    verified: {
      icon: '✅',
      title: 'Verification Complete!',
      message: 'Your account has been verified. Redirecting to dashboard...',
      color: '#10b981',
      bgColor: '#d1fae5'
    },
    rejected: {
      icon: '❌',
      title: 'Verification Rejected',
      message: 'Your verification was rejected. Please contact support or try again with valid documents.',
      color: '#ef4444',
      bgColor: '#fee2e2'
    },
    not_submitted: {
      icon: '⚠️',
      title: 'Documents Required',
      message: 'Please submit your verification documents.',
      color: '#f59e0b',
      bgColor: '#fef3c7'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  if (loading) {
    return (
      <div className="v-page-wrapper">
        <div className="v-main-modal">
          <div className="v-modal-body" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div className="loading-spinner"></div>
            <p style={{ color: '#6b7280', marginTop: '16px' }}>Checking verification status...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (status === 'pending') {
      return (
        <div className="v-content-card">
          <div className="v-status-icon-wrapper pending-bg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-hourglass"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>
          </div>
          <h1 className="v-status-title">Verification Pending</h1>
          <p className="v-status-subtitle">
            Your documents have been submitted and are under review by our clinical administration team.
          </p>

          <div className="v-info-list">
            <div className="v-info-item">
              <div className="v-icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <div className="v-info-text">
                <strong>Notification via email</strong>
                <span>We'll alert you the moment your status changes.</span>
              </div>
            </div>

            <div className="v-info-item">
              <div className="v-icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className="v-info-text">
                <strong>24-48 hour timeframe</strong>
                <span>Standard processing time for medical credentials.</span>
              </div>
            </div>

            <div className="v-info-item">
              <div className="v-icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </div>
              <div className="v-info-text">
                <strong>Auto-update on verification</strong>
                <span>Your dashboard will unlock automatically.</span>
              </div>
            </div>
          </div>

          <button className="v-action-btn primary" onClick={checkVerificationStatus}>
            Check Status
          </button>
          <button className="v-action-btn secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      );
    }

    if (status === 'verified') {
      return (
        <div className="v-content-card verified">
          <div className="v-status-icon-wrapper verified-bg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h1 className="v-status-title">Verification Complete!</h1>
          <p className="v-status-subtitle">
            Your account has been verified. Redirecting to dashboard in {countdown} seconds...
          </p>

          <div className="v-progress-bar-container">
             <div className="v-progress-fill" style={{ width: `${((5 - countdown) / 5) * 100}%` }}></div>
          </div>

          <button className="v-action-btn primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard Now
          </button>
          <button className="v-action-btn secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      );
    }

    if (status === 'rejected') {
      return (
        <div className="v-content-card rejected">
          <div className="v-status-icon-wrapper rejected-bg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h1 className="v-status-title" style={{ color: '#dc2626' }}>Verification Rejected</h1>
          <p className="v-status-subtitle">
            Your verification was rejected. Please review common rejection reasons and try again.
          </p>

          <div className="v-info-list" style={{ marginTop: '15px' }}>
            <ul className="v-rejection-reasons">
              <li>Blurry or unclear documents</li>
              <li>Expired medical license</li>
              <li>Name mismatch across documents</li>
              <li>Incomplete document set</li>
            </ul>
          </div>

          <button className="v-action-btn primary" onClick={() => navigate('/doctor-verification')} style={{ backgroundColor: '#dc2626', color: 'white' }}>
            Re-upload Documents
          </button>
          <button className="v-action-btn secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      );
    }

    if (status === 'not_submitted') {
      return (
        <div className="v-content-card warning">
          <div className="v-status-icon-wrapper warning-bg">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h1 className="v-status-title">Documents Required</h1>
          <p className="v-status-subtitle">
            Please submit your verification documents to gain full access to the clinical portal.
          </p>

          <button className="v-action-btn primary" onClick={() => navigate('/doctor-verification')} style={{ backgroundColor: '#f59e0b', color: 'white' }}>
            Submit Documents
          </button>
          <button className="v-action-btn secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="v-page-wrapper">
      <div className="v-main-modal">
        <div className="v-modal-header">
          <div className="v-brand">
            <div className="v-logo-box">
              <img src="/images/hippocrates.png" alt="Logo" className="v-logo-img" />
            </div>
            <span className="v-brand-name">Hippocrates Lab</span>
          </div>
          <div className="v-help-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
        </div>

        <div className="v-modal-body">
          {renderContent()}
        </div>

        <div className="v-modal-footer">
          HIPPOCRATES LAB - CLINICAL STANDARDS DEPARTMENT
        </div>
      </div>
    </div>
  );
};

export default VerificationPending;
