'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert, { AlertColor } from '@mui/material/Alert';

interface ToastContextType {
  showToast: (message: string, severity: AlertColor) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');

  const showToast = useCallback((message: string, severity: AlertColor) => {
    setMessage(message);
    setSeverity(severity);
    setOpen(true);
  }, []);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={3000} // Set duration to 3 seconds
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }} // Top-left position
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          variant="filled" // Use filled variant for more prominence
          elevation={6} // Add elevation for a "pop" effect
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

