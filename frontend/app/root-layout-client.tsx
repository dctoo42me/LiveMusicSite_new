// frontend/app/root-layout-client.tsx
'use client';

import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ColorModeProvider } from './contexts/ColorModeContext';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import TopBar from './components/TopBar';
import Link from 'next/link';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const appBarHeight = theme.mixins.toolbar.minHeight || 56;
  const topBarHeight = 32;

  return (
    <>
      <CssBaseline />
      <TopBar />
      <Header />
      <Box component="main" sx={{ 
        pt: `${topBarHeight + (appBarHeight as number) + theme.spacing(3)}px`,
        bgcolor: 'background.default',
        minHeight: 'calc(100vh - 150px)', // Leave space for footer
        transition: 'background-color 0.3s ease'
      }}>
        {children}
      </Box>
      
      {/* Platform Footer */}
      <Box component="footer" sx={{ 
        py: 4, 
        px: 2, 
        mt: 'auto', 
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Forks & Feedback. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Link href="/about" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography variant="body2" color="text.secondary" sx={{ '&:hover': { color: 'primary.main' } }}>About</Typography>
              </Link>
              <Link href="/support" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography variant="body2" color="text.secondary" sx={{ '&:hover': { color: 'primary.main' } }}>Support</Typography>
              </Link>
              <Link href="/privacy" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography variant="body2" color="text.secondary" sx={{ '&:hover': { color: 'primary.main' } }}>Privacy</Typography>
              </Link>
              <Link href="/terms" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography variant="body2" color="text.secondary" sx={{ '&:hover': { color: 'primary.main' } }}>Terms</Typography>
              </Link>
              <a href="mailto:support@forksandfeedback.com" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography variant="body2" color="text.secondary" sx={{ '&:hover': { color: 'primary.main' } }}>Contact</Typography>
              </a>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ColorModeProvider>
        <ToastProvider>
          <AuthProvider>
            <RootLayoutContent>
              {children}
            </RootLayoutContent>
          </AuthProvider>
        </ToastProvider>
      </ColorModeProvider>
    </ErrorBoundary>
  );
}
