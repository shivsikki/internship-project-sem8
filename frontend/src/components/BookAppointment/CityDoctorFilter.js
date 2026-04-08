import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CityDoctorFilter = ({ onDoctorSelect }) => {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const countries = [
    { code: 'IN', name: 'India' },
    { code: 'US', name: 'United States' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' }
  ];

  const citiesByCountry = {
    'IN': [
      'Nadiad',
      'Ahmedabad',
      'Vadodara',
      'Surat',
      'Rajkot',
      'Gandhinagar',
      'Bhavnagar',
      'Jamnagar',
      'Junagadh',
      'Gandhidham',
      'Anand',
      'Mumbai',
      'Delhi',
      'Bangalore',
      'Chennai',
      'Kolkata',
      'Hyderabad',
      'Pune'
    ],
    'US': [
      'New York',
      'Los Angeles',
      'Chicago',
      'Houston',
      'Phoenix',
      'Philadelphia',
      'San Antonio',
      'San Diego',
      'Dallas',
      'San Jose'
    ],
    'UK': [
      'London',
      'Manchester',
      'Birmingham',
      'Leeds',
      'Glasgow',
      'Sheffield',
      'Bradford',
      'Liverpool',
      'Edinburgh',
      'Bristol'
    ],
    'CA': [
      'Toronto',
      'Montreal',
      'Vancouver',
      'Calgary',
      'Edmonton',
      'Ottawa',
      'Winnipeg',
      'Quebec City',
      'Hamilton',
      'Halifax'
    ],
    'AU': [
      'Sydney',
      'Melbourne',
      'Brisbane',
      'Perth',
      'Adelaide',
      'Gold Coast',
      'Canberra',
      'Newcastle',
      'Wollongong',
      'Logan City'
    ]
  };

  useEffect(() => {
    if (selectedCountry && selectedCity) {
      fetchDoctorsByLocation(selectedCountry, selectedCity);
    } else {
      setDoctors([]);
    }
  }, [selectedCountry, selectedCity]);

  const fetchDoctorsByLocation = async (country, city) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/users/doctors/location`, {
        params: { country, city },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setDoctors(response.data.doctors);
      }
    } catch (err) {
      setError('Failed to fetch doctors. Please try again.');
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (e) => {
    setSelectedCountry(e.target.value);
    setSelectedCity('');
  };

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
  };

  const handleDoctorClick = (doctor) => {
    if (onDoctorSelect) {
      onDoctorSelect(doctor);
    }
  };

  return (
    <div className="city-doctor-filter">
      <div className="filter-header">
        <h3>Find Doctors by Location</h3>
        <p>Select your country and city to find available doctors in your area</p>
      </div>

      <div className="location-selector">
        <div className="form-group">
          <label htmlFor="country-select">Country:</label>
          <select
            id="country-select"
            value={selectedCountry}
            onChange={handleCountryChange}
            className="location-dropdown"
          >
            <option value="">Select a country</option>
            {countries.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="city-select">City:</label>
          <select
            id="city-select"
            value={selectedCity}
            onChange={handleCityChange}
            className="location-dropdown"
            disabled={!selectedCountry}
          >
            <option value="">Select a city</option>
            {selectedCountry && citiesByCountry[selectedCountry]?.map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <p>Loading doctors...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {selectedCountry && selectedCity && !loading && !error && (
        <div className="doctors-list">
          <h4>Doctors in {selectedCity}, {countries.find(c => c.code === selectedCountry)?.name}</h4>
          {doctors.length === 0 ? (
            <div className="no-doctors">
              <p>No doctors found in {selectedCity}, {countries.find(c => c.code === selectedCountry)?.name}</p>
            </div>
          ) : (
            <div className="doctor-cards">
              {doctors.map(doctor => (
                <div 
                  key={doctor._id} 
                  className="doctor-card"
                  onClick={() => handleDoctorClick(doctor)}
                >
                  <div className="doctor-avatar">
                    {doctor.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="doctor-info">
                    <h5>Dr. {doctor.name}</h5>
                    <p className="specialization">{doctor.specialization}</p>
                    <p className="address">{doctor.clinicAddress}</p>
                    <p className="phone">📞 {doctor.phone}</p>
                    <div className="doctor-status">
                      <span className={`status-badge ${doctor.verificationStatus}`}>
                        {doctor.verificationStatus === 'verified' ? '✓ Verified' : doctor.verificationStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CityDoctorFilter;
