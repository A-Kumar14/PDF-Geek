import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = '#007bff' }) => {
  const sizeMap = {
    small: '16px',
    medium: '24px',
    large: '32px'
  };

  const spinnerSize = sizeMap[size] || sizeMap.medium;

  return (
    <div style={{
      display: 'inline-block',
      width: spinnerSize,
      height: spinnerSize,
      border: `2px solid #f3f3f3`,
      borderTop: `2px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
  );
};

export default LoadingSpinner;
