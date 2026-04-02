import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminUserActivityModal from './AdminUserActivityModal';
import './Admin.css';

const AdminUsers = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedActivityUser, setSelectedActivityUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const toggleSuspension = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/admin/users/${id}/toggle-suspension`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        fetchUsers();
      }
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const filteredUsers = roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter);

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="admin-users-container">
      <div className="admin-users-header">
        <h2>Manage Users</h2>
        <div className="role-filters">
          <button className={roleFilter === 'all' ? 'active' : ''} onClick={() => setRoleFilter('all')}>All</button>
          <button className={roleFilter === 'patient' ? 'active' : ''} onClick={() => setRoleFilter('patient')}>Patients</button>
          <button className={roleFilter === 'doctor' ? 'active' : ''} onClick={() => setRoleFilter('doctor')}>Doctors</button>
          <button className={roleFilter === 'admin' ? 'active' : ''} onClick={() => setRoleFilter('admin')}>Admins</button>
        </div>
      </div>
      
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Details</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u._id}>
                <td>{u.name} {u.isRootAdmin && <span className="badge root">Root</span>}</td>
                <td>{u.email}</td>
                <td><span className={`badge ${u.role}`}>{u.role}</span></td>
                <td>
                  {u.role === 'patient' && (
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      {u.age ? `Age: ${u.age}` : ''} 
                      {u.gender ? ` | ${u.gender}` : ''}
                      {u.phone ? ` | 📞 ${u.phone}` : ''}
                      {u.address ? ` | 🏠 ${u.address}` : ''}
                      {!u.age && !u.phone && !u.address && '-'}
                    </div>
                  )}
                  {u.role === 'doctor' && (
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      {u.specialization ? `Spec: ${u.specialization}` : ''}
                      {u.licenseNumber ? ` | Lic: ${u.licenseNumber}` : ''}
                      {!u.specialization && !u.licenseNumber && '-'}
                    </div>
                  )}
                  {u.role === 'admin' && <span style={{color: '#999'}}>-</span>}
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  {(u.role === 'patient' || u.role === 'doctor') && (
                    <>
                      <button className="btn-primary" onClick={() => setSelectedActivityUser(u._id)}>Activity</button>
                      <button 
                        className={u.isSuspended ? 'btn-unsuspend' : 'btn-suspend'} 
                        onClick={() => toggleSuspension(u._id)}
                        style={{ marginLeft: '8px' }}
                      >
                        {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </>
                  )}
                  {user.isRootAdmin && user._id !== u._id && (
                    <button className="btn-danger" onClick={() => deleteUser(u._id)} style={{ marginLeft: '8px' }}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="6" style={{textAlign: 'center', color: '#888'}}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {selectedActivityUser && (
        <AdminUserActivityModal 
          userId={selectedActivityUser} 
          onClose={() => setSelectedActivityUser(null)} 
        />
      )}
    </div>
  );
};

export default AdminUsers;
