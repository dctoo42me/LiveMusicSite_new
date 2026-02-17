// frontend/app/register/page.tsx
import RegisterForm from '../components/auth/RegisterForm';
import Box from '@mui/material/Box'; // ADD THIS IMPORT
import Typography from '@mui/material/Typography'; // ADD THIS IMPORT

export default function RegisterPage() {
  return (
    <Box sx={{ py: 4 }}>
      <RegisterForm />
    </Box>
  );
}
