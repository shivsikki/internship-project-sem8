import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignUp from './components/Auth/SignUp';
import SignIn from './components/Auth/SignIn';
import Dashboard from './components/Dashboard/Dashboard';
import DotGrid from './components/DotGrid/DotGrid';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <div className="App-content">
          <DotGrid />
          <Routes>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Navigate to="/signin" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

