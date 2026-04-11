import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SignUp from './components/Auth/SignUp';
import SignIn from './components/Auth/SignIn';
import TokenDisplay from './components/Auth/TokenDisplay';
import AdminGate from './components/Auth/AdminGate';
import Dashboard from './components/Dashboard/Dashboard';
import StartUpPage from './components/StartUp/StartUpPage';
import ClickSpark from './components/ClickSpark/ClickSpark';
import Meteors from './components/Meteors/Meteors';
import FullscreenCall from './components/VideoCall/FullscreenCall';
import DoctorDocumentUpload from './components/DoctorVerification/DoctorDocumentUpload';
import VerificationPending from './components/DoctorVerification/VerificationPending';

const AppLayout = ({ isSidebarCollapsed, setIsSidebarCollapsed }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup' || location.pathname === '/admin-verify';
  const isTokenPage = location.pathname.match(/^\/[A-Za-z0-9]{12}$/); // Matches /WadTVVwDhWDa pattern
  const isStartUpPage = location.pathname === '/';
  const isVideoCallPage = location.pathname.startsWith('/video-call/');
  const hideGlobalChrome = isAuthPage || isStartUpPage || isVideoCallPage || isTokenPage;

  return (
    <div className={`App ${!isVideoCallPage ? 'app-background' : 'dark-video-bg'}`}>
      {!hideGlobalChrome && <Meteors number={50} />}
      {isVideoCallPage ? (
        <div className="App-content">
          <Routes>
            <Route path="/video-call/:id" element={<FullscreenCall />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      ) : (
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
              <Route path="/admin-verify" element={<TokenDisplay />} />
              <Route path="/:token" element={<AdminGate />} />
              <Route path="/dashboard" element={<Dashboard isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />} />
              <Route path="/doctor-verification" element={<DoctorDocumentUpload />} />
              <Route path="/verification-pending" element={<VerificationPending />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </ClickSpark>
      )}
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

