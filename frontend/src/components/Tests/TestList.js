import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import GlitchText from '../GlitchText/GlitchText';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './Tests.css';

const TestList = ({ patientId, userRole }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    testResults: '',
    notes: '',
    status: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);

  useEffect(() => {
    fetchTests();
  }, [patientId]);

  const fetchTests = async () => {
    try {
      const token = sessionStorage.getItem('token');
      let endpoint = '';

      if (userRole === 'patient') {
        endpoint = `/api/tests/patient/${patientId}`;
      } else if (userRole === 'doctor') {
        endpoint = '/api/tests/doctor';
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setTests(response.data.tests);
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (testId) => {
    try {
      const token = sessionStorage.getItem('token');
      const updateData = {};
      if (updateForm.testResults) updateData.testResults = updateForm.testResults;
      if (updateForm.notes !== undefined) updateData.notes = updateForm.notes;
      if (updateForm.status) updateData.status = updateForm.status;

      const response = await axios.put(`/api/tests/${testId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedTest(null);
        setUpdateForm({ testResults: '', notes: '', status: '' });
        fetchTests();
        alert('Test updated successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update test');
    }
  };

  const handlePatientUpload = async (testId) => {
    if (selectedFiles.length === 0 && !updateForm.notes) {
      alert('Please provide a note or at least one image.');
      return;
    }

    setUploading(true);
    try {
      const token = sessionStorage.getItem('token');
      const uploadedImages = [];

      // Upload each file to Cloudinary
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('image', file);

        const res = await axios.post('/api/upload', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (res.data.success) {
          uploadedImages.push({ url: res.data.url, fileName: res.data.fileName });
        }
      }

      // Update the test record
      await axios.put(`/api/tests/${testId}`, {
        images: uploadedImages,
        notes: updateForm.notes,
        status: 'completed'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Results uploaded successfully! Your doctor has been notified.');
      setSelectedTest(null);
      setSelectedFiles([]);
      setUpdateForm({ testResults: '', notes: '', status: '' });
      fetchTests();
    } catch (err) {
      console.error('Patient upload error:', err);
      alert('Failed to upload results.');
    } finally {
      setUploading(false);
    }
  };


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const downloadPDF = (t) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 48;
    let y = 60;

    // Header
    doc.setFillColor(63, 80, 56);
    doc.rect(0, 0, pageW, 44, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('HIPPOCRATES LAB — DIAGNOSTIC REPORT', margin, 28);

    y = 70;

    // Status & Date Header
    const statusColors = { completed: [220, 252, 231], pending: [254, 249, 195], cancelled: [254, 226, 226] };
    const statusText = { completed: [22, 101, 52], pending: [133, 77, 14], cancelled: [239, 68, 68] };
    const sc = statusColors[t.status] || [243, 244, 246];
    const st = statusText[t.status] || [75, 85, 99];

    doc.setFillColor(...sc);
    doc.roundedRect(pageW - margin - 80, y, 80, 22, 5, 5, 'F');
    doc.setTextColor(...st);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(t.status.toUpperCase(), pageW - margin - 40, y + 14, { align: 'center' });

    doc.setFillColor(247, 249, 246);
    doc.roundedRect(margin, y, 200, 44, 8, 8, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TEST DATE', margin + 12, y + 16);
    doc.setTextColor(40, 60, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(formatDate(t.testDate), margin + 12, y + 34);

    y += 64;

    // Test Info
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('TEST NAME', margin, y);
    doc.setTextColor(40, 60, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(t.testName, margin, y + 20);

    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Type: ${t.testType}`, margin, y + 36);

    y += 56;

    // Body Checks Grid
    if (Object.keys(t.bodyCheck || {}).some(k => t.bodyCheck[k])) {
      doc.setTextColor(156, 163, 175);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('BODY CHECK PARAMETERS', margin, y);
      y += 14;

      const checks = [
        { label: 'BP', val: t.bodyCheck.bloodPressure },
        { label: 'HR', val: t.bodyCheck.heartRate ? `${t.bodyCheck.heartRate} bpm` : null },
        { label: 'TEMP', val: t.bodyCheck.temperature ? `${t.bodyCheck.temperature}°F` : null },
        { label: 'WEIGHT', val: t.bodyCheck.weight ? `${t.bodyCheck.weight} kg` : null },
        { label: 'BMI', val: t.bodyCheck.bmi },
        { label: 'O2', val: t.bodyCheck.oxygenLevel ? `${t.bodyCheck.oxygenLevel}%` : null }
      ].filter(c => c.val);

      doc.setFillColor(250, 250, 245);
      doc.roundedRect(margin, y, pageW - margin * 2, 40, 8, 8, 'F');

      let subX = margin + 20;
      checks.forEach(c => {
        doc.setTextColor(140, 140, 140);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(c.label, subX, y + 14);
        doc.setTextColor(60, 80, 60);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(String(c.val), subX, y + 28);
        subX += (pageW - margin * 2) / checks.length;
      });
      y += 54;
    }

    // Results & Notes
    const printField = (label, value) => {
      if (!value) return;
      doc.setTextColor(156, 163, 175);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(label, margin, y);
      doc.setTextColor(50, 62, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(value, pageW - margin * 2);
      doc.text(lines, margin, y + 14);
      y += 14 + lines.length * 13 + 12;
    };

    printField('DIAGNOSTIC RESULTS', t.testResults);
    printField('CLINICAL NOTES', t.notes);

    // Footer
    doc.setFillColor(245, 245, 240);
    doc.rect(0, doc.internal.pageSize.getHeight() - 36, pageW, 36, 'F');
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Generated by Hippocrates Lab Clinical Portal', margin, doc.internal.pageSize.getHeight() - 14);
    doc.text(new Date().toLocaleDateString(), pageW - margin, doc.internal.pageSize.getHeight() - 14, { align: 'right' });

    doc.save(`test_report_${t._id?.slice(-6) || 'record'}.pdf`);
  };

  if (loading) {
    return <div className="tests-loading">Loading tests...</div>;
  }

  const zoomImage = (url) => {
    setExpandedImage(url);
  };

  return (
    <div className="tests-list-container">
      {tests.length === 0 ? (
        <div className="empty-state-center page-block">
          <GlitchText speed={1} enableShadows enableOnHover={false}>
            No Records
          </GlitchText>
        </div>
      ) : (
        <>
          {/* History / Assigned Section comes FIRST now */}
          <div className="tests-section">
            <h3 className="section-subtitle-modern">Assigned Tests & Medical Records</h3>
            <div className="tests-grid">
              {tests.filter(t => t.status !== 'pending').map((test, index) => (
                <div
                  key={test._id}
                  className={`test-card-item card-animated status-${test.status}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="test-card-top">
                    <div className="test-date-block">
                      <span className="test-date-label">COMPLETED ON</span>
                      <span className="test-date-value">{formatDate(test.testDate)}</span>
                    </div>
                    <span className={`test-status-pill status-${test.status}`}>
                      {test.status}
                    </span>
                  </div>

                  <div className="test-card-body">
                    <div className="test-main-section">
                      <span className="v2-label">{test.testType}</span>
                      <h4 className="test-main-title">{test.testName}</h4>
                      {test.doctor && (
                        <p className="test-physician-tag">Physician: Dr. {test.doctor.name}</p>
                      )}
                    </div>

                    {test.images && test.images.length > 0 && (
                      <div className="test-card-images">
                        {test.images.map((img, idx) => (
                          <div 
                            key={idx} 
                            className="card-thumb-wrapper"
                            onClick={() => zoomImage(img.url)}
                          >
                            <img src={img.url} alt="Result scan" />
                          </div>
                        ))}
                      </div>
                    )}

                    {Object.keys(test.bodyCheck || {}).some(key => test.bodyCheck[key]) && (
                      <div className="test-stats-grid">
                        {test.bodyCheck.bloodPressure && (
                          <div className="stat-pill"><span className="stat-label">BP</span>{test.bodyCheck.bloodPressure}</div>
                        )}
                        {test.bodyCheck.heartRate && (
                          <div className="stat-pill"><span className="stat-label">HR</span>{test.bodyCheck.heartRate} bpm</div>
                        )}
                        {test.bodyCheck.oxygenLevel && (
                          <div className="stat-pill"><span className="stat-label">O2</span>{test.bodyCheck.oxygenLevel}%</div>
                        )}
                        {test.bodyCheck.weight && (
                          <div className="stat-pill"><span className="stat-label">WT</span>{test.bodyCheck.weight}kg</div>
                        )}
                      </div>
                    )}

                    {test.testResults && (
                      <div className="test-results-block">
                        <span className="v2-label">RESULTS SUMMARY</span>
                        <p className="test-text-content">{test.testResults}</p>
                      </div>
                    )}
                  </div>

                  <div className="test-actions-row">
                    <button className="download-pdf-btn" onClick={() => downloadPDF(test)}>
                      ↓ Report PDF
                    </button>
                    {userRole === 'doctor' && (
                      <button onClick={() => setSelectedTest(test)} className="update-button">
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending / Ordered Section comes BELOW now */}
          {tests.some(t => t.status === 'pending') && (
            <div className="tests-section">
              <h3 className="section-subtitle-modern">Ordered Tests Awaiting Action</h3>
              <div className="tests-grid">
                {tests.filter(t => t.status === 'pending').map((test, index) => (
                  <div
                    key={test._id}
                    className={`test-card-item card-animated status-pending`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="test-card-top">
                      <div className="test-date-block">
                        <span className="test-date-label">ORDERED ON</span>
                        <span className="test-date-value">{formatDate(test.createdAt || test.testDate)}</span>
                      </div>
                      <span className="test-status-pill status-pending">Action Required</span>
                    </div>
                    <div className="test-card-body">
                      <div className="test-main-section">
                        <span className="v2-label">{test.testType}</span>
                        <h4 className="test-main-title">{test.testName}</h4>
                        {test.doctor && (
                          <p className="test-physician-tag">By Dr. {test.doctor.name}</p>
                        )}
                      </div>
                      <div className="test-pending-info">
                        <p>This test order has been sent to your profile. Please upload results or visit the clinic for sample collection.</p>
                      </div>
                    </div>
                    <div className="test-actions-row">
                      {userRole === 'doctor' ? (
                        <button onClick={() => setSelectedTest(test)} className="update-button">Update Status</button>
                      ) : (
                        <button onClick={() => setSelectedTest(test)} className="update-button">Provide Details / Upload</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Doctor Update Modal */}
      {selectedTest && userRole === 'doctor' && (
        <div className="modal-overlay" onClick={() => setSelectedTest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="section-title">Update Test Record</h3>
            <div className="form-group">
              <label>Test Results</label>
              <textarea
                value={updateForm.testResults || selectedTest.testResults || ''}
                onChange={(e) => setUpdateForm({ ...updateForm, testResults: e.target.value })}
                className="form-textarea"
                rows="4"
                placeholder="Enter test results..."
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={updateForm.status || selectedTest.status}
                onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                className="form-select"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={updateForm.notes !== '' ? updateForm.notes : (selectedTest.notes || '')}
                onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                className="form-textarea"
                rows="3"
                placeholder="Additional notes..."
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => handleUpdate(selectedTest._id)} className="submit-button">
                Update Record
              </button>
              <button
                onClick={() => {
                  setSelectedTest(null);
                  setUpdateForm({ testResults: '', notes: '', status: '' });
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Upload Modal - Portal Rendering */}
      {selectedTest && userRole === 'patient' && createPortal(
        <div className="modal-overlay glass-overlay" onClick={() => setSelectedTest(null)}>
          <div className="modal-content patient-upload-modal modern-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="section-title">Upload Results: {selectedTest.testName}</h3>
              <button className="close-x" onClick={() => setSelectedTest(null)}>&times;</button>
            </div>

            <p className="modal-instruction">Please upload your laboratory scans or diagnostic reports and add any relevant notes for your physician.</p>

            <div className="form-group">
              <label>Medical Images / Scans</label>
              <div className="file-upload-zone">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                  id="patient-file-input"
                  className="hidden-file-input"
                />
                <label htmlFor="patient-file-input" className="file-upload-label">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  {selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'Click to select images/scans'}
                </label>
              </div>
              {selectedFiles.length > 0 && (
                <div className="file-preview-list">
                  {selectedFiles.map((f, i) => (
                    <div key={i} className="preview-snippet">{f.name}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Clinical Notes</label>
              <textarea
                value={updateForm.notes}
                onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                className="form-textarea"
                rows="4"
                placeholder="Ex: I felt slightly dizzy during the blood collection..."
              />
            </div>

            <div className="modal-actions full-width">
              <button
                onClick={() => handlePatientUpload(selectedTest._id)}
                className="submit-button primary"
                disabled={uploading}
              >
                {uploading ? 'Uploading Clinical Data...' : 'Send to Doctor'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Image Zoom Overlay for Patients */}
      {expandedImage && (
        <div className="image-zoom-overlay" onClick={() => setExpandedImage(null)}>
          <img src={expandedImage} alt="Expanded Scan" />
          <button className="zoom-close" onClick={() => setExpandedImage(null)}>&times;</button>
        </div>
      )}
    </div>
  );
};

export default TestList;
