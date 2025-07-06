// user-client/src/components/Toast.jsx
import React from 'react';
import { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type, onClose }) => {
    if (!message) return null;

    const toastClass = type === 'success' ? 'toast-success' : 'toast-error';

    // Auto-hide after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [message, onClose]);


    return (
        <div className={`toast-container ${toastClass}`}>
            <span>{message}</span>
            <button onClick={onClose} className="toast-close-button">&times;</button>
        </div>
    );
};

export default Toast;