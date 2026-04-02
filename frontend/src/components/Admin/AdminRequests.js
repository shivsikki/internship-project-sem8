import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/pending-admins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/approve-admin/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      if (!window.confirm('Reject and delete this request?')) return;
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/reject-admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading requests...</div>;

  return (
    <div className="admin-requests-container">
      <h2>Sub-Admin Requests</h2>
      {requests.length === 0 ? (
        <p>No pending admin requests.</p>
      ) : (
        <div className="request-cards">
          {requests.map(req => (
            <div key={req._id} className="request-card">
              <div className="req-info">
                <h4>{req.name}</h4>
                <p>{req.email}</p>
                <small>Applied: {new Date(req.createdAt).toLocaleDateString()}</small>
              </div>
              <div className="req-actions">
                <button className="btn-approve" onClick={() => handleApprove(req._id)}>Approve</button>
                <button className="btn-reject" onClick={() => handleReject(req._id)}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRequests;
