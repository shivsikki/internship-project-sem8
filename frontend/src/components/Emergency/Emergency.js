import React, { useEffect, useState } from 'react';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './Emergency.css';

const Emergency = () => {
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Location is not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoords(location);
      },
      () => {
        setGeoError('Could not access your location. You can still use the map below.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const mapSrc =
    apiKey && coords
      ? `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=hospital&center=${coords.lat},${coords.lng}&zoom=14`
      : apiKey
      ? `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=hospital`
      : null;

  const externalMapsUrl =
    coords && `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;

  const emergencyContacts = [
    { name: "Emergency Services", number: "911", type: "emergency" },
    { name: "Poison Control", number: "1-800-222-1222", type: "urgent" },
    { name: "Crisis Hotline", number: "988", type: "mental" }
  ];

  const handleCallEmergency = (number) => {
    window.open(`tel:${number}`);
  };

  return (
    <div className="emergency-page">
      <div className="emergency-header">
        <div className="hero-bg-pattern" aria-hidden="true" />
        <div className="emergency-header-content">
          <p className="emergency-hero-eyebrow">urgent care</p>
          <AnimatedHeading text="Emergency" />
          <p className="emergency-hero-subtitle">
            If you have a medical emergency, contact local emergency services immediately.
          </p>
        </div>
      </div>

      <div className="emergency-container">
        {/* Emergency Quick Actions */}
        <div className="emergency-quick-actions">
          <h2 className="section-title">Emergency Contacts</h2>
          <div className="emergency-cards-grid">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className={`emergency-contact-card ${contact.type}`}>
                <div className="contact-icon">
                  {contact.type === 'emergency' && ''}
                  {contact.type === 'urgent' && ''}
                  {contact.type === 'mental' && ''}
                </div>
                <div className="contact-info">
                  <h3>{contact.name}</h3>
                  <p className="contact-number">{contact.number}</p>
                </div>
                <button 
                  onClick={() => handleCallEmergency(contact.number)}
                  className="call-btn"
                >
                  Call Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Map Section */}
        <div className="map-section">
          <h2 className="section-title">Nearby Hospitals Map</h2>
          <div className="map-container">
            {geoError && <p className="location-error">{geoError}</p>}
            {!apiKey && (
              <p className="map-error">
                Map is not configured. Please contact administrator.
              </p>
            )}
            {apiKey && (
              <div className="emergency-map-frame">
                {mapSrc && (
                  <iframe
                    title="Nearby hospitals map"
                    src={mapSrc}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                )}
              </div>
            )}
            {externalMapsUrl && (
              <a
                href={externalMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="open-maps-btn"
              >
                Open in Google Maps
              </a>
            )}
          </div>
        </div>

        {/* Emergency Guidelines */}
        <div className="emergency-guidelines">
          <h2 className="section-title">When to Seek Emergency Care</h2>
          <div className="guidelines-grid">
            <div className="guideline-card critical">
              <div className="guideline-icon">🚨</div>
              <h3>Critical Emergency</h3>
              <ul>
                <li>Chest pain or pressure</li>
                <li>Difficulty breathing</li>
                <li>Sudden severe headache</li>
                <li>Loss of consciousness</li>
              </ul>
            </div>
            <div className="guideline-card urgent">
              <div className="guideline-icon">⚡</div>
              <h3>Urgent Care</h3>
              <ul>
                <li>Fever with rash</li>
                <li>Broken bones</li>
                <li>Deep cuts requiring stitches</li>
                <li>Moderate asthma attack</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Emergency;

