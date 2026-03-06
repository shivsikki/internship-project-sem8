import React, { useState, useEffect } from 'react';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const [theme, setTheme] = useState('light');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    setIsAnimating(true);
    
    setTimeout(() => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 150);
  };

  return (
    <button
      className={`theme-toggle ${isAnimating ? 'animating' : ''}`}
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <div className="theme-toggle-inner">
        <div className="theme-icon sun-icon">
          ☀️
        </div>
        <div className="theme-icon moon-icon">
          🌙
        </div>
      </div>
      <div className="theme-toggle-bg"></div>
    </button>
  );
};

export default ThemeToggle;
