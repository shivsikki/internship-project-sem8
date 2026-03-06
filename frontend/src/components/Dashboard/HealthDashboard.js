import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import useRealTimeSync from '../../hooks/useRealTimeSync';
import './HealthDashboard.css';

const HealthDashboard = ({ user }) => {
  const [healthData, setHealthData] = useState(null);
  const [vitals, setVitals] = useState({
    heartRate: 72,
    bloodPressure: { systolic: 120, diastolic: 80 },
    temperature: 98.6,
    oxygenLevel: 98,
    weight: 70,
    height: 170
  });
  const [healthScore, setHealthScore] = useState(85);
  const [trends, setTrends] = useState([]);
  const [medications, setMedications] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time sync hook
  const { registerCallback, triggerRefresh } = useRealTimeSync(user?._id, user?.role);

  const heartRateChartRef = useRef(null);
  const bloodPressureChartRef = useRef(null);
  const weightChartRef = useRef(null);

  useEffect(() => {
    loadHealthData();
    const interval = setInterval(() => {
      simulateRealTimeVitals();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Register real-time callbacks
  useEffect(() => {
    if (!user?._id) return;

    // Register callbacks for real-time updates
    const unregisterTestUpdate = registerCallback('onTestUpdate', (data) => {
      console.log('HealthDashboard: Test updated', data);
      loadHealthData(); // Refresh all health data
    });

    const unregisterPrescriptionUpdate = registerCallback('onPrescriptionUpdate', (data) => {
      console.log('HealthDashboard: Prescription updated', data);
      loadHealthData(); // Refresh all health data
    });

    const unregisterAppointmentUpdate = registerCallback('onAppointmentUpdate', (data) => {
      console.log('HealthDashboard: Appointment updated', data);
      loadHealthData(); // Refresh all health data
    });

    // Cleanup on unmount
    return () => {
      unregisterTestUpdate?.();
      unregisterPrescriptionUpdate?.();
      unregisterAppointmentUpdate?.();
    };
  }, [user?._id, registerCallback]);

  useEffect(() => {
    if (healthData) {
      drawCharts();
    }
  }, [healthData]);

  const loadHealthData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load user's health data
      const [appointmentsRes, prescriptionsRes, testsRes] = await Promise.all([
        axios.get('/api/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/prescriptions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/tests', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Process and set health data
      const upcoming = appointmentsRes.data.data?.filter(apt => 
        new Date(apt.appointmentDate) > new Date()
      ).slice(0, 3) || [];

      const activeMeds = prescriptionsRes.data.data?.filter(pres => 
        pres.status === 'active'
      ).slice(0, 5) || [];

      setUpcomingAppointments(upcoming);
      setMedications(activeMeds);

      // Generate simulated health trends
      generateHealthTrends();

      // Generate recent activities
      generateRecentActivities();

      setLoading(false);
    } catch (error) {
      console.error('Error loading health data:', error);
      setLoading(false);
    }
  };

  const simulateRealTimeVitals = () => {
    setVitals(prev => ({
      ...prev,
      heartRate: Math.max(60, Math.min(100, prev.heartRate + (Math.random() - 0.5) * 5)),
      bloodPressure: {
        systolic: Math.max(110, Math.min(140, prev.bloodPressure.systolic + (Math.random() - 0.5) * 3)),
        diastolic: Math.max(70, Math.min(90, prev.bloodPressure.diastolic + (Math.random() - 0.5) * 2))
      },
      oxygenLevel: Math.max(95, Math.min(100, prev.oxygenLevel + (Math.random() - 0.5) * 2)),
      temperature: Math.max(97, Math.min(99, prev.temperature + (Math.random() - 0.5) * 0.2))
    }));

    // Update health score based on vitals
    updateHealthScore();
  };

  const updateHealthScore = () => {
    setVitals(prev => {
      let score = 100;
      
      // Heart rate scoring
      if (prev.heartRate < 60 || prev.heartRate > 100) score -= 10;
      
      // Blood pressure scoring
      if (prev.bloodPressure.systolic > 130 || prev.bloodPressure.diastolic > 85) score -= 15;
      
      // Oxygen level scoring
      if (prev.oxygenLevel < 98) score -= 10;
      
      // Temperature scoring
      if (prev.temperature < 98 || prev.temperature > 98.6) score -= 5;
      
      setHealthScore(Math.max(0, Math.min(100, score)));
      return prev;
    });
  };

  const generateHealthTrends = () => {
    const days = 30;
    const trends = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        heartRate: Math.floor(65 + Math.random() * 20),
        bloodPressure: {
          systolic: Math.floor(115 + Math.random() * 20),
          diastolic: Math.floor(75 + Math.random() * 15)
        },
        weight: 70 + (Math.random() - 0.5) * 4,
        steps: Math.floor(5000 + Math.random() * 10000),
        sleep: Math.floor(6 + Math.random() * 3)
      });
    }
    
    setTrends(trends);
  };

  const generateRecentActivities = () => {
    const activities = [
      { type: 'appointment', title: 'Cardiology Checkup', time: '2 days ago', icon: '🏥' },
      { type: 'medication', title: 'Took morning medication', time: '4 hours ago', icon: '💊' },
      { type: 'exercise', title: '30 min walk', time: '1 day ago', icon: '🚶' },
      { type: 'test', title: 'Blood test completed', time: '3 days ago', icon: '🩸' },
      { type: 'appointment', title: 'General consultation', time: '1 week ago', icon: '🏥' }
    ];
    
    setRecentActivities(activities);
  };

  const drawCharts = () => {
    drawHeartRateChart();
    drawBloodPressureChart();
    drawWeightChart();
  };

  const drawHeartRateChart = () => {
    const canvas = heartRateChartRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw heart rate line
    if (trends.length > 0) {
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      trends.forEach((trend, index) => {
        const x = (width / (trends.length - 1)) * index;
        const y = height - ((trend.heartRate - 60) / 40) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Draw points
      trends.forEach((trend, index) => {
        const x = (width / (trends.length - 1)) * index;
        const y = height - ((trend.heartRate - 60) / 40) * height;
        
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  };

  const drawBloodPressureChart = () => {
    const canvas = bloodPressureChartRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    if (trends.length > 0) {
      // Draw systolic line
      ctx.strokeStyle = '#4ecdc4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      trends.forEach((trend, index) => {
        const x = (width / (trends.length - 1)) * index;
        const y = height - ((trend.bloodPressure.systolic - 110) / 30) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Draw diastolic line
      ctx.strokeStyle = '#45b7d1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      trends.forEach((trend, index) => {
        const x = (width / (trends.length - 1)) * index;
        const y = height - ((trend.bloodPressure.diastolic - 70) / 20) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }
  };

  const drawWeightChart = () => {
    const canvas = weightChartRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    if (trends.length > 0) {
      // Draw weight line
      ctx.strokeStyle = '#95e1d3';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      trends.forEach((trend, index) => {
        const x = (width / (trends.length - 1)) * index;
        const y = height - ((trend.weight - 68) / 4) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return '#4ecdc4';
    if (score >= 60) return '#45b7d1';
    if (score >= 40) return '#f9ca24';
    return '#ff6b6b';
  };

  const getVitalStatus = (vital, normalRange) => {
    if (vital < normalRange.min || vital > normalRange.max) {
      return 'warning';
    }
    return 'normal';
  };

  const getVitalStatusColor = (status) => {
    const colors = {
      normal: '#4ecdc4',
      warning: '#f9ca24',
      critical: '#ff6b6b'
    };
    return colors[status] || '#95a5a6';
  };

  if (loading) {
    return (
      <div className="health-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading health dashboard...</p>
      </div>
    );
  }

  return (
    <div className="health-dashboard">
      <div className="dashboard-header">
        <h2>🏥 Your Health Dashboard</h2>
        <p>Real-time health monitoring and insights</p>
      </div>

      {/* Health Score Overview */}
      <div className="health-score-section">
        <div className="score-card">
          <div className="score-circle" style={{ borderColor: getHealthScoreColor(healthScore) }}>
            <div className="score-value" style={{ color: getHealthScoreColor(healthScore) }}>
              {healthScore}
            </div>
            <div className="score-label">Health Score</div>
          </div>
          <div className="score-insights">
            <h3>Overall Health Status</h3>
            <p>Your health score is {healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : 'needs attention'}</p>
            <div className="score-factors">
              <div className="factor">
                <span className="factor-label">Heart Rate:</span>
                <span className="factor-value" style={{ color: getVitalStatusColor(getVitalStatus(vitals.heartRate, { min: 60, max: 100 })) }}>
                  {vitals.heartRate} bpm
                </span>
              </div>
              <div className="factor">
                <span className="factor-label">Blood Pressure:</span>
                <span className="factor-value" style={{ color: getVitalStatusColor(getVitalStatus(vitals.bloodPressure.systolic, { min: 110, max: 130 })) }}>
                  {vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic}
                </span>
              </div>
              <div className="factor">
                <span className="factor-label">Oxygen Level:</span>
                <span className="factor-value" style={{ color: getVitalStatusColor(getVitalStatus(vitals.oxygenLevel, { min: 95, max: 100 })) }}>
                  {vitals.oxygenLevel}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Vitals */}
      <div className="vitals-section">
        <h3>📊 Real-time Vitals</h3>
        <div className="vitals-grid">
          <div className="vital-card">
            <div className="vital-header">
              <span className="vital-icon">❤️</span>
              <span className="vital-name">Heart Rate</span>
            </div>
            <div className="vital-value">{vitals.heartRate}</div>
            <div className="vital-unit">bpm</div>
            <div className="vital-status" style={{ backgroundColor: getVitalStatusColor(getVitalStatus(vitals.heartRate, { min: 60, max: 100 })) }}>
              {getVitalStatus(vitals.heartRate, { min: 60, max: 100 })}
            </div>
          </div>

          <div className="vital-card">
            <div className="vital-header">
              <span className="vital-icon">🩺</span>
              <span className="vital-name">Blood Pressure</span>
            </div>
            <div className="vital-value">{vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic}</div>
            <div className="vital-unit">mmHg</div>
            <div className="vital-status" style={{ backgroundColor: getVitalStatusColor(getVitalStatus(vitals.bloodPressure.systolic, { min: 110, max: 130 })) }}>
              {getVitalStatus(vitals.bloodPressure.systolic, { min: 110, max: 130 })}
            </div>
          </div>

          <div className="vital-card">
            <div className="vital-header">
              <span className="vital-icon">🌡️</span>
              <span className="vital-name">Temperature</span>
            </div>
            <div className="vital-value">{vitals.temperature.toFixed(1)}</div>
            <div className="vital-unit">°F</div>
            <div className="vital-status" style={{ backgroundColor: getVitalStatusColor(getVitalStatus(vitals.temperature, { min: 97, max: 98.6 })) }}>
              {getVitalStatus(vitals.temperature, { min: 97, max: 98.6 })}
            </div>
          </div>

          <div className="vital-card">
            <div className="vital-header">
              <span className="vital-icon">💨</span>
              <span className="vital-name">Oxygen Level</span>
            </div>
            <div className="vital-value">{vitals.oxygenLevel}</div>
            <div className="vital-unit">%</div>
            <div className="vital-status" style={{ backgroundColor: getVitalStatusColor(getVitalStatus(vitals.oxygenLevel, { min: 95, max: 100 })) }}>
              {getVitalStatus(vitals.oxygenLevel, { min: 95, max: 100 })}
            </div>
          </div>
        </div>
      </div>

      {/* Health Trends Charts */}
      <div className="trends-section">
        <h3>📈 Health Trends (30 Days)</h3>
        <div className="charts-grid">
          <div className="chart-card">
            <h4>Heart Rate</h4>
            <canvas ref={heartRateChartRef} width={300} height={150}></canvas>
            <div className="chart-legend">
              <span className="legend-item" style={{ backgroundColor: '#ff6b6b' }}></span>
              <span>Heart Rate (bpm)</span>
            </div>
          </div>

          <div className="chart-card">
            <h4>Blood Pressure</h4>
            <canvas ref={bloodPressureChartRef} width={300} height={150}></canvas>
            <div className="chart-legend">
              <span className="legend-item" style={{ backgroundColor: '#4ecdc4' }}></span>
              <span>Systolic</span>
              <span className="legend-item" style={{ backgroundColor: '#45b7d1' }}></span>
              <span>Diastolic</span>
            </div>
          </div>

          <div className="chart-card">
            <h4>Weight</h4>
            <canvas ref={weightChartRef} width={300} height={150}></canvas>
            <div className="chart-legend">
              <span className="legend-item" style={{ backgroundColor: '#95e1d3' }}></span>
              <span>Weight (kg)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side Panels */}
      <div className="side-panels">
        {/* Upcoming Appointments */}
        <div className="panel">
          <h3>📅 Upcoming Appointments</h3>
          <div className="appointments-list">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((apt, index) => (
                <div key={index} className="appointment-item">
                  <div className="appointment-date">
                    {new Date(apt.appointmentDate).toLocaleDateString()}
                  </div>
                  <div className="appointment-details">
                    <div className="appointment-title">{apt.reason || 'General Checkup'}</div>
                    <div className="appointment-doctor">Dr. {apt.doctor?.name || 'Smith'}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No upcoming appointments</p>
            )}
          </div>
        </div>

        {/* Active Medications */}
        <div className="panel">
          <h3>💊 Active Medications</h3>
          <div className="medications-list">
            {medications.length > 0 ? (
              medications.map((med, index) => (
                <div key={index} className="medication-item">
                  <div className="medication-name">
                    {med.medications?.[0]?.name || 'Medication'}
                  </div>
                  <div className="medication-dosage">
                    {med.medications?.[0]?.dosage || 'Dosage'}
                  </div>
                  <div className="medication-frequency">
                    {med.medications?.[0]?.frequency || 'Frequency'}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No active medications</p>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="panel">
          <h3>🔄 Recent Activities</h3>
          <div className="activities-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-icon">{activity.icon}</span>
                <div className="activity-details">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>⚡ Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn">
            <span className="action-icon">📋</span>
            <span className="action-label">Book Appointment</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">🧪</span>
            <span className="action-label">Order Tests</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">💊</span>
            <span className="action-label">Refill Prescription</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">📞</span>
            <span className="action-label">Video Consultation</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">🤖</span>
            <span className="action-label">AI Health Assistant</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">📊</span>
            <span className="action-label">Download Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthDashboard;
