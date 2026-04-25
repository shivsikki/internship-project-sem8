import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './DoctorVerification.css';

const DoctorVerification = () => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get('/api/auth/pending-doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingDoctors(response.data.doctors || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (doctorId, action) => {
    try {
      setActionInProgress(true);
      const token = sessionStorage.getItem('token');
      await axios.post('/api/auth/verify-doctor', 
        { doctorId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPendingDoctors(pendingDoctors.filter(doc => doc._id !== doctorId));
      setSelectedDoctor(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update verification status');
    } finally {
      setActionInProgress(false);
    }
  };

  const viewDocuments = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const renderDocument = (docPath, label) => {
    if (!docPath) {
      return (
        <div className="dv-card">
          <div className="dv-card-header">
            <span className="dv-card-title">{label}</span>
            <span className="dv-label" style={{ color: '#ef4444' }}>Missing</span>
          </div>
          <div className="dv-pdf-wrap" style={{ background: '#fef2f2', border: '1px dashed #fca5a5' }}>
            <span style={{ color: '#ef4444' }}>Not Uploaded</span>
          </div>
        </div>
      );
    }
    
    const isImage = docPath.match(/\.(jpg|jpeg|png|gif)$/i);
    const isPDF = docPath.match(/\.pdf$/i);
    
    return (
      <div className="dv-card">
        <div className="dv-card-header">
          <span className="dv-card-title">{label}</span>
          <span className="dv-label" style={{ color: '#10b981' }}>Uploaded</span>
        </div>
        {isImage ? (
          <div className="dv-img-wrap">
            <img 
              src={docPath} 
              alt={label}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNSAyNUgzNVYzNUgxNVYyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
              }}
            />
          </div>
        ) : isPDF ? (
          <div className="dv-pdf-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span>PDF Document</span>
          </div>
        ) : (
           <div className="dv-pdf-wrap"><span>Invalid Format</span></div>
        )}
        <a href={docPath} target="_blank" rel="noopener noreferrer" className="dv-btn-minimal" style={{ marginTop: 'auto' }}>
          {isImage ? 'View Full Image' : 'Open Document'}
        </a>
      </div>
    );
  };

  const getDocumentStatus = (doctor) => {
    const docs = ['profilePhoto', 'medicalLicense', 'idDocument', 'medicalDegree'];
    const uploaded = docs.filter(doc => doctor[doc]).length;
    return `${uploaded}/${docs.length} documents`;
  };

  if (loading) return (
    <div className="admin-verification-loading">
      <div className="loading-spinner"></div>
      <p>Loading pending doctors...</p>
    </div>
  );

  return (
    <div className="admin-doctor-verification view-fade-in">
      <header className="medivault-hero">
        <div className="hero-bg-pattern" aria-hidden="true" />
        <div className="medivault-hero-content">
          <p className="medivault-hero-eyebrow">Administrative Service</p>
          <AnimatedHeading text="Doctor Verification" />
          <p className="medivault-hero-subtitle">
            Review and verify incoming doctor applications. Current pending: <strong>{pendingDoctors.length} applications</strong>.
          </p>
        </div>
      </header>

      {error && <div className="admin-verification-error">{error}</div>}

      {selectedDoctor ? (
        <div className="dv-container">
          <div className="dv-header">
            <h2>Dr. {selectedDoctor.name}'s Verification</h2>
            <button onClick={() => setSelectedDoctor(null)} className="dv-btn-minimal" style={{ width: 'auto', padding: '8px 16px' }}>
              ← Return to List
            </button>
          </div>
          
          <div className="dv-info-grid">
            <div className="dv-info-item">
              <span className="dv-label">Email Address</span>
              <span className="dv-value">{selectedDoctor.email}</span>
            </div>
            <div className="dv-info-item">
              <span className="dv-label">Specialization</span>
              <span className="dv-value">{selectedDoctor.specialization || 'Not specified'}</span>
            </div>
            <div className="dv-info-item">
              <span className="dv-label">License Number</span>
              <span className="dv-value">{selectedDoctor.licenseNumber || 'Not provided'}</span>
            </div>
            <div className="dv-info-item">
              <span className="dv-label">Submission Date</span>
              <span className="dv-value">
                {selectedDoctor.verificationSubmittedAt 
                  ? new Date(selectedDoctor.verificationSubmittedAt).toLocaleDateString() 
                  : 'Not submitted'}
              </span>
            </div>
          </div>

          <div className="dv-grid">
            {renderDocument(selectedDoctor.profilePhoto, 'Profile Photo')}
            {renderDocument(selectedDoctor.medicalLicense, 'Medical License')}
            {renderDocument(selectedDoctor.idDocument, 'Gov ID / Aadhaar')}
            {renderDocument(selectedDoctor.medicalDegree, 'Medical Degree')}
          </div>

          <div className="dv-actions">
            <button 
              onClick={() => handleVerification(selectedDoctor._id, 'reject')}
              className="dv-btn danger"
              disabled={actionInProgress}
            >
              {actionInProgress ? 'Processing...' : 'Reject Application'}
            </button>
            <button 
              onClick={() => handleVerification(selectedDoctor._id, 'verify')}
              className="dv-btn primary"
              disabled={actionInProgress}
            >
              {actionInProgress ? 'Processing...' : 'Approve Doctor'}
            </button>
          </div>
        </div>
      ) : (
        <div className="admin-pending-list">
          {pendingDoctors.length === 0 ? (
            <div className="admin-empty-state">
              <div className="empty-icon">✓</div>
              <h3>No pending verifications</h3>
              <p>All doctor applications have been processed.</p>
            </div>
          ) : (
            pendingDoctors.map(doctor => (
              <div key={doctor._id} className="admin-doctor-card">
                <div className="admin-doctor-basic-info">
                  <div className="doctor-header-row">
                    <h3>{doctor.name}</h3>
                    <span className={`status-badge ${doctor.verificationStatus}`}>
                      {doctor.verificationStatus}
                    </span>
                  </div>
                  <p><strong>Email:</strong> {doctor.email}</p>
                  <p><strong>Specialization:</strong> {doctor.specialization || 'Not specified'}</p>
                  <p><strong>License:</strong> {doctor.licenseNumber || 'Not provided'}</p>
                </div>
                
                <div className="admin-doctor-status">
                  <div className="documents-status">
                    <span className="docs-count">{getDocumentStatus(doctor)}</span>
                    <div className="docs-indicators">
                      <span className={doctor.profilePhoto ? 'has-doc' : 'no-doc'}>
                        {doctor.profilePhoto ? '✓ Photo' : '✗ Photo'}
                      </span>
                      <span className={doctor.medicalLicense ? 'has-doc' : 'no-doc'}>
                        {doctor.medicalLicense ? '✓ License' : '✗ License'}
                      </span>
                      <span className={doctor.idDocument ? 'has-doc' : 'no-doc'}>
                        {doctor.idDocument ? '✓ ID' : '✗ ID'}
                      </span>
                      <span className={doctor.medicalDegree ? 'has-doc' : 'no-doc'}>
                        {doctor.medicalDegree ? '✓ Degree' : '✗ Degree'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="admin-card-actions">
                  <button 
                    onClick={() => viewDocuments(doctor)}
                    className="admin-btn-view-docs"
                  >
                    📄 View Documents
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorVerification;
