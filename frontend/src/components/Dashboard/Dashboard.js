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
      return {
        day,
        count,
        height: count > 0 ? height : 15,
        shade: count > 0 ? '#ae6e56ff' : '#DFBCAD',
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
              <div className="cafe-brand-text">
                <div className="cafe-title">Your Health Manager</div>
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
                      <div className="metric-lg card-animated" style={{ animationDelay: '0.1s' }}>
                        <div className="metric-lg-head">
                          <div>
                            <p className="metric-lg-label">Today</p>
                            <h3 className="metric-lg-value">{todayAppointments.length}</h3>
                          </div>
                        </div>
                      </div>
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
                  <div className="dashboard-stats-grid">
                    {user.role === 'doctor' && (
                      <>
                        <div className="stat-card stat-card-blue" style={{ animationDelay: '0.15s' }}>
                          <span className="stat-value">{pendingAppointments.length}</span>
                          <span className="stat-label">Pending</span>
                        </div>
                        <div className="stat-card stat-card-green" style={{ animationDelay: '0.2s' }}>
                          <span className="stat-value">{stats.prescriptions?.length || 0}</span>
                          <span className="stat-label">Prescriptions</span>
                        </div>
                        <div className="stat-card stat-card-slate" style={{ animationDelay: '0.25s' }}>
                          <span className="stat-value">{stats.tests?.length || 0}</span>
                          <span className="stat-label">Tests</span>
                        </div>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <>
                        <div className="stat-card stat-card-amber" style={{ animationDelay: '0.15s' }}>
                          <span className="stat-value">{todayAppointments.length}</span>
                          <span className="stat-label">Today</span>
                        </div>
                        <div className="stat-card stat-card-blue" style={{ animationDelay: '0.2s' }}>
                          <span className="stat-value">{pendingAppointments.length}</span>
                          <span className="stat-label">Pending</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {(user.role === 'patient' || user.role === 'doctor') && (
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
