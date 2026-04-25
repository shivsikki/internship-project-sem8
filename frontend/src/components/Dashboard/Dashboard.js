import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BookAppointment from '../Appointments/BookAppointment';
import AppointmentList from '../Appointments/AppointmentList';
import PrescriptionForm from '../Prescriptions/PrescriptionForm';
import PrescriptionList from '../Prescriptions/PrescriptionList';
import Tests from '../Tests/Tests';
import PaymentList from '../Payments/PaymentList';
import Payments from '../Payments/Payments';
import AIHelper from '../AIHelper/AIHelper';
import Emergency from '../Emergency/Emergency';
import MediVault from '../MediVault/MediVault';
import ConsultationPortal from '../VideoCall/ConsultationPortal';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import Enquiries from '../Enquiries/Enquiries';
import NotificationBell from '../Notifications/NotificationBell';
import AdminDashboard from '../AdminDashboard/AdminDashboard';
import DoctorVerification from '../DoctorVerification/DoctorVerification';
import UserManagement from '../UserManagement/UserManagement';
import './Dashboard.css';

const Dashboard = ({ isSidebarCollapsed, setIsSidebarCollapsed }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [healthRange, setHealthRange] = useState('7d');
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [healthForm, setHealthForm] = useState({ bpSys: '', bpDia: '', sugar: '', heartRate: '' });
  const [showPrescriptionAiPicker, setShowPrescriptionAiPicker] = useState(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mediVaultSearchQuery, setMediVaultSearchQuery] = useState('');
  const [reminders, setReminders] = useState(() => {
    try {
      const raw = sessionStorage.getItem('patient_reminders');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return { email: true, sms: false, weekly: true, privateAddress: false };
  });
  const [healthReadings, setHealthReadings] = useState(() => {
    const today = new Date();
    const daysBack = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() - n);
      return d;
    };
    // Lightweight demo data so the UI looks alive.
    return [
      { date: daysBack(6).toISOString(), bpSys: 118, bpDia: 78, sugar: 94, heartRate: 70 },
      { date: daysBack(5).toISOString(), bpSys: 121, bpDia: 80, sugar: 98, heartRate: 72 },
      { date: daysBack(4).toISOString(), bpSys: 116, bpDia: 76, sugar: 92, heartRate: 68 },
      { date: daysBack(3).toISOString(), bpSys: 124, bpDia: 82, sugar: 101, heartRate: 75 },
      { date: daysBack(2).toISOString(), bpSys: 120, bpDia: 79, sugar: 96, heartRate: 71 },
      { date: daysBack(1).toISOString(), bpSys: 122, bpDia: 81, sugar: 103, heartRate: 74 },
      { date: today.toISOString(), bpSys: 119, bpDia: 78, sugar: 97, heartRate: 69 },
    ];
  });
  const [stats, setStats] = useState({
    appointments: [],
    prescriptions: [],
    tests: [],
    totalRevenue: 0
  });

  useEffect(() => {
    const fetchUser = async () => {
      const token = sessionStorage.getItem('token');
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
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/signin');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    try {
      sessionStorage.setItem('patient_reminders', JSON.stringify(reminders));
    } catch {
    }
  }, [reminders]);

  useEffect(() => {
    if (!user || activeTab !== 'dashboard') return;

    const token = sessionStorage.getItem('token');
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
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };

    fetchStats();
  }, [user, activeTab]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
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

  const today = new Date().toISOString().split('T')[0];
  const upcomingAppointments = (stats.appointments || []).filter(
    (a) => new Date(a.appointmentDate).toISOString().split('T')[0] >= today && ['pending', 'confirmed'].includes(a.status)
  );
  const todayAppointments = (stats.appointments || []).filter(
    (a) => new Date(a.appointmentDate).toISOString().split('T')[0] === today
  );
  const pendingAppointments = (stats.appointments || []).filter((a) => a.status === 'pending');

  const formatTimeOnly = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${(m || '00').padStart(2, '0')} ${ampm}`;
  };

  const rangeDays = healthRange === '30d' ? 30 : healthRange === '90d' ? 90 : 7;
  const filteredHealth = [...healthReadings]
    .filter((r) => {
      const d = new Date(r.date);
      if (Number.isNaN(d.getTime())) return false;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - (rangeDays - 1));
      return d >= cutoff;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const latestHealth = filteredHealth.length ? filteredHealth[filteredHealth.length - 1] : null;

  const sparkPath = (values) => {
    if (!values || values.length < 2) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(1, max - min);
    const w = 120;
    const h = 36;
    const dx = w / (values.length - 1);
    return values
      .map((v, i) => {
        const x = i * dx;
        const y = h - ((v - min) / span) * h;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const addHealthReading = (e) => {
    e.preventDefault();
    const bpSys = parseInt(healthForm.bpSys, 10);
    const bpDia = parseInt(healthForm.bpDia, 10);
    const sugar = parseInt(healthForm.sugar, 10);
    const heartRate = parseInt(healthForm.heartRate, 10);

    if ([bpSys, bpDia, sugar, heartRate].some((n) => Number.isNaN(n) || n <= 0)) return;

    setHealthReadings((prev) => [
      ...prev,
      { date: new Date().toISOString(), bpSys, bpDia, sugar, heartRate },
    ]);
    setHealthForm({ bpSys: '', bpDia: '', sugar: '', heartRate: '' });
    setShowHealthForm(false);
  };

  const buildPrescriptionPrompt = (p) => {
    if (!p) return '';
    const meds = Array.isArray(p.medications) ? p.medications : [];
    const medsText = meds.length
      ? meds
        .map((m, idx) => {
          const parts = [
            m?.name ? `${m.name}` : `Medication ${idx + 1}`,
            m?.dosage ? `dosage: ${m.dosage}` : null,
            m?.frequency ? `frequency: ${m.frequency}` : null,
            m?.duration ? `duration: ${m.duration}` : null,
            m?.instructions ? `instructions: ${m.instructions}` : null,
          ].filter(Boolean);
          return `- ${parts.join(', ')}`;
        })
        .join('\n')
      : '- (none listed)';

    return [
      'Please review this prescription and explain it in simple terms for the patient.',
      '',
      `Date: ${p.date ? new Date(p.date).toLocaleDateString() : '—'}`,
      `Diagnosis: ${p.diagnosis || '—'}`,
      '',
      'Medications:',
      medsText,
      '',
      `Notes: ${p.notes || '—'}`,
      '',
      'Answer format:',
      '- Summary (what this is for)',
      '- How to take each medicine',
      '- Common side effects / warnings',
      '- When to contact a doctor',
    ].join('\n');
  };

  const openAiForPrescription = (prescription) => {
    const question = buildPrescriptionPrompt(prescription);
    if (!question) return;
    sessionStorage.setItem('ai_helper_prefill', JSON.stringify({ question }));
    setShowPrescriptionAiPicker(false);
    setSelectedPrescriptionId('');
    setActiveTab('ai-helper');
  };

  const weekdayBars = (() => {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const counts = new Array(7).fill(0);
    const appts = stats.appointments || [];
    for (const a of appts) {
      if (!a?.appointmentDate) continue;
      const d = new Date(a.appointmentDate);
      if (Number.isNaN(d.getTime())) continue;
      // JS: 0=Sun..6=Sat -> convert to Mon=0..Sun=6
      const idx = (d.getDay() + 6) % 7;
      counts[idx] += 1;
    }
    const maxCount = Math.max(...counts);
    return days.map((day, i) => {
      const count = counts[i];
      const height = maxCount > 0 ? Math.max(15, Math.round((count / maxCount) * 100)) : 15;
      const intensity = maxCount > 0 ? count / maxCount : 0;
      // Earthy green palette: vary hue per day + scale opacity by intensity.
      const hueByDay = [120, 135, 110, 145, 105, 128, 116];
      const hue = hueByDay[i] ?? 120;
      const lightness = count > 0 ? 36 : 50;
      const alpha = count > 0 ? 0.18 + 0.60 * intensity : 0.10;
      return {
        day,
        count,
        height: count > 0 ? height : 15,
        shade: `hsla(${hue}, 24%, ${lightness}%, ${alpha})`,
        isPeak: count > 0,
      };
    });
  })();

  const trendPill = (() => {
    const appts = stats.appointments || [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7Start = new Date(startOfToday);
    last7Start.setDate(last7Start.getDate() - 6);
    const prev7Start = new Date(last7Start);
    prev7Start.setDate(prev7Start.getDate() - 7);
    const prev7End = new Date(last7Start);
    prev7End.setDate(prev7End.getDate() - 1);

    let last7 = 0;
    let prev7 = 0;
    for (const a of appts) {
      if (!a?.appointmentDate) continue;
      const d = new Date(a.appointmentDate);
      if (Number.isNaN(d.getTime())) continue;
      const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (dateOnly >= last7Start && dateOnly <= startOfToday) last7 += 1;
      if (dateOnly >= prev7Start && dateOnly <= prev7End) prev7 += 1;
    }

    if (last7 === 0 && prev7 === 0) return null;
    if (prev7 === 0) {
      return { label: 'NEW', variant: 'pos' };
    }
    const delta = ((last7 - prev7) / prev7) * 100;
    const rounded = Math.round(delta * 10) / 10;
    if (Number.isNaN(rounded) || !Number.isFinite(rounded)) return null;
    return {
      label: `${rounded > 0 ? '+' : ''}${rounded}%`,
      variant: rounded >= 0 ? 'pos' : 'neg',
    };
  })();

  const upcomingList = [...(upcomingAppointments || [])]
    .sort((a, b) => {
      const dA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
      const dB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
      return dA - dB;
    })
    .slice(0, 5);

  const profileCompleteness = (() => {
    if (!user || user.role !== 'patient') return null;
    const checks = [
      Boolean(user.name),
      Boolean(user.email),
      Boolean(user.phone),
      Boolean(user.age),
      Boolean(user.gender),
      Boolean(user.address),
    ];
    const done = checks.filter(Boolean).length;
    const total = checks.length;
    return { done, total, pct: Math.round((done / total) * 100) };
  })();

  const navItems = [];
  navItems.push({ id: 'dashboard', label: 'Dashboard' });
  if (user.role === 'patient') {
    navItems.push({ id: 'book', label: 'Book Appointment' });
    navItems.push({ id: 'appointments', label: 'My Appointments' });
    navItems.push({ id: 'consultations', label: 'Virtual Consultation' });
    navItems.push({ id: 'prescriptions', label: 'My Prescriptions' });
    navItems.push({ id: 'tests', label: 'My Tests' });
    navItems.push({ id: 'payments', label: 'Payments' });
    navItems.push({ id: 'medivault', label: 'MediVault' });
    navItems.push({ id: 'inquiries', label: 'Inquiries' });
    navItems.push({ id: 'ai-helper', label: 'AI Helper' });
    navItems.push({ id: 'emergency', label: 'Emergency' });
  } else if (user.role === 'doctor') {
    navItems.push({ id: 'appointments', label: 'Appointments' });
    navItems.push({ id: 'consultations', label: 'E-Consultancy' });
    navItems.push({ id: 'prescriptions', label: 'Prescriptions' });
    navItems.push({ id: 'tests', label: 'Tests' });
    navItems.push({ id: 'inquiries', label: 'Patient Inquiries' });
  } else if (user.role === 'admin') {
    navItems.push({ id: 'appointments', label: 'Appointments' });
    navItems.push({ id: 'prescriptions', label: 'Prescriptions' });
    navItems.push({ id: 'tests', label: 'Tests' });
    navItems.push({ id: 'payments', label: 'All Payments' });
    navItems.push({ id: 'verification', label: 'Verify Doctors' });
    navItems.push({ id: 'manage-users', label: 'Manage Users' });
  }

  const isSidebarExpanded = !isSidebarCollapsed;

  const getNavIcon = (id) => {
    const common = {
      width: 18,
      height: 18,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    };
    switch (id) {
      case 'dashboard':
        return (
          <svg {...common}>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        );
      case 'appointments':
        return (
          <svg {...common}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case 'book':
        return (
          <svg {...common}>
            <path d="M16 2v4" />
            <path d="M3 10h18" />
            <path d="M8 2v4" />
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M12 14v4" />
            <path d="M10 16h4" />
          </svg>
        );
      case 'prescriptions':
        return (
          <svg {...common}>
            <path d="M8 3h8a3 3 0 0 1 3 3v15l-4-2-4 2-4-2-4 2V6a3 3 0 0 1 3-3z" />
            <line x1="8" y1="9" x2="16" y2="9" />
            <line x1="8" y1="13" x2="16" y2="13" />
          </svg>
        );
      case 'consultations':
        return (
          <svg {...common}>
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        );
      case 'tests':
        return (
          <svg {...common}>
            <path d="M10 2v6l-6 10a4 4 0 0 0 3.5 6h9A4 4 0 0 0 20 18L14 8V2" />
            <line x1="8" y1="6" x2="16" y2="6" />
          </svg>
        );
      case 'payments':
        return (
          <svg {...common}>
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case 'inquiries':
        return (
          <svg {...common}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
      case 'medivault':
        return (
          <svg {...common}>
            <path d="M19 7l-4-4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-1-1.7z" />
            <path d="M12 7v14" />
            <path d="M9 10h6" />
            <path d="M9 14h6" />
          </svg>
        );
      case 'ai-helper':
        return (
          <svg {...common}>
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M7 5H3" />
            <path d="M17 17v4" />
            <path d="M19 19h-4" />
          </svg>
        );
      case 'emergency':
        return (
          <svg {...common}>
            <path d="M12 2l9 7-9 13L3 9z" />
            <line x1="12" y1="8" x2="12" y2="14" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'verification':
        return (
          <svg {...common}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        );
      case 'manage-users':
        return (
          <svg {...common}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      default:
        return (
          <svg {...common}>
            <circle cx="12" cy="12" r="9" />
          </svg>
        );
    }
  };

  return (
    <div className="dashboard-layout">
      <aside
        className={`dashboard-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}
      >
        <div className="sidebar-header cafe-header">
          <div className="cafe-brand vertical-brand">
            <img
              src="/images/hippocrates.png"
              alt="Hippocrates Lab Logo"
              className="sidebar-logo-img"
            />
            <div className="cafe-brand-text centered-text">
              <div className="cafe-title big-title">Hippocrates Lab</div>
              <div className="cafe-subtitle tagline">where technology meets compassion</div>
            </div>
          </div>
          <button
            className="sidebar-toggle cafe-toggle"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="toggle-icon"></span>
            <span className="toggle-icon"></span>
            <span className="toggle-icon"></span>
          </button>
        </div>

        <nav className="sidebar-nav cafe-nav">
          {navItems.map((item, index) => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <span className="nav-icon" aria-hidden="true">
                {getNavIcon(item.id)}
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer cafe-footer">


          <div className="cafe-profile">
            <div className="cafe-profile-avatar">{user.name.charAt(0)}</div>
            <div className={`cafe-profile-text ${isSidebarExpanded ? 'visible' : ''}`}>
              <div className="cafe-profile-name">{user.name}</div>
              <div className="cafe-profile-role">
                {user.role === 'doctor' ? (user.specialization || 'Doctor') : user.role}
              </div>
            </div>
            <button type="button" className="cafe-profile-logout" onClick={handleLogout} aria-label="Logout">
              <svg
                className="logout-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-content">
          {activeTab === 'dashboard' && user?.role === 'admin' && (
            <AdminDashboard />
          )}

          {activeTab === 'verification' && user?.role === 'admin' && (
            <DoctorVerification />
          )}

          {activeTab === 'manage-users' && user?.role === 'admin' && (
            <UserManagement />
          )}

          {activeTab === 'dashboard' && user?.role !== 'admin' && (
            <>
              <div className="dashboard-home">
                <div className="dashboard-home-main">
                  <header className="dashboard-hero dashboard-hero-simple">
                    <div className="hero-bg-pattern" aria-hidden="true" />
                    <div className="hero-content">
                      <div className="hero-top-row">
                        <AnimatedHeading text="Your Dashboard" />
                        <NotificationBell />
                      </div>
                      <p className="hero-subtitle-simple">
                        Welcome back, {user.name}. {user.role === 'patient' && 'Here is your health overview.'}
                        {user.role === 'doctor' && 'Here is your clinic overview.'}
                        {user.role === 'admin' && 'Here is your clinic overview.'}
                      </p>
                    </div>
                  </header>

                  <div className="dashboard-metrics-primary">
                    {user.role === 'patient' && (
                      <>
                        <div 
                          className={`metric-lg card-animated patient-focus-card ${hoveredCard && hoveredCard !== 'visits' ? 'card-shrunk' : ''} ${hoveredCard === 'visits' ? 'card-expanded' : ''}`}
                          style={{ animationDelay: '0.05s' }}
                          onMouseEnter={() => setHoveredCard('visits')}
                          onMouseLeave={() => setHoveredCard(null)}
                        >
                          <div className="metric-lg-head">
                            <div>
                              <p className="metric-lg-label">Your Visits (Patient)</p>
                              <h3 className="metric-lg-value">{stats.appointments?.length || 0}</h3>
                            </div>
                            {trendPill && (
                              <div className={`metric-lg-pill metric-lg-pill-${trendPill.variant}`}>
                                {trendPill.label}
                              </div>
                            )}
                          </div>
                          <div className="metric-lg-bars">
                            {weekdayBars.map((b) => (
                              <div key={b.day} className="metric-lg-bar-wrap">
                                <div className="metric-lg-bar-num">{b.count}</div>
                                <div
                                  className={`metric-lg-bar-fill ${b.isPeak ? 'is-peak' : ''}`}
                                  style={{ height: `${b.height}%`, background: b.shade }}
                                />
                                <div className="metric-lg-bar-day">{b.day}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div 
                          className={`metric-lg health-card card-animated patient-focus-card ${hoveredCard && hoveredCard !== 'health' ? 'card-shrunk' : ''} ${hoveredCard === 'health' ? 'card-expanded' : ''}`}
                          style={{ animationDelay: '0.1s' }}
                          onMouseEnter={() => setHoveredCard('health')}
                          onMouseLeave={() => setHoveredCard(null)}
                        >
                          <div className="metric-lg-head health-card-head">
                            <div>
                              <p className="metric-lg-label">Health stats</p>
                              <h3 className="metric-lg-value">Today</h3>
                            </div>
                            <div className="health-card-controls">
                              <select
                                className="health-range"
                                value={healthRange}
                                onChange={(e) => setHealthRange(e.target.value)}
                                aria-label="Filter health readings by time"
                              >
                                <option value="7d">Last 7 days</option>
                                <option value="30d">Last 30 days</option>
                                <option value="90d">Last 90 days</option>
                              </select>
                              <button
                                type="button"
                                className="health-add-btn"
                                onClick={() => setShowHealthForm((v) => !v)}
                              >
                                Add reading
                              </button>
                            </div>
                          </div>

                          <div className="health-metrics">
                            <div className="health-metric">
                              <span className="health-metric-label">BP</span>
                              <span className="health-metric-value">
                                {latestHealth ? `${latestHealth.bpSys}/${latestHealth.bpDia}` : '—'}
                              </span>
                            </div>
                            <div className="health-metric">
                              <span className="health-metric-label">Sugar</span>
                              <span className="health-metric-value">
                                {latestHealth ? `${latestHealth.sugar}` : '—'}
                              </span>
                            </div>
                            <div className="health-metric">
                              <span className="health-metric-label">Heart rate</span>
                              <span className="health-metric-value">
                                {latestHealth ? `${latestHealth.heartRate}` : '—'}
                              </span>
                            </div>
                          </div>

                          <div className="health-sparks">
                            <div className="health-spark">
                              <div className="health-spark-top">
                                <span className="health-spark-title">BP (sys)</span>
                                <span className="health-spark-note">last {rangeDays}d</span>
                              </div>
                              <svg viewBox="0 0 120 36" className="health-spark-svg" aria-hidden="true">
                                <path
                                  d={sparkPath(filteredHealth.map((r) => r.bpSys))}
                                  fill="none"
                                  stroke="var(--color-primary)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                            <div className="health-spark">
                              <div className="health-spark-top">
                                <span className="health-spark-title">Sugar</span>
                                <span className="health-spark-note">last {rangeDays}d</span>
                              </div>
                              <svg viewBox="0 0 120 36" className="health-spark-svg" aria-hidden="true">
                                <path
                                  d={sparkPath(filteredHealth.map((r) => r.sugar))}
                                  fill="none"
                                  stroke="#b66a4e"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                            <div className="health-spark">
                              <div className="health-spark-top">
                                <span className="health-spark-title">Heart rate</span>
                                <span className="health-spark-note">last {rangeDays}d</span>
                              </div>
                              <svg viewBox="0 0 120 36" className="health-spark-svg" aria-hidden="true">
                                <path
                                  d={sparkPath(filteredHealth.map((r) => r.heartRate))}
                                  fill="none"
                                  stroke="#7a2e1a"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                          </div>

                          {showHealthForm && (
                            <form className="health-form" onSubmit={addHealthReading}>
                              <div className="health-form-grid">
                                <div className="health-field">
                                  <label>BP systolic</label>
                                  <input
                                    value={healthForm.bpSys}
                                    onChange={(e) => setHealthForm((p) => ({ ...p, bpSys: e.target.value }))}
                                    inputMode="numeric"
                                    placeholder="120"
                                  />
                                </div>
                                <div className="health-field">
                                  <label>BP diastolic</label>
                                  <input
                                    value={healthForm.bpDia}
                                    onChange={(e) => setHealthForm((p) => ({ ...p, bpDia: e.target.value }))}
                                    inputMode="numeric"
                                    placeholder="80"
                                  />
                                </div>
                                <div className="health-field">
                                  <label>Sugar</label>
                                  <input
                                    value={healthForm.sugar}
                                    onChange={(e) => setHealthForm((p) => ({ ...p, sugar: e.target.value }))}
                                    inputMode="numeric"
                                    placeholder="95"
                                  />
                                </div>
                                <div className="health-field">
                                  <label>Heart rate</label>
                                  <input
                                    value={healthForm.heartRate}
                                    onChange={(e) => setHealthForm((p) => ({ ...p, heartRate: e.target.value }))}
                                    inputMode="numeric"
                                    placeholder="72"
                                  />
                                </div>
                              </div>
                              <div className="health-form-actions">
                                <button type="submit" className="health-save-btn">Save</button>
                                <button type="button" className="health-cancel-btn" onClick={() => setShowHealthForm(false)}>
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </>
                    )}
                    {user.role === 'doctor' && (
                      <div className="clinical-insights-wrapper">
                        <div className="clinical-insights-header">
                          <h2 className="clinical-insights-title">Clinical Insights</h2>
                          <p className="clinical-insights-subtitle">Real-time overview of practice demographics and performance.</p>
                        </div>

                        {/* Section 1: Insights Grid */}
                        <div className="insights-grid">
                          {/* Age Distribution */}
                          <div className="insight-card age-card">
                            <div className="insight-card-top">
                              <div className="insight-card-title">PATIENT AGE DISTRIBUTION</div>
                              <div className="insight-pill">Last 30 Days</div>
                            </div>
                            <div className="age-metric">
                              <span className="age-value">32.4</span>
                              <span className="age-label">Median Age</span>
                            </div>
                            <div className="age-chart-svg">
                              <svg viewBox="0 0 400 120" preserveAspectRatio="none" style={{ width: '100%', height: '80px', display: 'block' }}>
                                <path
                                  d="M0,120 L0,80 C40,80 60,40 100,40 S160,90 200,90 S260,20 300,20 S360,70 400,70 L400,120 Z"
                                  fill="rgba(103, 131, 92, 0.15)"
                                />
                                <path
                                  d="M0,80 C40,80 60,40 100,40 S160,90 200,90 S260,20 300,20 S360,70 400,70"
                                  fill="none"
                                  stroke="#67835c"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="age-x-axis">
                                <span>0-18</span>
                                <span>19-35</span>
                                <span>36-50</span>
                                <span>51-65</span>
                                <span>65+</span>
                              </div>
                            </div>
                          </div>

                          {/* Gender Ratio */}
                          <div className="insight-card gender-card">
                            <div className="insight-card-top">
                              <div className="insight-card-title">GENDER RATIO</div>
                            </div>
                            <div className="gender-donut-wrapper">
                              <svg viewBox="0 0 100 100" className="gender-donut-chart-svg">
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#e6eaeb" strokeWidth="12" />
                                <circle
                                  cx="50" cy="50" r="38" fill="none" stroke="#67835c" strokeWidth="12"
                                  strokeDasharray="155.1 238.7" strokeDashoffset="0" transform="rotate(-90 50 50)"
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="gender-donut-center">
                                <div className="gender-donut-value">65%</div>
                                <div className="gender-donut-label">FEMALE</div>
                              </div>
                            </div>
                            <div className="gender-legend-simple">
                              <div className="legend-item"><span className="legend-dot female"></span> Female</div>
                              <div className="legend-item"><span className="legend-dot male"></span> Male</div>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Upcoming Appointments */}
                        <div className="upcoming-appointments-container">
                          <div className="section-header-row">
                            <h3 className="section-title">Upcoming Appointments</h3>
                            <button className="view-link-btn" onClick={() => setActiveTab('appointments')}>View Schedule</button>
                          </div>
                          <div className="appointments-list-view">
                            {todayAppointments.slice(0, 3).map((apt, idx) => {
                              const timeStr = apt.appointmentTime || '09:00';
                              let h = parseInt(timeStr.split(':')[0], 10);
                              if (isNaN(h)) h = 9;
                              const p = h >= 12 ? 'PM' : 'AM';
                              const hr = h % 12 || 12;
                              const fmtHr = hr.toString().padStart(2, '0');
                              return (
                                <div key={apt._id || idx} className="appointment-list-item">
                                  <div className="apt-time-col">
                                    <span className="apt-time-hr">{fmtHr}</span>
                                    <span className="apt-time-ampm">{p}</span>
                                  </div>
                                  <div className="apt-info-col">
                                    <h4 className="apt-patient-name">{apt.patient?.name || 'Patient Name'}</h4>
                                    <p className="apt-patient-desc">{apt.reason || 'Consultation'} • Room 402</p>
                                  </div>
                                  <div className="apt-status-col">
                                    <span className={`apt-status-pill ${apt.status || 'pending'}`}>{apt.status?.toUpperCase() || 'CONFIRMED'}</span>
                                    <span className="apt-chevron">›</span>
                                  </div>
                                </div>
                              );
                            })}
                            {todayAppointments.length === 0 && (
                              <>
                                <div className="appointment-list-item">
                                  <div className="apt-time-col">
                                    <span className="apt-time-hr">09</span>
                                    <span className="apt-time-ampm">AM</span>
                                  </div>
                                  <div className="apt-info-col">
                                    <h4 className="apt-patient-name">Jaskirat Singh Rangi</h4>
                                    <p className="apt-patient-desc">Post-Op Consultation • Room 402</p>
                                  </div>
                                  <div className="apt-status-col">
                                    <span className="apt-status-pill confirmed">CONFIRMED</span>
                                    <span className="apt-chevron">›</span>
                                  </div>
                                </div>
                                <div className="appointment-list-item">
                                  <div className="apt-time-col">
                                    <span className="apt-time-hr">10</span>
                                    <span className="apt-time-ampm">AM</span>
                                  </div>
                                  <div className="apt-info-col">
                                    <h4 className="apt-patient-name">Ram Charan Singh</h4>
                                    <p className="apt-patient-desc">General Checkup • Telehealth</p>
                                  </div>
                                  <div className="apt-status-col">
                                    <span className="apt-status-pill virtual">VIRTUAL</span>
                                    <span className="apt-chevron">›</span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Section 3: Current Patients */}
                        <div className="current-patients-container">
                          <div className="section-header-row">
                            <h3 className="section-title">Current Patients</h3>
                          </div>
                          <div className="patient-cards-grid">
                            {todayAppointments.slice(0, 2).map((apt, idx) => (
                              <div key={apt._id || idx} className="current-patient-card">
                                <div className="patient-card-header">
                                  <div className="cp-avatar">{apt.patient?.name?.charAt(0) || 'P'}</div>
                                </div>
                                <h4 className="cp-name">{apt.patient?.name || 'Patient Name'}</h4>
                                <p className="cp-reason">{apt.reason?.toUpperCase() || 'ROUTINE MONITORING'}</p>
                                <div className="cp-vitals">
                                  <span className="cp-vital">♥ {Math.floor(Math.random() * (90 - 65 + 1)) + 65} bpm</span>
                                  <span className="cp-vital">💧 {120 + Math.floor(Math.random() * 10)}/80</span>
                                </div>
                              </div>
                            ))}
                            {todayAppointments.length === 0 && (
                              <>
                                <div className="current-patient-card">
                                  <div className="patient-card-header">
                                    <div className="cp-avatar">S</div>
                                  </div>
                                  <h4 className="cp-name">Jaskirat Singh Rangi</h4>
                                  <p className="cp-reason">CRITICAL PATH CARE</p>
                                  <div className="cp-vitals">
                                    <span className="cp-vital">♥ 72 bpm</span>
                                  </div>
                                </div>
                                <div className="current-patient-card">
                                  <div className="patient-card-header">
                                    <div className="cp-avatar">D</div>
                                  </div>
                                  <h4 className="cp-name">Ram Charan Singh</h4>
                                  <p className="cp-reason">ROUTINE MONITORING</p>
                                  <div className="cp-vitals">
                                    <span className="cp-vital">💧 120/80</span>
                                  </div>
                                </div>
                              </>
                            )}
                            <div className="add-patient-card">
                              <div className="add-patient-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                  <circle cx="8.5" cy="7" r="4" />
                                  <line x1="20" y1="8" x2="20" y2="14" />
                                  <line x1="23" y1="11" x2="17" y2="11" />
                                </svg>
                              </div>
                              <div className="add-patient-text">ADD PATIENT</div>
                            </div>
                          </div>
                        </div>

                        {/* Section 4: Active Diagnostic Tests */}
                        <div className="active-tests-container">
                          <div className="section-header-row">
                            <h3 className="section-title">Active Diagnostic Tests</h3>
                          </div>
                          <div className="tests-table-view">
                            <div className="tests-table-header">
                              <div className="th-col">TEST NAME</div>
                              <div className="th-col">PATIENT</div>
                              <div className="th-col">STATUS</div>
                              <div className="th-col">PRIORITY</div>
                            </div>
                            {(stats.tests || []).slice(0, 4).map((test, idx) => {
                              let priority = 'NORMAL';
                              let pClass = 'normal';
                              if (test.testName?.toLowerCase().includes('comprehensive') || idx === 0) { priority = 'HIGH'; pClass = 'high'; }
                              return (
                                <div key={test._id || idx} className="tests-table-row">
                                  <div className="td-col test-name-td">{test.testName || test.name || 'Lab Test'}</div>
                                  <div className="td-col test-patient-td">{test.patient?.name || 'Patient Name'}</div>
                                  <div className="td-col test-status-td">
                                    <span className="status-dot-indicator"></span>
                                    {test.status === 'completed' ? 'Completed' : test.status === 'pending' ? 'Scheduled' : 'In Progress'}
                                  </div>
                                  <div className={`td-col test-priority-td ${pClass}`}>{priority}</div>
                                </div>
                              );
                            })}
                            {(stats.tests || []).length === 0 && (
                              <>
                                <div className="tests-table-row">
                                  <div className="td-col test-name-td">Comprehensive Metabolic Panel</div>
                                  <div className="td-col test-patient-td">Eleanor Fitzroy</div>
                                  <div className="td-col test-status-td"><span className="status-dot-indicator in-progress"></span> In Progress</div>
                                  <div className="td-col test-priority-td high">HIGH</div>
                                </div>
                                <div className="tests-table-row">
                                  <div className="td-col test-name-td">Cardiac Stress Test</div>
                                  <div className="td-col test-patient-td">David Chen</div>
                                  <div className="td-col test-status-td"><span className="status-dot-indicator scheduled"></span> Scheduled</div>
                                  <div className="td-col test-priority-td normal">NORMAL</div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                      </div>
                    )}
                    {user.role === 'admin' && (
                      <>
                        <div className="metric-lg card-animated" style={{ animationDelay: '0.05s' }}>
                          <div className="metric-lg-head">
                            <div>
                              <p className="metric-lg-label">Total Appointments</p>
                              <h3 className="metric-lg-value">{stats.appointments?.length || 0}</h3>
                            </div>
                            {trendPill && (
                              <div className={`metric-lg-pill metric-lg-pill-${trendPill.variant}`}>
                                {trendPill.label}
                              </div>
                            )}
                          </div>
                          <div className="metric-lg-bars">
                            {weekdayBars.map((b) => (
                              <div key={b.day} className="metric-lg-bar-wrap">
                                <div className="metric-lg-bar-num">{b.count}</div>
                                <div
                                  className={`metric-lg-bar-fill ${b.isPeak ? 'is-peak' : ''}`}
                                  style={{ height: `${b.height}%`, background: b.shade }}
                                />
                                <div className="metric-lg-bar-day">{b.day}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="metric-lg metric-lg-accent card-animated" style={{ animationDelay: '0.1s' }}>
                          <div className="metric-lg-head">
                            <div>
                              <p className="metric-lg-label">Consultation Revenue</p>
                              <h3 className="metric-lg-value">₹{(stats.totalRevenue || 0).toLocaleString()}</h3>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {user.role === 'patient' ? (
                    <>
                      <div className="dash-art-grid">
                        <section 
                          className={`dash-feature dash-prescriptions card-animated patient-focus-card ${hoveredCard && hoveredCard !== 'prescriptions' ? 'card-shrunk' : ''} ${hoveredCard === 'prescriptions' ? 'card-expanded' : ''}`}
                          style={{ animationDelay: '0.15s' }}
                          onMouseEnter={() => setHoveredCard('prescriptions')}
                          onMouseLeave={() => setHoveredCard(null)}
                        >
                          <div className="dash-feature-top">
                            <div>
                              <p className="dash-feature-kicker">Prescriptions</p>
                              <h3 className="dash-feature-title">Your meds & diagnosis</h3>
                            </div>
                            <div className="dash-feature-count">{stats.prescriptions?.length || 0}</div>
                          </div>

                          <div className="dash-feature-list">
                            {(stats.prescriptions || []).slice(0, 1).map((p) => (
                              <div key={p._id} className="dash-feature-item">
                                <div className="dash-feature-item-main">
                                  <span className="dash-feature-item-title">{p.diagnosis || 'Prescription'}</span>
                                  <span className="dash-feature-item-sub">
                                    {p.date ? new Date(p.date).toLocaleDateString() : '—'}
                                  </span>
                                </div>
                                <span className="dash-feature-chip">View</span>
                              </div>
                            ))}
                            {(stats.prescriptions || []).length === 0 && (
                              <div className="dash-feature-empty">No prescriptions yet.</div>
                            )}
                          </div>

                          <div className="dash-feature-cta-row">
                            <button
                              type="button"
                              className="dash-feature-cta"
                              onClick={() => setActiveTab('prescriptions')}
                            >
                              Open prescriptions
                            </button>

                            <button
                              type="button"
                              className="dash-feature-cta dash-feature-cta-secondary"
                              onClick={() => setShowPrescriptionAiPicker(true)}
                              disabled={(stats.prescriptions || []).length === 0}
                            >
                              Review with AI
                            </button>
                          </div>
                        </section>

                        <section 
                          className={`dash-feature dash-tests card-animated patient-focus-card ${hoveredCard && hoveredCard !== 'tests' ? 'card-shrunk' : ''} ${hoveredCard === 'tests' ? 'card-expanded' : ''}`}
                          style={{ animationDelay: '0.2s' }}
                          onMouseEnter={() => setHoveredCard('tests')}
                          onMouseLeave={() => setHoveredCard(null)}
                        >
                          <div className="dash-tests-bg" aria-hidden="true" />
                          <div className="dash-feature-top">
                            <div>
                              <p className="dash-feature-kicker">Test records</p>
                              <h3 className="dash-feature-title">Results timeline</h3>
                            </div>
                            <div className="dash-feature-count">{stats.tests?.length || 0}</div>
                          </div>

                          <div className="dash-tests-content">
                            <div className="dash-tests-mini">
                              {(stats.tests || []).slice(0, 1).map((t) => (
                                <div key={t._id} className="dash-tests-row">
                                  <div className="dash-tests-dot" />
                                  <div className="dash-tests-row-main">
                                    <span className="dash-tests-name">{t.testName || t.name || 'Test'}</span>
                                    <span className="dash-tests-sub">
                                      {t.date ? new Date(t.date).toLocaleDateString() : '—'}
                                    </span>
                                  </div>
                                  <span className={`dash-tests-pill status-${t.status || 'pending'}`}>
                                    {(t.status || 'pending').toString()}
                                  </span>
                                </div>
                              ))}
                              {(stats.tests || []).length === 0 && (
                                <div className="dash-feature-empty">No test records yet.</div>
                              )}
                            </div>
                          </div>

                          <div className="dash-tests-actions">
                            <button
                              type="button"
                              className="dash-feature-cta dash-feature-cta-secondary"
                              onClick={() => setActiveTab('tests')}
                            >
                              Open tests
                            </button>
                            <button
                              type="button"
                              className="dash-feature-cta"
                              onClick={() => setActiveTab('appointments')}
                            >
                              View all activity
                            </button>
                          </div>
                        </section>
                      </div>

                      {showPrescriptionAiPicker && (
                        <div className="dash-modal-overlay" onClick={() => setShowPrescriptionAiPicker(false)}>
                          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="dash-modal-head">
                              <h3>Review a prescription with AI</h3>
                              <button
                                type="button"
                                className="dash-modal-x"
                                onClick={() => setShowPrescriptionAiPicker(false)}
                                aria-label="Close"
                              >
                                ×
                              </button>
                            </div>

                            <p className="dash-modal-sub">
                              Choose one of your prescriptions. We’ll open AI Helper and paste it as the input.
                            </p>

                            <div className="dash-modal-list">
                              {(stats.prescriptions || []).map((p) => (
                                <label
                                  key={p._id}
                                  className={`dash-modal-item ${selectedPrescriptionId === p._id ? 'active' : ''}`}
                                >
                                  <input
                                    type="radio"
                                    name="prescription"
                                    value={p._id}
                                    checked={selectedPrescriptionId === p._id}
                                    onChange={() => setSelectedPrescriptionId(p._id)}
                                  />
                                  <div className="dash-modal-item-main">
                                    <span className="dash-modal-item-title">{p.diagnosis || 'Prescription'}</span>
                                    <span className="dash-modal-item-sub">
                                      {p.date ? new Date(p.date).toLocaleDateString() : '—'}
                                    </span>
                                  </div>
                                </label>
                              ))}
                            </div>

                            <div className="dash-modal-actions">
                              <button
                                type="button"
                                className="dash-modal-btn dash-modal-btn-secondary"
                                onClick={() => setShowPrescriptionAiPicker(false)}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="dash-modal-btn"
                                disabled={!selectedPrescriptionId}
                                onClick={() => {
                                  const p = (stats.prescriptions || []).find((x) => x._id === selectedPrescriptionId);
                                  openAiForPrescription(p);
                                }}
                              >
                                Continue to AI Helper
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    user.role === 'admin' && (
                      <>
                        <div className="metric-lg card-animated" style={{ animationDelay: '0.05s' }}>
                          <div className="metric-lg-head">
                            <div>
                              <p className="metric-lg-label">Total Appointments</p>
                              <h3 className="metric-lg-value">{stats.appointments?.length || 0}</h3>
                            </div>
                            {trendPill && (
                              <div className={`metric-lg-pill metric-lg-pill-${trendPill.variant}`}>
                                {trendPill.label}
                              </div>
                            )}
                          </div>
                          <div className="metric-lg-bars">
                            {weekdayBars.map((b) => (
                              <div key={b.day} className="metric-lg-bar-wrap">
                                <div className="metric-lg-bar-num">{b.count}</div>
                                <div
                                  className={`metric-lg-bar-fill ${b.isPeak ? 'is-peak' : ''}`}
                                  style={{ height: `${b.height}%`, background: b.shade }}
                                />
                                <div className="metric-lg-bar-day">{b.day}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="metric-lg metric-lg-accent card-animated" style={{ animationDelay: '0.1s' }}>
                          <div className="metric-lg-head">
                            <div>
                              <p className="metric-lg-label">Consultation Revenue</p>
                              <h3 className="metric-lg-value">₹{(stats.totalRevenue || 0).toLocaleString()}</h3>
                            </div>
                          </div>
                        </div>
                      </>
                    )
                  )}

                  {user.role === 'patient' && (
                    <section className="upcoming-appointments-section dashboard-block">
                      <div className="upcoming-section-head">
                        <h2 className="section-title">Upcoming Appointments</h2>
                        <button type="button" className="upcoming-view-all" onClick={() => setActiveTab('appointments')}>
                          View All
                        </button>
                      </div>
                      <div className="upcoming-list-card">
                        {upcomingList.length === 0 ? (
                          <div className="upcoming-empty">
                            <p>No upcoming appointments.</p>
                            {user.role === 'patient' && (
                              <button type="button" className="next-appointment-cta" onClick={() => setActiveTab('book')}>
                                Book an appointment
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="upcoming-list">
                            {upcomingList.map((apt) => (
                              <div key={apt._id} className="upcoming-list-item" onClick={() => setActiveTab('appointments')}>
                                <div className="upcoming-item-avatar">{user.role === 'patient' ? (apt.doctor?.name?.charAt(0) || 'D') : (apt.patient?.name?.charAt(0) || 'P')}</div>
                                <div className="upcoming-item-content">
                                  <h4 className="upcoming-item-name">{user.role === 'patient' ? `Dr. ${apt.doctor?.name}` : apt.patient?.name}</h4>
                                  <p className="upcoming-item-meta">{apt.reason || 'Appointment'} • {formatTimeOnly(apt.appointmentTime)}</p>
                                </div>
                                <span className={`upcoming-status-pill status-${apt.status}`}>{apt.status}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                </div>

                {user.role === 'doctor' ? (
                  <aside className="dashboard-home-sidebar doctor-sidebar-wrapper">
                    <div className="doc-profile-card">
                      <div className="doc-sidebar-content">
                      <div className="doc-avatar-wrap">
                        <img src="/images/doctor-profile.jpg" alt="Doctor avatar" className="doc-avatar" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                        <div className="doc-avatar-fallback">{user.name.charAt(0)}</div>
                        <span className="doc-online-dot"></span>
                      </div>
                      <h2 className="doc-name">Dr. {user.name.replace(/^Dr\.\s*/i, '')}</h2>
                      <p className="doc-role">{user.specialization || 'MD, PHD CARDIOVASCULAR MEDICINE'}</p>

                      <div className="doc-stats-grid">
                        <div className="doc-stat-pill">
                          <span className="doc-stat-value">{stats.appointments?.length || 0}</span>
                          <span className="doc-stat-label">APPOINTMENTS</span>
                        </div>
                        <div className="doc-stat-pill">
                          <span className="doc-stat-value">{stats.prescriptions?.length || stats.tests?.length || 0}</span>
                          <span className="doc-stat-label">PRESCRIPTIONS</span>
                        </div>
                      </div>

                      <div className="doc-section">
                        <h3 className="doc-section-heading">CLINICAL BIO</h3>
                        <p className="doc-bio-text">Leading specialist in non-invasive cardiology and preventative health with over 15 years of clinical practice.</p>
                      </div>

                      <div className="doc-section">
                        <h3 className="doc-section-heading">SPECIALIZATIONS</h3>
                        <div className="doc-tags">
                          <span className="doc-tag">Cardiology</span>
                          <span className="doc-tag">Genomic Medicine</span>
                          <span className="doc-tag">Diagnostics</span>
                        </div>
                      </div>

                      <div className="doc-section">
                        <h3 className="doc-section-heading">PATIENT REVIEWS</h3>
                        <div className="doc-review-block">
                          <div className="doc-review-line">
                            <strong>Rating:</strong> {user.rating ? `${user.rating} / 5` : 'no rating assigned'}
                          </div>
                          <div className="doc-review-line">
                            <strong>Latest Review:</strong> {user.latestReview ? `"${user.latestReview}"` : 'no reviews assigned'}
                          </div>
                        </div>
                      </div>

                      <div className="doc-action-list">
                        <button className="doc-action-btn">
                          <span className="doc-action-icon">👤</span>
                          <span className="doc-action-text">Edit Profile</span>
                        </button>
                        <button className="doc-action-btn">
                          <span className="doc-action-icon">⚙️</span>
                          <span className="doc-action-text">Clinic Settings</span>
                        </button>
                        <button className="doc-action-btn" onClick={() => setActiveTab('inquiries')}>
                          <span className="doc-action-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                          </span>
                          <span className="doc-action-text">Patient Inquiries</span>
                          <span className="doc-action-badge">2</span>
                        </button>
                      </div>
                    </div>
                    </div>

                    <div className="doc-contact-card">
                      <h3 className="doc-section-heading">CONTACT MANAGER</h3>
                      <p className="doc-contact-desc">Report any issue or any problem directly.</p>
                      <form className="doc-contact-form" onSubmit={(e) => { e.preventDefault(); e.target.reset(); alert('Report submitted successfully.'); }}>
                        <textarea className="doc-contact-textarea" placeholder="Describe your issue..." required></textarea>
                        <button type="submit" className="doc-contact-send-btn">Send</button>
                      </form>
                    </div>
                  </aside>
                ) : (
                  <aside className="dashboard-home-sidebar">
                    <div className="dashboard-profile-card profile-card-animated">
                      <div className="profile-card-avatar-wrap">
                        <div className="profile-card-avatar">{user.name.charAt(0)}</div>
                      </div>
                      <h2 className="profile-card-name">{user.name}</h2>
                      <p className="profile-card-role">{user.role === 'doctor' ? user.specialization || 'Doctor' : user.role === 'admin' ? 'Administrator' : 'Patient'}</p>
                      <div className="profile-card-stats">
                        <div className="profile-stat">
                          <p className="profile-stat-value">{stats.appointments?.length || 0}</p>
                          <p className="profile-stat-label">Appointments</p>
                        </div>
                        <div className="profile-stat">
                          <p className="profile-stat-value">{stats.prescriptions?.length || stats.tests?.length || 0}</p>
                          <p className="profile-stat-label">{user.role === 'doctor' ? 'Prescriptions' : 'Records'}</p>
                        </div>
                      </div>
                      {user.role === 'patient' ? (
                        <div className="profile-insights">
                          {profileCompleteness && (
                            <div className="profile-panel">
                              <div className="profile-panel-head">
                                <h3>Profile completeness</h3>
                                <span className="profile-muted">{profileCompleteness.pct}%</span>
                              </div>
                              <div className="profile-progress">
                                <div
                                  className="profile-progress-bar"
                                  style={{ width: `${profileCompleteness.pct}%` }}
                                />
                              </div>
                              <div className="profile-progress-sub">
                                {profileCompleteness.done}/{profileCompleteness.total} details added
                              </div>
                            </div>
                          )}

                          <div className="profile-panel profile-panel-tight">
                            <div className="profile-chip-row">
                              <div className="profile-chip">
                                <span className="profile-chip-k">Upcoming</span>
                                <span className="profile-chip-v">{upcomingAppointments.length}</span>
                              </div>
                              <div className="profile-chip">
                                <span className="profile-chip-k">Pending</span>
                                <span className="profile-chip-v">{pendingAppointments.length}</span>
                              </div>
                              <div className="profile-chip">
                                <span className="profile-chip-k">Records</span>
                                <span className="profile-chip-v">{(stats.prescriptions?.length || 0) + (stats.tests?.length || 0)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="profile-panel">
                            <div className="profile-panel-head">
                              <h3>Reminders</h3>
                              <span className="profile-muted">Preferences</span>
                            </div>
                            <div className="profile-toggle-list">
                              <label className="profile-toggle">
                                <span>Email reminders</span>
                                <input
                                  type="checkbox"
                                  checked={Boolean(reminders.email)}
                                  onChange={(e) => setReminders((p) => ({ ...p, email: e.target.checked }))}
                                />
                              </label>
                              <label className="profile-toggle">
                                <span>SMS reminders</span>
                                <input
                                  type="checkbox"
                                  checked={Boolean(reminders.sms)}
                                  onChange={(e) => setReminders((p) => ({ ...p, sms: e.target.checked }))}
                                />
                              </label>
                              <label className="profile-toggle">
                                <span>Weekly health summary</span>
                                <input
                                  type="checkbox"
                                  checked={Boolean(reminders.weekly)}
                                  onChange={(e) => setReminders((p) => ({ ...p, weekly: e.target.checked }))}
                                />
                              </label>
                              <label className="profile-toggle">
                                <span>Keep my address private</span>
                                <input
                                  type="checkbox"
                                  checked={Boolean(reminders.privateAddress)}
                                  onChange={(e) => setReminders((p) => ({ ...p, privateAddress: e.target.checked }))}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="profile-card-actions">
                          <button type="button" className="profile-btn profile-btn-secondary" onClick={() => setActiveTab('appointments')}>
                            View appointments
                          </button>
                        </div>
                      )}
                    </div>
                  </aside>
                )}
                <footer className="dashboard-footer">
                  <span className="dashboard-footer-status"><span className="status-dot" /> System online</span>
                  <span className="dashboard-footer-meta">Hippocrates Lab</span>
                </footer>
              </div>
            </>
          )}

          {activeTab === 'consultations' && (
            <ConsultationPortal userRole={user.role} />
          )}

          {activeTab === 'book' && user.role === 'patient' && (
            <BookAppointment />
          )}

          {activeTab === 'appointments' && (
            <AppointmentList userRole={user.role} />
          )}

          {activeTab === 'prescriptions' && (
            user.role === 'doctor'
              ? <PrescriptionForm />
              : <PrescriptionList 
                  patientId={user.role === 'patient' ? user._id : null} 
                  userRole={user.role}
                  onUploadToMediVault={(medicineName) => {
                    setMediVaultSearchQuery(medicineName);
                    setActiveTab('medivault');
                  }}
                />
          )}

          {activeTab === 'tests' && (
            <Tests 
              patientId={user.role === 'patient' ? user._id : null} 
              userRole={user.role} 
            />
          )}

          {activeTab === 'payments' && <Payments />}

          {activeTab === 'medivault' && user.role === 'patient' && (
            <MediVault searchQuery={mediVaultSearchQuery} />
          )}

          {activeTab === 'ai-helper' && user.role === 'patient' && (
            <AIHelper />
          )}

          {activeTab === 'emergency' && user.role === 'patient' && (
            <Emergency />
          )}

          {activeTab === 'inquiries' && (
            <Enquiries userRole={user.role} setActiveTab={setActiveTab} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
