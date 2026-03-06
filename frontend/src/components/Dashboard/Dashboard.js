import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useRealTimeSync from '../../hooks/useRealTimeSync';
import BookAppointment from '../Appointments/BookAppointment';
import AppointmentList from '../Appointments/AppointmentList';
import PrescriptionForm from '../Prescriptions/PrescriptionForm';
import PrescriptionList from '../Prescriptions/PrescriptionList';
import TestForm from '../Tests/TestForm';
import TestList from '../Tests/TestList';
import PaymentList from '../Payments/PaymentList';
import NotificationBell from '../Notifications/NotificationBell';
import UnifiedAIAssistant from '../AI/UnifiedAIAssistant';
import AdvancedAIFeatures from '../AI/AdvancedAIFeatures';
import HealthDashboard from './HealthDashboard';
import HealthRecommendations from '../AI/HealthRecommendations';
import VideoConsultation from '../VideoConsultation/VideoConsultation';
import ProfilePage from '../Profile/ProfilePage';
import NotificationsPage from '../Notifications/NotificationsPage';
import ChatPanel from '../Chat/ChatPanel';
import EmergencyPanel from '../Emergency/EmergencyPanel';
import DoctorFinder from '../Location/DoctorFinder';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    appointments: [],
    prescriptions: [],
    tests: [],
    totalRevenue: 0
  });
  const [theme, setTheme] = useState('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHover, setSidebarHover] = useState(false);

  // Real-time sync hook
  const { registerCallback, triggerRefresh } = useRealTimeSync(user?._id, user?.role);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/signin');
        return;
      }

      try {
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/signin');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!user || activeTab !== 'dashboard') return;

    const token = localStorage.getItem('token');
    let appointmentPollInterval = null;
    
    const fetchStats = async () => {
      try {
        const [appointmentsRes, paymentsRes] = await Promise.all([
          axios.get(user.role === 'patient' ? '/api/appointments/patient' : user.role === 'doctor' ? '/api/appointments/doctor' : '/api/appointments/all', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          (user.role === 'patient' || user.role === 'admin') ? axios.get(user.role === 'admin' ? '/api/payments/all' : '/api/payments/patient', {
            headers: { Authorization: `Bearer ${token}` }
          }) : Promise.resolve({ data: { totalRevenue: 0 } })
        ]);

        let prescriptions = [];
        let tests = [];
        if (user.role === 'patient') {
          const [presRes, testRes] = await Promise.all([
            axios.get(`/api/prescriptions/patient/${user._id}`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`/api/tests/patient/${user._id}`, { headers: { Authorization: `Bearer ${token}` } })
          ]);
          prescriptions = presRes.data.prescriptions || [];
          tests = testRes.data.tests || [];
        } else if (user.role === 'doctor') {
          const [presRes, testRes] = await Promise.all([
            axios.get('/api/prescriptions/doctor', { headers: { Authorization: `Bearer ${token}` } }),
            axios.get('/api/tests/doctor', { headers: { Authorization: `Bearer ${token}` } })
          ]);
          prescriptions = presRes.data.prescriptions || [];
          tests = testRes.data.tests || [];
        }

        setStats({
          appointments: appointmentsRes.data.appointments || [],
          prescriptions,
          tests,
          totalRevenue: paymentsRes.data?.totalRevenue || 0
        });

        // Poll for appointment updates every 30 seconds
        if (!appointmentPollInterval) {
          appointmentPollInterval = setInterval(async () => {
            try {
              const res = await axios.get(
                user.role === 'patient' ? '/api/appointments/patient' : user.role === 'doctor' ? '/api/appointments/doctor' : '/api/appointments/all',
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (res.data.success) {
                setStats(prev => ({ ...prev, appointments: res.data.appointments || [] }));
              }
            } catch (err) {
              console.error('Error polling appointments:', err);
            }
          }, 30000);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };

    fetchStats();
    return () => {
      if (appointmentPollInterval) {
        clearInterval(appointmentPollInterval);
      }
    };
  }, [user, activeTab]);

  // Register real-time callbacks
  useEffect(() => {
    if (!user?._id) return;

    // Register callbacks for real-time updates
    const unregisterTestUpdate = registerCallback('onTestUpdate', (data) => {
      console.log('Dashboard: Test updated', data);
      // Refresh stats if on dashboard tab
      if (activeTab === 'dashboard') {
        // Trigger stats refresh
        const fetchStats = async () => {
          try {
            const token = localStorage.getItem('token');
            const [appointmentsRes, paymentsRes] = await Promise.all([
              axios.get(user.role === 'patient' ? '/api/appointments/patient' : user.role === 'doctor' ? '/api/appointments/doctor' : '/api/appointments/all', {
                headers: { Authorization: `Bearer ${token}` }
              }),
              (user.role === 'patient' || user.role === 'admin') ? axios.get(user.role === 'admin' ? '/api/payments/all' : '/api/payments/patient', {
                headers: { Authorization: `Bearer ${token}` }
              }) : Promise.resolve({ data: { totalRevenue: 0 } })
            ]);

            let prescriptions = [];
            let tests = [];
            if (user.role === 'patient') {
              const [presRes, testRes] = await Promise.all([
                axios.get(`/api/prescriptions/patient/${user._id}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`/api/tests/patient/${user._id}`, { headers: { Authorization: `Bearer ${token}` } })
              ]);
              prescriptions = presRes.data.prescriptions || [];
              tests = testRes.data.tests || [];
            } else if (user.role === 'doctor') {
              const [presRes, testRes] = await Promise.all([
                axios.get('/api/prescriptions/doctor', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/tests/doctor', { headers: { Authorization: `Bearer ${token}` } })
              ]);
              prescriptions = presRes.data.prescriptions || [];
              tests = testRes.data.tests || [];
            }

            setStats({
              appointments: appointmentsRes.data.appointments || [],
              prescriptions,
              tests,
              totalRevenue: paymentsRes.data?.totalRevenue || 0
            });
          } catch (err) {
            console.error('Error refreshing stats:', err);
          }
        };
        fetchStats();
      }
    });

    const unregisterPrescriptionUpdate = registerCallback('onPrescriptionUpdate', (data) => {
      console.log('Dashboard: Prescription updated', data);
      // Refresh stats if on dashboard tab
      if (activeTab === 'dashboard') {
        // Similar refresh logic as above
      }
    });

    const unregisterAppointmentUpdate = registerCallback('onAppointmentUpdate', (data) => {
      console.log('Dashboard: Appointment updated', data);
      // Refresh stats if on dashboard tab
      if (activeTab === 'dashboard') {
        // Similar refresh logic as above
      }
    });

    // Cleanup on unmount
    return () => {
      unregisterTestUpdate?.();
      unregisterPrescriptionUpdate?.();
      unregisterAppointmentUpdate?.();
    };
  }, [user?._id, registerCallback, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/signin');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'doctor':
        return '#5c6b73';
      case 'admin':
        return '#4a5568';
      case 'patient':
        return '#5c6b73';
      default:
        return '#4a5568';
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcomingAppointments = (stats.appointments || []).filter(
    (a) => new Date(a.appointmentDate).toISOString().split('T')[0] >= today && ['pending', 'confirmed'].includes(a.status)
  );
  const earliestAppointment = upcomingAppointments.length > 0
    ? upcomingAppointments.sort((a, b) => {
        const dA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
        const dB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
        return dA - dB;
      })[0]
    : null;
  const todayAppointments = (stats.appointments || []).filter(
    (a) => new Date(a.appointmentDate).toISOString().split('T')[0] === today
  );
  const pendingAppointments = (stats.appointments || []).filter((a) => a.status === 'pending');

  const formatAppointmentDate = (dateStr, timeStr) => {
    const d = new Date(`${dateStr}T${timeStr || '00:00'}`);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const navItems = [];
  navItems.push({ id: 'dashboard', label: 'Dashboard' });
  if (user.role === 'patient') {
    navItems.push({ id: 'doctor-finder', label: '📍 Find Doctors' });
    navItems.push({ id: 'book', label: 'Book Appointment' });
    navItems.push({ id: 'appointments', label: 'My Appointments' });
    navItems.push({ id: 'prescriptions', label: 'My Prescriptions' });
    navItems.push({ id: 'tests', label: 'My Tests' });
    navItems.push({ id: 'payments', label: 'Payments' });
  } else if (user.role === 'doctor') {
    navItems.push({ id: 'appointments', label: 'Appointments' });
    navItems.push({ id: 'prescriptions', label: 'Prescriptions' });
    navItems.push({ id: 'tests', label: 'Tests' });
  } else if (user.role === 'admin') {
    navItems.push({ id: 'appointments', label: 'Appointments' });
    navItems.push({ id: 'prescriptions', label: 'Prescriptions' });
    navItems.push({ id: 'tests', label: 'Tests' });
    navItems.push({ id: 'payments', label: 'All Payments' });
  }
  navItems.push({ id: 'profile', label: 'Profile' });
  navItems.push({ id: 'notifications', label: 'Notifications' });
  navItems.push({ id: 'chat', label: 'Chat (beta)' });
  navItems.push({ id: 'ai-assistant', label: '🤖 AI Assistant' });
  navItems.push({ id: 'advanced-ai', label: '🧠 Advanced AI' });
  navItems.push({ id: 'health-dashboard', label: '📊 Health Dashboard' });
  navItems.push({ id: 'health-recommendations', label: '💡 Health Coach' });
  navItems.push({ id: 'video-consultation', label: '📹 Video Call' });
  if (user.role === 'patient') {
    navItems.push({ id: 'emergency', label: 'Emergency' });
  }

  const isSidebarExpanded = !sidebarCollapsed || sidebarHover;

  return (
    <div className="dashboard-layout">
      <aside
        className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarHover ? 'hovered' : ''}`}
        onMouseEnter={() => setSidebarHover(true)}
        onMouseLeave={() => setSidebarHover(false)}
      >
        <div className="sidebar-header">
          <h1 className="sidebar-logo">Hippocrates Lab</h1>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="toggle-icon"></span>
            <span className="toggle-icon"></span>
            <span className="toggle-icon"></span>
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{user.name.charAt(0)}</div>
          <div className={`user-info ${isSidebarExpanded ? 'visible' : ''}`}>
            <span className="user-name">{user.name}</span>
            <span className="user-role" style={{ color: getRoleColor(user.role) }}>
              {user.role}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, index) => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout">
            <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className={`logout-label ${isSidebarExpanded ? 'visible' : ''}`}>Logout</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-home">
              <div className="dashboard-home-main">
                <header className="dashboard-welcome-header">
                  <div>
                    <h1>Welcome back, {user.name}</h1>
                    <p className="welcome-subtitle">
                      {user.role === 'patient' && 'Here is an overview of your appointments and health records.'}
                      {user.role === 'doctor' && 'Here is your schedule and activity summary.'}
                      {user.role === 'admin' && 'Overview of clinic activity and performance.'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      type="button"
                      className="theme-toggle-button"
                      onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                      aria-label="Toggle theme"
                    >
                      {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <NotificationBell />
                  </div>
                </header>

                <div className="dashboard-stats-grid">
                {user.role === 'patient' && (
                  <>
                    <div className="stat-card stat-card-slate">
                      <span className="stat-value">{stats.appointments?.length || 0}</span>
                      <span className="stat-label">Total Appointments</span>
                    </div>
                    <div className="stat-card stat-card-amber">
                      <span className="stat-value">{upcomingAppointments.length}</span>
                      <span className="stat-label">Upcoming</span>
                    </div>
                    <div className="stat-card stat-card-green">
                      <span className="stat-value">{stats.prescriptions?.length || 0}</span>
                      <span className="stat-label">Prescriptions</span>
                    </div>
                    <div className="stat-card stat-card-blue">
                      <span className="stat-value">{stats.tests?.length || 0}</span>
                      <span className="stat-label">Test Records</span>
                    </div>
                    <div className="stat-card stat-card-purple">
                      <span className="stat-value">
                        {stats.tests?.filter(t => t.status === 'pending' && !t.isSubmitted).length || 0}
                      </span>
                      <span className="stat-label">Pending Tests</span>
                    </div>
                    <div className="stat-card stat-card-teal">
                      <span className="stat-value">
                        {stats.tests?.filter(t => t.isSubmitted && t.score !== null).length || 0}
                      </span>
                      <span className="stat-label">Tests with Scores</span>
                    </div>
                  </>
                )}
                {user.role === 'doctor' && (
                  <>
                    <div className="stat-card stat-card-slate">
                      <span className="stat-value">{stats.appointments?.length || 0}</span>
                      <span className="stat-label">Total Appointments</span>
                    </div>
                    <div className="stat-card stat-card-amber">
                      <span className="stat-value">{todayAppointments.length}</span>
                      <span className="stat-label">Today</span>
                    </div>
                    <div className="stat-card stat-card-blue">
                      <span className="stat-value">{pendingAppointments.length}</span>
                      <span className="stat-label">Pending</span>
                    </div>
                    <div className="stat-card stat-card-green">
                      <span className="stat-value">{stats.prescriptions?.length || 0}</span>
                      <span className="stat-label">Prescriptions Issued</span>
                    </div>
                    <div className="stat-card stat-card-slate">
                      <span className="stat-value">{stats.tests?.length || 0}</span>
                      <span className="stat-label">Tests Created</span>
                    </div>
                  </>
                )}
                {user.role === 'admin' && (
                  <>
                    <div className="stat-card stat-card-slate">
                      <span className="stat-value">{stats.appointments?.length || 0}</span>
                      <span className="stat-label">Total Appointments</span>
                    </div>
                    <div className="stat-card stat-card-amber">
                      <span className="stat-value">{todayAppointments.length}</span>
                      <span className="stat-label">Today</span>
                    </div>
                    <div className="stat-card stat-card-blue">
                      <span className="stat-value">{pendingAppointments.length}</span>
                      <span className="stat-label">Pending</span>
                    </div>
                    <div className="stat-card stat-card-green stat-card-accent">
                      <span className="stat-value">₹{(stats.totalRevenue || 0).toLocaleString()}</span>
                      <span className="stat-label">Total Revenue</span>
                    </div>
                  </>
                )}
              </div>

              {(user.role === 'patient' || user.role === 'doctor') && (
                <div className="dashboard-next-appointment">
                  <h2>Your Next Appointment</h2>
                  {earliestAppointment ? (
                    <div className="next-appointment-card">
                      <div className="next-appointment-main">
                        <span className="next-appointment-date">
                          {formatAppointmentDate(earliestAppointment.appointmentDate, earliestAppointment.appointmentTime)}
                        </span>
                        {user.role === 'patient' && earliestAppointment.doctor && (
                          <span className="next-appointment-doctor">Dr. {earliestAppointment.doctor.name}</span>
                        )}
                        {user.role === 'doctor' && earliestAppointment.patient && (
                          <span className="next-appointment-doctor">{earliestAppointment.patient.name}</span>
                        )}
                        {earliestAppointment.reason && (
                          <span className="next-appointment-reason">{earliestAppointment.reason}</span>
                        )}
                      </div>
                      <span className={`next-appointment-status status-${earliestAppointment.status}`}>
                        {earliestAppointment.status}
                      </span>
                    </div>
                  ) : (
                    <div className="next-appointment-empty">
                      <p>No upcoming appointments scheduled.</p>
                      {user.role === 'patient' && (
                        <button
                          type="button"
                          className="next-appointment-cta"
                          onClick={() => setActiveTab('book')}
                        >
                          Book an appointment
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              </div>

              <aside className="dashboard-home-sidebar">
                <div className="user-info-compact">
                  <h3>Your Profile</h3>
                  <div className="info-row">
                    <span className="info-label">Email</span>
                    <span>{user.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Role</span>
                    <span>{user.role}</span>
                  </div>
                  {user.specialization && (
                    <div className="info-row">
                      <span className="info-label">Specialization</span>
                      <span>{user.specialization}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="info-row">
                      <span className="info-label">Phone</span>
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}

          {activeTab === 'doctor-finder' && user.role === 'patient' && (
            <DoctorFinder />
          )}

          {activeTab === 'book' && user.role === 'patient' && (
            <BookAppointment />
          )}

          {activeTab === 'appointments' && (
            <AppointmentList userRole={user.role} />
          )}

          {activeTab === 'prescriptions' && (
            <>
              {user.role === 'doctor' && (
                <PrescriptionForm />
              )}
              <PrescriptionList patientId={user.role === 'patient' ? user._id : null} userRole={user.role} />
            </>
          )}

          {activeTab === 'tests' && (
            <>
              {user.role === 'doctor' && (
                <TestForm user={user} />
              )}
              <TestList patientId={user.role === 'patient' ? user._id : null} userRole={user.role} />
            </>
          )}

          {activeTab === 'payments' && (
            <PaymentList userRole={user.role} />
          )}

          {activeTab === 'profile' && (
            <ProfilePage
              user={user}
              onUserUpdated={(updated) => {
                setUser(updated);
              }}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsPage />
          )}

          {activeTab === 'chat' && (
            <ChatPanel user={user} />
          )}

          {activeTab === 'ai-assistant' && (
            <UnifiedAIAssistant />
          )}

          {activeTab === 'advanced-ai' && (
            <AdvancedAIFeatures user={user} />
          )}

          {activeTab === 'health-dashboard' && (
            <HealthDashboard user={user} />
          )}

          {activeTab === 'health-recommendations' && (
            <HealthRecommendations user={user} />
          )}

          {activeTab === 'video-consultation' && (
            <VideoConsultation user={user} />
          )}

          {activeTab === 'emergency' && user.role === 'patient' && (
            <EmergencyPanel user={user} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
