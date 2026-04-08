import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DocumentUpload from './DocumentUpload';
import './Auth.css';

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromSignIn = Boolean(location.state?.fromSignIn);
  const [playSwap, setPlaySwap] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    // Doctor fields
    specialization: '',
    licenseNumber: '',
    country: 'IN',
    city: '',
    clinicAddress: '',
    // Patient fields
    age: '',
    gender: '',
    phone: '',
    address: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...dataToSend } = formData;
      
      const response = await axios.post('/api/auth/signup', dataToSend);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        if (formData.role === 'doctor') {
          // Show document upload step for doctors
          setRegisteredUser(response.data.user);
          setShowDocumentUpload(true);
        } else {
          // Direct navigation for non-doctors
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    if (!fromSignIn) return;
    const rafId = requestAnimationFrame(() => setPlaySwap(true));
    return () => cancelAnimationFrame(rafId);
  }, [fromSignIn]);

  return (
    <div className={`auth-page auth-shell auth-shell-signup${fromSignIn ? ' auth-shell-swap-prepare' : ''}${playSwap ? ' auth-shell-swap-active' : ''}`}>
      {showDocumentUpload ? (
        <section className="auth-form-panel">
          <div className="auth-form-wrap auth-form-wrap-wide">
            <p className="auth-panel-brand">
              <span className="auth-panel-brand-mark" aria-hidden="true">✦</span>
              <span>Hippocrates Lab</span>
            </p>
            <div className="auth-header">
              <h1>Doctor Verification</h1>
              <p>Upload your documents for verification</p>
            </div>
            <DocumentUpload onUploadComplete={handleUploadComplete} />
          </div>
        </section>
      ) : (
        <>
          <section className="auth-visual-panel">
            <div className="auth-visual-image" />
            <div className="auth-visual-card">
              <h2>
                A sanctuary for <span className="auth-accent-script">clinical</span>{' '}
                <span className="auth-accent-strong">excellence.</span>
              </h2>
              <p className="auth-visual-lede">
              Enter a space designed for clarity, serenity, and precision in healthcare management.
                <br/>
                Manage your clinical operations with ease.
                <br/>
                Track your patients, appointments, and more.
                <br/>
                And much more!
              </p>
              <div className="auth-visual-crew" aria-hidden="true">
                <div className="auth-crew-avatars">
                  <span className="auth-crew-avatar auth-crew-avatar-1" />
                  <span className="auth-crew-avatar auth-crew-avatar-2" />
                  <span className="auth-crew-avatar auth-crew-avatar-more">+12</span>
                </div>
                <div className="auth-crew-copy">
                  <strong>Joined by experts</strong>
                  <span>Clinical staff</span>
                </div>
              </div>
            </div>
          </section>

          <section className="auth-form-panel">
            <div className="auth-form-wrap auth-form-wrap-wide">
              <p className="auth-panel-brand">
                <span className="auth-panel-brand-mark" aria-hidden="true">✦</span>
                <span>Hippocrates Lab</span>
              </p>
              <div className="auth-header">
                <h1>Create Account</h1>
                <p>Join our Hospital Management System</p>
              </div>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleSubmit} className="auth-form auth-form-sections">
                <div className="auth-sections">
                  <div className="auth-section">
                    <h3>Account</h3>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email"
                      />
                    </div>

                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="Enter password (min 6 characters)"
                      />
                    </div>

                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>

                  <div className="auth-section">
                    <h3>Role</h3>
                    <div className="form-group">
                      <label>I am a</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        className="role-select"
                      >
                        <option value="patient">Patient</option>
                        <option value="doctor">Doctor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {formData.role === 'doctor' && (
                      <>
                        <div className="form-group">
                          <label>Specialization</label>
                          <input
                            type="text"
                            name="specialization"
                            value={formData.specialization}
                            onChange={handleChange}
                            placeholder="e.g., Cardiology, Neurology"
                          />
                        </div>
                        <div className="form-group">
                          <label>License Number</label>
                          <input
                            type="text"
                            name="licenseNumber"
                            value={formData.licenseNumber}
                            onChange={handleChange}
                            placeholder="Enter license number"
                          />
                        </div>
                        <div className="form-group">
                          <label>Country</label>
                          <select
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            required
                            className="role-select"
                          >
                            <option value="IN">India</option>
                            <option value="US">United States</option>
                            <option value="UK">United Kingdom</option>
                            <option value="CA">Canada</option>
                            <option value="AU">Australia</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>City</label>
                          <select
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            required
                            className="role-select"
                          >
                            <option value="">Select your city</option>
                            {formData.country === 'IN' && (
                              <>
                                <option value="Nadiad">Nadiad</option>
                                <option value="Ahmedabad">Ahmedabad</option>
                                <option value="Vadodara">Vadodara</option>
                                <option value="Surat">Surat</option>
                                <option value="Rajkot">Rajkot</option>
                                <option value="Gandhinagar">Gandhinagar</option>
                                <option value="Bhavnagar">Bhavnagar</option>
                                <option value="Jamnagar">Jamnagar</option>
                                <option value="Junagadh">Junagadh</option>
                                <option value="Gandhidham">Gandhidham</option>
                                <option value="Anand">Anand</option>
                                <option value="Mumbai">Mumbai</option>
                                <option value="Delhi">Delhi</option>
                                <option value="Bangalore">Bangalore</option>
                                <option value="Chennai">Chennai</option>
                                <option value="Kolkata">Kolkata</option>
                                <option value="Hyderabad">Hyderabad</option>
                                <option value="Pune">Pune</option>
                              </>
                            )}
                            {formData.country === 'US' && (
                              <>
                                <option value="New York">New York</option>
                                <option value="Los Angeles">Los Angeles</option>
                                <option value="Chicago">Chicago</option>
                                <option value="Houston">Houston</option>
                                <option value="Phoenix">Phoenix</option>
                                <option value="Philadelphia">Philadelphia</option>
                                <option value="San Antonio">San Antonio</option>
                                <option value="San Diego">San Diego</option>
                                <option value="Dallas">Dallas</option>
                                <option value="San Jose">San Jose</option>
                              </>
                            )}
                            {formData.country === 'UK' && (
                              <>
                                <option value="London">London</option>
                                <option value="Manchester">Manchester</option>
                                <option value="Birmingham">Birmingham</option>
                                <option value="Leeds">Leeds</option>
                                <option value="Glasgow">Glasgow</option>
                                <option value="Sheffield">Sheffield</option>
                                <option value="Bradford">Bradford</option>
                                <option value="Liverpool">Liverpool</option>
                                <option value="Edinburgh">Edinburgh</option>
                                <option value="Bristol">Bristol</option>
                              </>
                            )}
                            {formData.country === 'CA' && (
                              <>
                                <option value="Toronto">Toronto</option>
                                <option value="Montreal">Montreal</option>
                                <option value="Vancouver">Vancouver</option>
                                <option value="Calgary">Calgary</option>
                                <option value="Edmonton">Edmonton</option>
                                <option value="Ottawa">Ottawa</option>
                                <option value="Winnipeg">Winnipeg</option>
                                <option value="Quebec City">Quebec City</option>
                                <option value="Hamilton">Hamilton</option>
                                <option value="Halifax">Halifax</option>
                              </>
                            )}
                            {formData.country === 'AU' && (
                              <>
                                <option value="Sydney">Sydney</option>
                                <option value="Melbourne">Melbourne</option>
                                <option value="Brisbane">Brisbane</option>
                                <option value="Perth">Perth</option>
                                <option value="Adelaide">Adelaide</option>
                                <option value="Gold Coast">Gold Coast</option>
                                <option value="Canberra">Canberra</option>
                                <option value="Newcastle">Newcastle</option>
                                <option value="Wollongong">Wollongong</option>
                                <option value="Logan City">Logan City</option>
                              </>
                            )}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Clinic Address</label>
                          <textarea
                            name="clinicAddress"
                            value={formData.clinicAddress}
                            onChange={handleChange}
                            placeholder="Enter your clinic address"
                            rows="3"
                            required
                          />
                        </div>
                      </>
                    )}

                    {formData.role !== 'doctor' && (
                      <p className="auth-section-note">No additional role details required.</p>
                    )}
                  </div>

                  <div className="auth-section">
                    <h3>Details</h3>
                    {formData.role === 'patient' ? (
                      <>
                        <div className="form-group">
                          <label>Age</label>
                          <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            placeholder="Enter your age"
                            min="1"
                            max="120"
                          />
                        </div>
                        <div className="form-group">
                          <label>Gender</label>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="role-select"
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Phone</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter your phone number"
                          />
                        </div>
                        <div className="form-group">
                          <label>Address</label>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter your address"
                          />
                        </div>
                      </>
                    ) : (
                      <p className="auth-section-note">No additional details required.</p>
                    )}
                  </div>
                </div>

                <button type="submit" className="auth-button" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>

              <div className="auth-footer">
                <p>Already have an account? <Link to="/signin" state={{ fromSignUp: true }}>Sign In</Link></p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default SignUp;

