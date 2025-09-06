import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyle = () => {
    const baseStyle = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '1rem',
      borderRadius: '8px',
      color: 'white',
      zIndex: 1000,
      maxWidth: '400px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transition: 'opacity 0.3s ease-in-out',
      opacity: isVisible ? 1 : 0
    };

    const typeStyles = {
      success: { backgroundColor: '#28a745' },
      error: { backgroundColor: '#dc3545' },
      warning: { backgroundColor: '#ffc107', color: '#000' },
      info: { backgroundColor: '#17a2b8' }
    };

    return { ...baseStyle, ...typeStyles[type] };
  };

  if (!isVisible) return null;

  return (
    <div style={getToastStyle()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            if (onClose) onClose();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            fontSize: '1.2rem',
            cursor: 'pointer',
            marginLeft: '1rem'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
