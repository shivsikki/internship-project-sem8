import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import DoctorVerification from '../DoctorVerification/DoctorVerification';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    prescriptionsCount: 0,
    testsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    monthlyAppointments: [],
    departmentStats: [],
    revenueTrend: [],
    patientGrowth: [],
    appointmentStatus: [],
    doctorPerformance: []
  });

  // Load user from sessionStorage
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchPendingVerificationsCount();
  }, []);

  const fetchPendingVerificationsCount = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get('/api/auth/pending-doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPendingVerifications(response.data.doctors?.length || 0);
      }
    } catch (err) {
      console.error('Error fetching pending verifications:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      // Fetch all necessary data
      const [usersRes, appointmentsRes, paymentsRes, prescriptionsRes, testsRes] = await Promise.all([
        axios.get('/api/users/all', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { users: [] } })),
        axios.get('/api/appointments/all', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { appointments: [] } })),
        axios.get('/api/payments/all', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { payments: [] } })),
        axios.get('/api/prescriptions/all', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { prescriptions: [] } })),
        axios.get('/api/tests/all', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { tests: [] } }))
      ]);

      const users = usersRes.data.users || [];
      const appointments = appointmentsRes.data.appointments || [];
      const payments = paymentsRes.data.payments || [];
      const prescriptions = prescriptionsRes.data.prescriptions || [];
      const tests = testsRes.data.tests || [];

      const patients = users.filter(u => u.role === 'patient');
      const doctors = users.filter(u => u.role === 'doctor');

      // Calculate stats
      const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
      const completedAppointments = appointments.filter(a => a.status === 'completed').length;

      setStats({
        totalPatients: patients.length,
        totalDoctors: doctors.length,
        totalAppointments: appointments.length,
        totalRevenue,
        pendingAppointments,
        completedAppointments,
        prescriptionsCount: prescriptions.length,
        testsCount: tests.length
      });

      // Prepare chart data
      prepareChartData(appointments, payments, patients, doctors);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const prepareChartData = (appointments, payments, patients, doctors) => {
    // Monthly appointments data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyAppointments = months.map((month, index) => ({
      month,
      appointments: Math.floor(Math.random() * 50) + 20,
      patients: Math.floor(Math.random() * 30) + 10
    }));

    // Department stats (specializations)
    const specializations = {};
    doctors.forEach(doc => {
      const spec = doc.specialization || 'General';
      specializations[spec] = (specializations[spec] || 0) + 1;
    });
    const departmentStats = Object.entries(specializations).map(([name, value]) => ({ name, value }));

    // Revenue trend
    const revenueTrend = months.map((month, index) => ({
      month,
      revenue: Math.floor(Math.random() * 50000) + 10000,
      target: 40000
    }));

    // Patient growth
    const patientGrowth = months.map((month, index) => ({
      month,
      newPatients: Math.floor(Math.random() * 20) + 5,
      totalPatients: patients.length + (index * 10)
    }));

    // Appointment status pie chart
    const appointmentStatus = [
      { name: 'Completed', value: appointments.filter(a => a.status === 'completed').length || 45, color: '#6B7D6E' },
      { name: 'Pending', value: appointments.filter(a => a.status === 'pending').length || 25, color: '#A3AD9E' },
      { name: 'Cancelled', value: appointments.filter(a => a.status === 'cancelled').length || 10, color: '#4a5d4a' },
      { name: 'No Show', value: 8, color: '#8a9a8a' }
    ];

    // Doctor performance radar
    const doctorPerformance = [
      { subject: 'Appointments', A: 120, fullMark: 150 },
      { subject: 'Patients', A: 98, fullMark: 150 },
      { subject: 'Revenue', A: 86, fullMark: 150 },
      { subject: 'Rating', A: 99, fullMark: 150 },
      { subject: 'Response', A: 85, fullMark: 150 },
      { subject: 'Availability', A: 65, fullMark: 150 }
    ];

    setChartData({
      monthlyAppointments,
      departmentStats: departmentStats.length > 0 ? departmentStats : [
        { name: 'Cardiology', value: 12 },
        { name: 'Neurology', value: 8 },
        { name: 'Pediatrics', value: 15 },
        { name: 'Orthopedics', value: 10 },
        { name: 'General', value: 20 }
      ],
      revenueTrend,
      patientGrowth,
      appointmentStatus,
      doctorPerformance
    });
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-loading">
          <div className="admin-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#6B7D6E', '#A3AD9E', '#4a5d4a', '#8a9a8a', '#c5d4c0', '#7a8f7a'];



  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-layout">
        {/* Left side - Header and Main Content */}
        <div className="admin-left-column">
          {/* Header with Hero Styling */}
          <header className="admin-header">
            <div className="admin-header-bg" aria-hidden="true" />
            <div className="admin-header-content">
              <p className="admin-eyebrow">Administrator Panel</p>
              <AnimatedHeading text="Admin Dashboard" />
              <p className="admin-subtitle">Complete overview of your healthcare system</p>
            </div>
          </header>

          {/* Metrics Cards */}
          <section className="admin-metrics">
            {/* Total Appointments */}
            <div className="metric-card">
              <div className="metric-card-header">
                <div className="metric-icon-wrap">
                  <svg className="metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <span className="metric-badge">+12%</span>
              </div>
              <div className="metric-card-content">
                <p className="metric-label">Total Appointments</p>
                {/*<h3 className="metric-value">{stats.totalAppointments.toLocaleString()}</h3> */}
                <h3 className="metric-value">497</h3>
              </div>
            </div>

            {/* Completed */}
            <div className="metric-card">
              <div className="metric-card-header">
                <div className="metric-icon-wrap">
                  <svg className="metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span className="metric-badge neutral">Stable</span>
              </div>
              <div className="metric-card-content">
                <p className="metric-label">Completed</p>
                {/*<h3 className="metric-value">{stats.completedAppointments.toLocaleString()}</h3> */}
                <h3 className="metric-value">345</h3>
              </div>
            </div>

            {/* Pending */}
            <div className="metric-card">
              <div className="metric-card-header">
                <div className="metric-icon-wrap">
                  <svg className="metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <span className="metric-badge warning">Action Req</span>
              </div>
              <div className="metric-card-content">
                <p className="metric-label">Pending</p>
                {/*<h3 className="metric-value">{stats.pendingAppointments.toLocaleString()}</h3> */}
                <h3 className="metric-value">152</h3>
              </div>
            </div>
            
            {/* Cancelled */}
            <div className="metric-card">
              <div className="metric-card-header">
                <div className="metric-icon-wrap">
                  <svg className="metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
              </div>
              <div className="metric-card-content">
                <p className="metric-label">Cancelled</p>
                {/*<h3 className="metric-value">{Math.floor(stats.totalAppointments * 0.08)}</h3> */}
                <h3 className="metric-value">40</h3>
              </div>
            </div>

            {/* Today's Appointments */}
            <div className="metric-card">
              <div className="metric-card-header">
                <div className="metric-icon-wrap">
                  <svg className="metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <span className="metric-badge">Today</span>
              </div>
              <div className="metric-card-content">
                <p className="metric-label">Today's Appointments</p>
                {/*<h3 className="metric-value">{Math.floor(stats.totalAppointments * 0.15)}</h3> */}
                <h3 className="metric-value">17</h3>
              </div>
            </div>

            {/* Prescriptions */}
            <div className="metric-card">
              <div className="metric-card-header">
                <div className="metric-icon-wrap">
                  <svg className="metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4.5 12.5l4 4c.5.5 1.5.5 2 0l9-9a1.414 1.414 0 0 0-2-2l-9 9a1.414 1.414 0 0 1-2 0l-4-4"></path>
                    <path d="M9 12l-5 5c-1 1-1 2.5 0 3.5s2.5 1 3.5 0l5-5"></path>
                  </svg>
                </div>
              </div>
              <div className="metric-card-content">
                <p className="metric-label">Prescriptions</p>
                {/*<h3 className="metric-value">{(stats.prescriptionsCount / 1000).toFixed(1)}k</h3> */}
                <h3 className="metric-value">234</h3>
              </div>
            </div>

            {/* Lab Tests */}
            <div className="metric-card">
              <div className="metric-card-header">
                <div className="metric-icon-wrap">
                  <svg className="metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 2h4"></path>
                    <path d="M12 2v8"></path>
                    <path d="M9 10h6v10a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V10z"></path>
                  </svg>
                </div>
              </div>
              <div className="metric-card-content">
                <p className="metric-label">Lab Tests</p>
                {/*<h3 className="metric-value">{stats.testsCount.toLocaleString()}</h3> */}
                <h3 className="metric-value">89</h3>
              </div>
            </div>

            {/* New Registrations */}
            <div className="metric-card">
              <div className="metric-card-header">
                <div className="metric-icon-wrap">
                  <svg className="metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                </div>
                <span className="metric-badge">+24%</span>
              </div>
              <div className="metric-card-content">
                <p className="metric-label">New Registrations</p>
                {/*<h3 className="metric-value">{Math.floor(stats.totalAppointments * 0.05) || 12}</h3> */}
                <h3 className="metric-value">12</h3>
              </div>
            </div>

            {/* Pending Prescriptions */}
            <div className="metric-card">
              <div className="metric-card-header">
                <div className="metric-icon-wrap">
                  <svg className="metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
              </div>
              <div className="metric-card-content">
                <p className="metric-label">Pending Prescriptions</p>
                {/*<h3 className="metric-value">{Math.floor(stats.prescriptionsCount * 0.2)}</h3> */}
                <h3 className="metric-value">24</h3>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="metric-card">
              <div className="metric-card-header">
                <div className="metric-icon-wrap">
                  <svg className="metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <span className="metric-badge">↑8%</span>
              </div>
              <div className="metric-card-content">
                <p className="metric-label">Total Revenue</p>
                {/*<h3 className="metric-value">₹{(stats.totalRevenue / 1000).toFixed(0)}k</h3> */}
                <h3 className="metric-value">₹72,590</h3>
              </div>
            </div>
          </section>

      {/* Charts Grid */}
      <section className="admin-charts">
        {/* Line Chart - Monthly Appointments */}
        <div className="chart-card chart-large">
          <div className="chart-header">
            <h3 className="chart-title">Monthly Appointments & Patients</h3>
            <p className="chart-subtitle">Trend over last 6 months</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData.monthlyAppointments}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Line type="monotone" dataKey="appointments" stroke="#6B7D6E" strokeWidth={3} name="Appointments" />
              <Line type="monotone" dataKey="patients" stroke="#A3AD9E" strokeWidth={3} name="New Patients" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Department Stats */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Doctors by Department</h3>
            <p className="chart-subtitle">Distribution across specializations</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.departmentStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {chartData.departmentStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Appointment Status */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Appointment Status</h3>
            <p className="chart-subtitle">Distribution by status</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData.appointmentStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.appointmentStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Area Chart - Revenue Trend */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Revenue Trend</h3>
            <p className="chart-subtitle">Monthly revenue vs target</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData.revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#6B7D6E" fill="#6B7D6E" fillOpacity={0.3} name="Revenue" />
              <Area type="monotone" dataKey="target" stroke="#A3AD9E" fill="#A3AD9E" fillOpacity={0.15} name="Target" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart - Doctor Performance */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Performance Metrics</h3>
            <p className="chart-subtitle">Key performance indicators</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData.doctorPerformance}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" stroke="#6b7280" fontSize={11} />
              <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="#e5e7eb" />
              <Radar name="Performance" dataKey="A" stroke="#6B7D6E" fill="#6B7D6E" fillOpacity={0.3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Stacked Bar Chart - Patient Growth */}
        <div className="chart-card chart-large">
          <div className="chart-header">
            <h3 className="chart-title">Patient Growth Analysis</h3>
            <p className="chart-subtitle">New vs total patients over time</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.patientGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="newPatients" stackId="a" fill="#A3AD9E" name="New Patients" />
              <Bar dataKey="totalPatients" stackId="a" fill="#6B7D6E" name="Total Patients" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
        </div>

        {/* Admin Profile Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-profile-card">
            <div className="admin-sidebar-content">
              <div className="admin-avatar-wrap">
                <img src="/images/admin-profile.jpg" alt="Admin avatar" className="admin-avatar" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                <div className="admin-avatar-fallback">{user?.name?.charAt(0) || 'A'}</div>
                <span className="admin-online-dot"></span>
              </div>
              <h2 className="admin-name">{user?.name || 'Admin'}</h2>
              <p className="admin-role">System Administrator</p>

              <div className="admin-stats-grid">
                <div className="admin-stat-pill">
                  {/*<span className="admin-stat-value">{stats.totalDoctors}</span>*/}
                  <span className="admin-stat-value">52</span>
                  <span className="admin-stat-label">DOCTORS</span>
                </div>
                <div className="admin-stat-pill">
                  {/*<span className="admin-stat-value">{stats.totalPatients}</span>*/}
                  <span className="admin-stat-value">89</span>
                  <span className="admin-stat-label">PATIENTS</span>
                </div>
              </div>

              <div className="admin-section">
                <h3 className="admin-section-heading">SYSTEM STATUS</h3>
                <div className="admin-status-grid">
                  <div className="admin-status-item">
                    <span className="admin-status-dot online"></span>
                    <span>Database: Online</span>
                  </div>
                  <div className="admin-status-item">
                    <span className="admin-status-dot online"></span>
                    <span>Server: Running</span>
                  </div>
                  <div className="admin-status-item">
                    <span className="admin-status-dot warning"></span>
                    <span>Backups: 12h ago</span>
                  </div>
                </div>
              </div>

              <div className="admin-section">
                <h3 className="admin-section-heading">PRIVILEGES</h3>
                <div className="admin-tags">
                  <span className="admin-tag">Full Access</span>
                  <span className="admin-tag">User Management</span>
                  <span className="admin-tag">System Config</span>
                </div>
              </div>

              <div className="admin-section">
                <h3 className="admin-section-heading">ACTIVITY LOG</h3>
                <div className="admin-activity-list">
                  <div className="admin-activity-item">
                    <span className="admin-activity-time">Today</span>
                    <span className="admin-activity-text">System check completed</span>
                  </div>
                  <div className="admin-activity-item">
                    <span className="admin-activity-time">Yesterday</span>
                    <span className="admin-activity-text">Added new doctor</span>
                  </div>
                </div>
              </div>

              <div className="admin-action-list">
                <button className="admin-action-btn">
                  <span className="admin-action-icon">⚙️</span>
                  <span className="admin-action-text">System Settings</span>
                </button>
                <button className="admin-action-btn">
                  <span className="admin-action-icon">🔒</span>
                  <span className="admin-action-text">Security Logs</span>
                </button>
                <button className="admin-action-btn">
                  <span className="admin-action-icon">📋</span>
                  <span className="admin-action-text">Audit Reports</span>
                  <span className="admin-action-badge">5</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="admin-quick-actions">
            <h3 className="admin-section-heading">QUICK ACTIONS</h3>
            <div className="admin-quick-actions-list">

              <button className="admin-quick-action-card">
                <div className="admin-quick-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <span className="admin-quick-action-text">View All Appointments</span>
              </button>
              <button className="admin-quick-action-card">
                <div className="admin-quick-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18"></path>
                    <path d="M18 17V9"></path>
                    <path d="M13 17V5"></path>
                    <path d="M8 17v-3"></path>
                  </svg>
                </div>
                <span className="admin-quick-action-text">Generate Reports</span>
              </button>
              <button className="admin-quick-action-card">
                <div className="admin-quick-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                <span className="admin-quick-action-text">Send Notifications</span>
              </button>
            </div>
          </div>

          {/* Contact Form */}
          <div className="admin-contact-card">
            <h3 className="admin-section-heading">CONTACT SUPPORT</h3>
            <form className="admin-contact-form">
              <div className="admin-form-group">
                <label className="admin-form-label">Subject</label>
                <input type="text" className="admin-form-input" placeholder="Enter subject" />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Message</label>
                <textarea className="admin-form-textarea" rows="4" placeholder="Describe your issue..."></textarea>
              </div>
              <button type="submit" className="admin-contact-btn">Send Message</button>
            </form>
          </div>
        </aside>

        <footer className="dashboard-footer">
          <span className="dashboard-footer-status"><span className="status-dot" /> System online</span>
          <span className="dashboard-footer-meta">Hippocrates Lab</span>
        </footer>
      </div>
    </div>
  );
};

export default AdminDashboard;
