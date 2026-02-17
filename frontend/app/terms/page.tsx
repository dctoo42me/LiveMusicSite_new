// frontend/app/terms/page.tsx
'use client';

import React from 'react';
import { Container, Typography, Paper, Box, Divider, Breadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} href="/" color="inherit">Home</MuiLink>
        <Typography color="text.primary">Terms of Service</Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Terms of Service</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Last Updated: February 13, 2026</Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>1. Acceptance of Terms</Typography>
          <Typography variant="body1" paragraph>
            By accessing or using Forks & Feedback, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight="bold" gutterBottom>2. Use of the Service</Typography>
          <Typography variant="body1" paragraph>
            Forks & Feedback provides a platform for discovering live music and dining. We are not responsible for the accuracy of venue-provided data, event cancellations, or the quality of services provided by third-party venues.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight="bold" gutterBottom>3. User Content</Typography>
          <Typography variant="body1" paragraph>
            Users are responsible for the content they post, including reviews and images. Forks & Feedback reserves the right to remove any content that violates community standards or is deemed inappropriate.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight="bold" gutterBottom>4. Venue Ownership & Claims</Typography>
          <Typography variant="body1" paragraph>
            Venue claims are subject to administrative approval. Providing false information during the claim process may result in permanent suspension from the platform.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight="bold" gutterBottom>5. Limitation of Liability</Typography>
          <Typography variant="body1" paragraph>
            Forks & Feedback shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the service.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
