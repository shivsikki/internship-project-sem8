import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromSignUp = Boolean(location.state?.fromSignUp);
  const [playSwap, setPlaySwap] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  const ssoOptions = useMemo(
    () => ([
      { id: 'google', label: 'Google' },
      { id: 'biometric', label: 'Biometrics' }
    ]),
    []
  );

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

    try {
      const response = await axios.post('/api/auth/signin', formData);

      if (response.data.success) {
        // Check if admin needs secondary verification
        if (response.data.pending && response.data.tempToken) {
          navigate('/admin-verify', { 
            state: { token: response.data.tempToken }
          });
          return;
        }

        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('user', JSON.stringify(response.data.user));

        // Check if doctor needs verification
        const user = response.data.user;
        if (user.role === 'doctor') {
          if (!user.isVerified) {
            if (user.verificationStatus === 'not_submitted') {
              navigate('/doctor-verification');
            } else {
              navigate('/verification-pending');
            }
            return;
          }
        }

        navigate('/dashboard');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!fromSignUp) return;
    const rafId = requestAnimationFrame(() => setPlaySwap(true));
    return () => cancelAnimationFrame(rafId);
  }, [fromSignUp]);

  return (
    <div className={`auth-page auth-shell auth-shell-signin${fromSignUp ? ' auth-shell-swap-prepare' : ''}${playSwap ? ' auth-shell-swap-active' : ''}`}>
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
        <div className="auth-form-wrap">
          <p className="auth-panel-brand">
            <span className="auth-panel-brand-mark" aria-hidden="true">✦</span>
            <span>Hippocrates Lab</span>
          </p>
          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Please enter your credentials to continue.</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group auth-password-group">
              <label>Password</label>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="auth-actions-row">
              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                />
                <span>Keep me signed in</span>
              </label>
              <button type="button" className="auth-link-btn" onClick={() => {}}>
                Forgot password?
              </button>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="auth-sso-grid">
            {ssoOptions.map((opt) => (
              <button key={opt.id} type="button" className="auth-sso-btn">
                {opt.label}
              </button>
            ))}
          </div>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/signup" state={{ fromSignIn: true }}>Sign Up</Link></p>
          </div>

          <div className="auth-footer-note">
            <p>New to the system? <button type="button" className="auth-link-btn">Request access</button></p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SignIn;

