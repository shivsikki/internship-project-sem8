import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './Enquiries.css';

const Enquiries = ({ userRole }) => {
  const [enquiries, setEnquiries] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  
  const [formData, setFormData] = useState({
    doctorId: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    fetchEnquiries();
    if (userRole === 'patient') {
      fetchDoctors();
    }
  }, [userRole]);

  const fetchEnquiries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/enquiries', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setEnquiries(res.data.enquiries);
      }
    } catch (err) {
      console.error('Error fetching enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setDoctors(res.data.users.filter(u => u.role === 'doctor'));
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/enquiries', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setShowForm(false);
        setFormData({ doctorId: '', subject: '', message: '' });
        fetchEnquiries();
        alert('Enquiry sent successfully');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send enquiry');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/api/enquiries/${selectedEnquiry._id}/reply`, { reply: replyText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSelectedEnquiry(null);
        setReplyText('');
        fetchEnquiries();
        alert('Reply sent successfully');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send reply');
    }
  };

  if (loading) return <div className="enquiries-loading">Loading inquiries...</div>;

  return (
    <div className="enquiries-container view-fade-in">
      <header className="enquiries-hero">
        <div className="hero-bg-pattern" aria-hidden="true" />
        <div className="hero-content">
          <p className="hero-eyebrow">{userRole === 'doctor' ? 'Clinical Workspace' : 'Patient Support'}</p>
          <AnimatedHeading text={userRole === 'doctor' ? 'Inquiry Inbox' : 'My Clinical Inquiries'} />
          <p className="hero-subtitle">
            {userRole === 'doctor' 
              ? 'Address clinical questions and provide diagnostic guidance to your patients.' 
              : 'Directly communicate with your physicians regarding your health and records.'}
          </p>
        </div>
      </header>

      <div className="enquiries-layout">
        {userRole === 'patient' && (
          <div className="enquiries-actions">
            <button className="new-enquiry-btn" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel Inquiry' : 'Start New Inquiry'}
            </button>
          </div>
        )}

        {showForm && userRole === 'patient' && (
          <div className="enquiry-form-card glass-panel">
            <h3 className="section-title">New Clinical Inquiry</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select Physician</label>
                <select 
                  value={formData.doctorId} 
                  onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                  required
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id}>Dr. {doc.name} - {doc.specialization}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input 
                  type="text" 
                  value={formData.subject} 
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="e.g., Question about Blood Test results"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea 
                  value={formData.message} 
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Describe your question or concern in detail..."
                  required 
                  rows="5"
                />
              </div>
              <button type="submit" className="submit-enquiry-btn">Send Inquiry</button>
            </form>
          </div>
        )}

        <div className="enquiries-list">
          {enquiries.length === 0 ? (
            <div className="empty-state">No inquiries found.</div>
          ) : (
            enquiries.map((enq, index) => (
              <div key={enq._id} className="enquiry-card glass-panel card-animated" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="enquiry-header">
                  <span className={`status-pill status-${enq.status}`}>{enq.status}</span>
                  <span className="enquiry-date">{new Date(enq.createdAt).toLocaleDateString()}</span>
                </div>
                <h4 className="enquiry-subject">{enq.subject}</h4>
                <p className="enquiry-meta">
                  {userRole === 'patient' ? `To: Dr. ${enq.doctor?.name}` : `From: ${enq.patient?.name}`}
                </p>
                <div className="enquiry-body">
                  <p className="enquiry-msg">{enq.message}</p>
                </div>
                
                {enq.reply && (
                  <div className="enquiry-reply-box">
                    <p className="reply-label">Physician Reply:</p>
                    <p className="reply-text">{enq.reply}</p>
                    <span className="reply-date">Replied on {new Date(enq.repliedAt).toLocaleDateString()}</span>
                  </div>
                )}

                {userRole === 'doctor' && !enq.reply && (
                  <button className="reply-trigger-btn" onClick={() => setSelectedEnquiry(enq)}>
                    Write Reply
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {selectedEnquiry && (
        <div className="modal-overlay" onClick={() => setSelectedEnquiry(null)}>
          <div className="modal-content glass-panel modal-content-animated" onClick={(e) => e.stopPropagation()}>
            <h3 className="section-title">Reply to Inquiry</h3>
            <p className="modal-sub">Subject: {selectedEnquiry.subject}</p>
            <div className="modal-msg-preview">"{selectedEnquiry.message}"</div>
            <form onSubmit={handleReply}>
              <textarea 
                value={replyText} 
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your clinical response here..."
                required
                rows="6"
              />
              <div className="modal-actions">
                <button type="submit" className="submit-reply-btn">Send Response</button>
                <button type="button" className="cancel-btn" onClick={() => setSelectedEnquiry(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enquiries;
