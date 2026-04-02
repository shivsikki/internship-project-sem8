import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setLogs(response.data.data);
      }
    } catch (err) {
      console.error('Logs Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionClass = (action) => {
    if (action.includes('CREATE')) return 'action-create';
    if (action.includes('UPDATE')) return 'action-update';
    if (action.includes('DELETE')) return 'action-delete';
    if (action.includes('SUSPEND')) return 'action-suspend';
    return '';
  };

  if (loading) return <div className="loading">Retrieving system audit logs...</div>;

  return (
    <div className="admin-feature-container">
      <h2>System Audit Trail</h2>
      <p className="subtitle">History of all administrative actions and changes</p>

      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td><strong>{log.adminName}</strong></td>
                <td>
                  <span className={`log-action-badge ${getActionClass(log.action)}`}>
                    {log.action.replace('_', ' ')}
                  </span>
                </td>
                <td>{log.targetType}</td>
                <td>{log.details}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>No logs recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAuditLogs;
