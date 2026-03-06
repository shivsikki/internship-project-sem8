import React, { useState, useEffect } from 'react';
import './DoctorProfile.css';

const DoctorProfile = ({ doctorId }) => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctorProfile();
  }, [doctorId]);

  const loadDoctorProfile = async () => {
    // Mock realistic doctor data
    const mockDoctor = {
      _id: doctorId,
      name: 'Dr. Sarah Chen MD',
      specialization: 'Cardiology',
      experience: 12,
      education: 'Harvard Medical School',
      bio: 'Board-certified cardiologist with expertise in interventional cardiology and preventive heart care. Dr. Chen has performed over 2,000 cardiac procedures and published numerous research papers on cardiovascular health.',
      licenseNumber: 'MD-CARD-2021-0847',
      rating: 4.9,
      patients: 1247,
      languages: ['English', 'Mandarin', 'Spanish'],
      availability: {
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 3:00 PM',
        saturday: 'Closed',
        sunday: 'Closed'
      },
      specialties: [
        'Interventional Cardiology',
        'Preventive Cardiology',
        'Cardiac Catheterization',
        'Echocardiography',
        'Heart Failure Management'
      ],
      educationDetails: [
        {
          degree: 'Doctor of Medicine',
          school: 'Harvard Medical School',
          year: '2009'
        },
        {
          degree: 'Residency in Internal Medicine',
          school: 'Massachusetts General Hospital',
          year: '2012'
        },
        {
          degree: 'Fellowship in Cardiology',
          school: 'Mayo Clinic',
          year: '2014'
        }
      ],
      certifications: [
        'American Board of Internal Medicine',
        'American Board of Cardiology',
        'Interventional Cardiology Certification'
      ],
      achievements: [
        'Top Cardiologist Award 2023',
        'Published 25+ Research Papers',
        'Pioneer in Minimally Invasive Cardiac Procedures'
      ],
      consultationFee: 250,
      insurance: ['Blue Cross Blue Shield', 'Aetna', 'UnitedHealth', 'Cigna'],
      hospitalAffiliations: [
        'Massachusetts General Hospital',
        'Boston Medical Center',
        'Brigham and Women\'s Hospital'
      ]
    };

    setDoctor(mockDoctor);
    setLoading(false);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star full">⭐</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">⭐</span>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="doctor-profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading doctor profile...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="doctor-profile-error">
        <p>Doctor profile not found.</p>
      </div>
    );
  }

  return (
    <div className="doctor-profile">
      <div className="profile-header">
        <div className="doctor-avatar">
          <img src="/images/doctors/doctor1.svg" alt={doctor.name} />
          <div className="online-indicator"></div>
        </div>
        <div className="doctor-info">
          <h1>{doctor.name}</h1>
          <div className="specialization">{doctor.specialization}</div>
          <div className="rating-section">
            <div className="stars">
              {renderStars(doctor.rating)}
            </div>
            <span className="rating-text">{doctor.rating} (342 reviews)</span>
          </div>
          <div className="stats">
            <div className="stat">
              <span className="stat-number">{doctor.experience}</span>
              <span className="stat-label">Years Experience</span>
            </div>
            <div className="stat">
              <span className="stat-number">{doctor.patients.toLocaleString()}</span>
              <span className="stat-label">Patients</span>
            </div>
            <div className="stat">
              <span className="stat-number">${doctor.consultationFee}</span>
              <span className="stat-label">Consultation</span>
            </div>
          </div>
        </div>
        <div className="profile-actions">
          <button className="btn-primary">Book Appointment</button>
          <button className="btn-secondary">Video Consultation</button>
        </div>
      </div>

      <div className="profile-content">
        <div className="main-content">
          <section className="about-section">
            <h2>About Dr. {doctor.name.split(' ')[1]}</h2>
            <p>{doctor.bio}</p>
          </section>

          <section className="specialties-section">
            <h2>Medical Specialties</h2>
            <div className="specialties-grid">
              {doctor.specialties.map((specialty, index) => (
                <div key={index} className="specialty-item">
                  <span className="specialty-icon">🏥</span>
                  <span>{specialty}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="education-section">
            <h2>Education & Training</h2>
            <div className="education-timeline">
              {doctor.educationDetails.map((edu, index) => (
                <div key={index} className="education-item">
                  <div className="education-year">{edu.year}</div>
                  <div className="education-details">
                    <h4>{edu.degree}</h4>
                    <p>{edu.school}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="certifications-section">
            <h2>Certifications & Licensure</h2>
            <div className="certifications-list">
              {doctor.certifications.map((cert, index) => (
                <div key={index} className="certification-item">
                  <span className="cert-icon">📜</span>
                  <span>{cert}</span>
                </div>
              ))}
            </div>
            <div className="license-info">
              <strong>Medical License:</strong> {doctor.licenseNumber}
            </div>
          </section>

          <section className="achievements-section">
            <h2>Achievements & Awards</h2>
            <div className="achievements-list">
              {doctor.achievements.map((achievement, index) => (
                <div key={index} className="achievement-item">
                  <span className="achievement-icon">🏆</span>
                  <span>{achievement}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="availability-section">
            <h2>Availability</h2>
            <div className="availability-grid">
              {Object.entries(doctor.availability).map(([day, time]) => (
                <div key={day} className="availability-item">
                  <span className="day">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                  <span className="time">{time}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="sidebar">
          <div className="sidebar-card">
            <h3>Languages</h3>
            <div className="languages-list">
              {doctor.languages.map((lang, index) => (
                <div key={index} className="language-item">
                  <span className="lang-icon">🌍</span>
                  <span>{lang}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-card">
            <h3>Insurance Accepted</h3>
            <div className="insurance-list">
              {doctor.insurance.map((insurance, index) => (
                <div key={index} className="insurance-item">
                  <span className="insurance-icon">💳</span>
                  <span>{insurance}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-card">
            <h3>Hospital Affiliations</h3>
            <div className="hospitals-list">
              {doctor.hospitalAffiliations.map((hospital, index) => (
                <div key={index} className="hospital-item">
                  <span className="hospital-icon">🏥</span>
                  <span>{hospital}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-card consultation-card">
            <h3>Consultation Fee</h3>
            <div className="fee-info">
              <span className="fee-amount">${doctor.consultationFee}</span>
              <span className="fee-note">per consultation</span>
            </div>
            <button className="btn-primary btn-full">Book Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
