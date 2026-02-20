import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught error:', error, info);
  }

  handleReset = () => {
    window.location.assign('/signin');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: 'center' }}>
            <h1 style={{ marginBottom: 12 }}>Something went wrong</h1>
            <p style={{ marginBottom: 20, color: '#5c5c5c' }}>
              An unexpected error occurred. You can try going back to the sign in page and continue from there.
            </p>
            <button
              onClick={this.handleReset}
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
              Go to sign in
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

