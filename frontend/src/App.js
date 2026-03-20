import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignUp from './components/Auth/SignUp';
import SignIn from './components/Auth/SignIn';
import Dashboard from './components/Dashboard/Dashboard';
import ClickSpark from './components/ClickSpark/ClickSpark';
import Meteors from './components/Meteors/Meteors';
import HeaderBar from './components/HeaderBar/HeaderBar';
import './App.css';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <Router>
      <div className="App app-background">
        <Meteors number={50} />
        <HeaderBar isSidebarCollapsed={isSidebarCollapsed} />
        <ClickSpark
          sparkColor="#ecd25cff"
          sparkSize={15}
          sparkRadius={15}
          sparkCount={8}
          duration={600}
        >
          <div className="App-content" style={{ paddingTop: '80px' }}>
            <Routes>
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/dashboard" element={<Dashboard isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />} />
              <Route path="/" element={<Navigate to="/signin" />} />
            </Routes>
          </div>
        </ClickSpark>
      </div>
    </Router>
  );
}

export default App;

