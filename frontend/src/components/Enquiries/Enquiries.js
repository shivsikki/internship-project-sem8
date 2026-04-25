import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './Enquiries.css';

// SVG Icons
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
);
const IconMessage = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);
const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);
const IconFlask = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6"></path><path d="M10 3v4c0 1.1-.9 2-2 2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2a2 2 0 0 1-2-2V3"></path><path d="M8.5 21h7"></path></svg>
);
const IconVideo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
);
const IconSystem = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1V15a2 2 0 0 1-2-2 2 2 0 0 1 2-2v-.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2v.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);
const IconSend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

const Enquiries = ({ userRole, setActiveTab }) => {
  const [internalTab, setInternalTab] = useState('hub'); // 'hub', 'pending', or 'chat'
  const [notifications, setNotifications] = useState([]);
  const [pendingData, setPendingData] = useState({ tests: [], sessions: [] });
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingTestId, setViewingTestId] = useState(null);
  const [viewedTestData, setViewedTestData] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const [reschedulingSession, setReschedulingSession] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchHubData();
    const interval = setInterval(fetchHubData, 10000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (internalTab === 'chat' && selectedContact) {
      fetchChatHistory(selectedContact._id);
    }
  }, [internalTab, selectedContact]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchHubData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const [notifRes, contactRes, pendingRes] = await Promise.all([
        axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/chat/contacts/list', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/enquiries/pending-data', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (notifRes.data.success) setNotifications(notifRes.data.notifications);
      if (contactRes.data.success) setContacts(contactRes.data.contacts);
      if (pendingRes.data.success) setPendingData(pendingRes.data.pending);
    } catch (err) {
      console.error('Error fetching hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async (otherUserId) => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`/api/chat/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setMessages(res.data.messages);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    }
  };

  const fetchTestDetails = async (testId) => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`/api/tests/detail/${testId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setViewedTestData(res.data.test);
        setViewingTestId(testId);
      }
    } catch (err) {
      console.error('Fetch test detail error:', err);
      alert('Could not load test details.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post('/api/chat/send', {
        receiverId: selectedContact._id,
        content: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setMessages([...messages, res.data.message]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleAction = (path) => {
    if (!path) return;
    
    if (path.startsWith('/video-call/')) {
      window.open(path, '_blank');
      return;
    }

    if (path.startsWith('/enquiries/chat/')) {
      const contactId = path.split('/').pop();
      setInternalTab('chat');
      const targetContact = contacts.find(c => c._id === contactId);
      if (targetContact) {
        setSelectedContact(targetContact);
      } else {
        setSelectedContact({ _id: contactId, name: 'User' });
      }
      return;
    }

    if (path.startsWith('/appointments/confirm/')) {
      const appointmentId = path.split('/').pop();
      confirmPlannedCall(appointmentId);
      return;
    }

    if (path.startsWith('/tests/results/')) {
      const testId = path.split('/').pop();
      fetchTestDetails(testId);
      return;
    }

    const tabMap = {
      '/appointments': 'appointments',
      '/tests': 'tests',
      '/prescriptions': 'prescriptions',
      '/enquiries': 'inquiries',
      '/ai-helper': 'aiHelper',
      '/medi-vault': 'medivault',
      '/settings': 'settings'
    };

    if (tabMap[path]) {
      setActiveTab(tabMap[path]);
    }
  };

  const confirmPlannedCall = async (id) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`/api/appointments/${id}/status`, {
        status: 'confirmed',
        notes: 'Call requested via E-Consultation Portal'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Call confirmed! The patient has been notified.');
      fetchHubData();
    } catch (err) {
      console.error('Error confirming call:', err);
      alert('Failed to confirm call.');
    }
  };

  const declinePlannedCall = async (id) => {
    if (!window.confirm('Are you sure you want to decline this call request?')) return;
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`/api/appointments/${id}/status`, {
        status: 'cancelled',
        notes: 'Call declined by physician'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Call request declined.');
      fetchHubData();
    } catch (err) {
      console.error('Error declining call:', err);
      alert('Failed to decline call.');
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!reschedulingSession || !newDate || !newTime) return;

    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`/api/appointments/${reschedulingSession._id}/status`, {
        status: 'confirmed',
        appointmentDate: newDate,
        appointmentTime: newTime,
        notes: 'Session rescheduled and confirmed by physician'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Session rescheduled and confirmed!');
      setReschedulingSession(null);
      fetchHubData();
    } catch (err) {
      console.error('Reschedule error:', err);
      alert('Failed to reschedule session.');
    }
  };

  const deleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  if (loading && notifications.length === 0) return <div className="enquiries-loading">Loading Clinical Hub...</div>;

  return (
    <div className="hub-container view-fade-in">
      <header className="hub-hero">
        <div className="hero-bg-pattern" aria-hidden="true" />
        <div className="hero-content">
          <p className="hero-eyebrow">{userRole === 'doctor' ? 'Clinical Workspace' : 'Patient Support'}</p>
          <AnimatedHeading text={userRole === 'doctor' ? 'Clinical Hub' : 'My Care Enquiries'} />
          <p className="hero-subtitle">
            {userRole === 'doctor' 
              ? 'Unified interface for patient communication, diagnostic tracking, and session alerts.'
              : 'Direct connection to your clinical team and real-time updates on your care plan.'}
          </p>
        </div>
      </header>

      <div className="hub-layout">
        <aside className="hub-sidebar">
          <button 
            className={`hub-nav-btn ${internalTab === 'hub' ? 'active' : ''}`}
            onClick={() => setInternalTab('hub')}
          >
            <span className="nav-icon"><IconBell /></span> Activity Feed
          </button>
          <button 
            className={`hub-nav-btn ${internalTab === 'pending' ? 'active' : ''}`}
            onClick={() => setInternalTab('pending')}
          >
            <span className="nav-icon"><IconClock /></span> Pending Items
            {(pendingData.tests.length + pendingData.sessions.length) > 0 && (
              <span className="pending-indicator">!</span>
            )}
          </button>
          <button 
            className={`hub-nav-btn ${internalTab === 'chat' ? 'active' : ''}`}
            onClick={() => setInternalTab('chat')}
          >
            <span className="nav-icon"><IconMessage /></span> Messaging
          </button>
          
          <div className="sidebar-divider">CONTACTS</div>
          <div className="contact-list">
            {contacts.length === 0 ? (
              <div className="empty-contacts">No recent interactions</div>
            ) : (
              contacts.map(contact => (
                <button 
                  key={contact._id} 
                  className={`contact-item ${selectedContact?._id === contact._id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedContact(contact);
                    setInternalTab('chat');
                  }}
                >
                  <div className="contact-avatar">
                    {contact.profilePhoto ? <img src={contact.profilePhoto} alt="" /> : contact.name.charAt(0).toLowerCase()}
                  </div>
                  <div className="contact-info">
                    <span className="contact-name">{contact.role === 'doctor' ? `Dr. ${contact.name}` : contact.name}</span>
                    <span className="contact-role">{contact.role === 'doctor' ? contact.specialization : 'Patient'}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="hub-main-content">
          {internalTab === 'hub' && (
            <div className="activities-feed">
              <div className="feed-section">
                <h3 className="section-header">Recent Activity</h3>
                {notifications.length === 0 ? (
                  <div className="empty-hub">No new alerts. Your clinical feed is clear.</div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif._id} className={`activity-card type-${notif.type}`}>
                      <button 
                        className="notif-delete-btn" 
                        onClick={(e) => deleteNotification(notif._id, e)}
                        title="Delete alert"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18M6 6l12 12"></path>
                        </svg>
                      </button>
                      <div className="activity-icon">
                        {notif.type === 'appointment' && <IconCalendar />}
                        {notif.type === 'test' && <IconFlask />}
                        {notif.type === 'chat' && <IconMessage />}
                        {notif.type === 'call' && <IconVideo />}
                        {notif.type === 'system' && <IconSystem />}
                      </div>
                      <div className="activity-details">
                        <div className="activity-head">
                          <h4 className="activity-title">{notif.title}</h4>
                          <span className="activity-time">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="activity-msg">{notif.message}</p>
                        {notif.actionPath && (
                          <button className="activity-action-btn" onClick={() => handleAction(notif.actionPath)}>
                            {notif.type === 'call' ? 'Join Call Now' : 'View Details'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {internalTab === 'pending' && (
            <div className="activities-feed">
              <div className="feed-section pending-section-view">
                <h3 className="section-header">Pending Items Awaiting Action</h3>
                
                <div className="pending-grid-layout">
                  {pendingData.tests.map(test => (
                    <div key={test._id} className="pending-card type-test">
                      <div className="pending-badge">PENDING TEST</div>
                      <div className="pending-meta">
                        <span className="pending-date"><IconClock /> Requested {new Date(test.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="pending-title">{test.testName}</h4>
                      <p className="pending-user">
                        {userRole === 'doctor' ? `Patient: ${test.patient?.name}` : `Doctor: Dr. ${test.doctor?.name}`}
                      </p>
                      <button className="pending-action-btn" onClick={() => handleAction('/tests')}>
                        {userRole === 'doctor' ? 'Track Progress' : 'Upload Results'}
                      </button>
                    </div>
                  ))}

                  {pendingData.sessions.map(session => (
                    <div key={session._id} className="pending-card type-session">
                      <div className={`pending-badge ${session.status === 'pending' ? 'is-waiting' : ''}`}>
                        {session.status === 'pending' ? 'AWAITING CONFIRMATION' : 'UPCOMING SESSION'}
                      </div>
                      <div className="pending-meta">
                        <span className="pending-date"><IconClock /> {new Date(session.appointmentDate).toLocaleDateString()} at {session.appointmentTime}</span>
                      </div>
                      <h4 className="pending-title">Video Consultation</h4>
                      <p className="pending-user">
                        {userRole === 'doctor' ? `Patient: ${session.patient?.name}` : `Physician: Dr. ${session.doctor?.name}`}
                      </p>
                      {!(session.reason === 'Planned Call' && userRole === 'patient') && (
                        <div className="pending-actions-stack">
                          <button className="pending-action-btn confirm" onClick={() => confirmPlannedCall(session._id)}>
                            Confirm Request
                          </button>
                          <div className="pending-secondary-actions">
                            <button 
                              className="pending-mini-btn reschedule" 
                              onClick={() => {
                                setReschedulingSession(session);
                                setNewDate(session.appointmentDate.split('T')[0]);
                                setNewTime(session.appointmentTime);
                              }}
                            >
                              Update Day/Time
                            </button>
                            <button className="pending-mini-btn decline" onClick={() => declinePlannedCall(session._id)}>
                              Decline
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {pendingData.tests.length === 0 && pendingData.sessions.length === 0 && (
                    <div className="empty-pending-state">
                      <div className="empty-pending-icon"><IconClock /></div>
                      <h4>No Pending Tasks</h4>
                      <p>You're all caught up! No medical tests or sessions require immediate action.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {internalTab === 'chat' && (
            <div className="chat-interface">
              {selectedContact ? (
                <>
                  <div className="chat-header">
                    <div className="header-avatar">
                      {selectedContact.profilePhoto ? <img src={selectedContact.profilePhoto} alt="" /> : selectedContact.name.charAt(0)}
                    </div>
                    <div>
                      <h4>{selectedContact.role === 'doctor' ? `Dr. ${selectedContact.name}` : selectedContact.name}</h4>
                      <p>{selectedContact.role === 'doctor' ? selectedContact.specialization : 'Verified Patient'}</p>
                    </div>
                  </div>
                  <div className="message-list">
                    {messages.map((msg, i) => (
                      <div key={i} className={`message-bubble ${msg.sender === selectedContact._id ? 'received' : 'sent'}`}>
                        <div className="bubble-content">{msg.content}</div>
                        <span className="bubble-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <form className="chat-input-area" onSubmit={handleSendMessage}>
                    <input 
                      type="text" 
                      placeholder="Type your message here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" disabled={!newMessage.trim()}><IconSend /></button>
                  </form>
                </>
              ) : (
                <div className="empty-chat-state">
                  <div className="chat-large-icon"><IconMessage /></div>
                  <h3>Select a conversation</h3>
                  <p>Choose a contact from the sidebar to reach your clinical care team.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Test Result Viewer Modal */}
      {viewingTestId && viewedTestData && createPortal(
        <div className="hub-modal-overlay" onClick={() => {setViewingTestId(null); setViewedTestData(null);}}>
          <div className="test-result-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="viewer-header">
              <div className="viewer-title-group">
                <span className="viewer-label">Diagnostic Result</span>
                <h3>{viewedTestData.testName}</h3>
                <p className="viewer-patient">Patient: {viewedTestData.patient?.name}</p>
              </div>
              <button className="viewer-close" onClick={() => {setViewingTestId(null); setViewedTestData(null);}}>&times;</button>
            </div>

            <div className="viewer-content">
              <div className="viewer-sidebar">
                <div className="sidebar-section">
                  <label>Clinical Notes (Patient)</label>
                  <div className="sidebar-note">
                    {viewedTestData.notes || "No additional notes provided by patient."}
                  </div>
                </div>
                <div className="sidebar-section">
                  <label>Test Information</label>
                  <div className="sidebar-info-grid">
                    <div className="info-item">
                      <span>Type</span>
                      <strong>{viewedTestData.testType}</strong>
                    </div>
                    <div className="info-item">
                      <span>Date Uploaded</span>
                      <strong>{new Date(viewedTestData.testDate).toLocaleDateString()}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="viewer-main">
                <label>Uploaded Scans & Reports ({viewedTestData.images?.length || 0})</label>
                {viewedTestData.images && viewedTestData.images.length > 0 ? (
                  <div className="image-result-grid">
                    {viewedTestData.images.map((img, idx) => (
                      <div key={idx} className="result-image-box" onClick={() => setExpandedImage(img.url)}>
                        <img src={img.url} alt={`Scan ${idx + 1}`} />
                        <div className="image-overlay">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-images-placeholder">
                    No images were uploaded for this test.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Image Zoom Overlay */}
      {expandedImage && createPortal(
        <div className="image-zoom-overlay" onClick={() => setExpandedImage(null)}>
          <img src={expandedImage} alt="Expanded Scan" />
          <button className="zoom-close">&times;</button>
        </div>,
        document.body
      )}
      {/* Reschedule Modal */}
      {reschedulingSession && createPortal(
        <div className="hub-modal-overlay" onClick={() => setReschedulingSession(null)}>
          <div className="reschedule-modal view-fade-in" onClick={e => e.stopPropagation()}>
            <div className="reschedule-header">
              <h3>Update Consultation Slot</h3>
              <p>Reschedule the session for {reschedulingSession.patient?.name}</p>
            </div>
            
            <form onSubmit={handleRescheduleSubmit} className="reschedule-form">
              <div className="form-row">
                <div className="form-group">
                  <label>New Date</label>
                  <input 
                    type="date" 
                    value={newDate} 
                    onChange={e => setNewDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>New Time</label>
                  <input 
                    type="time" 
                    value={newTime} 
                    onChange={e => setNewTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="reschedule-footer">
                <button type="button" className="btn-cancel" onClick={() => setReschedulingSession(null)}>Cancel</button>
                <button type="submit" className="btn-save">Save & Confirm Session</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Enquiries;


