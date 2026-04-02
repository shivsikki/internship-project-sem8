import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

const DocumentUpload = ({ onUploadComplete }) => {
  const [files, setFiles] = useState({
    profilePhoto: null,
    medicalLicense: null,
    idDocument: null,
    medicalDegree: null
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (fileList[0]) {
      setFiles(prev => ({
        ...prev,
        [name]: fileList[0]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    const formData = new FormData();
    
    // Only append files that exist
    Object.keys(files).forEach(key => {
      if (files[key]) {
        formData.append(key, files[key]);
      }
    });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/auth/upload-documents', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert('Documents uploaded successfully! Your verification is now pending admin review.');
        onUploadComplete();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="document-upload">
      <h3>Upload Verification Documents</h3>
      <p>Please upload the following documents to verify your identity:</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="upload-grid">
          <div className="upload-item">
            <label>Profile Photo *</label>
            <input
              type="file"
              name="profilePhoto"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            {files.profilePhoto && <span className="file-name">{files.profilePhoto.name}</span>}
          </div>

          <div className="upload-item">
            <label>Medical License *</label>
            <input
              type="file"
              name="medicalLicense"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              required
            />
            {files.medicalLicense && <span className="file-name">{files.medicalLicense.name}</span>}
          </div>

          <div className="upload-item">
            <label>ID Document (Aadhar/Passport) *</label>
            <input
              type="file"
              name="idDocument"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              required
            />
            {files.idDocument && <span className="file-name">{files.idDocument.name}</span>}
          </div>

          <div className="upload-item">
            <label>Medical Degree Certificate *</label>
            <input
              type="file"
              name="medicalDegree"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              required
            />
            {files.medicalDegree && <span className="file-name">{files.medicalDegree.name}</span>}
          </div>
        </div>

        <button type="submit" className="auth-button" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Documents'}
        </button>
      </form>
    </div>
  );
};

export default DocumentUpload;
