import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DoctorVerification.css';

const DoctorVerification = () => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const fetchPendingDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/pending-doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingDoctors(response.data.doctors);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (doctorId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/verify-doctor', 
        { doctorId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPendingDoctors(pendingDoctors.filter(doc => doc._id !== doctorId));
      setSelectedDoctor(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update verification status');
    }
  };

  const viewDocuments = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const renderDocument = (docPath, label) => {
    if (!docPath) return <span className="no-document">No {label} uploaded</span>;
    
    const isImage = docPath.match(/\.(jpg|jpeg|png|gif)$/i);
    const isPDF = docPath.match(/\.pdf$/i);
    
    if (isImage) {
      return (
        <div className="document-item">
          <h4>{label}</h4>
          <img 
            src={`http://localhost:5001${docPath}`} 
            alt={label}
            className="document-preview"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNSAyNUgzNVYzNUgxNVYyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
            }}
          />
          <a href={`http://localhost:5001${docPath}`} target="_blank" rel="noopener noreferrer" className="view-link">
            View Full Size
          </a>
        </div>
      );
    } else if (isPDF) {
      return (
        <div className="document-item">
          <h4>{label}</h4>
          <div className="pdf-preview">
            📄 PDF Document
          </div>
          <a href={`http://localhost:5001${docPath}`} target="_blank" rel="noopener noreferrer" className="view-link">
            Open PDF
          </a>
        </div>
      );
    }
    
    return <span className="no-document">Invalid document format</span>;
  };

  if (loading) return <div className="loading">Loading pending doctors...</div>;

  return (
    <div className="doctor-verification">
      <h2>Doctor Verification</h2>
      {error && <div className="error">{error}</div>}
      
      {selectedDoctor ? (
        <div className="document-viewer">
          <div className="viewer-header">
            <h3>Documents for Dr. {selectedDoctor.name}</h3>
            <button onClick={() => setSelectedDoctor(null)} className="back-btn">
              ← Back to List
            </button>
          </div>
          
          <div className="doctor-info">
            <p><strong>Email:</strong> {selectedDoctor.email}</p>
            <p><strong>Specialization:</strong> {selectedDoctor.specialization}</p>
            <p><strong>License Number:</strong> {selectedDoctor.licenseNumber}</p>
          </div>

          <div className="documents-grid">
            {renderDocument(selectedDoctor.profilePhoto, 'Profile Photo')}
            {renderDocument(selectedDoctor.medicalLicense, 'Medical License')}
            {renderDocument(selectedDoctor.idDocument, 'ID Document')}
            {renderDocument(selectedDoctor.medicalDegree, 'Medical Degree')}
          </div>

          <div className="verification-actions">
            <button 
              onClick={() => handleVerification(selectedDoctor._id, 'verify')}
              className="btn-verify"
            >
              ✓ Verify Doctor
            </button>
            <button 
              onClick={() => handleVerification(selectedDoctor._id, 'reject')}
              className="btn-reject"
            >
              ✗ Reject Application
            </button>
          </div>
        </div>
      ) : (
        <div className="pending-list">
          {pendingDoctors.length === 0 ? (
            <p>No pending doctor verifications.</p>
          ) : (
            pendingDoctors.map(doctor => (
              <div key={doctor._id} className="doctor-card">
                <div className="doctor-basic-info">
                  <h3>{doctor.name}</h3>
                  <p><strong>Email:</strong> {doctor.email}</p>
                  <p><strong>Specialization:</strong> {doctor.specialization}</p>
                  <p><strong>License Number:</strong> {doctor.licenseNumber}</p>
                </div>
                
                <div className="doctor-status">
                  <div className="documents-status">
                    {doctor.profilePhoto ? '✓ Photo' : '✗ Photo'} | 
                    {doctor.medicalLicense ? '✓ License' : '✗ License'} | 
                    {doctor.idDocument ? '✓ ID' : '✗ ID'} | 
                    {doctor.medicalDegree ? '✓ Degree' : '✗ Degree'}
                  </div>
                </div>

                <div className="card-actions">
                  <button 
                    onClick={() => viewDocuments(doctor)}
                    className="btn-view-docs"
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
