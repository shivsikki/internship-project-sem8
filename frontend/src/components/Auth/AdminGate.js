import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const AdminGate = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await axios.get(`/api/auth/admin-token/${token}`);
        if (response.data.success) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError('Invalid or expired token');
        }
      } catch (err) {
        setTokenValid(false);
        setError('Invalid or expired token');
      } finally {
        setCheckingToken(false);
      }
    };

    if (token) {
      validateToken();
    } else {
      setCheckingToken(false);
      setError('No token provided');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/admin-verify', {
        token,
        password
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="auth-page">
        <div className="admin-gate-container">
          <div className="admin-gate-card">
            <div className="loading-spinner">Verifying token...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="auth-page">
        <div className="admin-gate-container">
          <div className="admin-gate-card error">
            <div className="token-icon">⛔</div>
            <h2>Access Denied</h2>
            <p>{error}</p>
            <Link to="/signin" className="auth-button">Go to Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="admin-gate-container">
        <div className="admin-gate-card">
          <div className="token-icon">🔐</div>
          <h2>Admin Access</h2>
          <p className="token-subtitle">Enter the admin password to continue</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="admin-gate-form">
            <div className="form-group">
              <label>Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter admin password"
                autoFocus
              />
            </div>

            <button 
              type="submit" 
              className="auth-button" 
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Access Dashboard'}
            </button>
          </form>

          <div className="token-footer">
            <Link to="/signin" className="back-link">← Back to Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGate;
