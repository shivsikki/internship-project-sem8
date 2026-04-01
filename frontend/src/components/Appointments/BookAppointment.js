import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './Appointments.css';

const SPECIALTIES = [
  'All',
  'General Practice',
  'Cardiovascular',
  'Neurological',
  'Orthopedic',
  'Dermatology',
  'Pediatrics',
  'Psychiatry',
  'Gastroenterology',
  'Ophthalmology',
  'ENT',
  'Ayurvedic'
];

const SPECIALTY_DESCRIPTIONS = {
  'All': 'View doctors across all medical departments',
  'General Practice': 'Primary care for common illnesses, check-ups, and routine health matters',
  'Cardiovascular': 'Heart, blood vessels, and circulatory system conditions',
  'Neurological': 'Brain, spinal cord, and nervous system disorders',
  'Orthopedic': 'Bones, joints, muscles, and ligaments',
  'Dermatology': 'Skin, hair, and nail conditions',
  'Pediatrics': 'Medical care for infants, children, and adolescents',
  'Psychiatry': 'Mental health, emotional disorders, and behavioral conditions',
  'Gastroenterology': 'Digestive system, stomach, liver, and intestines',
  'Ophthalmology': 'Eye care, vision problems, and eye conditions',
  'ENT': 'Ear, nose, throat, and related head and neck conditions',
  'Ayurvedic': 'Traditional Indian holistic medicine and wellness'
};

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [formData, setFormData] = useState({
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: ''
  });

  const fetchDoctors = async (specialization = '') => {
    try {
      const token = localStorage.getItem('token');
      const url = specialization
        ? `/api/appointments/doctors/list?specialization=${encodeURIComponent(specialization)}`
        : '/api/appointments/doctors/list';
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDoctors(response.data.doctors);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setDoctors([]);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedSpecialty === null) return;
    if (selectedSpecialty === 'All') {
      fetchDoctors();
    } else {
      fetchDoctors(selectedSpecialty);
    }
  }, [selectedSpecialty]);

  const handleSpecialtyClick = (specialty) => {
    setSelectedSpecialty(specialty);
    setFormData(prev => ({ ...prev, doctorId: '' }));
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/appointments/create', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('Appointment booked successfully!');
        setFormData({
          doctorId: '',
          appointmentDate: '',
          appointmentTime: '',
          reason: ''
        });
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [];
  for (let hour = 9; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="book-appointment-page">
      {/* Hero */}
      <header className="book-appointment-hero">
        <div className="hero-bg-pattern" aria-hidden="true" />
        <div className="book-hero-content">
          <p className="book-hero-eyebrow">Appointments</p>
          <AnimatedHeading text="Book an appointment" />
          <p className="book-hero-subtitle">Choose a department, pick a doctor, and schedule your visit.</p>
        </div>
      </header>

      {/* Part 1: Specialty selector */}
      <section className="book-appointment-section-1 page-block">
        <h2 className="section-title">Select a department</h2>
        <p className="section-1-hint">Choose a specialty to view available doctors</p>
        <div className="specialty-grid">
          {SPECIALTIES.map((specialty, index) => (
            <button
              key={specialty}
              type="button"
              className={`specialty-box ${selectedSpecialty === specialty ? 'active' : ''}`}
              onClick={() => handleSpecialtyClick(specialty)}
              title={SPECIALTY_DESCRIPTIONS[specialty]}
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <span className="specialty-box-label">{specialty}</span>
              <span className="specialty-tooltip">{SPECIALTY_DESCRIPTIONS[specialty]}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Part 2 & 3: Form and info */}
      <section className="book-appointment-section-2">
        <div className="book-appointment-part book-appointment-part-2 page-block">
          <div className="appointment-card appointment-book-form card-animated">
            <h2 className="section-title">Book appointment</h2>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit} className="appointment-form book-form">
            <div className="form-group">
              <label>Select Doctor</label>
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleChange}
                required
                className="form-select"
                disabled={!selectedSpecialty}
              >
                <option value="">
                  {selectedSpecialty
                    ? doctors.length > 0
                      ? 'Choose a doctor...'
                      : 'No doctors in this specialty'
                    : 'Select a specialty first'}
                </option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.name} - {doctor.specialization || 'General'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Appointment Date</label>
              <input
                type="date"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleChange}
                min={today}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Appointment Time</label>
              <select
                name="appointmentTime"
                value={formData.appointmentTime}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">Select time...</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Reason for Visit</label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                placeholder="Describe your symptoms or reason for the appointment..."
                rows="4"
                className="form-textarea"
              />
            </div>

            <button type="submit" className="submit-button form-submit-btn" disabled={loading}>
              {loading ? 'Booking...' : 'Book Appointment'}
            </button>
          </form>
        </div>
      </div>

        <div className="book-appointment-part book-appointment-part-3 page-block">
          <div className="appointment-card appointment-book-form info-card card-animated">
            <h2 className="section-title">Additional info</h2>
            <div className="info-content">
              <div className="info-section">
                <h3>Clinic Hours</h3>
                <p>Mon – Fri: 9:00 AM – 5:00 PM</p>
                <p>Sat: 9:00 AM – 1:00 PM</p>
                <p>Sun: Closed</p>
                <p>Closed on public holidays. Extended hours may apply during flu season; please check our website for updates.</p>
              </div>
              <div className="info-section">
                <h3>Before Your Visit</h3>
                <ul>
                  <li>Bring your ID and insurance card</li>
                  <li>Arrive 10–15 minutes early for registration</li>
                  <li>List all current medications and dosages</li>
                  <li>Note any allergies or past medical history relevant to your visit</li>
                </ul>
              </div>
              <div className="info-section">
                <h3>Contact</h3>
                <p>General inquiries: (012) 345-6789</p>
                <p>Appointment line: (012) 345-6790</p>
                <p>For medical emergencies, call emergency services immediately.</p>
                <p>Email: appointments@hippocrateslab.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookAppointment;
