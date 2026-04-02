import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <div>Loading statistics...</div>;

  return (
    <div className="admin-overview">
      <div className="dashboard-metrics-primary">
        <div className="metric-lg card-animated">
          <div className="metric-lg-head">
            <div>
              <p className="metric-lg-label">Total Users</p>
              <h3 className="metric-lg-value">{stats.totalUsers}</h3>
            </div>
          </div>
        </div>
        <div className="metric-lg card-animated">
          <div className="metric-lg-head">
            <div>
              <p className="metric-lg-label">Total Patients</p>
              <h3 className="metric-lg-value">{stats.totalPatients}</h3>
            </div>
          </div>
        </div>
        <div className="metric-lg card-animated">
          <div className="metric-lg-head">
            <div>
              <p className="metric-lg-label">Total Doctors</p>
              <h3 className="metric-lg-value">{stats.totalDoctors}</h3>
            </div>
          </div>
        </div>
        <div className="metric-lg card-animated">
          <div className="metric-lg-head">
            <div>
              <p className="metric-lg-label">Total Appointments</p>
              <h3 className="metric-lg-value">{stats.totalAppointments}</h3>
            </div>
          </div>
        </div>
        <div className="metric-lg card-animated">
          <div className="metric-lg-head">
            <div>
              <p className="metric-lg-label">Total Revenue</p>
              <h3 className="metric-lg-value">${stats.totalRevenue.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
