import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const AdminBroadcast = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', content: '', priority: 'medium' });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/announcements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAnnouncements(response.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/admin/announcements', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setForm({ title: '', content: '', priority: 'medium' });
        fetchAnnouncements();
      }
    } catch (err) {
      alert('Failed to send broadcast');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-feature-container">
      <h2>Global Broadcasts</h2>
      <p className="subtitle">Announce news and alerts to all users</p>

      <div className="broadcast-form">
        <h3>Create New Announcement</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input 
              required
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              placeholder="e.g. Holiday Closure"
            />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea 
              required
              rows={3}
              value={form.content}
              onChange={(e) => setForm({...form, content: e.target.value})}
              placeholder="Detailed message..."
            />
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High (Urgent)</option>
            </select>
          </div>
          <button type="submit" className="cafe-primary-btn" style={{ width: '100%' }}>Send Broadcast</button>
        </form>
      </div>

      <div className="active-announcements">
        <h3>Active Announcements</h3>
        <div className="audit-table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Priority</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map(ann => (
                <tr key={ann._id}>
                  <td><strong>{ann.title}</strong></td>
                  <td>{ann.priority}</td>
                  <td>{new Date(ann.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => handleDelete(ann._id)} className="btn-suspend">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBroadcast;
