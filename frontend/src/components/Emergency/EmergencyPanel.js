import React from 'react';
import { getSocket } from '../../realtime';
import './Emergency.css';

const EmergencyPanel = ({ user }) => {
  const sendAlert = () => {
    const socket = getSocket();
    if (!navigator.geolocation) {
      socket.emit('emergency:alert', {
        userId: user._id,
        name: user.name,
        message: 'Emergency alert (location unavailable)',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        socket.emit('emergency:alert', {
          userId: user._id,
          name: user.name,
          lat: latitude,
          lng: longitude,
          message: 'Emergency alert',
        });
      },
      () => {
        socket.emit('emergency:alert', {
          userId: user._id,
          name: user.name,
          message: 'Emergency alert (location permission denied)',
        });
      }
    );
  };

  const mapsQuery = encodeURIComponent('hospitals near me');

  return (
    <div className="emergency-panel">
      <h2>Emergency</h2>
      <p>If you are in an emergency, press the button below to send an alert to the system.</p>
      <button type="button" className="emergency-button" onClick={sendAlert}>
        Send Emergency Alert
      </button>
      <div className="emergency-map">
        <iframe
          title="Nearby hospitals"
          width="100%"
          height="220"
          style={{ border: 0, borderRadius: 12 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/search?q=${mapsQuery}&key=YOUR_GOOGLE_MAPS_API_KEY`}
        />
      </div>
      <p className="emergency-hint">
        Replace <code>YOUR_GOOGLE_MAPS_API_KEY</code> with a valid Google Maps API key to enable the map.
      </p>
    </div>
  );
};

export default EmergencyPanel;

