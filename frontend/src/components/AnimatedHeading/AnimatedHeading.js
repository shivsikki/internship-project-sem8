import React from 'react';
import TextType from '../TextType/TextType';
import '../Dashboard/Dashboard.css';

const AnimatedHeading = ({ text }) => {
  return (
    <TextType
      as="h1"
      className="hero-title-simple artistic-heading"
      text={text}
      typingSpeed={70}
      deletingSpeed={40}
      pauseDuration={1600}
      variableSpeed={{ min: 40, max: 90 }}
      cursorCharacter="|"
    />
  );
};

export default AnimatedHeading;

