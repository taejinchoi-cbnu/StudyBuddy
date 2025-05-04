import React from 'react';
import logoBook from '../assets/logoBook.png';
import '../styles/LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-overlay">
      <img src={logoBook} alt="Loading..." className="loading-logo" />
    </div>
  );
};

export default LoadingSpinner;