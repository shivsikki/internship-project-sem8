import React, { useEffect, useState } from "react";
import "./Meteors.css";

export const Meteors = ({ number = 20 }) => {
  const [meteors, setMeteors] = useState([]);

  useEffect(() => {
    // Generate crosses uniformly across viewport
    const meteorArr = new Array(number).fill(true).map(() => {
      const duration = Math.floor(Math.random() * (50 - 25) + 25);
      return {
        id: Math.random().toString(36).substring(7),
        left: Math.random() * 100 + "vw",
        animationDelay: "-" + (Math.random() * duration) + "s",
        animationDuration: duration + "s",
        size: Math.floor(Math.random() * (70 - 25) + 25), 
        opacity: Math.random() * (0.6 - 0.1) + 0.1
      };
    });
    setMeteors(meteorArr);
  }, [number]);

  return (
    <div className="meteors-container">
      {meteors.map((meteor) => (
        <div
          key={meteor.id}
          className="hospital-cross"
          style={{
            left: meteor.left,
            animationDelay: meteor.animationDelay,
            animationDuration: meteor.animationDuration,
            opacity: meteor.opacity,
            width: meteor.size + 'px',
            height: meteor.size + 'px'
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2H14V10H22V14H14V22H10V14H2V10H10V2Z" />
          </svg>
        </div>
      ))}
    </div>
  );
};

export default Meteors;
