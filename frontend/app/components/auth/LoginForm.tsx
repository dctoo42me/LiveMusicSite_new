// frontend/app/components/auth/LoginForm.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { post } from '../../services/api';
import { useToast } from '../../contexts/ToastContext'; // Import useToast

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // New state variable
  const { login, token } = useAuth();
  const router = useRouter();
  const { showToast } = useToast(); // Initialize useToast

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setError(''); // No longer needed with toasts
    setIsLoading(true); // Set loading to true on submission

    try {
      const data = await post('/auth/login', { username, password }, token);
      if (data.token) {
        login(data.token);
        showToast('Login successful!', 'success'); // Show success toast
        router.push('/');
      } else {
        showToast(data.error || 'Login failed.', 'error'); // Show error toast
      }
    } catch (err) {
      showToast('An unexpected error occurred.', 'error'); // Show error toast
    } finally {
      setIsLoading(false); // Always set loading to false
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 bg-white rounded-lg shadow-xl max-w-md mx-auto my-10">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Login to Tune & Dine</h2>
      <div className="mb-4">
        <label htmlFor="login-username" className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <input
          type="text"
          id="login-username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
      </div>
      <div className="mb-6">
        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          id="login-password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>LOGGING IN...</span>
          </>
        ) : (
          <span>Login</span>
        )}
      </button>
    </form>
  );
}