// frontend/app/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { logout as apiLogout } from '@/services/api'; // Import the new API logout function

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to load token from localStorage on initial render
    const storedToken = localStorage.getItem('jwt_token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []); // Run once on component mount

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('jwt_token', newToken); // Store token in localStorage
  };

  const logout = async () => { // Make it async
    if (token) {
      await apiLogout(token); // Call the backend logout API
    }
    setToken(null);
    localStorage.removeItem('jwt_token'); // Remove token from localStorage
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
