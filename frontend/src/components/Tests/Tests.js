import React, { useState } from 'react';
import TestForm from './TestForm';
import TestList from './TestList';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './Tests.css';

const Tests = ({ userRole, patientId }) => {
  const [view, setView] = useState('selection'); // 'selection', 'upload', 'request'
  const [refreshKey, setRefreshKey] = useState(0);

  // If the user is a patient, just show the list of records
  if (userRole === 'patient') {
    return (
      <div className="tests-main-container view-fade-in">
        <header className="tests-list-hero" style={{ marginBottom: '30px' }}>
          <div className="tests-hero-bg" aria-hidden="true" />
          <div className="tests-hero-content">
            <p className="tests-hero-eyebrow">Medical History</p>
            <AnimatedHeading text="Tests & Medical Records" />
            <p className="tests-hero-subtitle">Review all your laboratory results, imaging scans, and medical reports from one place.</p>
          </div>
        </header>
        <div className="tests-section test-list-section">
          <TestList
            key={refreshKey}
            patientId={patientId}
            userRole={userRole}
          />
        </div>
      </div>
    );
  }

  // DOCTOR WORKFLOW (Selection -> Form)
  const handleTestCreated = () => {
    setRefreshKey(prev => prev + 1);
    setView('selection'); // Return to choice view after success
  };

  const SelectionView = () => (
    <div className="test-selection-wrapper view-fade-in">
      <header className="tests-list-hero" style={{ marginBottom: '40px' }}>
        <div className="tests-hero-bg" aria-hidden="true" />
        <div className="tests-hero-content">
          <p className="tests-hero-eyebrow">Diagnostic Management</p>
          <AnimatedHeading text="Clinical Test Pathways" />
          <p className="tests-hero-subtitle">Choose the appropriate diagnostic workflow for your patient. Plan future tests or record immediate results.</p>
        </div>
      </header>

      <div className="test-choice-container">
        <div
          className="diagnostic-choice-card"
          onClick={() => setView('request')}
        >
          <div className="choice-icon-vessel">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          </div>
          <h2 className="choice-title">Order a test/record</h2>
          <p className="choice-description">
            Order a diagnostic test for the patient to complete at their preferred laboratory.
          </p>
          <div className="choice-glow"></div>
        </div>

        <div
          className="diagnostic-choice-card"
          onClick={() => setView('upload')}
        >
          <div className="choice-icon-vessel">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h2 className="choice-title">Upload a test/record</h2>
          <p className="choice-description">
            Directly record clinical findings, vitals, and lab results into the medical history.
          </p>
          <div className="choice-glow"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="tests-main-container">
      {view === 'selection' ? (
        <SelectionView />
      ) : (
        <div className="tests-layout-wrapper view-fade-in">
          <div className="back-navigator" onClick={() => setView('selection')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Selection
          </div>

          <div className="tests-layout single-form-layout">
            <div className="tests-section test-form-section">
              <TestForm
                onSuccess={handleTestCreated}
                mode={view}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tests;
