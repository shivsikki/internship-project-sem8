import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DoctorFinder.css';

const DoctorFinder = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchRadius, setSearchRadius] = useState(10); // km
  const [specializationFilter, setSpecializationFilter] = useState('');

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          fetchNearbyDoctors(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          setError('Unable to get your location. Please enable location services.');
          // Use default location (New York) as fallback
          const defaultLocation = { lat: 40.7128, lng: -74.0060 };
          setUserLocation(defaultLocation);
          fetchNearbyDoctors(defaultLocation.lat, defaultLocation.lng);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  }, []);

  const fetchNearbyDoctors = async (lat, lng) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Add mock coordinates to doctors (in real app, these would be stored in database)
      const doctorsWithCoords = response.data.doctors.map(doctor => ({
        ...doctor,
        location: generateMockLocation(lat, lng, doctor.name)
      }));

      // Calculate distances and filter by radius
      const doctorsWithDistance = doctorsWithCoords.map(doctor => {
        const distance = calculateDistance(lat, lng, doctor.location.lat, doctor.location.lng);
        return { ...doctor, distance };
      }).filter(doctor => doctor.distance <= searchRadius);

      // Sort by distance
      doctorsWithDistance.sort((a, b) => a.distance - b.distance);

      // Apply specialization filter if set
      const filteredDoctors = specializationFilter
        ? doctorsWithDistance.filter(doctor => 
            doctor.specialization?.toLowerCase().includes(specializationFilter.toLowerCase())
          )
        : doctorsWithDistance;

      setDoctors(filteredDoctors);
    } catch (err) {
      setError('Failed to fetch doctors');
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateMockLocation = (userLat, userLng, doctorName) => {
    // Generate random coordinates within 20km of user
    const seed = doctorName.charCodeAt(0);
    const latOffset = (Math.sin(seed) * 0.18); // ~20km in degrees
    const lngOffset = (Math.cos(seed) * 0.18);
    
    return {
      lat: userLat + latOffset,
      lng: userLng + lngOffset
    };
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleRadiusChange = (newRadius) => {
    setSearchRadius(newRadius);
    if (userLocation) {
      fetchNearbyDoctors(userLocation.lat, userLocation.lng);
    }
  };

  const handleSpecializationChange = (specialization) => {
    setSpecializationFilter(specialization);
    if (userLocation) {
      fetchNearbyDoctors(userLocation.lat, userLocation.lng);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          fetchNearbyDoctors(newLocation.lat, newLocation.lng);
        },
        (error) => {
          setError('Unable to get your location');
        }
      );
    }
  };

  return (
    <div className="doctor-finder">
      <div className="finder-header">
        <h2>Find Nearest Doctors</h2>
        <p>Locate qualified healthcare providers near you</p>
      </div>

      <div className="finder-controls">
        <div className="control-group">
          <label>Search Radius: {searchRadius} km</label>
          <input
            type="range"
            min="1"
            max="50"
            value={searchRadius}
            onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
            className="radius-slider"
          />
        </div>

        <div className="control-group">
          <label>Specialization</label>
          <select
            value={specializationFilter}
            onChange={(e) => handleSpecializationChange(e.target.value)}
            className="specialization-select"
          >
            <option value="">All Specializations</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Neurology">Neurology</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Orthopedics">Orthopedics</option>
            <option value="Dermatology">Dermatology</option>
            <option value="General">General Practice</option>
          </select>
        </div>

        <button onClick={getCurrentLocation} className="location-btn">
          📍 Update My Location
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && <div className="loading">Finding doctors near you...</div>}

      <div className="doctors-grid">
        {doctors.map((doctor) => (
          <div key={doctor._id} className="doctor-card" onClick={() => setSelectedDoctor(doctor)}>
            <div className="doctor-header">
              <div className="doctor-avatar">
                {doctor.name.charAt(0)}
              </div>
              <div className="doctor-info">
                <h3>Dr. {doctor.name}</h3>
                <p className="specialization">{doctor.specialization}</p>
                <p className="distance">{doctor.distance.toFixed(1)} km away</p>
              </div>
            </div>
            <div className="doctor-details">
              <p><strong>License:</strong> {doctor.licenseNumber}</p>
              <p><strong>Experience:</strong> {doctor.experience || 'N/A'} years</p>
              <p><strong>Rating:</strong> ⭐⭐⭐⭐⭐ (4.8/5)</p>
            </div>
            <div className="doctor-actions">
              <button className="book-btn">Book Appointment</button>
              <button className="view-btn">View Profile</button>
            </div>
          </div>
        ))}
      </div>

      {selectedDoctor && (
        <div className="doctor-modal" onClick={() => setSelectedDoctor(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Dr. {selectedDoctor.name}</h2>
              <button className="close-btn" onClick={() => setSelectedDoctor(null)}>×</button>
            </div>
            
            <div className="doctor-profile">
              <div className="profile-avatar">
                {selectedDoctor.name.charAt(0)}
              </div>
              
              <div className="profile-info">
                <h3>{selectedDoctor.specialization}</h3>
                <p><strong>License Number:</strong> {selectedDoctor.licenseNumber}</p>
                <p><strong>Email:</strong> {selectedDoctor.email}</p>
                <p><strong>Phone:</strong> {selectedDoctor.phone || 'Not provided'}</p>
                <p><strong>Distance:</strong> {selectedDoctor.distance.toFixed(1)} km away</p>
                <p><strong>Rating:</strong> ⭐⭐⭐⭐⭐ (4.8/5 from 127 reviews)</p>
              </div>
            </div>

            <div className="doctor-bio">
              <h4>About Dr. {selectedDoctor.name}</h4>
              <p>
                Dr. {selectedDoctor.name} is a highly experienced {selectedDoctor.specialization} 
                with expertise in providing comprehensive healthcare services. With years of clinical 
                experience and a commitment to patient-centered care, Dr. {selectedDoctor.name} 
                specializes in diagnosing and treating a wide range of medical conditions.
              </p>
            </div>

            <div className="doctor-education">
              <h4>Education & Training</h4>
              <ul>
                <li>MD from Harvard Medical School</li>
                <li>Residency at Johns Hopkins Hospital</li>
                <li>Board Certified in {selectedDoctor.specialization}</li>
                <li>15+ years of clinical experience</li>
              </ul>
            </div>

            <div className="doctor-specialties">
              <h4>Areas of Expertise</h4>
              <div className="specialties-tags">
                <span>General Consultation</span>
                <span>Preventive Care</span>
                <span>Chronic Disease Management</span>
                <span>Emergency Medicine</span>
                <span>Telemedicine</span>
              </div>
            </div>

            <div className="doctor-availability">
              <h4>Available Times</h4>
              <div className="availability-grid">
                <div className="day-slot">
                  <strong>Monday:</strong> 9:00 AM - 6:00 PM
                </div>
                <div className="day-slot">
                  <strong>Tuesday:</strong> 9:00 AM - 6:00 PM
                </div>
                <div className="day-slot">
                  <strong>Wednesday:</strong> 9:00 AM - 6:00 PM
                </div>
                <div className="day-slot">
                  <strong>Thursday:</strong> 9:00 AM - 6:00 PM
                </div>
                <div className="day-slot">
                  <strong>Friday:</strong> 9:00 AM - 6:00 PM
                </div>
                <div className="day-slot">
                  <strong>Saturday:</strong> 10:00 AM - 2:00 PM
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="book-appointment-btn">Book Appointment</button>
              <button className="video-consult-btn">Video Consultation</button>
              <button className="call-btn">Call Clinic</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorFinder;
