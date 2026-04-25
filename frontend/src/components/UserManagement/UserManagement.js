import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'patient', 'doctor'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const res = await axios.get('/api/users/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, action) => {
    try {
      const token = sessionStorage.getItem('token');
      let url = '';
      let method = 'put';

      if (action === 'delete') {
        if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
        url = `/api/users/${userId}`;
        method = 'delete';
      } else if (action === 'suspend') {
        url = `/api/users/${userId}/suspend`;
      } else if (action === 'watchlist') {
        url = `/api/users/${userId}/watchlist`;
      }

      const res = await axios({
        method,
        url,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        if (action === 'delete') {
          setUsers(users.filter(u => u._id !== userId));
        } else {
          setUsers(users.map(u => u._id === userId ? { ...u, ...res.data.user } : u));
        }
      }
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
      alert('Action failed. Please check permissions.');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesFilter = filter === 'all' || u.role === filter;
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return <div className="um-loading">Loading clinical directory...</div>;

  return (
    <div className="um-container view-fade-in">
      <header className="medivault-hero">
        <div className="hero-bg-pattern" aria-hidden="true" />
        <div className="medivault-hero-content">
          <p className="medivault-hero-eyebrow">Platform Administration</p>
          <AnimatedHeading text="Manage Users" />
          <p className="medivault-hero-subtitle">
            Oversee all platform members, manage account statuses, and monitor clinical participation.
          </p>
        </div>
      </header>

      <div className="um-controls">
        <div className="um-tabs">
          {['all', 'patient', 'doctor'].map(t => (
            <button 
              key={t}
              className={`um-tab-btn ${filter === t ? 'active' : ''}`}
              onClick={() => setFilter(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}s
            </button>
          ))}
        </div>
        <div className="um-search">
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="um-list">
        {filteredUsers.length === 0 ? (
          <div className="um-empty">No users found match your criteria.</div>
        ) : (
          <div className="um-grid">
            {filteredUsers.map(u => (
              <div key={u._id} className={`um-card ${u.isSuspended ? 'is-suspended' : ''} ${u.isOnWatchlist ? 'on-watchlist' : ''}`}>
                <div className="um-card-header">
                  <div className="um-avatar">
                    {u.profilePhoto ? <img src={u.profilePhoto} alt="" /> : u.name.charAt(0)}
                  </div>
                  <div className="um-main-info">
                    <h4>{u.name} {u.isOnWatchlist && <span className="watchlist-badge">👁️ Watchlist</span>}</h4>
                    <p className="um-email">{u.email}</p>
                    <span className={`um-role-tag ${u.role}`}>{u.role}</span>
                  </div>
                </div>

                <div className="um-card-details">
                  <div className="um-detail-row">
                    <span>Joined:</span>
                    <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                  {u.role === 'doctor' && (
                    <div className="um-detail-row">
                      <span>Verification:</span>
                      <span className={`v-status ${u.verificationStatus}`}>{u.verificationStatus}</span>
                    </div>
                  )}
                </div>

                <div className="um-card-actions">
                  <button 
                    className={`um-action-btn watchlist ${u.isOnWatchlist ? 'active' : ''}`}
                    onClick={() => handleAction(u._id, 'watchlist')}
                    title="Toggle Watchlist"
                  >
                    {u.isOnWatchlist ? 'Unwatch' : 'Watch List'}
                  </button>
                  <button 
                    className={`um-action-btn suspend ${u.isSuspended ? 'active' : ''}`}
                    onClick={() => handleAction(u._id, 'suspend')}
                  >
                    {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                  <button 
                    className="um-action-btn delete"
                    onClick={() => handleAction(u._id, 'delete')}
                  >
                    Delete
                  </button>
                </div>
                
                {u.isSuspended && <div className="suspended-overlay">ACCOUNT SUSPENDED</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
