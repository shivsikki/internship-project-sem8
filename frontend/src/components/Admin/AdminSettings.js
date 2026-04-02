import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const AdminSettings = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ key: '', value: '' });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setConfigs(response.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/config', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm({ key: '', value: '' });
      fetchConfig();
    } catch (err) {
      alert('Update failed');
    }
  };

  return (
    <div className="admin-feature-container">
      <h2>System Configuration</h2>
      <p className="subtitle">Manage global site variables and settings</p>

      <div className="broadcast-form">
        <h3>Update Variable</h3>
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label>Key</label>
            <input 
              required
              value={form.key}
              onChange={(e) => setForm({...form, key: e.target.value})}
              placeholder="e.g. CLINIC_NAME"
            />
          </div>
          <div className="form-group">
            <label>Value</label>
            <input 
              required
              value={form.value}
              onChange={(e) => setForm({...form, value: e.target.value})}
              placeholder="e.g. Hippocrates Global"
            />
          </div>
          <button type="submit" className="cafe-primary-btn" style={{ width: '100%' }}>Update Config</button>
        </form>
      </div>

      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {configs.map(c => (
              <tr key={c._id}>
                <td><code>{c.key}</code></td>
                <td>{c.value.toString()}</td>
                <td>{new Date(c.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSettings;
