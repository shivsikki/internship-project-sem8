import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BookAppointment from '../Appointments/BookAppointment';
import AppointmentList from '../Appointments/AppointmentList';
import PrescriptionForm from '../Prescriptions/PrescriptionForm';
import PrescriptionList from '../Prescriptions/PrescriptionList';
import TestForm from '../Tests/TestForm';
import TestList from '../Tests/TestList';
import PaymentList from '../Payments/PaymentList';
import AIHelper from '../AIHelper/AIHelper';
import Emergency from '../Emergency/Emergency';
import MediVault from '../MediVault/MediVault';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
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
  const [reminders, setReminders] = useState(() => {
    try {
      const raw = localStorage.getItem('patient_reminders');
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
    try {
      localStorage.setItem('patient_reminders', JSON.stringify(reminders));
    } catch {
    }
  }, [reminders]);

  useEffect(() => {
    if (!user || activeTab !== 'dashboard') return;

    const token = localStorage.getItem('token');
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
    localStorage.setItem('ai_helper_prefill', JSON.stringify({ question }));
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
    navItems.push({ id: 'prescriptions', label: 'My Prescriptions' });
    navItems.push({ id: 'tests', label: 'My Tests' });
    navItems.push({ id: 'payments', label: 'Payments' });
    navItems.push({ id: 'medivault', label: 'MediVault' });
    navItems.push({ id: 'ai-helper', label: 'AI Helper' });
    navItems.push({ id: 'emergency', label: 'Emergency' });
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
      case 'book':
        return (
          <svg {...common}>
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <line x1="8" y1="2.5" x2="8" y2="6.5" />
            <line x1="16" y1="2.5" x2="16" y2="6.5" />
            <line x1="3" y1="10" x2="21" y2="10" />
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
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3 2-5a4 4 0 0 1-1-2.7V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4z" />
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
          {!isSidebarCollapsed && (
            <div className="cafe-brand">
              <img 
                src="/images/hippocrates.png" 
                alt="Hippocrates Lab Logo" 
                className="sidebar-logo-img"
              />
              <div className="cafe-brand-text">
                <div className="cafe-title">Hippocrates Lab</div>
                <div className="cafe-subtitle">navigate freely to use our features</div>
              </div>
            </div>
          )}
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
          {user.role !== 'patient' && (
            <button type="button" className="cafe-primary-btn">
              <span className="cafe-primary-btn-icon" aria-hidden="true">＋</span>
              <span className={`cafe-primary-btn-label ${isSidebarExpanded ? 'visible' : ''}`}>Add New Patient</span>
            </button>
          )}

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
          {activeTab === 'dashboard' && (
            <>
              <div className="dashboard-home">
                <div className="dashboard-home-main">
                  <header className="dashboard-hero dashboard-hero-simple">
                    <div className="hero-bg-pattern" aria-hidden="true" />
                    <div className="hero-content">
                      <AnimatedHeading text="Your Dashboard" />
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
                      <div className="metric-lg card-animated" style={{ animationDelay: '0.05s' }}>
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
                      <div className="metric-lg health-card card-animated" style={{ animationDelay: '0.1s' }}>
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
                    <>
                      {/* Section 1: Analytics & Statistics */}
                      <section className="doctor-analytics-section">
                        <div className="analytics-header">
                          <h2 className="analytics-title">Practice Analytics</h2>
                          <p className="analytics-subtitle">Real-time insights into your medical practice</p>
                        </div>
                        
                        <div className="analytics-grid">
                          {/* Age Distribution */}
                          <div className="analytics-card age-distribution-card">
                            <div className="analytics-card-header">
                              <h3 className="analytics-card-title">Patient Age Distribution</h3>
                              <div className="analytics-card-icon">👥</div>
                            </div>
                            <div className="age-chart-container">
                              <div className="age-bars">
                                <div className="age-bar-group">
                                  <span className="age-label">0-18</span>
                                  <div className="age-bar-track">
                                    <div className="age-bar-fill" style={{ width: '15%' }}></div>
                                  </div>
                                  <span className="age-percentage">15%</span>
                                </div>
                                <div className="age-bar-group">
                                  <span className="age-label">19-35</span>
                                  <div className="age-bar-track">
                                    <div className="age-bar-fill" style={{ width: '35%' }}></div>
                                  </div>
                                  <span className="age-percentage">35%</span>
                                </div>
                                <div className="age-bar-group">
                                  <span className="age-label">36-50</span>
                                  <div className="age-bar-track">
                                    <div className="age-bar-fill" style={{ width: '28%' }}></div>
                                  </div>
                                  <span className="age-percentage">28%</span>
                                </div>
                                <div className="age-bar-group">
                                  <span className="age-label">51+</span>
                                  <div className="age-bar-track">
                                    <div className="age-bar-fill" style={{ width: '22%' }}></div>
                                  </div>
                                  <span className="age-percentage">22%</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Gender Ratio */}
                          <div className="analytics-card gender-ratio-card">
                            <div className="analytics-card-header">
                              <h3 className="analytics-card-title">Gender Distribution</h3>
                              <div className="analytics-card-icon">⚧</div>
                            </div>
                            <div className="gender-chart-container">
                              <div className="gender-donut-chart">
                                <svg viewBox="0 0 100 100" className="gender-donut">
                                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e8f5e8" strokeWidth="12"/>
                                  <circle cx="50" cy="50" r="40" fill="none" stroke="#2d472d" strokeWidth="12"
                                    strokeDasharray="75.4 251.2" strokeDashoffset="0" transform="rotate(-90 50 50)"/>
                                  <circle cx="50" cy="50" r="40" fill="none" stroke="#4a5d4a" strokeWidth="12"
                                    strokeDasharray="62.8 251.2" strokeDashoffset="-75.4" transform="rotate(-90 50 50)"/>
                                </svg>
                                <div className="gender-center-text">
                                  <div className="gender-total">1,247</div>
                                  <div className="gender-label">Patients</div>
                                </div>
                              </div>
                              <div className="gender-legend">
                                <div className="gender-legend-item">
                                  <div className="gender-legend-color" style={{ background: '#2d472d' }}></div>
                                  <span className="gender-legend-text">Male (48%)</span>
                                </div>
                                <div className="gender-legend-item">
                                  <div className="gender-legend-color" style={{ background: '#4a5d4a' }}></div>
                                  <span className="gender-legend-text">Female (40%)</span>
                                </div>
                                <div className="gender-legend-item">
                                  <div className="gender-legend-color" style={{ background: '#e8f5e8' }}></div>
                                  <span className="gender-legend-text">Other (12%)</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Monthly Revenue Trend */}
                          <div className="analytics-card revenue-trend-card">
                            <div className="analytics-card-header">
                              <h3 className="analytics-card-title">Revenue Trend</h3>
                              <div className="analytics-card-icon">📈</div>
                            </div>
                            <div className="revenue-chart-container">
                              <div className="revenue-sparkline">
                                <svg viewBox="0 0 200 60" className="revenue-line">
                                  <polyline
                                    fill="none"
                                    stroke="#4a5d4a"
                                    strokeWidth="2"
                                    points="10,45 35,35 60,38 85,25 110,30 135,15 160,20 185,10 190,12"
                                  />
                                  <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#4a5d4a" stopOpacity="0.3"/>
                                    <stop offset="100%" stopColor="#4a5d4a" stopOpacity="0"/>
                                  </linearGradient>
                                  <polygon
                                    fill="url(#revenueGradient)"
                                    points="10,45 35,35 60,38 85,25 110,30 135,15 160,20 185,10 190,12 190,60 10,60"
                                  />
                                </svg>
                              </div>
                              <div className="revenue-stats">
                                <div className="revenue-stat-item">
                                  <span className="revenue-stat-value">₹2.4L</span>
                                  <span className="revenue-stat-label">This Month</span>
                                </div>
                                <div className="revenue-stat-item">
                                  <span className="revenue-stat-value">+18%</span>
                                  <span className="revenue-stat-label">Growth</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Section 2: Clinical Operations */}
                      <section className="doctor-clinical-section">
                        <div className="clinical-header">
                          <h2 className="clinical-title">Clinical Operations</h2>
                          <p className="clinical-subtitle">Manage your daily clinical activities</p>
                        </div>
                        
                        <div className="clinical-grid">
                          {/* Current Patient */}
                          <div className="clinical-card current-patient-card">
                            <div className="clinical-card-header">
                              <h3 className="clinical-card-title">Current Patient</h3>
                              <div className="clinical-status-badge live">LIVE</div>
                            </div>
                            {todayAppointments.length > 0 ? (
                              <div className="current-patient-info">
                                <div className="patient-avatar-large">
                                  {todayAppointments[0].patient?.name?.charAt(0) || 'P'}
                                </div>
                                <div className="patient-details">
                                  <h4 className="patient-name">{todayAppointments[0].patient?.name || 'Patient Name'}</h4>
                                  <p className="patient-reason">{todayAppointments[0].reason || 'General Consultation'}</p>
                                  <div className="patient-time-info">
                                    <span className="appointment-time">{formatTimeOnly(todayAppointments[0].appointmentTime)}</span>
                                    <span className="appointment-duration">~30 mins</span>
                                  </div>
                                </div>
                                <div className="patient-actions">
                                  <button className="patient-action-btn primary">View Records</button>
                                  <button className="patient-action-btn secondary">Prescribe</button>
                                </div>
                              </div>
                            ) : (
                              <div className="no-current-patient">
                                <div className="empty-state-icon">👨‍⚕️</div>
                                <p>No active consultation</p>
                                <span className="empty-state-text">Next appointment will appear here</span>
                              </div>
                            )}
                          </div>

                          {/* Upcoming Appointments */}
                          <div className="clinical-card upcoming-appointments-card">
                            <div className="clinical-card-header">
                              <h3 className="clinical-card-title">Today's Schedule</h3>
                              <div className="appointment-count">{todayAppointments.length}</div>
                            </div>
                            <div className="appointments-timeline">
                              {todayAppointments.slice(0, 4).map((apt, index) => (
                                <div key={apt._id} className="timeline-item">
                                  <div className="timeline-time">
                                    {formatTimeOnly(apt.appointmentTime)}
                                  </div>
                                  <div className="timeline-dot"></div>
                                  <div className="timeline-content">
                                    <div className="timeline-patient">{apt.patient?.name || 'Patient'}</div>
                                    <div className="timeline-reason">{apt.reason || 'Consultation'}</div>
                                  </div>
                                  <div className={`timeline-status ${apt.status}`}>{apt.status}</div>
                                </div>
                              ))}
                              {todayAppointments.length === 0 && (
                                <div className="no-appointments">
                                  <span>No appointments today</span>
                                </div>
                              )}
                            </div>
                            <button className="view-all-btn" onClick={() => setActiveTab('appointments')}>
                              View Full Schedule
                            </button>
                          </div>

                          {/* Active Tests */}
                          <div className="clinical-card active-tests-card">
                            <div className="clinical-card-header">
                              <h3 className="clinical-card-title">Active Tests</h3>
                              <div className="test-count">{stats.tests?.length || 0}</div>
                            </div>
                            <div className="tests-grid">
                              {(stats.tests || []).slice(0, 3).map((test) => (
                                <div key={test._id} className="test-item">
                                  <div className="test-header">
                                    <span className="test-name">{test.testName || test.name || 'Lab Test'}</span>
                                    <span className={`test-status ${test.status}`}>{test.status}</span>
                                  </div>
                                  <div className="test-patient">{test.patient?.name || 'Patient'}</div>
                                  <div className="test-progress">
                                    <div className="progress-bar">
                                      <div className="progress-fill" style={{ width: test.status === 'completed' ? '100%' : '60%' }}></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {(stats.tests || []).length === 0 && (
                                <div className="no-tests">
                                  <span>No active tests</span>
                                </div>
                              )}
                            </div>
                            <button className="view-all-btn" onClick={() => setActiveTab('tests')}>
                              Manage Tests
                            </button>
                          </div>
                        </div>
                      </section>

                      {/* Section 3: All Patients - Horizontal */}
                      <section className="all-patients-section">
                        <div className="all-patients-header">
                          <h2 className="all-patients-title">All Patients</h2>
                          <button className="view-all-patients-btn">View All</button>
                        </div>
                        <div className="all-patients-grid">
                          {/* Sample patient cards - replace with actual data */}
                          <div className="patient-card-small">
                            <div className="patient-avatar-small">JD</div>
                            <div className="patient-info-small">
                              <h4 className="patient-name-small">John Doe</h4>
                              <p className="patient-detail-small">Last visit: 2 days ago</p>
                            </div>
                            <div className="patient-status-small">Active</div>
                          </div>
                          <div className="patient-card-small">
                            <div className="patient-avatar-small">SM</div>
                            <div className="patient-info-small">
                              <h4 className="patient-name-small">Sarah Miller</h4>
                              <p className="patient-detail-small">Last visit: 1 week ago</p>
                            </div>
                            <div className="patient-status-small">Active</div>
                          </div>
                          <div className="patient-card-small">
                            <div className="patient-avatar-small">RJ</div>
                            <div className="patient-info-small">
                              <h4 className="patient-name-small">Robert Johnson</h4>
                              <p className="patient-detail-small">Last visit: 3 days ago</p>
                            </div>
                            <div className="patient-status-small">Active</div>
                          </div>
                          <div className="patient-card-small">
                            <div className="patient-avatar-small">EW</div>
                            <div className="patient-info-small">
                              <h4 className="patient-name-small">Emily Wilson</h4>
                              <p className="patient-detail-small">Last visit: 5 days ago</p>
                            </div>
                            <div className="patient-status-small">Active</div>
                          </div>
                          <div className="patient-card-small">
                            <div className="patient-avatar-small">MB</div>
                            <div className="patient-info-small">
                              <h4 className="patient-name-small">Michael Brown</h4>
                              <p className="patient-detail-small">Last visit: 1 week ago</p>
                            </div>
                            <div className="patient-status-small">Active</div>
                          </div>
                          <div className="patient-card-small">
                            <div className="patient-avatar-small">LW</div>
                            <div className="patient-info-small">
                              <h4 className="patient-name-small">Lisa White</h4>
                              <p className="patient-detail-small">Last visit: 4 days ago</p>
                            </div>
                            <div className="patient-status-small">Active</div>
                          </div>
                        </div>
                      </section>
                    </>
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
                      <section className="dash-feature dash-prescriptions card-animated" style={{ animationDelay: '0.15s' }}>
                        <div className="dash-feature-top">
                          <div>
                            <p className="dash-feature-kicker">Prescriptions</p>
                            <h3 className="dash-feature-title">Your meds & diagnosis</h3>
                          </div>
                          <div className="dash-feature-count">{stats.prescriptions?.length || 0}</div>
                        </div>

                        <div className="dash-feature-list">
                          {(stats.prescriptions || []).slice(0, 2).map((p) => (
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

                      <section className="dash-feature dash-tests card-animated" style={{ animationDelay: '0.2s' }}>
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
                            {(stats.tests || []).slice(0, 3).map((t) => (
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

              <footer className="dashboard-footer">
                <span className="dashboard-footer-status"><span className="status-dot" /> System online</span>
                <span className="dashboard-footer-meta">Hippocrates Lab</span>
              </footer>
            </div>
            </>
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
              : <PrescriptionList patientId={user.role === 'patient' ? user._id : null} userRole={user.role} />
          )}

          {activeTab === 'tests' && (
            user.role === 'doctor'
              ? <TestForm />
              : <TestList patientId={user.role === 'patient' ? user._id : null} userRole={user.role} />
          )}

          {activeTab === 'payments' && (
            <PaymentList userRole={user.role} />
          )}

          {activeTab === 'medivault' && user.role === 'patient' && (
            <MediVault />
          )}

          {activeTab === 'ai-helper' && user.role === 'patient' && (
            <AIHelper />
          )}

          {activeTab === 'emergency' && user.role === 'patient' && (
            <Emergency />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
