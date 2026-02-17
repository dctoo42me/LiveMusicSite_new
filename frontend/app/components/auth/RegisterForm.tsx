// frontend/app/components/auth/RegisterForm.tsx
'use client';

import { useState } from 'react';
import { post } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext'; // Import useToast
import { useRouter } from 'next/navigation'; // Import useRouter
// ADD MATERIAL UI IMPORTS
import {
  Box,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Stack, // For vertical spacing
  Checkbox,
  FormControlLabel
} from '@mui/material';

export default function RegisterForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  // const [error, setError] = useState(''); // No longer needed with toasts
  // const [success, setSuccess] = useState(''); // No longer needed with toasts
  const [isLoading, setIsLoading] = useState(false); // New state variable
  const { token } = useAuth();
  const { showToast } = useToast(); // Initialize useToast
  const router = useRouter(); // Initialize useRouter

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setError(''); // No longer needed with toasts
    // setSuccess(''); // No longer needed with toasts
    setIsLoading(true); // Set loading to true on submission

    try {
      const data = await post('/auth/register', { username, email, password, marketingOptIn }, token);
      if (data.error) {
        showToast(data.error, 'error');
      } else {
        showToast(data.message, 'success');
        // Optionally clear form or redirect after success
        setUsername('');
        setEmail('');
        setPassword('');
        router.push('/login'); // Redirect to login page
      }
    } catch (err) {
      showToast('An unexpected error occurred.', 'error');
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
        Register
      </Typography>
      <Stack spacing={3} mt={3}> {/* For vertical spacing */}
        <TextField
          label="Username"
          id="register-username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          fullWidth
          variant="outlined"
          autoComplete="username"
        />
        <TextField
          label="Email"
          type="email"
          id="register-email"
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
          id="register-password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          variant="outlined"
          autoComplete="new-password"
        />
        <FormControlLabel
          control={
            <Checkbox 
              checked={marketingOptIn} 
              onChange={(e) => setMarketingOptIn(e.target.checked)} 
              color="primary" 
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              I want to receive weekly highlights, new venue alerts, and platform updates.
            </Typography>
          }
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
            'Create Account'
          )}
        </Button>
      </Stack>
    </Box>
  );
}
