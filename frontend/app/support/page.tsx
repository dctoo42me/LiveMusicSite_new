// frontend/app/support/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { submitSupportTicket } from '@/services/api';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import SendIcon from '@mui/icons-material/Send';
import Link from 'next/link';

export default function SupportPage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // Pre-fill user info if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.username,
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      showToast('Please fill in all fields.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await submitSupportTicket(formData, token || undefined);
      showToast('Support ticket submitted successfully! Our team will review it.', 'success');
      setFormData({
        ...formData,
        subject: '',
        message: ''
      });
    } catch (err) {
      showToast('Failed to submit support ticket.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} href="/" color="inherit">Home</MuiLink>
        <Typography color="text.primary">Support</Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
          <HelpIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h4" fontWeight="bold">How can we help?</Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Reporting a bug? Suggesting a new feature? Or just have a question about your venue claim? 
          Send us a message and we&apos;ll get back to you as soon as possible.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                fullWidth
                label="Your Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Box>
            <TextField
              fullWidth
              label="Subject"
              placeholder="e.g. Issue with venue image upload"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Message"
              placeholder="Please provide as much detail as possible..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              disabled={submitting}
              sx={{ py: 1.5, fontWeight: 'bold' }}
            >
              {submitting ? 'Sending...' : 'Submit Request'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
