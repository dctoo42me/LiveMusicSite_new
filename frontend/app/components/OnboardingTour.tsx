// frontend/app/components/OnboardingTour.tsx
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  MobileStepper,
  useTheme
} from '@mui/material';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/services/api';

const steps = [
  {
    label: 'Welcome to your Dashboard!',
    description: "This is where you manage your venues and performances. Let's take a quick look around.",
    icon: <DashboardIcon color="primary" sx={{ fontSize: 60 }} />,
  },
  {
    label: 'Add Performances',
    description: 'Use the "Event" button on any venue card to schedule live music or special dining events.',
    icon: <AddCircleIcon color="primary" sx={{ fontSize: 60 }} />,
  },
  {
    label: 'Manage Your Brand',
    description: 'The "Media" button lets you upload a stunning Hero image and manage your Spotlight Gallery.',
    icon: <PhotoCameraIcon color="primary" sx={{ fontSize: 60 }} />,
  },
  {
    label: 'Unlock More with Pro',
    description: 'Upgrade to the Pro tier for unlimited events, more gallery photos, and featured search placement.',
    icon: <WorkspacePremiumIcon color="secondary" sx={{ fontSize: 60 }} />,
  },
];

export default function OnboardingTour({ open, onComplete }: { open: boolean, onComplete: () => void }) {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const maxSteps = steps.length;
  const { token, login } = useAuth();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFinish = async () => {
    if (token) {
      try {
        // Mark onboarding as completed in DB
        const updatedUser = await updateUserProfile(token, { onboardingCompleted: true });
        // We might need a way to update the local context user object here
        // For now, we'll just close it
      } catch (err) {
        console.error('Failed to save onboarding state:', err);
      }
    }
    onComplete();
  };

  return (
    <Dialog open={open} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 2 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
        {steps[activeStep].icon}
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>
          {steps[activeStep].label}
        </DialogTitle>
      </Box>
      <DialogContent>
        <Typography variant="body1" textAlign="center" color="text.secondary">
          {steps[activeStep].description}
        </Typography>
      </DialogContent>
      <Box sx={{ px: 3, pb: 2 }}>
        <MobileStepper
          variant="dots"
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          sx={{ bgcolor: 'transparent', flexGrow: 1 }}
          nextButton={
            activeStep === maxSteps - 1 ? (
              <Button size="small" onClick={handleFinish} variant="contained" color="primary">
                Get Started
              </Button>
            ) : (
              <Button size="small" onClick={handleNext} disabled={activeStep === maxSteps - 1}>
                Next
                {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
              </Button>
            )
          }
          backButton={
            <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
              {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
              Back
            </Button>
          }
        />
      </Box>
    </Dialog>
  );
}
