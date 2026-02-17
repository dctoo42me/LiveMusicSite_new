// frontend/app/profile/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getUserProfile, updateUserProfile } from '@/services/api';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Divider,
  Stack,
  Switch,
  FormControlLabel
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ImageUpload from '@/app/components/ImageUpload';

export default function ProfilePage() {
  const { token, user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    avatarUrl: '',
    bio: '',
    marketingOptIn: false
  });

  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(token);
        setProfile({
          username: data.username,
          email: data.email,
          avatarUrl: data.avatarUrl || '',
          bio: data.bio || '',
          marketingOptIn: data.marketingOptIn || false
        });
      } catch (err) {
        showToast('Failed to load profile details.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, showToast]);

  const handleUpdate = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await updateUserProfile(token, {
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        marketingOptIn: profile.marketingOptIn
      });
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
          <PersonIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h4" fontWeight="bold">My Profile</Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar
              src={profile.avatarUrl}
              sx={{ width: 150, height: 150, mb: 2, border: '4px solid', borderColor: 'primary.main', boxShadow: 2 }}
            >
              {!profile.avatarUrl && profile.username[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="h6" fontWeight="bold">{profile.username}</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>{profile.email}</Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
                  Profile Picture
                </Typography>
                <ImageUpload 
                  type="avatar" 
                  token={token!} 
                  label="Change Avatar"
                  onUploadSuccess={(url) => setProfile({ ...profile, avatarUrl: url })} 
                  fullWidth
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
                  Short Bio
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Tell us about your taste in food and music..."
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  variant="outlined"
                />
              </Box>

              <Divider />

              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <NotificationsIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight="bold">Newsletter Preferences</Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={profile.marketingOptIn} 
                      onChange={(e) => setProfile({ ...profile, marketingOptIn: e.target.checked })} 
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Receive weekly highlights, new venue alerts, and platform updates.
                    </Typography>
                  }
                />
              </Box>

              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleUpdate}
                disabled={saving}
                sx={{ py: 1.2, fontWeight: 'bold' }}
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
