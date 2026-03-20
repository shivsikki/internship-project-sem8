import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlitchText from '../GlitchText/GlitchText';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './Prescriptions.css';

const PrescriptionList = ({ patientId, userRole }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, [patientId]);

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';

      if (userRole === 'patient') {
        endpoint = `/api/prescriptions/patient/${patientId}`;
      } else if (userRole === 'doctor') {
        endpoint = '/api/prescriptions/doctor';
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPrescriptions(response.data.prescriptions);
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="prescriptions-loading">Loading prescriptions...</div>;
  }

  return (
    <div className="prescriptions-list-container">
      <header className="prescriptions-list-hero">
        <div className="prescriptions-hero-bg" aria-hidden="true" />
        <div className="prescriptions-hero-content">
          <p className="prescriptions-hero-eyebrow">Health records</p>
          <AnimatedHeading text="Prescriptions" />
          <p className="prescriptions-hero-subtitle">Your diagnosis and medications at a glance.</p>
        </div>
      </header>

      {prescriptions.length === 0 ? (
        <div className="empty-state-center page-block">
          <GlitchText speed={1} enableShadows enableOnHover={false}>
            No Prescriptions
          </GlitchText>
        </div>
      ) : (
        <div className="prescriptions-grid">
          {prescriptions.map((prescription, index) => (
            <div
              key={prescription._id}
              className="prescription-card-item card-animated"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="prescription-header">
                <div>
                  <strong>Date:</strong> {formatDate(prescription.date)}
                </div>
                {prescription.doctor && (
                  <div>
                    <strong>Doctor:</strong> Dr. {prescription.doctor.name}
                  </div>
                )}
              </div>

              <div className="prescription-body">
                <div className="diagnosis-section">
                  <strong>Diagnosis:</strong>
                  <p>{prescription.diagnosis}</p>
                </div>

                <div className="medications-section-list">
                  <strong>Medications:</strong>
                  <ul>
                    {prescription.medications.map((med, index) => (
                      <li key={index}>
                        <strong>{med.name}</strong> - {med.dosage} | {med.frequency} | {med.duration}
                        {med.instructions && <span className="instructions"> ({med.instructions})</span>}
                      </li>
                    ))}
                  </ul>
                </div>

                {prescription.notes && (
                  <div className="notes-section">
                    <strong>Notes:</strong>
                    <p>{prescription.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrescriptionList;

