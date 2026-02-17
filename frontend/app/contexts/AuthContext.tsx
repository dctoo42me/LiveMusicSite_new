// frontend/app/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode'; // Correctly import jwtDecode
import { logout as apiLogout } from '@/services/api'; // Import the new API logout function
import { useRouter } from 'next/navigation'; // Import useRouter
import { useToast } from './ToastContext'; // Import useToast

interface User {
  userId: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'operator';
  onboardingCompleted: boolean;
  marketingOptIn: boolean;
  iat: number;
  exp: number;
}
interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string) => void;
  logout: (message?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter(); // Initialize useRouter
  const { showToast } = useToast(); // Initialize useToast

  useEffect(() => {
    // Attempt to load token from localStorage on initial render
    const storedToken = localStorage.getItem('jwt_token');
    if (storedToken) {
      setToken(storedToken);
      try {
        const decodedUser: User = jwtDecode(storedToken);
        const tokenExpMs = decodedUser.exp * 1000;
        const currentTimestampMs = Date.now();
        console.log('AuthContext: Token expiration (ms):', tokenExpMs); // Debugging
        console.log('AuthContext: Current timestamp (ms):', currentTimestampMs); // Debugging
        console.log('AuthContext: Time difference (ms, exp - current):', tokenExpMs - currentTimestampMs); // Debugging
        // Check if token is expired. If so, clear it.
        if (tokenExpMs < currentTimestampMs) {
          handleLogout('Your session has expired. Please log in again.'); // Pass message for expired token
        } else {
          setUser(decodedUser);
        }
      } catch (error) {
        console.error('Failed to decode stored token:', error);
        handleLogout('Your session is invalid. Please log in again.'); // Clear token if decoding fails
      }
    }
  }, []); // Re-run when token changes
  
  const handleLogout = useCallback(async (message?: string) => {
    if (token) {
      await apiLogout(token).catch(err => console.error("API Logout failed:", err)); // Still call API logout but catch errors
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwt_token'); // Remove token from localStorage
    showToast(message || 'Logged out successfully.', 'info'); // Show message
    router.push('/login'); // Redirect to login page
  }, [token, router, showToast]);

  const login = (newToken: string) => {
    setToken(newToken);
    const decodedUser: User = jwtDecode(newToken);
    setUser(decodedUser);
    localStorage.setItem('jwt_token', newToken); // Store token in localStorage
  };

  const logout = () => handleLogout(); // Expose the handler as `logout`

  return (
    <AuthContext.Provider value={{ token, user, login, logout: handleLogout }}>
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
