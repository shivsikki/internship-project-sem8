import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
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

  const downloadPDF = (appointment) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 48;
    let y = 60;

    // Header bar
    doc.setFillColor(63, 80, 56);
    doc.rect(0, 0, pageW, 44, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('HIPPOCRATES LAB — APPOINTMENT RECORD', margin, 28);

    // Status pill
    const statusColors = { confirmed: [220, 252, 231], pending: [254, 249, 195], cancelled: [254, 226, 226], completed: [219, 234, 254] };
    const statusText = { confirmed: [22, 101, 52], pending: [133, 77, 14], cancelled: [239, 68, 68], completed: [30, 64, 175] };
    const sc = statusColors[appointment.status] || [243, 244, 246];
    const st = statusText[appointment.status] || [75, 85, 99];
    doc.setFillColor(...sc);
    doc.roundedRect(pageW - margin - 80, 52, 80, 22, 5, 5, 'F');
    doc.setTextColor(...st);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(appointment.status.toUpperCase(), pageW - margin - 40, 66, { align: 'center' });

    y = 90;

    // Date & time block
    doc.setFillColor(247, 249, 246);
    doc.roundedRect(margin, y, 160, 54, 8, 8, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(formatDate(appointment.appointmentDate).toUpperCase(), margin + 12, y + 18);
    doc.setTextColor(40, 60, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(appointment.appointmentTime || '—', margin + 12, y + 42);

    y += 80;

    const printField = (label, value, x, curY, w = 220) => {
      doc.setTextColor(156, 163, 175);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(label, x, curY);
      doc.setTextColor(50, 62, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(value || '—', w);
      doc.text(lines, x, curY + 14);
      return curY + 14 + (lines.length * 13);
    };

    if (userRole === 'patient') {
      doc.setTextColor(156, 163, 175);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('PHYSICIAN', margin, y);
      doc.setTextColor(40, 60, 40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`Dr. ${appointment.doctor?.name || '—'}`, margin, y + 18);
      y += 38;
      const newY1 = printField('SPECIALIZATION', appointment.doctor?.specialization || 'General', margin, y);
      printField('REASON', appointment.reason, margin + 240, y);
      y = Math.max(newY1, y + 30) + 8;
      y = printField('CITY', appointment.city || 'Not specified', margin, y);
      y = printField('NOTES', appointment.notes || 'No notes assigned', margin, y, pageW - margin * 2) + 8;
    } else {
      doc.setTextColor(156, 163, 175);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('PATIENT', margin, y);
      doc.setTextColor(40, 60, 40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(appointment.patient?.name || '—', margin, y + 18);
      y += 38;
      const newY2 = printField('EMAIL', appointment.patient?.email, margin, y);
      printField('REASON', appointment.reason, margin + 240, y);
      y = Math.max(newY2, y + 30) + 8;
      y = printField('CITY', appointment.city || 'Not specified', margin, y);
      y = printField('NOTES', appointment.notes || 'No notes assigned', margin, y, pageW - margin * 2) + 8;
    }

    // Fee footer
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 6, pageW - margin, y + 6);
    y += 22;
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Consultation Fee', margin, y);
    doc.setTextColor(40, 60, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`\u20B9${appointment.fee || '0'}`, pageW - margin, y, { align: 'right' });

    // Footer
    doc.setFillColor(245, 245, 240);
    doc.rect(0, doc.internal.pageSize.getHeight() - 36, pageW, 36, 'F');
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Generated by Hippocrates Lab Clinical Portal', margin, doc.internal.pageSize.getHeight() - 14);
    doc.text(new Date().toLocaleDateString(), pageW - margin, doc.internal.pageSize.getHeight() - 14, { align: 'right' });

    doc.save(`appointment_${appointment._id?.slice(-6) || 'record'}.pdf`);
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
                  <div className="appointment-details v2-details">
                    <div className="v2-section-group">
                      <div className="v2-section-group">
                        <span className="v2-label">CITY</span>
                        <p className="v2-detail-text">{appointment.city || 'Not specified'}</p>
                      </div>
                      <span className="v2-label">PHYSICIAN</span>
                      <h4 className="v2-patient-name">Dr. {appointment.doctor?.name}</h4>
                    </div>

                    <div className="v2-grid-row">
                      <div className="v2-section-group">
                        <span className="v2-label">SPECIALIZATION</span>
                        <p className="v2-detail-text">{appointment.doctor?.specialization || 'General'}</p>
                      </div>
                      <div className="v2-section-group">
                        <span className="v2-label">REASON</span>
                        <p className="v2-detail-text">{appointment.reason}</p>
                      </div>
                    </div>

                    <div className="v2-section-group">
                      <span className="v2-label">NOTES</span>
                      <p className="v2-detail-text">{appointment.notes || 'no notes assigned'}</p>
                    </div>

                    <div className="v2-fee-section">
                      <span className="v2-fee-label">Consultation Fee</span>
                      <span className="v2-fee-value">
                        {appointment.fee > 0 ? `₹${appointment.fee}` : '₹0'}
                      </span>
                    </div>

                    {appointment.fee > 0 && appointment.paymentStatus === 'pending' && (
                      <div className="appointment-payment-cta" style={{ marginTop: '12px' }}>
                        <PaymentButton
                          amount={appointment.fee}
                          appointmentId={appointment._id}
                          description={`Payment for appointment with Dr. ${appointment.doctor?.name}`}
                          onSuccess={() => fetchAppointments()}
                        />
                      </div>
                    )}
                    {appointment.fee > 0 && appointment.paymentStatus === 'paid' && (
                      <div className="payment-badge" style={{ marginTop: '8px' }}>Payment completed</div>
                    )}
                  </div>
                )}

                {userRole === 'doctor' && (
                  <div className="appointment-details v2-details">
                    <div className="v2-section-group">
                      <span className="v2-label">PATIENT IDENTITY</span>
                      <h4 className="v2-patient-name">{appointment.patient?.name}</h4>
                    </div>

                    <div className="v2-grid-row">
                      <div className="v2-section-group">
                        <span className="v2-label">CONTACT</span>
                        <div className="v2-contact-info">
                          <span className="v2-detail-text">{appointment.patient?.email}</span>
                          {appointment.patient?.phone && (
                            <span className="v2-detail-text">{appointment.patient?.phone}</span>
                          )}
                        </div>
                      </div>
                      <div className="v2-section-group">
                        <span className="v2-label">CITY</span>
                        <p className="v2-detail-text">{appointment.city || 'Not specified'}</p>
                      </div>
                      <div className="v2-section-group">
                        <span className="v2-label">REASON</span>
                        <p className="v2-detail-text">{appointment.reason}</p>
                      </div>
                    </div>

                    <div className="v2-section-group">
                      <span className="v2-label">MY NOTES</span>
                      <p className="v2-detail-text">
                        {appointment.notes || "no notes assigned"}
                      </p>
                    </div>

                    <div className="v2-fee-section">
                      <span className="v2-fee-label">Consultation Fee</span>
                      <span className="v2-fee-value">₹{appointment.fee || '0'}</span>
                    </div>

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

              {/* Download PDF button – shown for all roles */}
              <div className="appointment-actions appt-actions-row">
                <button
                  className="download-pdf-btn"
                  onClick={() => downloadPDF(appointment)}
                >
                  ↓ Download PDF
                </button>
                {(userRole === 'doctor' || userRole === 'admin') && (
                  <button
                    onClick={() => setSelectedAppointment(appointment)}
                    className="update-button"
                  >
                    UPDATE RECORDS
                  </button>
                )}
              </div>
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

