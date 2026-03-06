import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdvancedAIFeatures.css';

const AdvancedAIFeatures = ({ user }) => {
  const [activeFeature, setActiveFeature] = useState('symptom-checker');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  // Symptom Checker States
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState('moderate');
  const [age, setAge] = useState(user?.age || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Health Analytics States
  const [timeframe, setTimeframe] = useState('3months');
  const [analyticsData, setAnalyticsData] = useState(null);

  // Smart Reminders States
  const [reminderPreferences, setReminderPreferences] = useState(['medications', 'appointments', 'tests']);
  const [reminders, setReminders] = useState([]);

  // AI Triage States
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [vitalSigns, setVitalSigns] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenLevel: ''
  });
  const [triageSymptoms, setTriageSymptoms] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  // Emergency Detection States
  const [emergencySymptoms, setEmergencySymptoms] = useState('');
  const [emergencyVitals, setEmergencyVitals] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenLevel: '',
    consciousness: 'alert'
  });
  const [situation, setSituation] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (user) {
      setAge(user.age || '');
      setGender(user.gender || '');
    }
  }, [user]);

  // Symptom Checker Handler
  const handleSymptomCheck = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      const symptomsArray = symptoms.split(',').map(s => s.trim()).filter(s => s);

      const response = await axios.post('/api/ai/symptom-checker', {
        symptoms: symptomsArray,
        duration,
        severity,
        age,
        gender,
        additionalInfo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setResults(response.data.data);
      } else {
        setError(response.data.message || 'Failed to analyze symptoms');
      }
    } catch (err) {
      console.error('Symptom checker error:', err);
      setError(err.response?.data?.message || 'Failed to analyze symptoms');
    } finally {
      setLoading(false);
    }
  };

  // Health Analytics Handler
  const handleHealthAnalytics = async () => {
    setLoading(true);
    setError('');
    setAnalyticsData(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/ai/health-analytics', {
        userId: user._id,
        timeframe
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAnalyticsData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to generate health analytics');
      }
    } catch (err) {
      console.error('Health analytics error:', err);
      setError(err.response?.data?.message || 'Failed to generate health analytics');
    } finally {
      setLoading(false);
    }
  };

  // Smart Reminders Handler
  const handleSmartReminders = async () => {
    setLoading(true);
    setError('');
    setReminders([]);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/ai/smart-reminders', {
        userId: user._id,
        preferences: reminderPreferences
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setReminders(response.data.data);
      } else {
        setError(response.data.message || 'Failed to generate smart reminders');
      }
    } catch (err) {
      console.error('Smart reminders error:', err);
      setError(err.response?.data?.message || 'Failed to generate smart reminders');
    } finally {
      setLoading(false);
    }
  };

  // AI Triage Handler
  const handleAITriage = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      const symptomsArray = triageSymptoms.split(',').map(s => s.trim()).filter(s => s);

      const response = await axios.post('/api/ai/ai-triage', {
        chiefComplaint,
        vitalSigns: Object.fromEntries(
          Object.entries(vitalSigns).filter(([_, value]) => value)
        ),
        symptoms: symptomsArray,
        medicalHistory,
        age,
        gender
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setResults(response.data.data);
      } else {
        setError(response.data.message || 'Failed to perform triage assessment');
      }
    } catch (err) {
      console.error('AI triage error:', err);
      setError(err.response?.data?.message || 'Failed to perform triage assessment');
    } finally {
      setLoading(false);
    }
  };

  // Emergency Detection Handler
  const handleEmergencyDetection = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      const symptomsArray = emergencySymptoms.split(',').map(s => s.trim()).filter(s => s);

      const response = await axios.post('/api/ai/emergency-detection', {
        symptoms: symptomsArray,
        vitalSigns: Object.fromEntries(
          Object.entries(emergencyVitals).filter(([_, value]) => value)
        ),
        situation,
        location,
        age,
        gender
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setResults(response.data.data);
      } else {
        setError(response.data.message || 'Failed to assess emergency situation');
      }
    } catch (err) {
      console.error('Emergency detection error:', err);
      setError(err.response?.data?.message || 'Failed to assess emergency situation');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (level) => {
    const colors = {
      'low': '#28a745',
      'medium': '#ffc107',
      'high': '#fd7e14',
      'emergency': '#dc3545',
      'Critical': '#dc3545',
      'Serious': '#fd7e14',
      'Urgent': '#ffc107',
      'Non-emergency': '#28a745'
    };
    return colors[level] || '#6c757d';
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#ffc107';
    if (score >= 40) return '#fd7e14';
    return '#dc3545';
  };

  return (
    <div className="advanced-ai-container">
      <div className="advanced-ai-header">
        <h2>🧠 Advanced AI Healthcare Features</h2>
        <p>Comprehensive AI-powered health analysis and emergency services</p>
      </div>

      <div className="feature-tabs">
        {[
          { id: 'symptom-checker', label: '🩺 Symptom Checker', icon: '🩺' },
          { id: 'health-analytics', label: '📊 Health Analytics', icon: '📊' },
          { id: 'smart-reminders', label: '🔔 Smart Reminders', icon: '🔔' },
          { id: 'ai-triage', label: '📱 AI Triage', icon: '📱' },
          { id: 'emergency-detection', label: '🏥 Emergency Detection', icon: '🏥' }
        ].map(feature => (
          <button
            key={feature.id}
            className={`feature-tab ${activeFeature === feature.id ? 'active' : ''}`}
            onClick={() => setActiveFeature(feature.id)}
          >
            <span className="feature-icon">{feature.icon}</span>
            <span className="feature-label">{feature.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Symptom Checker */}
      {activeFeature === 'symptom-checker' && (
        <div className="feature-content">
          <div className="feature-section">
            <h3>🩺 AI Symptom Checker</h3>
            <p>Describe your symptoms and get AI-powered analysis with medical recommendations</p>
            
            <form onSubmit={handleSymptomCheck} className="symptom-form">
              <div className="form-group">
                <label>Symptoms (comma-separated)</label>
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g., headache, fever, nausea, fatigue"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 2 days, 1 week"
                  />
                </div>

                <div className="form-group">
                  <label>Severity</label>
                  <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Age"
                  />
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Additional Information</label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Any other relevant information..."
                  rows="3"
                />
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Analyzing...' : '🔍 Analyze Symptoms'}
              </button>
            </form>

            {results && (
              <div className="results-card">
                <h4>Symptom Analysis Results</h4>
                <div className="analysis-grid">
                  <div className="analysis-item">
                    <label>Possible Conditions:</label>
                    <ul>
                      {results.analysis.possibleConditions?.map((condition, index) => (
                        <li key={index}>{condition}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-item">
                    <label>Urgency Level:</label>
                    <span 
                      className="urgency-badge"
                      style={{ backgroundColor: getUrgencyColor(results.analysis.urgencyLevel) }}
                    >
                      {results.analysis.urgencyLevel?.toUpperCase()}
                    </span>
                  </div>

                  <div className="analysis-item">
                    <label>Recommended Actions:</label>
                    <ul>
                      {results.analysis.recommendedActions?.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-item">
                    <label>Specialist Type:</label>
                    <p>{results.analysis.specialistType}</p>
                  </div>
                </div>

                <div className="disclaimer">
                  <p>⚠️ {results.analysis.disclaimer}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Health Analytics */}
      {activeFeature === 'health-analytics' && (
        <div className="feature-content">
          <div className="feature-section">
            <h3>📊 Health Analytics Dashboard</h3>
            <p>Get insights from your medical history and health patterns</p>
            
            <div className="analytics-controls">
              <div className="form-group">
                <label>Timeframe</label>
                <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                  <option value="1month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="1year">Last Year</option>
                </select>
              </div>

              <button onClick={handleHealthAnalytics} className="submit-button" disabled={loading}>
                {loading ? 'Analyzing...' : '📊 Generate Analytics'}
              </button>
            </div>

            {analyticsData && (
              <div className="analytics-dashboard">
                <div className="health-score-card">
                  <h4>Overall Health Score</h4>
                  <div 
                    className="score-circle"
                    style={{ color: getHealthScoreColor(analyticsData.analytics.healthScore) }}
                  >
                    {analyticsData.analytics.healthScore}/100
                  </div>
                </div>

                <div className="analytics-grid">
                  <div className="analytics-card">
                    <h5>Health Trends</h5>
                    <ul>
                      {analyticsData.analytics.trends?.map((trend, index) => (
                        <li key={index}>{trend}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analytics-card">
                    <h5>Medication Insights</h5>
                    <ul>
                      {analyticsData.analytics.medicationInsights?.map((insight, index) => (
                        <li key={index}>{insight}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analytics-card">
                    <h5>Appointment Compliance</h5>
                    <p className="compliance-badge">{analyticsData.analytics.appointmentCompliance}</p>
                  </div>

                  <div className="analytics-card">
                    <h5>Recommendations</h5>
                    <ul>
                      {analyticsData.analytics.recommendations?.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analytics-card">
                    <h5>Preventive Care</h5>
                    <ul>
                      {analyticsData.analytics.preventiveCare?.map((care, index) => (
                        <li key={index}>{care}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analytics-card">
                    <h5>Lifestyle Suggestions</h5>
                    <ul>
                      {analyticsData.analytics.lifestyleSuggestions?.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="analytics-summary">
                  <h4>Summary for {timeframe}</h4>
                  <div className="summary-stats">
                    <div className="stat-item">
                      <span className="stat-number">{analyticsData.summary.totalAppointments}</span>
                      <span className="stat-label">Appointments</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{analyticsData.summary.totalPrescriptions}</span>
                      <span className="stat-label">Prescriptions</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{analyticsData.summary.totalTests}</span>
                      <span className="stat-label">Tests</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Smart Reminders */}
      {activeFeature === 'smart-reminders' && (
        <div className="feature-content">
          <div className="feature-section">
            <h3>🔔 Smart Reminders</h3>
            <p>AI-powered personalized reminders for your healthcare needs</p>
            
            <div className="reminder-controls">
              <div className="form-group">
                <label>Reminder Preferences</label>
                <div className="checkbox-group">
                  {['medications', 'appointments', 'tests'].map(pref => (
                    <label key={pref} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={reminderPreferences.includes(pref)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setReminderPreferences([...reminderPreferences, pref]);
                          } else {
                            setReminderPreferences(reminderPreferences.filter(p => p !== pref));
                          }
                        }}
                      />
                      {pref.charAt(0).toUpperCase() + pref.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <button onClick={handleSmartReminders} className="submit-button" disabled={loading}>
                {loading ? 'Generating...' : '🔔 Generate Reminders'}
              </button>
            </div>

            {reminders.reminders && (
              <div className="reminders-dashboard">
                <div className="reminders-summary">
                  <h4>Generated Reminders</h4>
                  <div className="summary-stats">
                    <div className="stat-item">
                      <span className="stat-number">{reminders.summary.upcomingAppointments}</span>
                      <span className="stat-label">Upcoming Appointments</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{reminders.summary.activePrescriptions}</span>
                      <span className="stat-label">Active Prescriptions</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{reminders.summary.scheduledTests}</span>
                      <span className="stat-label">Scheduled Tests</span>
                    </div>
                  </div>
                </div>

                <div className="reminders-list">
                  {reminders.reminders.map((reminder, index) => (
                    <div key={index} className="reminder-card">
                      <div className="reminder-header">
                        <h5>{reminder.title}</h5>
                        <span className={`priority-badge ${reminder.priority}`}>
                          {reminder.priority}
                        </span>
                      </div>
                      <p>{reminder.description}</p>
                      <div className="reminder-details">
                        <span className="reminder-type">{reminder.type}</span>
                        <span className="reminder-frequency">{reminder.frequency}</span>
                        <span className="reminder-time">
                          {new Date(reminder.scheduledTime).toLocaleString()}
                        </span>
                      </div>
                      {reminder.actions && (
                        <div className="reminder-actions">
                          <strong>Actions:</strong>
                          <ul>
                            {reminder.actions.map((action, actionIndex) => (
                              <li key={actionIndex}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {reminders.insights && (
                  <div className="insights-section">
                    <h4>AI Insights</h4>
                    <ul>
                      {reminders.insights.map((insight, index) => (
                        <li key={index}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Triage */}
      {activeFeature === 'ai-triage' && (
        <div className="feature-content">
          <div className="feature-section">
            <h3>📱 AI-Powered Triage Assessment</h3>
            <p>Get priority assessment and care recommendations</p>
            
            <form onSubmit={handleAITriage} className="triage-form">
              <div className="form-group">
                <label>Chief Complaint *</label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g., chest pain, difficulty breathing, severe headache"
                  required
                />
              </div>

              <div className="form-group">
                <label>Vital Signs (if known)</label>
                <div className="vitals-grid">
                  <input
                    type="text"
                    placeholder="Blood Pressure (e.g., 120/80)"
                    value={vitalSigns.bloodPressure}
                    onChange={(e) => setVitalSigns({...vitalSigns, bloodPressure: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Heart Rate (bpm)"
                    value={vitalSigns.heartRate}
                    onChange={(e) => setVitalSigns({...vitalSigns, heartRate: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Temperature (°F/°C)"
                    value={vitalSigns.temperature}
                    onChange={(e) => setVitalSigns({...vitalSigns, temperature: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Oxygen Level (%)"
                    value={vitalSigns.oxygenLevel}
                    onChange={(e) => setVitalSigns({...vitalSigns, oxygenLevel: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Additional Symptoms</label>
                <input
                  type="text"
                  value={triageSymptoms}
                  onChange={(e) => setTriageSymptoms(e.target.value)}
                  placeholder="e.g., nausea, dizziness, shortness of breath"
                />
              </div>

              <div className="form-group">
                <label>Relevant Medical History</label>
                <textarea
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  placeholder="e.g., diabetes, heart disease, previous surgeries"
                  rows="3"
                />
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Assessing...' : '📱 Perform Triage Assessment'}
              </button>
            </form>

            {results && (
              <div className="triage-results">
                <div className="triage-header">
                  <h4>Triage Assessment Results</h4>
                  <div 
                    className="triage-level"
                    style={{ backgroundColor: getUrgencyColor(results.triage.priorityName) }}
                  >
                    Level {results.triage.triageLevel}: {results.triage.priorityName}
                  </div>
                </div>

                <div className="triage-grid">
                  <div className="triage-item">
                    <label>Recommended Care:</label>
                    <p>{results.triage.recommendedCare}</p>
                  </div>

                  <div className="triage-item">
                    <label>Estimated Wait Time:</label>
                    <p>{results.triage.estimatedWaitTime}</p>
                  </div>

                  <div className="triage-item">
                    <label>Immediate Actions:</label>
                    <ul>
                      {results.triage.immediateActions?.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="triage-item">
                    <label>Red Flags:</label>
                    <ul>
                      {results.triage.redFlags?.map((flag, index) => (
                        <li key={index} className="red-flag">{flag}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="triage-item">
                    <label>Recommended Tests:</label>
                    <ul>
                      {results.triage.recommendedTests?.map((test, index) => (
                        <li key={index}>{test}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="triage-item">
                    <label>Specialist Needed:</label>
                    <p>{results.triage.specialistNeeded}</p>
                  </div>
                </div>

                <div className="disclaimer">
                  <p>⚠️ {results.triage.disclaimer}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emergency Detection */}
      {activeFeature === 'emergency-detection' && (
        <div className="feature-content">
          <div className="feature-section emergency-section">
            <h3>🏥 Emergency Detection & Response</h3>
            <p>AI-powered emergency assessment with immediate action recommendations</p>
            
            <form onSubmit={handleEmergencyDetection} className="emergency-form">
              <div className="form-group">
                <label>Emergency Symptoms</label>
                <input
                  type="text"
                  value={emergencySymptoms}
                  onChange={(e) => setEmergencySymptoms(e.target.value)}
                  placeholder="e.g., chest pain, difficulty breathing, severe bleeding"
                />
              </div>

              <div className="form-group">
                <label>Current Situation</label>
                <textarea
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  placeholder="Describe what is happening..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Vital Signs (if available)</label>
                <div className="vitals-grid">
                  <input
                    type="text"
                    placeholder="Blood Pressure"
                    value={emergencyVitals.bloodPressure}
                    onChange={(e) => setEmergencyVitals({...emergencyVitals, bloodPressure: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Heart Rate"
                    value={emergencyVitals.heartRate}
                    onChange={(e) => setEmergencyVitals({...emergencyVitals, heartRate: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Temperature"
                    value={emergencyVitals.temperature}
                    onChange={(e) => setEmergencyVitals({...emergencyVitals, temperature: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Oxygen Level"
                    value={emergencyVitals.oxygenLevel}
                    onChange={(e) => setEmergencyVitals({...emergencyVitals, oxygenLevel: e.target.value})}
                  />
                  <select
                    value={emergencyVitals.consciousness}
                    onChange={(e) => setEmergencyVitals({...emergencyVitals, consciousness: e.target.value})}
                  >
                    <option value="alert">Alert</option>
                    <option value="drowsy">Drowsy</option>
                    <option value="confused">Confused</option>
                    <option value="unresponsive">Unresponsive</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Current location or address"
                />
              </div>

              <button type="submit" className="emergency-submit-button" disabled={loading}>
                {loading ? 'Assessing...' : '🚨 Assess Emergency Situation'}
              </button>
            </form>

            {results && (
              <div className={`emergency-results ${results.assessment.isEmergency ? 'emergency' : 'non-emergency'}`}>
                <div className="emergency-header">
                  <h4>Emergency Assessment</h4>
                  <div 
                    className="emergency-level"
                    style={{ backgroundColor: getUrgencyColor(results.assessment.emergencyLevel) }}
                  >
                    {results.assessment.emergencyLevel}
                  </div>
                </div>

                {results.assessment.callEmergency && (
                  <div className="emergency-call">
                    <h4>🚨 CALL EMERGENCY SERVICES IMMEDIATELY</h4>
                    <p>Dial: {results.assessment.emergencyNumber}</p>
                  </div>
                )}

                <div className="emergency-grid">
                  <div className="emergency-item">
                    <label>Immediate Actions:</label>
                    <ul>
                      {results.assessment.immediateActions?.map((action, index) => (
                        <li key={index} className="urgent-action">{action}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="emergency-item">
                    <label>While Waiting for Help:</label>
                    <ul>
                      {results.assessment.whileWaiting?.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="emergency-item">
                    <label>Emergency Services:</label>
                    <ul>
                      {results.assessment.emergencyServices?.map((service, index) => (
                        <li key={index}>{service}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="emergency-item">
                    <label>Information for Responders:</label>
                    <ul>
                      {results.assessment.infoForResponders?.map((info, index) => (
                        <li key={index}>{info}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="emergency-item">
                    <label>Warning Signs to Monitor:</label>
                    <ul>
                      {results.assessment.warningSigns?.map((sign, index) => (
                        <li key={index} className="warning-sign">{sign}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="emergency-disclaimer">
                  <p>⚠️ {results.assessment.disclaimer}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="global-disclaimer">
        <p><strong>⚠️ Medical Disclaimer:</strong> All AI features are for informational purposes only and are not substitutes for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers for any medical concerns.</p>
      </div>
    </div>
  );
};

export default AdvancedAIFeatures;
