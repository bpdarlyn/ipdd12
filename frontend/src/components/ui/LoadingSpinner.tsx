import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  overlay?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  message = 'Loading...',
  overlay = false,
  className = ''
}) => {
  const containerClass = `loading-container ${overlay ? 'loading-overlay' : ''} ${className}`.trim();

  return (
    <div className={containerClass}>
      <div className="loading-content">
        <div className={`loading-spinner ${size}`}></div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;