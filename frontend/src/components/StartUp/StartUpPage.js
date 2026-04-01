import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './StartUpPage.css';

const StartUpPage = () => {
  useEffect(() => {
    const elements = document.querySelectorAll('.startup-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.18 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="startup-page">
      <header className="startup-nav">
        <Link to="/" className="startup-logo">
          <span className="startup-logo-mark" aria-hidden="true">✦</span>
          <span>Hippocrates Lab</span>
        </Link>
        <div className="startup-nav-actions">
          <Link to="/signin" className="startup-nav-btn startup-nav-btn-ghost">Sign In</Link>
          <Link to="/signup" className="startup-nav-btn startup-nav-btn-solid">Sign Up</Link>
        </div>
      </header>

      <main className="startup-content">
        <section className="startup-hero startup-reveal">
          <div className="startup-hero-copy">
            <p className="startup-kicker">Modern care platform</p>
            <h1>Healthcare workflows, beautifully organized.</h1>
            <p>
              Manage appointments, prescriptions, tests, emergency support, and payments in one calm,
              interactive system designed for patients, doctors, and admins.
            </p>
            <div className="startup-hero-cta">
              <Link to="/signup" className="startup-cta startup-cta-primary">Start Free</Link>
              <Link to="/signin" className="startup-cta startup-cta-secondary">Open Dashboard</Link>
            </div>
          </div>
          <div className="startup-hero-media">
            <img src="/images/photo12.png" alt="Hippocrates dashboard visual" />
          </div>
        </section>

        <section className="startup-grid startup-reveal">
          <article className="startup-card">
            <img src="/images/photo4.png" alt="Appointments view preview" />
            <h3>Appointments</h3>
            <p>Book and track visits with reminders and status updates.</p>
          </article>
          <article className="startup-card">
            <img src="/images/photo8.png" alt="Tests and records preview" />
            <h3>Tests & Reports</h3>
            <p>Keep lab reports, trends, and records easy to review.</p>
          </article>
          <article className="startup-card">
            <img src="/images/photo10.png" alt="Prescriptions and medicines preview" />
            <h3>Prescriptions</h3>
            <p>Organize medicines and dosage instructions in one place.</p>
          </article>
        </section>

        <section className="startup-showcase startup-reveal">
          <div className="startup-showcase-copy">
            <p className="startup-kicker">Interactive and smooth</p>
            <h2>Built to feel fast while handling serious workflows.</h2>
            <p>
              Every screen is designed with clarity-first layouts and micro-animations so users can
              move quickly without confusion.
            </p>
          </div>
          <div className="startup-showcase-stack">
            <img src="/images/photo5.png" alt="Feature screenshot one" className="startup-shot startup-shot-a" />
            <img src="/images/photo7.png" alt="Feature screenshot two" className="startup-shot startup-shot-b" />
          </div>
        </section>

        <section className="startup-footer-cta startup-reveal">
          <h2>Ready to launch your care workspace?</h2>
          <p>Create your account and experience the full Hippocrates Lab flow.</p>
          <div className="startup-hero-cta">
            <Link to="/signup" className="startup-cta startup-cta-primary">Create Account</Link>
            <Link to="/signin" className="startup-cta startup-cta-secondary">Sign In</Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StartUpPage;
