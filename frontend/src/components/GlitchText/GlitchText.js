import React from 'react';
import './GlitchText.css';

const GlitchText = ({
  children,
  speed = 1.5,
  enableShadows = true,
  enableOnHover = false,
  className = ''
}) => {
  const inlineStyles = {
    '--after-duration': `${speed * 3}s`,
    '--before-duration': `${speed * 2}s`,
    '--after-shadow': enableShadows ? '-4px 0 #6b4a4a' : 'none',
    '--before-shadow': enableShadows ? '4px 0 #4a6b8a' : 'none'
  };

  const hoverClass = enableOnHover ? 'enable-on-hover' : '';

  return (
    <div
      className={`glitch ${hoverClass} ${className}`}
      style={inlineStyles}
      data-text={children}
    >
      {children}
    </div>
  );
};

export default GlitchText;
