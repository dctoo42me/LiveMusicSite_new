// frontend/app/components/auth/RegisterForm.tsx
'use client';

import { useState } from 'react';
import { post } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext'; // Import useToast

export default function RegisterForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [error, setError] = useState(''); // No longer needed with toasts
  // const [success, setSuccess] = useState(''); // No longer needed with toasts
  const [isLoading, setIsLoading] = useState(false); // New state variable
  const { token } = useAuth();
  const { showToast } = useToast(); // Initialize useToast

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setError(''); // No longer needed with toasts
    // setSuccess(''); // No longer needed with toasts
    setIsLoading(true); // Set loading to true on submission

    try {
      const data = await post('/auth/register', { username, email, password }, token);
      if (data.error) {
        showToast(data.error, 'error');
      } else {
        showToast(data.message, 'success');
        // Optionally clear form or redirect after success
        setUsername('');
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsLoading(false); // Always set loading to false
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 bg-white rounded-lg shadow-xl max-w-md mx-auto my-10">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Register for Tune & Dine</h2>
      <div className="mb-4">
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autocomplete="username"
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autocomplete="email"
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
      </div>
      <div className="mb-6">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autocomplete="new-password"
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
            <span>REGISTERING...</span>
          </>
        ) : (
          <span>Register</span>
        )}
      </button>
    </form>
  );
}
