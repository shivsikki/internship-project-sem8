import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignUp from './components/Auth/SignUp';
import SignIn from './components/Auth/SignIn';
import Dashboard from './components/Dashboard/Dashboard';
import DotGrid from './components/DotGrid/DotGrid';
import ThemeToggle from './components/Theme/ThemeToggle';
import { ToastProvider } from './components/Toast/ToastProvider';
import NotFound from './components/Common/NotFound';
import './App.css';
import './styles/ModernTheme.css';

function App() {
  const token = localStorage.getItem('token');

  return (
    <ToastProvider>
      <Router>
        <div className="App">
          <ThemeToggle />
          <div className="App-content">
            {!token && <DotGrid />}
            <Routes>
              <Route path="/signup" element={!token ? <SignUp /> : <Navigate to="/dashboard" />} />
              <Route path="/signin" element={!token ? <SignIn /> : <Navigate to="/dashboard" />} />
              <Route
                path="/dashboard"
                element={token ? <Dashboard /> : <Navigate to="/signin" />}
              />
              <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/signin" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;

