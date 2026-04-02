import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PaymentButton from '../Payments/PaymentButton';
import GlitchText from '../GlitchText/GlitchText';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './Appointments.css';

const AppointmentList = ({ userRole }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    notes: '',
    fee: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';

      if (userRole === 'patient') {
        endpoint = '/api/appointments/patient';
      } else if (userRole === 'doctor') {
        endpoint = '/api/appointments/doctor';
      } else if (userRole === 'admin') {
        endpoint = '/api/appointments/all';
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAppointments(response.data.appointments);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      const updateData = {};

      if (updateForm.status) updateData.status = updateForm.status;
      if (updateForm.notes !== undefined) updateData.notes = updateForm.notes;
      if (updateForm.fee !== undefined && updateForm.fee !== '') {
        updateData.fee = parseFloat(updateForm.fee);
      }

      const response = await axios.put(
        `/api/appointments/${appointmentId}/status`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSelectedAppointment(null);
        setUpdateForm({ status: '', notes: '', fee: '' });
        fetchAppointments();
        alert('Appointment updated successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update appointment');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="appointments-loading">Loading appointments...</div>;
  }

  const pageTitle = userRole === 'patient' ? 'My appointments' : userRole === 'doctor' ? 'Patient appointments' : 'All appointments';
  const pageSubtitle = userRole === 'patient'
    ? 'View and manage your scheduled visits.'
    : userRole === 'doctor'
      ? 'Manage your schedule and patient visits.'
      : 'Overview of all clinic appointments.';

  return (
    <div className="appointments-list-container">
      <header className="appointments-list-hero">
        <div className="hero-bg-pattern" aria-hidden="true" />
        <div className="appointments-hero-content">
          <p className="appointments-hero-eyebrow">Appointments</p>
          <AnimatedHeading text={pageTitle} />
          <p className="appointments-hero-subtitle">{pageSubtitle}</p>
        </div>
      </header>

      {appointments.length === 0 ? (
        <div className="empty-state-center page-block">
          <GlitchText speed={1} enableShadows enableOnHover={false}>
            No Appointments
          </GlitchText>
        </div>
      ) : (
        <div className="appointments-grid">
          {appointments.map((appointment, index) => (
            <div
              key={appointment._id}
              className={`appointment-card-item card-animated status-${appointment.status}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="appointment-card-top">
                <div className="appointment-date-block">
                  <span className="appointment-date-main">{formatDate(appointment.appointmentDate)}</span>
                  <span className="appointment-time">{appointment.appointmentTime}</span>
                </div>
                <span className={`appointment-status-pill status-${appointment.status}`}>
                  {appointment.status}
                </span>
              </div>

              <div className="appointment-card-body">
                {userRole === 'patient' && (
                  <div className="appointment-details">
                    <div className="appointment-detail-row">
                      <span className="detail-label">Doctor</span>
                      <span className="detail-value">Dr. {appointment.doctor?.name}</span>
                    </div>
                    <div className="appointment-detail-row">
                      <span className="detail-label">Specialization</span>
                      <span className="detail-value">{appointment.doctor?.specialization || 'General'}</span>
                    </div>
                    <div className="appointment-detail-row">
                      <span className="detail-label">Reason</span>
                      <span className="detail-value">{appointment.reason}</span>
                    </div>
                    {appointment.fee > 0 && (
                      <>
                        <div className="appointment-detail-row">
                          <span className="detail-label">Fee</span>
                          <span className="detail-value">₹{appointment.fee}</span>
                        </div>
                        {appointment.paymentStatus === 'pending' && (
                          <div className="appointment-payment-cta">
                            <PaymentButton
                              amount={appointment.fee}
                              appointmentId={appointment._id}
                              description={`Payment for appointment with Dr. ${appointment.doctor?.name}`}
                              onSuccess={() => fetchAppointments()}
                            />
                          </div>
                        )}
                        {appointment.paymentStatus === 'paid' && (
                          <div className="payment-badge">Payment completed</div>
                        )}
                      </>
                    )}
                    {appointment.notes && (
                      <div className="appointment-detail-row">
                        <span className="detail-label">Notes</span>
                        <span className="detail-value">{appointment.notes}</span>
                      </div>
                    )}
                  </div>
                )}

                {userRole === 'doctor' && (
                  <div className="appointment-details">
                    <div className="appointment-detail-row">
                      <span className="detail-label">Patient</span>
                      <span className="detail-value">{appointment.patient?.name}</span>
                    </div>
                    <div className="appointment-detail-row">
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{appointment.patient?.email}</span>
                    </div>
                    {appointment.patient?.phone && (
                      <div className="appointment-detail-row">
                        <span className="detail-label">Phone</span>
                        <span className="detail-value">{appointment.patient?.phone}</span>
                      </div>
                    )}
                    <div className="appointment-detail-row">
                      <span className="detail-label">Reason</span>
                      <span className="detail-value">{appointment.reason}</span>
                    </div>
                    {appointment.notes && (
                      <div className="appointment-detail-row">
                        <span className="detail-label">My notes</span>
                        <span className="detail-value">{appointment.notes}</span>
                      </div>
                    )}
                    {appointment.fee > 0 && (
                      <div className="appointment-detail-row">
                        <span className="detail-label">Fee</span>
                        <span className="detail-value">₹{appointment.fee}</span>
                      </div>
                    )}
                  </div>
                )}

                {userRole === 'admin' && (
                  <div className="appointment-details">
                    <div className="appointment-detail-row">
                      <span className="detail-label">Patient</span>
                      <span className="detail-value">{appointment.patient?.name}</span>
                    </div>
                    <div className="appointment-detail-row">
                      <span className="detail-label">Doctor</span>
                      <span className="detail-value">Dr. {appointment.doctor?.name}</span>
                    </div>
                    <div className="appointment-detail-row">
                      <span className="detail-label">Reason</span>
                      <span className="detail-value">{appointment.reason}</span>
                    </div>
                    {appointment.fee > 0 && (
                      <div className="appointment-detail-row">
                        <span className="detail-label">Fee</span>
                        <span className="detail-value">₹{appointment.fee}</span>
                      </div>
                    )}
                    <div className="appointment-detail-row">
                      <span className="detail-label">Payment</span>
                      <span className="detail-value">{appointment.paymentStatus}</span>
                    </div>
                  </div>
                )}
              </div>

              {(userRole === 'doctor' || userRole === 'admin') && (
                <div className="appointment-actions">
                  <button
                    onClick={() => setSelectedAppointment(appointment)}
                    className="update-button"
                  >
                    Update
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Update Modal */}
      {selectedAppointment && (userRole === 'doctor' || userRole === 'admin') && (
        <div className="modal-overlay" onClick={() => setSelectedAppointment(null)}>
          <div className="modal-content modal-content-animated" onClick={(e) => e.stopPropagation()}>
            <h3 className="section-title">Update appointment</h3>
            <div className="form-group">
              <label>Status</label>
              <select
                value={updateForm.status || selectedAppointment.status}
                onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                className="form-select"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={updateForm.notes !== '' ? updateForm.notes : (selectedAppointment.notes || '')}
                onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                className="form-textarea"
                rows="4"
                placeholder="Add notes about the appointment..."
              />
            </div>

            <div className="form-group">
              <label>Fee ($)</label>
              <input
                type="number"
                value={updateForm.fee !== '' ? updateForm.fee : (selectedAppointment.fee || '')}
                onChange={(e) => setUpdateForm({ ...updateForm, fee: e.target.value })}
                className="form-input"
                min="0"
                step="0.01"
                placeholder="Enter fee amount"
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={() => handleStatusUpdate(selectedAppointment._id)}
                className="submit-button"
              >
                Update Appointment
              </button>
              <button
                onClick={() => {
                  setSelectedAppointment(null);
                  setUpdateForm({ status: '', notes: '', fee: '' });
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;

