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
      const token = sessionStorage.getItem('token');
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
      const token = sessionStorage.getItem('token');
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

  const getImageDataUrl = (src, options = {}) => new Promise((resolve) => {
    const { rounded = false, radius = 0 } = options;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      if (rounded) {
        const w = canvas.width;
        const h = canvas.height;
        const r = Math.max(0, Math.min(radius, Math.min(w, h) / 2));
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(w - r, 0);
        ctx.quadraticCurveTo(w, 0, w, r);
        ctx.lineTo(w, h - r);
        ctx.quadraticCurveTo(w, h, w - r, h);
        ctx.lineTo(r, h);
        ctx.quadraticCurveTo(0, h, 0, h - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.clip();
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

  const downloadPDF = async (appointment) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    let y = 60;

    const logoDataUrl = await getImageDataUrl('/images/hippocrates.png', { rounded: true, radius: 36 });
    const primary = [47, 71, 56];
    const textDark = [37, 48, 44];
    const textMuted = [107, 114, 128];
    const formattedFee = `INR ${Number(appointment.fee || 0).toLocaleString('en-IN')}`;

    // Header band
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageW, 70, 'F');

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', margin, 14, 40, 40);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.text('HIPPOCRATES LAB', logoDataUrl ? margin + 50 : margin, 38);
    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    doc.text('Patient Appointment Report', logoDataUrl ? margin + 50 : margin, 54);

    // Meta area
    doc.setTextColor(...textMuted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('REPORT ID', pageW - margin - 150, 26);
    doc.text('GENERATED ON', pageW - margin - 150, 46);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${appointment._id?.slice(-8)?.toUpperCase() || 'N/A'}`, pageW - margin, 26, { align: 'right' });
    doc.text(new Date().toLocaleDateString(), pageW - margin, 46, { align: 'right' });

    // Status card colors
    const statusColors = { confirmed: [220, 252, 231], pending: [254, 249, 195], cancelled: [254, 226, 226], completed: [219, 234, 254] };
    const statusText = { confirmed: [22, 101, 52], pending: [133, 77, 14], cancelled: [239, 68, 68], completed: [30, 64, 175] };
    const sc = statusColors[appointment.status] || [243, 244, 246];
    const st = statusText[appointment.status] || [75, 85, 99];
    y = 96;

    // Top information row: date/time + city + status
    doc.setFillColor(247, 249, 246);
    doc.roundedRect(margin, y, 170, 66, 10, 10, 'F');
    doc.roundedRect(margin + 185, y, 145, 66, 10, 10, 'F');
    doc.setFillColor(...sc);
    doc.roundedRect(margin + 345, y, 170, 66, 10, 10, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(formatDate(appointment.appointmentDate).toUpperCase(), margin + 14, y + 20);
    doc.text('CITY', margin + 199, y + 20);
    doc.setTextColor(...st);
    doc.text('STATUS', margin + 359, y + 20);
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text(appointment.appointmentTime || '—', margin + 14, y + 52);
    doc.setFontSize(12);
    doc.text(appointment.city || 'Not specified', margin + 199, y + 44);
    doc.setTextColor(...st);
    doc.setFontSize(16);
    doc.text(appointment.status.toUpperCase(), margin + 430, y + 44, { align: 'center' });

    y += 94;

    const drawFieldCard = (label, value, x, topY, width, height, options = {}) => {
      const {
        titleSize = 8,
        valueSize = 11,
        boldValue = false,
      } = options;

      doc.setTextColor(...textMuted);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(titleSize);
      doc.text(label, x, topY + 18);

      doc.setTextColor(...textDark);
      doc.setFont('helvetica', boldValue ? 'bold' : 'normal');
      doc.setFontSize(valueSize);

      const lines = doc.splitTextToSize(value || '—', width);
      const maxLines = Math.max(1, Math.floor((height - 18) / (valueSize + 3)));
      const clipped = lines.slice(0, maxLines);
      doc.text(clipped, x, topY + 38);
    };

    const leftX = margin;
    const rightX = margin + 258;
    const colWidth = 210;
    const rowGap = 14;
    const rowOneH = 74;
    const rowTwoH = 74;
    const notesH = 94;

    if (userRole === 'patient') {
      drawFieldCard('PHYSICIAN', `Dr. ${appointment.doctor?.name || '—'}`, leftX, y, colWidth, rowOneH, {
        valueSize: 16,
        boldValue: true,
      });
      drawFieldCard('SPECIALIZATION', appointment.doctor?.specialization || 'General', rightX, y, colWidth, rowOneH);
      y += rowOneH + rowGap;

      drawFieldCard('REASON', appointment.reason || '—', leftX, y, colWidth, rowTwoH);
      drawFieldCard('NOTES', appointment.notes || 'No notes assigned', rightX, y, colWidth, notesH);
      y += Math.max(rowTwoH, notesH) + 10;
    } else {
      drawFieldCard('PATIENT', appointment.patient?.name || '—', leftX, y, colWidth, rowOneH, {
        valueSize: 16,
        boldValue: true,
      });
      drawFieldCard('EMAIL', appointment.patient?.email || '—', rightX, y, colWidth, rowOneH);
      y += rowOneH + rowGap;

      drawFieldCard('REASON', appointment.reason || '—', leftX, y, colWidth, rowTwoH);
      drawFieldCard('NOTES', appointment.notes || 'No notes assigned', rightX, y, colWidth, notesH);
      y += Math.max(rowTwoH, notesH) + 10;
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
    doc.text(formattedFee, pageW - margin, y, { align: 'right' });

    // Signature + footer for authenticity
    const signY = Math.min(y + 70, pageH - 120);
    doc.setTextColor(...textMuted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('AUTHORIZED SIGNATORY', pageW - margin - 140, signY);
    doc.setDrawColor(190, 190, 190);
    doc.line(pageW - margin - 160, signY + 26, pageW - margin, signY + 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    doc.text('Hippocrates Lab', pageW - margin - 80, signY + 39, { align: 'center' });

    // Footer
    doc.setFillColor(245, 245, 240);
    doc.rect(0, pageH - 36, pageW, 36, 'F');
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Generated by Hippocrates Lab Clinical Portal', margin, pageH - 14);
    doc.text('This report is digitally generated and valid without physical signature.', pageW - margin, pageH - 14, { align: 'right' });

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
    <div className={"appointments-list-container"}>
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
                <div className="appointment-card-meta-row">
                  <div className="appointment-date-block">
                    <span className="appointment-date-main">{formatDate(appointment.appointmentDate)}</span>
                    <span className="appointment-time">{appointment.appointmentTime}</span>
                  </div>
                  {userRole === 'patient' && (
                    <div className="appointment-city-block">
                      <span className="appointment-date-main">CITY</span>
                      <span className="appointment-time appointment-city-value">
                        {appointment.city || 'Not specified'}
                      </span>
                    </div>
                  )}
                </div>
                <span className={`appointment-status-pill status-${appointment.status}`}>
                  {appointment.status}
                </span>
              </div>

              <div className="appointment-card-body">
                {userRole === 'patient' && (
                  <div className="appointment-details v2-details">
                    <div className="v2-grid-row">
                      <div className="v2-section-group">
                        <span className="v2-label">PHYSICIAN</span>
                        <h4 className="v2-patient-name">Dr. {appointment.doctor?.name}</h4>
                      </div>
                      <div className="v2-section-group">
                        <span className="v2-label">SPECIALIZATION</span>
                        <p className="v2-detail-text">{appointment.doctor?.specialization || 'General'}</p>
                      </div>
                    </div>

                    <div className="v2-grid-row">
                      <div className="v2-section-group">
                        <span className="v2-label">REASON</span>
                        <p className="v2-detail-text">{appointment.reason}</p>
                      </div>
                      <div className="v2-section-group">
                        <span className="v2-label">NOTES</span>
                        <p className="v2-detail-text">{appointment.notes || 'no notes assigned'}</p>
                      </div>
                    </div>

                    <div className="v2-fee-section">
                      <span className="v2-fee-label">Consultation Fee</span>
                      <span className="v2-fee-value">
                        {appointment.fee > 0 ? `₹${appointment.fee}` : '₹0'}
                      </span>
                    </div>

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
              <div className={`appointment-actions appt-actions-row ${userRole === 'patient' && !(appointment.fee > 0 && appointment.paymentStatus === 'pending') ? 'single-action' : ''}`}>
                {userRole === 'patient' && appointment.fee > 0 && appointment.paymentStatus === 'pending' && (
                  <PaymentButton
                    amount={appointment.fee}
                    appointmentId={appointment._id}
                    description={`Payment for appointment with Dr. ${appointment.doctor?.name}`}
                    onSuccess={() => fetchAppointments()}
                  />
                )}
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

