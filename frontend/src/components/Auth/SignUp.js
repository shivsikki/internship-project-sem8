import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromSignIn = Boolean(location.state?.fromSignIn);
  const [playSwap, setPlaySwap] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    // Doctor fields
    specialization: '',
    licenseNumber: '',
    // Patient fields
    age: '',
    gender: '',
    phone: '',
    address: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...dataToSend } = formData;
      
      const response = await axios.post('/api/auth/signup', dataToSend);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!fromSignIn) return;
    const rafId = requestAnimationFrame(() => setPlaySwap(true));
    return () => cancelAnimationFrame(rafId);
  }, [fromSignIn]);

  return (
    <div className={`auth-page auth-shell auth-shell-signup${fromSignIn ? ' auth-shell-swap-prepare' : ''}${playSwap ? ' auth-shell-swap-active' : ''}`}>
      <section className="auth-visual-panel">
        <div className="auth-visual-image" />
        <div className="auth-visual-card">
          <h2>
            A sanctuary for <span className="auth-accent-script">clinical</span>{' '}
            <span className="auth-accent-strong">excellence.</span>
          </h2>
          <p className="auth-visual-lede">
          Enter a space designed for clarity, serenity, and precision in healthcare management.
            <br/>
            Manage your clinical operations with ease.
            <br/>
            Track your patients, appointments, and more.
            <br/>
            And much more!
          </p>
          <div className="auth-visual-crew" aria-hidden="true">
            <div className="auth-crew-avatars">
              <span className="auth-crew-avatar auth-crew-avatar-1" />
              <span className="auth-crew-avatar auth-crew-avatar-2" />
              <span className="auth-crew-avatar auth-crew-avatar-more">+12</span>
            </div>
            <div className="auth-crew-copy">
              <strong>Joined by experts</strong>
              <span>Clinical staff</span>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap auth-form-wrap-wide">
          <p className="auth-panel-brand">
            <span className="auth-panel-brand-mark" aria-hidden="true">✦</span>
            <span>Hippocrates Lab</span>
          </p>
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Join our Hospital Management System</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form auth-form-sections">
            <div className="auth-sections">
              <div className="auth-section">
                <h3>Account</h3>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter password (min 6 characters)"
                  />
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              <div className="auth-section">
                <h3>Role</h3>
                <div className="form-group">
                  <label>I am a</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="role-select"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {formData.role === 'doctor' && (
                  <>
                    <div className="form-group">
                      <label>Specialization</label>
                      <input
                        type="text"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        placeholder="e.g., Cardiology, Neurology"
                      />
                    </div>
                    <div className="form-group">
                      <label>License Number</label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        placeholder="Enter license number"
                      />
                    </div>
                  </>
                )}

                {formData.role !== 'doctor' && (
                  <p className="auth-section-note">No additional role details required.</p>
                )}
              </div>

              <div className="auth-section">
                <h3>Details</h3>
                {formData.role === 'patient' ? (
                  <>
                    <div className="form-group">
                      <label>Age</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="Enter your age"
                        min="1"
                        max="120"
                      />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="role-select"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter your address"
                      />
                    </div>
                  </>
                ) : (
                  <p className="auth-section-note">No additional details required.</p>
                )}
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/signin" state={{ fromSignUp: true }}>Sign In</Link></p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SignUp;

