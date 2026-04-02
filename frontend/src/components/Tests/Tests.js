import React, { useState } from 'react';
import TestForm from './TestForm';
import TestList from './TestList';
import './Tests.css';

const Tests = ({ userRole, patientId }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTestCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="tests-main-container">
      <div className="tests-layout">
        {/* Test Form Section */}
        <div className="tests-section test-form-section">
          <TestForm onSuccess={handleTestCreated} />
        </div>

        {/* Test List Section */}
        <div className="tests-section test-list-section">
          <TestList 
            key={refreshKey} 
            patientId={patientId} 
            userRole={userRole} 
          />
        </div>
      </div>
    </div>
  );
};

export default Tests;
