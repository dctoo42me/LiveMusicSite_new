// frontend/app/manage/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { 
  getManagedVenues, 
  createVenueEvent, 
  getVenueImages, 
  updateVenueMainImage, 
  addVenueImage, 
  deleteVenueImage,
  createCheckoutSession,
  createPortalSession,
  getVenueMetrics 
} from '@/services/api';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  OutlinedInput,
  IconButton,
  Tooltip,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Divider
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import BusinessIcon from '@mui/icons-material/Business';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ImageIcon from '@mui/icons-material/Image';
import StarIcon from '@mui/icons-material/Star';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LanguageIcon from '@mui/icons-material/Language';
import MapIcon from '@mui/icons-material/Map';
import type { VenueDetails } from '@/types/venue-details';
import Image from 'next/image';
import ImageUpload from '@/app/components/ImageUpload';
import OnboardingTour from '@/app/components/OnboardingTour';

const PERFORMANCE_TAGS = [
  'Live Music', 'Jazz', 'Rock', 'Piano', 'Solo', 'Acoustic', 'Karaoke', 
  'Stand-up', 'Blues', 'Country', 'DJ', 'Open Mic', 'Trivia', 'Magician', 'Classical', 'Symphony', 'Quartet', 'R&B', 'Latin'
];

interface GalleryImage {
  id: number;
  imageUrl: string;
  altText?: string;
}

interface VenueMetrics {
  views: number;
  websiteClicks: number;
  mapClicks: number;
}

export default function OperatorDashboard() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [venues, setVenues] = useState<VenueDetails[]>([]);
  const [metrics, setMetrics] = useState<Record<number, VenueMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check for successful upgrade return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      showToast('Venue successfully upgraded to PRO! Enjoy unlimited features.', 'success');
      // Clear the query params
      router.replace('/manage');
    }
  }, [router, showToast]);

  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [user]);
  
  // Event Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [eventDate, setEventDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventTags, setEventTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Media Dialog State
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [venueImages, setVenueImages] = useState<GalleryImage[]>([]);
  const [newMainImageUrl, setNewMainImageUrl] = useState('');
  const [newGalleryImageUrl, setNewGalleryImageUrl] = useState('');
  const [loadingMedia, setLoadingMedia] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
      const timeout = setTimeout(() => {
        if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
          showToast('Access denied. Business owners only.', 'error');
          router.push('/');
        }
      }, 500);
      return () => clearTimeout(timeout);
    }

    const fetchVenuesAndMetrics = async () => {
      setLoading(true);
      try {
        const venueData = await getManagedVenues(token!);
        setVenues(venueData);

        // Fetch metrics for each venue
        const metricsMap: Record<number, VenueMetrics> = {};
        await Promise.all(venueData.map(async (v: VenueDetails) => {
          try {
            const m = await getVenueMetrics(token!, v.id);
            metricsMap[v.id] = m;
          } catch (err) {
            console.error(`Failed to fetch metrics for venue ${v.id}`, err);
          }
        }));
        setMetrics(metricsMap);
      } catch (err) {
        console.error('Failed to fetch managed venues:', err);
        showToast('Failed to load your venues.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchVenuesAndMetrics();
  }, [user, token, router, showToast]);

  const handleOpenDialog = (venueId: number) => {
    setSelectedVenueId(venueId);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedVenueId(null);
    setEventDate('');
    setEventDescription('');
    setEventTags([]);
  };

  const handleOpenMediaDialog = async (venue: VenueDetails) => {
    setSelectedVenueId(venue.id);
    setNewMainImageUrl(venue.imageUrl || '');
    setIsMediaDialogOpen(true);
    setLoadingMedia(true);
    try {
      const images = await getVenueImages(venue.id);
      setVenueImages(images);
    } catch (err) {
      showToast('Failed to load gallery images.', 'error');
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleCloseMediaDialog = () => {
    setIsMediaDialogOpen(false);
    setSelectedVenueId(null);
    setVenueImages([]);
    setNewGalleryImageUrl('');
  };

  const handleUpdateMainImage = async (urlOverride?: string) => {
    if (!selectedVenueId || !token) return;
    const urlToSave = urlOverride || newMainImageUrl;
    if (!urlToSave) return;

    try {
      await updateVenueMainImage(token, selectedVenueId, urlToSave);
      showToast('Main image updated!', 'success');
      // Refresh venues list to show new image
      const updatedVenues = await getManagedVenues(token);
      setVenues(updatedVenues);
    } catch (err) {
      showToast('Failed to update main image.', 'error');
    }
  };

  const handleAddGalleryImage = async () => {
    if (!selectedVenueId || !token || !newGalleryImageUrl) return;
    try {
      const newImg = await addVenueImage(token, selectedVenueId, newGalleryImageUrl);
      setVenueImages([newImg, ...venueImages]);
      setNewGalleryImageUrl('');
      showToast('Gallery image added!', 'success');
    } catch (err) {
      showToast('Failed to add gallery image.', 'error');
    }
  };

  const handleDeleteGalleryImage = async (imageId: number) => {
    if (!selectedVenueId || !token) return;
    try {
      await deleteVenueImage(token, selectedVenueId, imageId);
      setVenueImages(venueImages.filter(img => img.id !== imageId));
      showToast('Image removed.', 'info');
    } catch (err) {
      showToast('Failed to delete image.', 'error');
    }
  };

  const handleUpgrade = async (venueId: number) => {
    if (!token) return;
    try {
      const response = await createCheckoutSession(token, venueId);
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      showToast('Failed to start checkout. Please try again.', 'error');
    }
  };

  const handleManageSubscription = async (venueId: number) => {
    if (!token) return;
    try {
      const response = await createPortalSession(token, venueId);
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      showToast('Failed to open billing portal. Please try again.', 'error');
    }
  };

  const handleCreateEvent = async () => {
    if (!selectedVenueId || !eventDate || !eventDescription) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await createVenueEvent(token!, selectedVenueId, {
        date: eventDate,
        type: 'both', // Standard platform pairing
        description: eventDescription,
        tags: eventTags
      });
      showToast('Performance added successfully!', 'success');
      handleCloseDialog();
    } catch (err) {
      showToast('Failed to add performance.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <DashboardIcon color="primary" sx={{ fontSize: 40 }} />
        <Typography variant="h4" fontWeight="bold">Operator Dashboard</Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>My Managed Venues</Typography>
          
          {venues.length === 0 ? (
            <Alert severity="info">You don&apos;t have any managed venues yet. Request to claim a venue from its details page.</Alert>
          ) : (
            <Grid container spacing={3}>
              {venues.map((venue) => (
                <Grid key={venue.id} size={{ xs: 12, md: 6 }}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <Box sx={{ height: 140, position: 'relative' }}>
                      <Image 
                        src={venue.imageUrl || '/LMS_hero_image2.png'} 
                        alt={venue.name} 
                        fill 
                        style={{ objectFit: 'cover' }} 
                      />
                      <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                        <Chip 
                          label={venue.subscriptionTier.toUpperCase()} 
                          color={venue.subscriptionTier === 'free' ? 'default' : 'secondary'}
                          size="small"
                          icon={venue.subscriptionTier === 'free' ? undefined : <StarIcon />}
                          sx={{ fontWeight: 'bold', bgcolor: venue.subscriptionTier === 'free' ? 'rgba(255,255,255,0.8)' : undefined }}
                        />
                      </Box>
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <BusinessIcon color="primary" />
                        <Typography variant="h5" fontWeight="bold">{venue.name}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">{venue.city}, {venue.state}</Typography>
                      
                      {venue.subscriptionTier === 'free' && (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(237, 108, 2, 0.05)', borderRadius: 1, border: '1px solid rgba(237, 108, 2, 0.2)' }}>
                          <Typography variant="caption" display="block" color="warning.main" fontWeight="bold">FREE TIER LIMITS</Typography>
                          <Typography variant="caption" color="text.secondary">
                            4 events/mo • 3 gallery images
                          </Typography>
                          <Button 
                            size="small" 
                            variant="text" 
                            color="secondary" 
                            startIcon={<WorkspacePremiumIcon />}
                            sx={{ mt: 1, p: 0, minWidth: 0, textTransform: 'none', fontWeight: 'bold' }}
                            onClick={() => handleUpgrade(venue.id)}
                          >
                            Upgrade to Pro
                          </Button>
                        </Box>
                      )}

                      {venue.subscriptionTier === 'pro' && metrics[venue.id] && (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(3, 169, 244, 0.05)', borderRadius: 1, border: '1px solid rgba(3, 169, 244, 0.2)' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="caption" color="primary.main" fontWeight="bold">VENUE PERFORMANCE</Typography>
                            <Button 
                              size="small" 
                              variant="text" 
                              sx={{ p: 0, minWidth: 0, textTransform: 'none', fontSize: '0.7rem' }}
                              onClick={() => handleManageSubscription(venue.id)}
                            >
                              Manage Subscription
                            </Button>
                          </Box>
                          <Stack direction="row" spacing={2}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <VisibilityIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                              <Typography variant="caption" fontWeight="bold">{metrics[venue.id].views}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LanguageIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                              <Typography variant="caption" fontWeight="bold">{metrics[venue.id].websiteClicks}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <MapIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                              <Typography variant="caption" fontWeight="bold">{metrics[venue.id].mapClicks}</Typography>
                            </Box>
                          </Stack>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        startIcon={<AddCircleIcon />}
                        onClick={() => handleOpenDialog(venue.id)}
                      >
                        Event
                      </Button>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        startIcon={<PhotoCameraIcon />}
                        onClick={() => handleOpenMediaDialog(venue)}
                      >
                        Media
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Add Performance Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Add New Performance</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Performance Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
            <TextField
              label="Event Description"
              placeholder="e.g. Special Jazz session with the Blue Trio"
              fullWidth
              multiline
              rows={3}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Performance Tags</InputLabel>
              <Select
                multiple
                value={eventTags}
                onChange={(e) => setEventTags(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                input={<OutlinedInput label="Performance Tags" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {PERFORMANCE_TAGS.map((tag) => (
                  <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
          <Button 
            onClick={handleCreateEvent} 
            variant="contained" 
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Create Event'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Media Management Dialog */}
      <Dialog open={isMediaDialogOpen} onClose={handleCloseMediaDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ImageIcon /> Manage Venue Media
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={4}>
            {/* Main Image Section */}
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Main Hero Image</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This is the primary image shown on search results and the top of your venue page.
              </Typography>
              <ImageUpload 
                type="venue" 
                token={token!} 
                label="Update Main Image"
                onUploadSuccess={async (url) => {
                  setNewMainImageUrl(url);
                  await handleUpdateMainImage(url); 
                }} 
              />
            </Box>

            <Divider />

            {/* Gallery Section */}
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Spotlight Gallery</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add more photos of your stage, interior, or food. (Max 3 for Free Tier)
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <ImageUpload 
                  type="venue" 
                  token={token!} 
                  label="Add Gallery Photo"
                  onUploadSuccess={async (url) => {
                    await addVenueImage(token!, selectedVenueId!, url);
                    // Refresh gallery
                    const images = await getVenueImages(selectedVenueId!);
                    setVenueImages(images);
                    showToast('Gallery image added!', 'success');
                  }} 
                />
              </Box>

              {loadingMedia ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
              ) : (
                <ImageList sx={{ width: '100%', maxHeight: 300 }} cols={3} rowHeight={164}>
                  {venueImages.map((item) => (
                    <ImageListItem key={item.id}>
                      <img
                        src={item.imageUrl}
                        alt="Venue gallery"
                        loading="lazy"
                        style={{ height: '100%', objectFit: 'cover' }}
                      />
                      <ImageListItemBar
                        actionIcon={
                          <IconButton
                            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            onClick={() => handleDeleteGalleryImage(item.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseMediaDialog} variant="contained">Done</Button>
        </DialogActions>
      </Dialog>

      <OnboardingTour 
        open={showOnboarding} 
        onComplete={() => setShowOnboarding(false)} 
      />
    </Container>
  );
}
