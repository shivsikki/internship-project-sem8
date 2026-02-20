import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PaymentButton from '../Payments/PaymentButton';
import GlitchText from '../GlitchText/GlitchText';
import { useToast } from '../Toast/ToastProvider';
import './Appointments.css';

const AppointmentList = ({ userRole }) => {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    notes: '',
    fee: ''
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 6;

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
        toast.success('Appointment updated successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update appointment');
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

  const filtered = appointments.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const textParts = [
      a.reason,
      a.patient?.name,
      a.patient?.email,
      a.doctor?.name,
      a.doctor?.specialization,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return textParts.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const header = ['Date', 'Time', 'Patient', 'Doctor', 'Status', 'Reason'];
    const rows = filtered.map((a) => [
      new Date(a.appointmentDate).toISOString().split('T')[0],
      a.appointmentTime,
      a.patient?.name || '',
      a.doctor?.name || '',
      a.status,
      (a.reason || '').replace(/,/g, ';'),
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'appointments.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  return (
    <div className="appointments-list-container">
      <div className="appointments-header-row">
        <h2>
          {userRole === 'patient' && 'My Appointments'}
          {userRole === 'doctor' && 'Patient Appointments'}
          {userRole === 'admin' && 'All Appointments'}
        </h2>
        <div className="appointments-actions-row">
          <input
            type="text"
            placeholder="Search by name or reason..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="form-input"
            style={{ maxWidth: 220 }}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="form-select"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button type="button" className="export-button" onClick={exportCsv}>
            Export CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state-center">
          <GlitchText speed={1} enableShadows enableOnHover={false}>
            No Appointments
          </GlitchText>
        </div>
      ) : (
        <div className="appointments-grid">
          {paged.map((appointment) => (
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

      {filtered.length > 0 && (
        <div className="pagination-row">
          <button
            type="button"
            className="page-button"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className="page-button"
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
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

