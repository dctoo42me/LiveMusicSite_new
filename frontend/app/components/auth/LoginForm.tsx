// frontend/app/components/auth/LoginForm.tsx
'use client';

import React, { useState } from 'react'; // Explicitly import React
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { post } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
// ADD MATERIAL UI IMPORTS
import {
  Box,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Stack, // For vertical spacing
} from '@mui/material';

export default function LoginForm() {
  const [email, setEmail] = useState('');
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
      const data = await post('/auth/login', { email, password }, token);
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
    <Box
      component="form"
      onSubmit={handleSubmit}
      method="post"
      sx={{
        p: 4,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 3,
        maxWidth: 400,
        mx: 'auto', // Center the form horizontally
        my: 5, // Margin top/bottom
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
        Login
      </Typography>
      <Stack spacing={3} mt={3}> {/* For vertical spacing */}
        <TextField
          label="Email"
          id="login-email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          variant="outlined"
          autoComplete="email"
        />
        <TextField
          label="Password"
          type="password"
          id="login-password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          variant="outlined"
          autoComplete="current-password"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={isLoading}
          sx={{ height: 56 }} // Consistent height with TextFields
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Sign In'
          )}
        </Button>
      </Stack>
    </Box>
  );
}