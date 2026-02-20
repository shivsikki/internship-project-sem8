import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleGoHome = () => {
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/signin');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Page not found</h1>
        <p style={{ color: '#5c5c5c', marginBottom: 20 }}>
          The page you are looking for does not exist or may have moved.
        </p>
        <button
          onClick={handleGoHome}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#4a5568',
            color: '#f5f4f2',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Go back
        </button>
      </div>
    </div>
  );
};

export default NotFound;

