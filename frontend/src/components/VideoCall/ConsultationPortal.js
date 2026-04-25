import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import JitsiCall from './JitsiCall';
import './ConsultationPortal.css';

const ConsultationPortal = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState('start'); // 'start' or 'history'
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState(null);
  const [planningUserId, setPlanningUserId] = useState(null);
  const [planningForm, setPlanningForm] = useState({ date: '', time: '' });
  const [planningLoading, setPlanningLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'start') {
      fetchDiscoveryUsers();
    } else {
      fetchConsultationHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    // 📡 BROADCAST CHANNEL: Listen for 'call_ended' signals from the other tab
    const windowChannel = new BroadcastChannel('hippocrates_consultation');
    
    windowChannel.onmessage = (event) => {
      if (event.data?.type === 'call_ended') {
        setActiveCall(null);
      }
    };

    // 🕵️ WINDOW MONITORING: Fallback for manual tab closure
    let monitorInterval;
    if (activeCall?.windowRef) {
      monitorInterval = setInterval(() => {
        if (activeCall.windowRef.closed) {
          setActiveCall(null);
          clearInterval(monitorInterval);
        }
      }, 1500);
    }

    return () => {
      windowChannel.close();
      if (monitorInterval) clearInterval(monitorInterval);
    };
  }, [activeCall]);

  const fetchDiscoveryUsers = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      
      if (userRole === 'patient') {
        // Patients only see doctors they have appointments with
        const response = await axios.get('/api/appointments/linked-clinicians', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setUsers(response.data.doctors);
        }
      } else {
        // Doctors see all patients (discovery mode)
        const response = await axios.get('/api/users/list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setUsers(response.data.users);
        }
      }
    } catch (err) {
      console.error('Error fetching discovery users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultationHistory = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const endpoint = userRole === 'patient' ? '/api/appointments/patient' : '/api/appointments/doctor';
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        // Filter for past/cancelled sessions
        const pastSessions = response.data.appointments.filter(
          a => a.status === 'completed' || a.status === 'cancelled'
        );
        setHistory(pastSessions);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const startAdhocCall = async (targetUser) => {
    const currentUserId = JSON.parse(sessionStorage.getItem('user'))?._id;
    const ids = [currentUserId, targetUser._id].sort().join('-');
    const roomName = `Hippocrates-Consult-${ids}`;
    
    // Notify the other user via Enquiries Hub
    try {
      const token = sessionStorage.getItem('token');
      await axios.post('/api/chat/start-call', {
        receiverId: targetUser._id,
        roomName: roomName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to send call notification:', err);
    }

    // OPEN INTERNAL ROUTE (Triggers FullscreenCall.js)
    const callWindow = window.open(`/video-call/${roomName}`, '_blank', 'noopener,noreferrer');
    
    setActiveCall({
      _id: roomName,
      doctor: userRole === 'doctor' ? { name: 'Me' } : targetUser,
      patient: userRole === 'patient' ? { name: 'Me' } : targetUser,
      windowRef: callWindow // Store reference for monitoring
    });
  };

  const submitPlannedCall = async (targetUser) => {
    if (!planningForm.date || !planningForm.time) {
      alert('Please select both date and time');
      return;
    }

    setPlanningLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const user = JSON.parse(sessionStorage.getItem('user'));
      const city = user?.city || 'Tele-health';

      await axios.post('/api/appointments/create', {
        doctorId: targetUser._id,
        appointmentDate: planningForm.date,
        appointmentTime: planningForm.time,
        reason: 'Planned Call',
        city: city
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Call request sent! The doctor will confirm it in their Hub.');
      setPlanningUserId(null);
      setPlanningForm({ date: '', time: '' });
    } catch (err) {
      console.error('Error planning call:', err);
      alert(err.response?.data?.message || 'Failed to plan call');
    } finally {
      setPlanningLoading(false);
    }
  };


  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.specialization && u.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="consultation-portal-container">
      {activeCall ? (
        <div className="portal-active-call-layout">
          <div className="call-header-bar">
            <div className="call-title">
              <span className="live-indicator">● SESSION ACTIVE</span>
              <h3>Consultation with {userRole === 'doctor' ? activeCall.patient?.name : `Dr. ${activeCall.doctor?.name}`}</h3>
            </div>
            <button className="exit-call-btn" onClick={() => setActiveCall(null)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
              Finalize Session
            </button>
          </div>
          
          <div className="session-status-vessel">
            <div className="session-info-card">
              <div className="session-icon">📡</div>
              <h2>High-Performance Session Started</h2>
              <p>Your video consultation has been launched in a dedicated browser tab to ensure 100% video quality and zero lag.</p>
              
              <div className="session-meta-grid">
                <div className="meta-item">
                  <span className="meta-label">PROVIDER</span>
                  <span className="meta-value">{userRole === 'doctor' ? 'Clinical Staff (You)' : `Dr. ${activeCall.doctor?.name}`}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">PATIENT</span>
                  <span className="meta-value">{userRole === 'patient' ? 'Patient (You)' : activeCall.patient?.name}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">ROOM ID</span>
                  <span className="meta-value">{activeCall._id.split('-').pop()}</span>
                </div>
              </div>

              <div className="session-actions">
                <button 
                  className="rejoin-btn"
                  onClick={() => {
                    const callWindow = window.open(`/video-call/${activeCall._id}`, '_blank', 'noopener,noreferrer');
                    setActiveCall(prev => ({ ...prev, windowRef: callWindow }));
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  Re-open Call Tab
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <header className="portal-hero">
            <div className="portal-hero-bg" />
            <div className="portal-hero-content">
              <span className="portal-hero-eyebrow">
                {activeTab === 'start' ? 'Digital Healthcare' : 'Archive & Records'}
              </span>
              <AnimatedHeading text={activeTab === 'start' ? 'E-Consultation Portal' : 'Consultation History'} />
              <p className="portal-hero-subtitle">
                {activeTab === 'start' 
                  ? 'Instant, high-density video sessions at your fingertips.' 
                  : 'Review and manage your past clinical interactions.'}
              </p>
            </div>
          </header>

          <div className="portal-main-card">
            <div className={`portal-action-bar ${activeTab === 'history' ? 'history-mode' : ''}`}>
              {activeTab === 'start' && (
                <div className="discovery-search-box-wrapper">
                  <div className="discovery-search-box">
                    <input 
                      type="text" 
                      placeholder={userRole === 'patient' ? "Search my doctors..." : "Find a patient by name, ID, or case number..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="discovery-search-input"
                    />
                    <span className="search-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </span>
                  </div>
                </div>
              )}

              <div className="portal-tabs">
                <button 
                  className={`portal-tab ${activeTab === 'start' ? 'active' : ''}`}
                  onClick={() => setActiveTab('start')}
                >
                  Start New
                </button>
                <button 
                  className={`portal-tab ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  Consultation History
                </button>
              </div>
            </div>

            <div className="portal-tab-content">
              {activeTab === 'start' ? (
                <>
                  <div className="discovery-section">
                    {loading ? (
                      <div className="portal-status-msg">Searching availability...</div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="empty-discovery">
                        <div className="empty-icon">👥</div>
                        <h3>No Users Found</h3>
                        <p>Try searching with another name or category.</p>
                      </div>
                    ) : (
                      <div className="discovery-grid">
                        {filteredUsers.map((target, idx) => (
                          <div key={target._id} className="discovery-card card-animated" style={{ animationDelay: `${idx * 0.05}s` }}>
                            <div className="discovery-card-header">
                              <div className="discovery-avatar-wrapper">
                                <div className="discovery-avatar">
                                  {target?.name ? target.name.charAt(0) : '?'}
                                </div>
                              </div>
                              <div className="discovery-info">
                                <span className="discovery-eyebrow">{target?.role === 'doctor' ? 'Clinical Provider' : 'Direct Patient'}</span>
                                <h4 className="discovery-name">
                                  {target?.role === 'doctor' ? `Dr. ${target.name}` : target?.name || 'Unknown User'}
                                </h4>
                              </div>
                            </div>

                            <div className="discovery-stats">
                              <div className="discovery-stat">
                                <span className="stat-label">DEPARTMENT</span>
                                <span className="stat-value">{target.role === 'doctor' ? target.specialization : 'General'}</span>
                              </div>
                              <div className="discovery-stat">
                                <span className="stat-label">ROLE</span>
                                <span className="stat-value">
                                  {target?.role ? (target.role.charAt(0).toUpperCase() + target.role.slice(1)) : 'N/A'}
                                </span>
                              </div>
                              <div className="discovery-stat">
                                <span className="stat-label">STATUS</span>
                                <span className="stat-value active">Available</span>
                              </div>
                            </div>

                            <div className="discovery-divider"></div>

                            <div className="discovery-footer">
                              {userRole === 'doctor' && (
                                <button 
                                  className="discovery-call-btn start-call"
                                  onClick={() => startAdhocCall(target)}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 7l-7 5 7 5V7z"></path>
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                  </svg>
                                  Start Call
                                </button>
                              )}
                              <button 
                                className="discovery-call-btn plan-call"
                                onClick={() => setPlanningUserId(target._id)}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                  <line x1="16" y1="2" x2="16" y2="6"></line>
                                  <line x1="8" y1="2" x2="8" y2="6"></line>
                                  <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                Plan Call
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Planning Modal Overlay - Rendered in Portal to blur the WHOLE website */}
                  {planningUserId && createPortal(
                    <div className="planning-modal-overlay" onClick={() => setPlanningUserId(null)}>
                      <div className="planning-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                          <h3>Schedule Consultation</h3>
                          <button className="close-modal-btn" onClick={() => setPlanningUserId(null)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6L6 18M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                        <p className="modal-subtitle">Pick a preferred time for your session with {users.find(u => u._id === planningUserId)?.role === 'doctor' ? 'Dr. ' : ''}{users.find(u => u._id === planningUserId)?.name}.</p>
                        
                        <div className="planning-form-container popup-mode">
                          <div className="planning-input-group">
                            <label>Appointment Date</label>
                            <input 
                              type="date" 
                              min={new Date().toISOString().split('T')[0]}
                              value={planningForm.date}
                              onChange={(e) => setPlanningForm({ ...planningForm, date: e.target.value })}
                            />
                          </div>
                          <div className="planning-input-group">
                            <label>Preferred Time Slot</label>
                            <input 
                              type="time" 
                              value={planningForm.time}
                              onChange={(e) => setPlanningForm({ ...planningForm, time: e.target.value })}
                            />
                          </div>
                          <button 
                            className="confirm-plan-btn"
                            onClick={() => submitPlannedCall(users.find(u => u._id === planningUserId))}
                            disabled={planningLoading}
                          >
                            {planningLoading ? 'Processing Request...' : 'Confirm Call Request'}
                          </button>
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}
                </>
              ) : (
                <div className="history-section">
                  {loading ? (
                    <div className="portal-status-msg">Retrieving records...</div>
                  ) : history.length === 0 ? (
                    <div className="empty-history">
                      <div className="empty-icon">📜</div>
                      <h3>No History Found</h3>
                      <p>Complete a session to see clinical records here.</p>
                    </div>
                  ) : (
                    <div className="history-list">
                      {history.map((session, idx) => (
                        <div key={session._id} className="history-item card-animated" style={{ animationDelay: `${idx * 0.05}s` }}>
                          <div className="history-date">
                            {formatDateTime(session.appointmentDate)}
                          </div>
                          <div className="history-main">
                            <div className="history-partner">
                              {userRole === 'doctor' ? session.patient?.name : `Dr. ${session.doctor?.name}`}
                            </div>
                            <div className="history-reason">{session.reason}</div>
                          </div>
                          <div className={`history-status-pill status-${session.status}`}>
                            {session.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConsultationPortal;
