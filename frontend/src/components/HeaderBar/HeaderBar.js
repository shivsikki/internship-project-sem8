import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './HeaderBar.css';

const HeaderBar = ({ isSidebarCollapsed }) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const sidebarWidth = isDashboard ? (isSidebarCollapsed ? '72px' : '248px') : '0px';

  return (
    <header className="global-header-bar" style={{ left: sidebarWidth, width: `calc(100% - ${sidebarWidth})` }}>
      <div className="header-left">
        <Link to="/dashboard" className="header-brand">
          <div className="header-logo">+</div>
          <div className="header-brand-text">
            <span className="header-title">Hippocrates</span>
            <span className="header-subtitle">Lab</span>
          </div>
        </Link>
      </div>

      <div className="header-center">
        <div className="dashboard-top-search">
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Search records, appointments..." />
          </div>
        </div>
      </div>

      <div className="header-right">
        <nav className="header-nav">
          <Link to="/contact" className="header-nav-link">Contact Us</Link>
          <Link to="/about" className="header-nav-link">About Us</Link>
          <Link to="/services" className="header-nav-link">Our Services</Link>
        </nav>
      </div>
    </header>
  );
};

export default HeaderBar;
