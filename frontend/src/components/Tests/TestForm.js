import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './Tests.css';

const TestForm = ({ appointment, onSuccess, mode = 'upload' }) => {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patientId: appointment?.patient?._id || '',
    appointmentId: appointment?._id || '',
    testType: 'laboratory',
    testName: '',
    testDate: new Date().toISOString().split('T')[0],
    bodyCheck: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
      height: '',
      bmi: '',
      oxygenLevel: '',
      other: ''
    },
    testResults: '',
    notes: '',
    images: [],
    labResults: Array.from({ length: 5 }, () => ({ parameter: '', value: '', unit: '', referenceRange: '' })),
    status: mode === 'request' ? 'pending' : 'completed'
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!appointment) {
      fetchPatients();
    } else {
      setFormData(prev => ({
        ...prev,
        patientId: appointment.patient._id,
        appointmentId: appointment._id
      }));
    }
  }, [appointment]);

  useEffect(() => {
    // Update status if mode changes
    setFormData(prev => ({
      ...prev,
      status: mode === 'request' ? 'pending' : 'completed'
    }));
  }, [mode]);

  const fetchPatients = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get('/api/appointments/doctor', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const uniquePatients = [...new Map(response.data.appointments.map(a => [a.patient._id, a.patient])).values()];
        setPatients(uniquePatients);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  const handleBodyCheckChange = (field, value) => {
    setFormData({
      ...formData,
      bodyCheck: {
        ...formData.bodyCheck,
        [field]: value
      }
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setImageUploading(true);
    const token = sessionStorage.getItem('token');

    try {
      const uploadedImages = [];
      for (const file of files) {
        const uploadData = new FormData();
        uploadData.append('image', file);

        const response = await axios.post('/api/upload', uploadData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          uploadedImages.push({
            url: response.data.url,
            fileName: response.data.fileName
          });
        }
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));
    } catch (err) {
      console.error('Image upload failed', err);
      setError('Failed to upload images. Check file size or credentials.');
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== indexToRemove)
    }));
  };

  const addLabResult = () => {
    setFormData(prev => ({
      ...prev,
      labResults: [...prev.labResults, { parameter: '', value: '', unit: '', referenceRange: '' }]
    }));
  };

  const removeLabResult = (index) => {
    setFormData(prev => ({
      ...prev,
      labResults: prev.labResults.filter((_, i) => i !== index)
    }));
  };

  const handleLabResultChange = (index, field, value) => {
    const newLabResults = [...formData.labResults];
    newLabResults[index][field] = value;
    setFormData(prev => ({
      ...prev,
      labResults: newLabResults
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.testName) {
      setError('Please enter test name');
      setLoading(false);
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post('/api/tests/create', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess(mode === 'request' ? 'Diagnostic request dispatched to patient!' : 'Test record created successfully!');
        setFormData({
          patientId: '',
          appointmentId: '',
          testType: 'laboratory',
          testName: '',
          testDate: new Date().toISOString().split('T')[0],
          bodyCheck: {
            bloodPressure: '',
            heartRate: '',
            temperature: '',
            weight: '',
            height: '',
            bmi: '',
            oxygenLevel: '',
            other: ''
          },
          testResults: '',
          notes: '',
          images: [],
          labResults: Array(5).fill({ parameter: '', value: '', unit: '', referenceRange: '' }),
          status: mode === 'request' ? 'pending' : 'completed'
        });
        if (onSuccess) onSuccess();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create test record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`test-form-container view-fade-in ${mode === 'request' ? 'request-mode-active' : ''}`}>
      <header className="tests-list-hero">
        <div className="tests-hero-bg" aria-hidden="true" />
        <div className="tests-hero-content">
          <p className="tests-hero-eyebrow">{mode === 'request' ? 'Clinical Orders' : 'Medical Records'}</p>
          <AnimatedHeading text={mode === 'request' ? 'Request Patient Test' : 'Create Test Record'} />
          <p className="tests-hero-subtitle">
            {mode === 'request'
              ? 'Instruct the patient to perform a diagnostic test at a nearby facility.'
              : 'Directly record clinical findings and diagnostic results into the patient profile.'}
          </p>
        </div>
      </header>

      {/* SUCCESS/ERROR MESSAGES */}
      <div style={{ padding: '0 10px' }}>
        {error && <div className="error-message" style={{ marginBottom: '20px' }}>{error}</div>}
        {success && <div className="success-message" style={{ marginBottom: '20px' }}>{success}</div>}
      </div>

      <form onSubmit={handleSubmit} className="custom-test-grid">
        {/* LEFT COLUMN: SETUP */}
        <div className="test-col-left">
          <div className="v2-section-group">
            <span className="v2-label">Patient</span>
            {!appointment ? (
              <div className="patient-pill-selector">
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  required
                  className="patient-select-pill"
                >
                  <option value="">Choose a patient...</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
                <div className="patient-select-caret">⌄</div>
              </div>
            ) : (
              <div className="patient-pill-card">
                <div className="patient-pill-avatar">
                  {appointment.patient?.name?.charAt(0) || 'P'}
                </div>
                <div className="patient-pill-info">
                  <strong>{appointment.patient?.name || 'Patient'}</strong>
                  <span>ID: #{appointment.patient?._id?.substring(0, 6).toUpperCase() || 'UNKNOWN'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="v2-section-group">
            <span className="v2-label">Diagnostic Category</span>
            <select
              value={formData.testType}
              onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
              required
              className="v2-input-pill"
            >
              <option value="laboratory">Laboratory Test</option>
              <option value="body-check">Body Check</option>
              <option value="xray">X-Ray (Radiography)</option>
              <option value="mri">MRI (Magnetic Resonance Imaging)</option>
              <option value="ct">CT Scan (Computed Tomography)</option>
              <option value="ultrasound">Ultrasound (Sonography)</option>
              <option value="pet">PET Scan (Positron Emission Tomography)</option>
              <option value="dexa">DEXA Scan (Bone Density)</option>
              <option value="mammography">Mammography</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="v2-section-group">
            <span className="v2-label">Test / Scan Name</span>
            <input
              type="text"
              value={formData.testName}
              onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
              required
              placeholder="e.g., Blood Test, Upper GI X-Ray"
              className="v2-input-pill"
            />
          </div>

          <div className="v2-section-group">
            <span className="v2-label">{mode === 'request' ? 'Test Deadline Date' : 'Test Date'}</span>
            <div className="date-input-wrapper">
              <input
                type="date"
                value={formData.testDate}
                onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                required
                className="v2-input-pill"
              />
            </div>
          </div>

          {mode !== 'request' && (
            <div className="v2-section-group">
              <span className="v2-label">Order Status</span>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="v2-input-pill"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}

          {mode == 'request' && (
            <div className="v2-section-group">
              <span className="v2-label">Upload Deadline</span>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  value={formData.uploadDeadline}
                  onChange={(e) => setFormData({ ...formData, uploadDeadline: e.target.value })}
                  required
                  className="v2-input-pill"
                />
              </div>
            </div>
          )}
        </div>

        {/* CENTER COLUMN: DYNAMIC CONTENT (Hidden in Request Mode) */}
        {mode !== 'request' && (
          <div className="test-col-center">
            {/* 1. LABORATORY TEST VIEW */}
            {formData.testType === 'laboratory' && (
              <div className="floating-test-card">
                <div className="lab-card-header">
                  <div className="lab-title-group">
                    <h3 className="test-card-title">Laboratory Parameters</h3>
                    <div className="status-tip-pill">
                      <span className="tip-dot"></span>
                      Customize the parameters accordingly
                    </div>
                  </div>
                  <button type="button" onClick={addLabResult} className="add-param-btn">+ Add Parameter</button>
                </div>
                <div className="lab-results-header">
                  <span>Parameter</span>
                  <span>Value</span>
                  <span>Unit</span>
                  <span>Ref. Range</span>
                </div>
                <div className="lab-results-body">
                  {formData.labResults.map((result, idx) => (
                    <div key={idx} className="lab-result-row">
                      <input
                        type="text"
                        placeholder="Glucose"
                        value={result.parameter}
                        onChange={(e) => handleLabResultChange(idx, 'parameter', e.target.value)}
                        className="v2-input-pill-mini"
                      />
                      <input
                        type="text"
                        placeholder="95"
                        value={result.value}
                        onChange={(e) => handleLabResultChange(idx, 'value', e.target.value)}
                        className="v2-input-pill-mini"
                      />
                      <select
                        value={result.unit}
                        onChange={(e) => handleLabResultChange(idx, 'unit', e.target.value)}
                        className="v2-input-pill-mini"
                      >
                        <option value="">Unit</option>
                        <option value="mg/dL">mg/dL</option>
                        <option value="g/dL">g/dL</option>
                        <option value="mmol/L">mmol/L</option>
                        <option value="µmol/L">µmol/L</option>
                        <option value="cells/mcL">cells/mcL</option>
                        <option value="IU/L">IU/L</option>
                        <option value="U/L">U/L</option>
                        <option value="%">%</option>
                        <option value="pg">pg</option>
                        <option value="fL">fL</option>
                        <option value="mEq/L">mEq/L</option>
                        <option value="ng/mL">ng/mL</option>
                        <option value="unitless">unitless</option>
                      </select>
                      <input
                        type="text"
                        placeholder="70-100"
                        value={result.referenceRange}
                        onChange={(e) => handleLabResultChange(idx, 'referenceRange', e.target.value)}
                        className="v2-input-pill-mini"
                      />
                      {formData.labResults.length > 1 && (
                        <button type="button" onClick={() => removeLabResult(idx)} className="remove-param-btn">×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. IMAGING VIEW (X-RAY, MRI, etc) */}
            {['xray', 'mri', 'ct', 'ultrasound', 'pet', 'dexa', 'mammography'].includes(formData.testType) && (
              <>
                <div className="floating-test-card">
                  <h3 className="test-card-title">Imaging Scans</h3>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 10px 0' }}>
                    Upload diagnostic images related to this scan.
                  </p>
                  <div className="image-upload-zone">
                    <label className="upload-btn">
                      {imageUploading ? 'Uploading...' : '+ Upload Image(s)'}
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        hidden
                        disabled={imageUploading}
                      />
                    </label>
                  </div>
                  {formData.images.length > 0 && (
                    <div className="image-preview-grid">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="preview-thumbnail">
                          <img src={img.url} alt={img.fileName} />
                          <button type="button" onClick={() => removeImage(idx)} className="remove-img-btn">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="floating-test-card">
                  <h3 className="test-card-title">Diagnostic Findings</h3>
                  <textarea
                    value={formData.testResults}
                    onChange={(e) => setFormData({ ...formData, testResults: e.target.value })}
                    placeholder="Radiologist's report/findings..."
                    className="v2-input-pill"
                    rows="4"
                    style={{ padding: '15px', borderRadius: '20px' }}
                  />
                </div>
              </>
            )}

            {/* 3. BODY CHECK VIEW */}
            {formData.testType === 'body-check' && (
              <div className="floating-test-card">
                <h3 className="test-card-title">Clinical Vitals</h3>
                <div className="vitals-grid">
                  <div className="vital-item">
                    <span className="v2-label">BP (mmHg)</span>
                    <input
                      type="text"
                      value={formData.bodyCheck.bloodPressure}
                      onChange={(e) => handleBodyCheckChange('bloodPressure', e.target.value)}
                      placeholder="120/80"
                      className="v2-input-pill"
                    />
                  </div>
                  <div className="vital-item">
                    <span className="v2-label">HR (bpm)</span>
                    <input
                      type="text"
                      value={formData.bodyCheck.heartRate}
                      onChange={(e) => handleBodyCheckChange('heartRate', e.target.value)}
                      placeholder="72"
                      className="v2-input-pill"
                    />
                  </div>
                  <div className="vital-item">
                    <span className="v2-label">Temp (°F)</span>
                    <input
                      type="text"
                      value={formData.bodyCheck.temperature}
                      onChange={(e) => handleBodyCheckChange('temperature', e.target.value)}
                      placeholder="98.6"
                      className="v2-input-pill"
                    />
                  </div>
                  <div className="vital-item">
                    <span className="v2-label">O2 (%)</span>
                    <input
                      type="text"
                      value={formData.bodyCheck.oxygenLevel}
                      onChange={(e) => handleBodyCheckChange('oxygenLevel', e.target.value)}
                      placeholder="98"
                      className="v2-input-pill"
                    />
                  </div>
                </div>
                <div className="v2-section-group" style={{ marginTop: '20px' }}>
                  <span className="v2-label">Physical Examination Notes</span>
                  <textarea
                    value={formData.testResults}
                    onChange={(e) => setFormData({ ...formData, testResults: e.target.value })}
                    placeholder="Describe overall appearance, palpation, auscultation findings..."
                    className="v2-input-pill"
                    rows="6"
                    style={{ padding: '15px', borderRadius: '20px' }}
                  />
                </div>
              </div>
            )}

            {/* 4. OTHER VIEW (DEFAULT) */}
            {!['laboratory', 'body-check', 'xray', 'mri', 'ct', 'ultrasound', 'pet', 'dexa', 'mammography'].includes(formData.testType) && (
              <div className="floating-test-card">
                <h3 className="test-card-title">Test Results / Findings</h3>
                <textarea
                  value={formData.testResults}
                  onChange={(e) => setFormData({ ...formData, testResults: e.target.value })}
                  placeholder="Enter detailed test findings here..."
                  className="v2-input-pill"
                  rows="8"
                  style={{ padding: '20px', borderRadius: '20px' }}
                />
              </div>
            )}
          </div>
        )}

        {/* RIGHT COLUMN: ACTIONS & RULES */}
        <div className="test-col-right">
          <div className="v2-section-group">
            <button type="submit" className="finalize-pill-btn" disabled={loading}>
              {loading ? 'Processing...' : (mode === 'request' ? 'Dispatch Diagnostic Request' : 'Finalize Test Record')}
            </button>
          </div>

          <div className="rules-sage-card">
            <span className="v2-label" style={{ color: '#3f5038', display: 'block', marginBottom: '16px' }}>
              {mode === 'request' ? 'Request Checklist' : 'Verification Checklist'}
            </span>
            <ul className="rules-checklist">
              {mode === 'request' ? (
                <>
                  <li>Verify clinical need?</li>
                  <li>Instructions clear?</li>
                  <li>Target laboratory set?</li>
                  <li>Timeframe specified?</li>
                </>
              ) : (
                <>
                  <li>Confirm clinical question?</li>
                  <li>Check recent duplicate?</li>
                  <li>Reference ranges check?</li>
                  <li>Document findings?</li>
                </>
              )}
            </ul>
          </div>

          <div className="v2-section-group" style={{ marginTop: 'auto' }}>
            <span className="v2-label">{mode === 'request' ? 'Specific Instructions for Patient' : 'Internal Clinician Notes'}</span>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={mode === 'request' ? "Please visit the nearest laboratory and upload the results here..." : "Private case notes..."}
              className="v2-input-pill"
              rows="4"
              style={{ height: '150px', padding: '15px' }}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default TestForm;

