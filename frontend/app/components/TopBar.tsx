// frontend/app/components/TopBar.tsx
'use client';

import { useAuth } from '../contexts/AuthContext';
import { useColorMode } from '../contexts/ColorModeContext';
import { Box, Typography, Container, IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export default function TopBar() {
  const { user } = useAuth();
  const { mode, toggleColorMode } = useColorMode();

  return (
    <Box sx={{ bgcolor: '#222222', py: 0.5 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
          {user && (
            <Typography variant="body2" sx={{ color: 'white' }}>
              Welcome, {user.username}
            </Typography>
          )}
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton onClick={toggleColorMode} color="inherit" size="small" sx={{ color: 'white' }}>
              {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Container>
    </Box>
  );
}
