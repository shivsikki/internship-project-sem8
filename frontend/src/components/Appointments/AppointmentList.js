import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PaymentButton from '../Payments/PaymentButton';
import GlitchText from '../GlitchText/GlitchText';
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'completed':
        return '#2196F3';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
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
    return <div className="loading">Loading appointments...</div>;
  }

  return (
    <div className="appointments-list-container">
      <h2>
        {userRole === 'patient' && 'My Appointments'}
        {userRole === 'doctor' && 'Patient Appointments'}
        {userRole === 'admin' && 'All Appointments'}
      </h2>

      {appointments.length === 0 ? (
        <div className="empty-state-center">
          <GlitchText speed={1} enableShadows enableOnHover={false}>
            No Appointments
          </GlitchText>
        </div>
      ) : (
        <div className="appointments-grid">
          {appointments.map((appointment) => (
            <div key={appointment._id} className="appointment-card-item">
              <div className="appointment-header">
                <div className="appointment-status" style={{ backgroundColor: getStatusColor(appointment.status) }}>
                  {appointment.status.toUpperCase()}
                </div>
                <div className="appointment-date-time">
                  <strong>{formatDate(appointment.appointmentDate)}</strong>
                  <span>{appointment.appointmentTime}</span>
                </div>
              </div>

              <div className="appointment-body">
                {userRole === 'patient' && (
                  <div className="appointment-info">
                    <p><strong>Doctor:</strong> Dr. {appointment.doctor?.name}</p>
                    <p><strong>Specialization:</strong> {appointment.doctor?.specialization || 'General'}</p>
                    <p><strong>Reason:</strong> {appointment.reason}</p>
                    {appointment.fee > 0 && (
                      <>
                        <p><strong>Fee:</strong> ₹{appointment.fee}</p>
                        {appointment.paymentStatus === 'pending' && (
                          <div style={{ marginTop: '15px' }}>
                            <PaymentButton
                              amount={appointment.fee}
                              appointmentId={appointment._id}
                              description={`Payment for appointment with Dr. ${appointment.doctor?.name}`}
                              onSuccess={() => {
                                fetchAppointments();
                              }}
                            />
                          </div>
                        )}
                        {appointment.paymentStatus === 'paid' && (
                          <p style={{ color: '#4CAF50', fontWeight: '600', marginTop: '10px' }}>
                            Payment Completed
                          </p>
                        )}
                      </>
                    )}
                    {appointment.notes && (
                      <p><strong>Notes:</strong> {appointment.notes}</p>
                    )}
                  </div>
                )}

                {userRole === 'doctor' && (
                  <div className="appointment-info">
                    <p><strong>Patient:</strong> {appointment.patient?.name}</p>
                    <p><strong>Email:</strong> {appointment.patient?.email}</p>
                    {appointment.patient?.phone && (
                      <p><strong>Phone:</strong> {appointment.patient?.phone}</p>
                    )}
                    <p><strong>Reason:</strong> {appointment.reason}</p>
                    {appointment.notes && (
                      <p><strong>My Notes:</strong> {appointment.notes}</p>
                    )}
                    {appointment.fee > 0 && (
                      <p><strong>Fee:</strong> ₹{appointment.fee}</p>
                    )}
                  </div>
                )}

                {userRole === 'admin' && (
                  <div className="appointment-info">
                    <p><strong>Patient:</strong> {appointment.patient?.name}</p>
                    <p><strong>Doctor:</strong> Dr. {appointment.doctor?.name}</p>
                    <p><strong>Reason:</strong> {appointment.reason}</p>
                    {appointment.fee > 0 && (
                      <p><strong>Fee:</strong> ₹{appointment.fee}</p>
                    )}
                    <p><strong>Payment:</strong> {appointment.paymentStatus}</p>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Update Appointment</h3>
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

