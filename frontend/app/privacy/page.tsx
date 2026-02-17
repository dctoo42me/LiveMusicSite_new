// frontend/app/privacy/page.tsx
'use client';

import React from 'react';
import { Container, Typography, Paper, Box, Divider, Breadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} href="/" color="inherit">Home</MuiLink>
        <Typography color="text.primary">Privacy Policy</Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Privacy Policy</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Last Updated: February 13, 2026</Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>1. Information We Collect</Typography>
          <Typography variant="body1" paragraph>
            We collect information you provide directly to us, such as when you create an account, update your profile, or submit a support ticket. This includes your username, email address, and any profile images or bios you upload.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight="bold" gutterBottom>2. Use of Information</Typography>
          <Typography variant="body1" paragraph>
            We use your information to provide and improve our services, communicate with you, and personalize your experience. Your username and profile picture are displayed publicly alongside your reviews to build community trust.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight="bold" gutterBottom>3. Data Security</Typography>
          <Typography variant="body1" paragraph>
            We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight="bold" gutterBottom>4. Payments</Typography>
          <Typography variant="body1" paragraph>
            Payment processing is handled securely through Stripe. We do not store your credit card information on our servers.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight="bold" gutterBottom>5. Your Choices</Typography>
          <Typography variant="body1" paragraph>
            You can update your profile information at any time through your account settings. You may also contact support to request data deletion.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
