import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const AdminUserActivityModal = ({ userId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/admin/users/${userId}/activity`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch activity', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [userId]);

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="admin-modal-close" onClick={onClose}>×</button>
        <h3>User Activity History</h3>
        
        {loading ? (
          <div>Loading activity profile...</div>
        ) : data ? (
          <div className="admin-modal-scroll">
            <section className="admin-activity-section">
              <h4>Appointments ({data.appointments?.length || 0})</h4>
              {data.appointments?.length === 0 ? <p className="text-muted">No appointments</p> : (
                <ul className="admin-activity-list">
                  {data.appointments.map(a => (
                    <li key={a._id}>
                      <strong>{new Date(a.appointmentDate).toLocaleDateString()}</strong> at {a.appointmentTime} - {a.reason || 'General'}
                      <br/><span className={`badge ${a.status}`}>{a.status}</span>
                      {a.doctor && <span> • With: {a.doctor.name}</span>}
                      {a.patient && <span> • For: {a.patient.name}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="admin-activity-section">
              <h4>Prescriptions ({data.prescriptions?.length || 0})</h4>
              {data.prescriptions?.length === 0 ? <p className="text-muted">No prescriptions</p> : (
                <ul className="admin-activity-list">
                  {data.prescriptions.map(p => (
                    <li key={p._id}>
                      <strong>{new Date(p.date).toLocaleDateString()}</strong> - Diagnosis: {p.diagnosis}
                      {p.medications?.length > 0 && (
                        <div className="activity-nested">
                          {p.medications.map((m, i) => (
                            <div key={i}>• {m.name} ({m.dosage}, {m.frequency})</div>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="admin-activity-section">
              <h4>Tests ({data.tests?.length || 0})</h4>
              {data.tests?.length === 0 ? <p className="text-muted">No tests</p> : (
                <ul className="admin-activity-list">
                  {data.tests.map(t => (
                    <li key={t._id}>
                      <strong>{new Date(t.date).toLocaleDateString()}</strong> - {t.testName} 
                      <br/>Results: {t.results || 'Pending'}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : (
          <div>Error loading data.</div>
        )}
      </div>
    </div>
  );
};

export default AdminUserActivityModal;
