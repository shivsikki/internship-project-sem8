import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    satisfaction: 0
  });

  const testimonials = [
    {
      name: 'John Anderson',
      role: 'Patient',
      image: '/images/patients/patient1.jpg',
      text: 'The AI health recommendations helped me manage my diabetes better. My blood sugar levels have never been more stable!',
      rating: 5
    },
    {
      name: 'Maria Garcia',
      role: 'Patient',
      image: '/images/patients/patient2.jpg',
      text: 'The video consultation feature saved me a trip to the hospital. Dr. Chen was amazing and the technology worked perfectly.',
      rating: 5
    },
    {
      name: 'Dr. Sarah Chen MD',
      role: 'Cardiologist',
      image: '/images/doctors/doctor1.jpg',
      text: 'This platform revolutionizes how we deliver healthcare. The AI tools help me provide better, faster care to my patients.',
      rating: 5
    }
  ];

  const services = [
    {
      icon: '🏥',
      title: 'Telemedicine',
      description: 'Connect with top doctors through secure video consultations from anywhere.',
      features: ['HD Video Calls', 'Screen Sharing', 'Recording', 'Chat Integration']
    },
    {
      icon: '🤖',
      title: 'AI Health Assistant',
      description: 'Get instant medical guidance with our advanced AI-powered health assistant.',
      features: ['Symptom Analysis', 'Medicine Info', 'Health Analytics', 'Emergency Detection']
    },
    {
      icon: '📊',
      title: 'Health Dashboard',
      description: 'Monitor your health in real-time with comprehensive analytics and insights.',
      features: ['Real-time Vitals', 'Health Score', 'Risk Assessment', 'Trend Analysis']
    },
    {
      icon: '💡',
      title: 'Personal Wellness',
      description: 'Receive personalized health recommendations and wellness coaching.',
      features: ['Custom Plans', 'Progress Tracking', 'Goal Setting', 'Health Insights']
    },
    {
      icon: '📱',
      title: 'Mobile Healthcare',
      description: 'Access all healthcare services on your mobile device with our app-like experience.',
      features: ['Responsive Design', 'Touch Optimized', 'Real-time Updates', 'Secure Access']
    },
    {
      icon: '🔔',
      title: 'Smart Notifications',
      description: 'Stay on top of your health with intelligent reminders and alerts.',
      features: ['Medication Reminders', 'Appointment Alerts', 'Health Tips', 'Emergency Alerts']
    }
  ];

  const specialties = [
    { name: 'Cardiology', doctors: 12, description: 'Heart and cardiovascular care' },
    { name: 'Neurology', doctors: 8, description: 'Brain and nervous system disorders' },
    { name: 'Orthopedics', doctors: 10, description: 'Bone and joint health' },
    { name: 'Family Medicine', doctors: 15, description: 'Comprehensive healthcare for all ages' },
    { name: 'Pediatrics', doctors: 6, description: 'Children\'s health and development' },
    { name: 'Mental Health', doctors: 7, description: 'Psychological and emotional wellness' }
  ];

  useEffect(() => {
    // Animate stats
    const targetStats = {
      patients: 15420,
      doctors: 58,
      appointments: 8947,
      satisfaction: 98
    };

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setStats({
        patients: Math.floor(targetStats.patients * progress),
        doctors: Math.floor(targetStats.doctors * progress),
        appointments: Math.floor(targetStats.appointments * progress),
        satisfaction: Math.floor(targetStats.satisfaction * progress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const testimonialTimer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(testimonialTimer);
  }, []);

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/signin');
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Next-Generation Healthcare Powered by AI
            </h1>
            <p className="hero-subtitle">
              Experience the future of medicine with our intelligent hospital management system. 
              Connect with top doctors, get AI-powered health insights, and manage your wellness journey.
            </p>
            <div className="hero-actions">
              <button onClick={handleGetStarted} className="btn-primary">
                Get Started Now
              </button>
              <button onClick={handleLogin} className="btn-secondary">
                Sign In
              </button>
            </div>
            <div className="hero-trust">
              <div className="trust-item">
                <span className="trust-icon">🏆</span>
                <span className="trust-text">AI-Powered</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🔒</span>
                <span className="trust-text">HIPAA Compliant</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">⭐</span>
                <span className="trust-text">4.9 Rating</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-dashboard">
              <div className="dashboard-header">
                <div className="dashboard-nav">
                  <div className="nav-item active">Dashboard</div>
                  <div className="nav-item">AI Assistant</div>
                  <div className="nav-item">Health</div>
                </div>
              </div>
              <div className="dashboard-content">
                <div className="health-metrics">
                  <div className="metric-card">
                    <div className="metric-value">72</div>
                    <div className="metric-label">Heart Rate</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-value">120/80</div>
                    <div className="metric-label">Blood Pressure</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-value">98%</div>
                    <div className="metric-label">Oxygen</div>
                  </div>
                </div>
                <div className="ai-chat">
                  <div className="chat-message ai">
                    🤖 Your health score is excellent! Keep up the great work.
                  </div>
                  <div className="chat-message user">
                    📊 Show me my weekly health trends
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{stats.patients.toLocaleString()}+</div>
              <div className="stat-label">Happy Patients</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.doctors}+</div>
              <div className="stat-label">Expert Doctors</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.appointments.toLocaleString()}+</div>
              <div className="stat-label">Consultations</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.satisfaction}%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section">
        <div className="container">
          <div className="section-header">
            <h2>Comprehensive Healthcare Solutions</h2>
            <p>Everything you need for optimal health management in one intelligent platform</p>
          </div>
          <div className="services-grid">
            {services.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <ul className="service-features">
                  {service.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className="specialties-section">
        <div className="container">
          <div className="section-header">
            <h2>Expert Medical Specialties</h2>
            <p>Connect with specialists across all major medical fields</p>
          </div>
          <div className="specialties-grid">
            {specialties.map((specialty, index) => (
              <div key={index} className="specialty-card">
                <div className="specialty-header">
                  <h3>{specialty.name}</h3>
                  <span className="doctor-count">{specialty.doctors} doctors</span>
                </div>
                <p>{specialty.description}</p>
                <button className="specialty-btn">Book Consultation</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="ai-features-section">
        <div className="container">
          <div className="section-header">
            <h2>🤖 AI-Powered Healthcare</h2>
            <p>Experience the future of medicine with our advanced artificial intelligence</p>
          </div>
          <div className="ai-features-grid">
            <div className="ai-feature">
              <div className="ai-icon">🩺</div>
              <h3>Symptom Checker</h3>
              <p>Get instant AI analysis of your symptoms with medical-grade accuracy</p>
            </div>
            <div className="ai-feature">
              <div className="ai-icon">💊</div>
              <h3>Medicine Information</h3>
              <p>Comprehensive drug information, interactions, and alternatives</p>
            </div>
            <div className="ai-feature">
              <div className="ai-icon">📊</div>
              <h3>Health Analytics</h3>
              <p>Deep insights into your health patterns and predictive analytics</p>
            </div>
            <div className="ai-feature">
              <div className="ai-icon">💡</div>
              <h3>Personalized Recommendations</h3>
              <p>AI-generated wellness plans tailored to your unique health profile</p>
            </div>
            <div className="ai-feature">
              <div className="ai-icon">🏥</div>
              <h3>Emergency Detection</h3>
              <p>Life-saving AI that detects medical emergencies in real-time</p>
            </div>
            <div className="ai-feature">
              <div className="ai-icon">📱</div>
              <h3>Voice Assistant</h3>
              <p>Hands-free health management with natural voice interactions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>What Our Patients Say</h2>
            <p>Real stories from people who transformed their health with our platform</p>
          </div>
          <div className="testimonial-container">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="testimonial-text">
                  "{testimonials[currentTestimonial].text}"
                </div>
                <div className="testimonial-rating">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <span key={i} className="star">⭐</span>
                  ))}
                </div>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">
                  <img src={testimonials[currentTestimonial].image} alt={testimonials[currentTestimonial].name} />
                </div>
                <div className="author-info">
                  <div className="author-name">{testimonials[currentTestimonial].name}</div>
                  <div className="author-role">{testimonials[currentTestimonial].role}</div>
                </div>
              </div>
            </div>
            <div className="testimonial-dots">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentTestimonial ? 'active' : ''}`}
                  onClick={() => setCurrentTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Start Your Health Journey Today</h2>
            <p>Join thousands of patients who are already experiencing the future of healthcare</p>
            <div className="cta-actions">
              <button onClick={handleGetStarted} className="btn-primary btn-large">
                Get Started Free
              </button>
              <button onClick={handleLogin} className="btn-secondary btn-large">
                Sign In to Your Account
              </button>
            </div>
            <div className="cta-features">
              <div className="cta-feature">
                <span className="feature-icon">✓</span>
                <span>No credit card required</span>
              </div>
              <div className="cta-feature">
                <span className="feature-icon">✓</span>
                <span>Free AI health assessment</span>
              </div>
              <div className="cta-feature">
                <span className="feature-icon">✓</span>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>MediCenter AI</h3>
              <p>The future of healthcare is here. Experience AI-powered medical care that puts you first.</p>
            </div>
            <div className="footer-section">
              <h4>Services</h4>
              <ul>
                <li>Telemedicine</li>
                <li>AI Health Assistant</li>
                <li>Health Dashboard</li>
                <li>Emergency Care</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <ul>
                <li>About Us</li>
                <li>Careers</li>
                <li>Press</li>
                <li>Contact</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <ul>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>HIPAA Compliance</li>
                <li>Security</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 MediCenter AI. All rights reserved. | Healthcare powered by Artificial Intelligence</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
