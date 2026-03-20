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
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
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
      ? `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${coords.lat},${coords.lng}&zoom=15&maptype=roadmap`
      : apiKey
      ? `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=hospital`
      : null;

  const externalMapsUrl =
    coords && `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;

  return (
    <div className="emergency-page">
      <div className="emergency-header">
        <div>
          <AnimatedHeading text="Emergency" />
          <p>If you have a medical emergency, contact local emergency services immediately.</p>
        </div>
      </div>

      <div className="emergency-layout">
        <div className="emergency-card emergency-map-card">
          <h3>Nearby Hospitals &amp; Clinics</h3>
          {geoError && <p className="emergency-note">{geoError}</p>}
          {!apiKey && (
            <p className="emergency-note">
              Map is not configured. Please contact the administrator.
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
              className="emergency-open-maps"
            >
              Open in Google Maps
            </a>
          )}
        </div>

        <div className="emergency-card emergency-info-card">
          <h3>Important Contacts</h3>
          <div className="emergency-section">
            <h4>Immediate Help</h4>
            <ul>
              <li>Local emergency number (ambulance / police / fire).</li>
              <li>Nearest hospital emergency department.</li>
            </ul>
          </div>
          <div className="emergency-section">
            <h4>When to Seek Urgent Care</h4>
            <ul>
              <li>Chest pain, severe shortness of breath, or sudden weakness.</li>
              <li>Heavy bleeding or serious injury.</li>
              <li>Sudden confusion, loss of consciousness, or seizures.</li>
            </ul>
          </div>
          <div className="emergency-section">
            <h4>Disclaimer</h4>
            <p>
              This map and information are for guidance only and do not replace local emergency
              services. In any serious situation, always call your official emergency number
              immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Emergency;

