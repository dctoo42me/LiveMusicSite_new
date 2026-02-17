'use client'; // Mark as client component, as LoginForm is client component

import LoginForm from '../components/auth/LoginForm';
import Box from '@mui/material/Box'; // ADD THIS IMPORT
import Typography from '@mui/material/Typography'; // ADD THIS IMPORT

export default function LoginPage() {

  return (

    <Box sx={{ py: 4 }}>

      <LoginForm />

    </Box>

  );

}
