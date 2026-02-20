import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from '../Toast/ToastProvider';
import './Profile.css';

const ProfilePage = ({ user, onUserUpdated }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: user.name || '',
    phone: user.phone || '',
    address: user.address || '',
    age: user.age ?? '',
    gender: user.gender || '',
    specialization: user.specialization || '',
    licenseNumber: user.licenseNumber || '',
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.put('/api/auth/me', profile);
      if (response.data.success) {
        toast.success('Profile updated');
        const updated = response.data.user;
        onUserUpdated && onUserUpdated(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) {
      toast.error('Please fill current and new password');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setPwdSaving(true);
    try {
      const response = await axios.post('/api/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      if (response.data.success) {
        toast.success('Password updated');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2>Profile</h2>
        <form onSubmit={handleSaveProfile} className="profile-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
              required
              className="form-input"
            />
          </div>

          {user.role === 'patient' && (
            <>
              <div className="profile-grid">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={profile.age}
                    onChange={(e) => handleProfileChange('age', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="profile-grid">
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => handleProfileChange('gender', e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </>
          )}

          {user.role === 'doctor' && (
            <div className="profile-grid">
              <div className="form-group">
                <label>Specialization</label>
                <input
                  type="text"
                  value={profile.specialization}
                  onChange={(e) => handleProfileChange('specialization', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>License Number</label>
                <input
                  type="text"
                  value={profile.licenseNumber}
                  onChange={(e) => handleProfileChange('licenseNumber', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          )}

          <button type="submit" className="submit-button" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      <div className="profile-card">
        <h2>Change Password</h2>
        <form onSubmit={handleSavePassword} className="profile-form">
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div className="profile-grid">
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="form-input"
                required
              />
            </div>
          </div>
          <button type="submit" className="submit-button" disabled={pwdSaving}>
            {pwdSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;

