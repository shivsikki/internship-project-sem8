import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [enter, setEnter] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [showSuccessVideo, setShowSuccessVideo] = useState(false);
  const videoRef = useRef(null);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    setEnter(true);
  }, []);

  useEffect(() => {
    if (!showSuccessVideo) return;

    // Fallback in case `onEnded` doesn't fire (some browsers/edge cases).
    const t = setTimeout(() => {
      if (hasNavigatedRef.current) return;
      hasNavigatedRef.current = true;
      navigate('/dashboard');
    }, 12000);

    return () => clearTimeout(t);
  }, [showSuccessVideo, navigate]);

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
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        setExiting(true);

        setTimeout(() => {
          setShowSuccessVideo(true);
        }, 800);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {!showSuccessVideo && <div className="auth-wave" />}
      <div className="auth-container">
        {!showSuccessVideo && (
          <div
            className={`auth-card ${enter ? 'auth-card-enter' : ''} ${exiting ? 'auth-card-exit' : ''
              }`}
          >
            <div className="auth-header">
              <h1>Welcome Back</h1>
              <p>Sign in to your account</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
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
                  placeholder="Enter your password"
                />
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="auth-footer">
              <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
            </div>

            <div className="role-info">
              <p>Sign in as: <strong>Doctor</strong> | <strong>Admin</strong> | <strong>Patient</strong></p>
            </div>
          </div>
        )}

        {showSuccessVideo && (
          <div className="auth-success auth-video-overlay">
            <div className="auth-video-wrap">
              <video
                ref={videoRef}
                className="auth-success-video"
                src="/videos/animation.mp4"
                preload="auto"
                autoPlay
                muted
                playsInline
                onEnded={() => {
                  if (hasNavigatedRef.current) return;
                  hasNavigatedRef.current = true;
                  navigate('/dashboard');
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignIn;

