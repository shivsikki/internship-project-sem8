import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SignUp from './components/Auth/SignUp';
import SignIn from './components/Auth/SignIn';
import Dashboard from './components/Dashboard/Dashboard';
import StartUpPage from './components/StartUp/StartUpPage';
import ClickSpark from './components/ClickSpark/ClickSpark';
import Meteors from './components/Meteors/Meteors';
import './App.css';

const AppLayout = ({ isSidebarCollapsed, setIsSidebarCollapsed }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';
  const isStartUpPage = location.pathname === '/';
  const hideGlobalChrome = isAuthPage || isStartUpPage;

  return (
    <div className="App app-background">
      {!hideGlobalChrome && <Meteors number={50} />}
      <ClickSpark
        sparkColor="#ecd25cff"
        sparkSize={15}
        sparkRadius={15}
        sparkCount={8}
        duration={600}
      >
        <div className="App-content">
          <Routes>
            <Route path="/" element={<StartUpPage />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/dashboard" element={<Dashboard isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ClickSpark>
    </div>
  );
};

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <Router>
      <AppLayout
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />
    </Router>
  );
}

export default App;

