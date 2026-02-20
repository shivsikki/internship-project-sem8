import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignUp from './components/Auth/SignUp';
import SignIn from './components/Auth/SignIn';
import Dashboard from './components/Dashboard/Dashboard';
import DotGrid from './components/DotGrid/DotGrid';
import { ToastProvider } from './components/Toast/ToastProvider';
import NotFound from './components/Common/NotFound';
import './App.css';

function App() {
  const token = localStorage.getItem('token');

  return (
    <ToastProvider>
      <Router>
        <div className="App">
          <div className="App-content">
            <DotGrid />
            <Routes>
              <Route path="/signup" element={!token ? <SignUp /> : <Navigate to="/dashboard" />} />
              <Route path="/signin" element={!token ? <SignIn /> : <Navigate to="/dashboard" />} />
              <Route
                path="/dashboard"
                element={token ? <Dashboard /> : <Navigate to="/signin" />}
              />
              <Route path="/" element={<Navigate to={token ? "/dashboard" : "/signin"} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;

