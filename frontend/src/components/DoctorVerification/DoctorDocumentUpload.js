import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DoctorVerification.css';

const DoctorDocumentUpload = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState({
    profilePhoto: null,
    medicalLicense: null,
    idDocument: null,
    medicalDegree: null
  });
  const [uploadedUrls, setUploadedUrls] = useState({
    profilePhoto: '',
    medicalLicense: '',
    idDocument: '',
    medicalDegree: ''
  });
  const [uploading, setUploading] = useState({
    profilePhoto: false,
    medicalLicense: false,
    idDocument: false,
    medicalDegree: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRefs = {
    profilePhoto: useRef(null),
    medicalLicense: useRef(null),
    idDocument: useRef(null),
    medicalDegree: useRef(null)
  };

  const documentLabels = {
    profilePhoto: 'Profile Photo',
    medicalLicense: 'Medical License',
    idDocument: 'ID Document (Aadhaar/Driving License)',
    medicalDegree: 'Medical Degree Certificate'
  };

  const documentIcons = {
    profilePhoto: '👤',
    medicalLicense: '🏥',
    idDocument: '🆔',
    medicalDegree: '📜'
  };

  const handleFileSelect = (docType, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`File size must be less than 5MB for ${documentLabels[docType]}`);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type. Please upload JPG, PNG, or PDF for ${documentLabels[docType]}`);
      return;
    }

    setDocuments(prev => ({ ...prev, [docType]: file }));
    setError('');
    
    // Auto-upload the file
    uploadFile(docType, file);
  };

  const uploadFile = async (docType, file) => {
    setUploading(prev => ({ ...prev, [docType]: true }));
    setError('');

    try {
      const token = sessionStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setUploadedUrls(prev => ({ ...prev, [docType]: response.data.url }));
        setSuccess(`${documentLabels[docType]} uploaded successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to upload ${documentLabels[docType]}`);
    } finally {
      setUploading(prev => ({ ...prev, [docType]: false }));
    }
  };

  const handleDrop = (docType, e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      handleFileSelect(docType, fakeEvent);
    }
  };

  const handleSubmit = async () => {
    // Check if at least 2 documents are uploaded
    const uploadedCount = Object.values(uploadedUrls).filter(url => url).length;
    if (uploadedCount < 2) {
      setError('Please upload at least 2 documents (Profile Photo and Medical License are required)');
      return;
    }

    if (!uploadedUrls.profilePhoto || !uploadedUrls.medicalLicense) {
      setError('Profile Photo and Medical License are required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post('/api/auth/submit-verification', uploadedUrls, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Update user in sessionStorage with verification status
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        user.verificationStatus = 'pending';
        sessionStorage.setItem('user', JSON.stringify(user));

        setSuccess('Documents submitted successfully! Waiting for admin verification.');
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/verification-pending');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit verification documents');
    } finally {
      setSubmitting(false);
    }
  };

  const getPreview = (docType) => {
    const file = documents[docType];
    const url = uploadedUrls[docType];

    if (url) {
      if (url.toLowerCase().endsWith('.pdf')) {
        return <div className="doc-preview pdf">📄 PDF Uploaded</div>;
      }
      return <img src={url} alt={documentLabels[docType]} className="doc-preview-image" />;
    }

    if (file) {
      if (file.type === 'application/pdf') {
        return <div className="doc-preview pdf">📄 {file.name}</div>;
      }
      return <img src={URL.createObjectURL(file)} alt={documentLabels[docType]} className="doc-preview-image" />;
    }

    return (
      <div className="doc-placeholder">
        <span className="doc-icon">{documentIcons[docType]}</span>
        <span className="doc-text">Click or drag to upload</span>
        <span className="doc-hint">JPG, PNG, PDF (max 5MB)</span>
      </div>
    );
  };

  return (
    <div className="v-page-wrapper" style={{ overflowY: 'auto' }}>
      <div className="v-main-modal" style={{ height: 'auto', minHeight: 'calc(100vh - 60px)' }}>
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

        <div className="v-modal-body" style={{ alignItems: 'center', padding: '15px', overflowY: 'visible', maxHeight: 'none' }}>
          <div className="v-content-card" style={{ maxWidth: '900px', width: '100%', padding: '25px 40px' }}>
            
            <div className="verification-header" style={{ marginBottom: '20px' }}>
              <div className="v-status-icon-wrapper pending-bg" style={{ margin: '0 auto 12px', width: '48px', height: '48px' }}>
                <span className="header-icon" style={{ fontSize: '22px', marginBottom: 0 }}>🏥</span>
              </div>
              <h1 className="v-status-title" style={{ fontSize: '1.4rem' }}>Doctor Verification Required</h1>
              <p className="v-status-subtitle" style={{ margin: '0 auto', maxWidth: '600px', fontSize: '0.85rem', marginBottom: '0' }}>
                Please upload the required documents to verify your medical credentials. Your account will be reviewed by an admin before you can access the dashboard.
              </p>
            </div>

            {error && <div className="verification-error" style={{ width: '100%', borderRadius: '12px' }}>{error}</div>}
            {success && <div className="verification-success" style={{ width: '100%', borderRadius: '12px' }}>{success}</div>}

            <div className="documents-grid" style={{ flexWrap: 'wrap', justifyContent: 'center', marginBottom: '15px' }}>
              {Object.keys(documentLabels).map((docType) => (
                <div 
                  key={docType}
                  className={`document-card ${uploadedUrls[docType] ? 'uploaded' : ''} ${uploading[docType] ? 'uploading' : ''}`}
                  onDrop={(e) => handleDrop(docType, e)}
                  onDragOver={(e) => e.preventDefault()}
                  style={{ minWidth: '180px', padding: '10px' }}
                >
                  <div className="document-header" style={{ marginBottom: '4px', paddingBottom: '4px' }}>
                    <span className="doc-type-icon" style={{ fontSize: '14px' }}>{documentIcons[docType]}</span>
                    <span className="doc-label" style={{ fontSize: '0.75rem' }}>{documentLabels[docType]}</span>
                    {uploadedUrls[docType] && <span className="upload-status" style={{ color: '#10b981' }}>✓</span>}
                  </div>

                  <div 
                    className="document-upload-area"
                    onClick={() => fileInputRefs[docType].current?.click()}
                    style={{ background: '#f9fbf9', border: '1px dashed #cbd5e1', height: '60px' }}
                  >
                    {getPreview(docType)}
                    
                    {uploading[docType] && (
                      <div className="upload-overlay">
                        <div className="upload-spinner" style={{ borderTopColor: '#4a5d4e', width: '20px', height: '20px' }}></div>
                        <span style={{ color: '#4a5d4e', fontSize: '0.75rem' }}>Uploading...</span>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRefs[docType]}
                    onChange={(e) => handleFileSelect(docType, e)}
                    accept=".jpg,.jpeg,.png,.pdf"
                    style={{ display: 'none' }}
                  />

                  {uploadedUrls[docType] && (
                    <button 
                      className="change-file-btn"
                      onClick={() => fileInputRefs[docType].current?.click()}
                      style={{ background: '#eff3f0', color: '#4a5d4e', fontWeight: '600', padding: '4px 8px', margin: '4px 0 0 0' }}
                    >
                      Change File
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="verification-requirements" style={{ background: '#f9fbf9', textAlign: 'left', width: '100%', borderRadius: '16px', padding: '12px 20px', marginBottom: '0' }}>
              <h3 style={{ color: '#1f2937', marginBottom: '8px', fontSize: '0.9rem' }}>📋 Requirements</h3>
              <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px', justifyContent: 'flex-start', fontSize: '0.8rem' }}>
                <li style={{ color: uploadedUrls.profilePhoto ? '#10b981' : '#6b7280', fontWeight: '500' }}>
                  {uploadedUrls.profilePhoto ? '✓' : '○'} Profile Photo (Required)
                </li>
                <li style={{ color: uploadedUrls.medicalLicense ? '#10b981' : '#6b7280', fontWeight: '500' }}>
                  {uploadedUrls.medicalLicense ? '✓' : '○'} Medical License (Required)
                </li>
                <li style={{ color: uploadedUrls.idDocument ? '#10b981' : '#6b7280', fontWeight: '500' }}>
                  {uploadedUrls.idDocument ? '✓' : '○'} ID Document (Aadhaar or DL)
                </li>
                <li style={{ color: uploadedUrls.medicalDegree ? '#10b981' : '#6b7280', fontWeight: '500' }}>
                  {uploadedUrls.medicalDegree ? '✓' : '○'} Medical Degree Certificate
                </li>
              </ul>
            </div>

            <div className="verification-actions" style={{ marginTop: '16px', width: '100%' }}>
              <button 
                className="v-action-btn primary"
                onClick={handleSubmit}
                disabled={submitting || !uploadedUrls.profilePhoto || !uploadedUrls.medicalLicense}
                style={{ opacity: (submitting || !uploadedUrls.profilePhoto || !uploadedUrls.medicalLicense) ? 0.5 : 1, cursor: (submitting || !uploadedUrls.profilePhoto || !uploadedUrls.medicalLicense) ? 'not-allowed' : 'pointer', padding: '10px', fontSize: '0.9rem', marginBottom: '4px' }}
              >
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
              <p className="v-info-text" style={{ textAlign: 'center', marginTop: '6px' }}>
                <span style={{ fontSize: '0.75rem' }}>Your documents will be reviewed by an administrator. You will be notified once verified.</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="v-modal-footer" style={{ padding: '10px' }}>
          HIPPOCRATES LAB - CLINICAL STANDARDS DEPARTMENT
        </div>
      </div>
    </div>
  );
};

export default DoctorDocumentUpload;
