// frontend/app/venues/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getVenueById, getVenueEvents, saveEvent, unsaveEvent, getSavedEvents, submitVenueFeedback, getVenueImages, trackVenueEvent, reportVenue } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { VenueDetails, VenueEvent } from '@/types/venue-details';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Stack,
  Rating,
  TextField,
  Avatar,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  ImageList,
  ImageListItem,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LanguageIcon from '@mui/icons-material/Language';
import MapIcon from '@mui/icons-material/Map';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ShareIcon from '@mui/icons-material/Share';
import CollectionsIcon from '@mui/icons-material/Collections';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import Link from 'next/link';
import Image from 'next/image';
import VerifiedIcon from '@mui/icons-material/Verified';
import BusinessIcon from '@mui/icons-material/Business';
import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown';
import ServiceIcons from '@/app/components/ServiceIcons';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

interface Review {
  id: number;
  username: string;
  avatarUrl?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface GalleryImage {
  id: number;
  imageUrl: string;
  altText?: string;
}

export default function VenueDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const { token, user, logout } = useAuth();
  const { showToast } = useToast();

  const [venue, setVenue] = useState<VenueDetails | null>(null);
  const [events, setEvents] = useState<VenueEvent[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedEventIds, setSavedEventIds] = useState<Set<number>>(new Set());

  const [userRating, setUserRating] = useState<number | null>(0);
  const [userComment, setUserComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Claim Modal State
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimDetails, setClaimDetails] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Verification State
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [suggestedWebsite, setSuggestedWebsite] = useState('');

  // Gallery State
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [selectedGalleryImg, setSelectedGalleryImg] = useState<string | null>(null);

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportEmail, setReportEmail] = useState('');
  const [reportName, setReportName] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Dynamic Sticky State
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (user) {
      setReportName(user.username);
      setReportEmail(user.email || '');
    }
  }, [user]);

  const handleReportSubmit = async () => {
    if (!reportReason || !reportDescription || !reportEmail || !reportName) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }

    setIsSubmittingReport(true);
    try {
      await reportVenue(parseInt(id, 10), {
        reason: reportReason,
        description: reportDescription,
        name: reportName,
        email: reportEmail
      });
      showToast('Thank you for your report. We will look into it.', 'success');
      setIsReportModalOpen(false);
      setReportReason('');
      setReportDescription('');
    } catch (err) {
      showToast('Failed to submit report.', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      // Threshold to shrink: roughly when the hero image (350px) is scrolled past
      setScrolled(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!id) return;
    // Log "view" event for analytics
    trackVenueEvent(parseInt(id, 10), 'view', token || undefined).catch(err => console.error('Analytics error:', err));
  }, [id, token]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [venueData, eventsData, reviewsRes, imagesData] = await Promise.all([
          getVenueById(id),
          getVenueEvents(id),
          fetch(`/api/reviews/${id}`),
          getVenueImages(parseInt(id, 10))
        ]);

        if (venueData.error) throw new Error(venueData.error);
        
        setVenue(venueData);
        setEvents(eventsData);
        setGalleryImages(imagesData || []);

        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.reviews);
          setAvgRating(reviewsData.averageRating);
        }

        if (token) {
          const savedData = await getSavedEvents(token);
          if (savedData && Array.isArray(savedData)) {
            setSavedEventIds(new Set(savedData.map(se => se.eventId)));
          }
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'Authentication failed or session expired') {
          logout('Your session has expired. Please log in again.');
        } else {
          setError('Failed to load venue details.');
          console.error(err);
        }
      } finally {
        setLoading(false);
        // Only scroll to top if there is no hash in the URL (like #events)
        if (!window.location.hash) {
          window.scrollTo(0, 0);
        } else {
          // If there is a hash, give the browser a tiny moment to render then jump to it with an offset
          setTimeout(() => {
            const hashId = window.location.hash.replace('#', '');
            const element = document.getElementById(hashId);
            const stickyHeader = document.getElementById('venue-sticky-bar');
            if (element) {
              const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 160;
              const yOffset = -(headerHeight + 70); // Header height + global top bar + small buffer
              const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }, 100);
        }
      }
    };

    fetchData();
  }, [id, token, logout]);

  const handleShare = async () => {
    if (!venue) return;
    
    const shareData = {
      title: venue.name,
      text: `Check out ${venue.name} on Forks & Feedback!`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('Shared successfully!', 'success');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          showToast('Failed to share.', 'error');
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!', 'success');
      } catch (err) {
        showToast('Failed to copy link.', 'error');
      }
    }
  };

  const handleFeedback = async (hasLive: boolean) => {
    if (!token) {
      showToast('Please log in to provide feedback.', 'warning');
      return;
    }

    setIsVoting(true);
    try {
      await submitVenueFeedback(token, parseInt(id, 10), hasLive, suggestedWebsite);
      showToast('Thank you for helping the community!', 'success');
      setHasVoted(true);
      
      // If we suggested a website and the venue didn't have one, refresh the data
      if (suggestedWebsite && !venue?.website) {
        getVenueById(id).then(updatedVenue => {
          if (updatedVenue) setVenue(updatedVenue);
        });
      }
    } catch (err: any) {
      if (err.message.includes('already provided feedback')) {
        showToast('You have already provided feedback for this venue.', 'info');
        setHasVoted(true);
      } else {
        showToast('Failed to submit feedback.', 'error');
      }
    } finally {
      setIsVoting(false);
    }
  };

  const handleClaimSubmit = async () => {
    if (!token) {
      showToast('Please log in to claim a venue.', 'warning');
      return;
    }

    setIsSubmittingClaim(true);
    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ venueId: parseInt(id, 10), details: claimDetails })
      });

      if (response.ok) {
        showToast('Claim submitted successfully! We will review your request.', 'success');
        setIsClaimModalOpen(false);
        setClaimDetails('');
      } else {
        const errData = await response.json();
        showToast(errData.error || 'Failed to submit claim.', 'error');
      }
    } catch (err) {
      showToast('An error occurred while submitting your claim.', 'error');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const handleShareEvent = async (event: VenueEvent) => {
    const shareData = {
      title: `${venue?.name} Performance`,
      text: `${event.description || 'Live Performance'} at ${venue?.name} on ${new Date(event.date).toLocaleDateString()}`,
      url: window.location.href, // Link to the venue page
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          showToast('Failed to share.', 'error');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Venue link copied to clipboard!', 'success');
      } catch (err) {
        showToast('Failed to copy link.', 'error');
      }
    }
  };

  const handleToggleSaveEvent = async (eventId: number) => {
    if (!token) {
      showToast('Please log in to save events.', 'warning');
      return;
    }

    try {
      if (savedEventIds.has(eventId)) {
        await unsaveEvent(token, eventId);
        setSavedEventIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(eventId);
          return newSet;
        });
        showToast('Event removed from your schedule!', 'info');
      } else {
        const result = await saveEvent(token, eventId);
        if (result) {
          setSavedEventIds(prev => new Set(prev.add(eventId)));
          showToast('Event saved to your schedule!', 'success');
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Authentication failed or session expired') {
        logout('Your session has expired. Please log in again.');
      } else {
        console.error('Failed to toggle save event:', err);
        showToast('An error occurred while saving the event.', 'error');
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!token) {
      showToast('Please log in to leave a review.', 'warning');
      return;
    }
    if (!userRating) {
      showToast('Please select a rating.', 'warning');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ venueId: parseInt(id, 10), rating: userRating, comment: userComment })
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews([newReview, ...reviews]);
        setUserRating(0);
        setUserComment('');
        showToast('Review submitted successfully!', 'success');
        
        const avgRes = await fetch(`/api/reviews/${id}`);
        if (avgRes.ok) {
          const avgData = await avgRes.json();
          setAvgRating(avgData.averageRating);
        }
      } else {
        const errData = await response.json();
        showToast(errData.error || 'Failed to submit review.', 'error');
      }
    } catch (err) {
      showToast('An error occurred while submitting your review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !venue) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Venue not found.'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, pt: 0 }}>
      {/* Hero Image Section */}
      <Card sx={{ mb: 0, mt: 4, position: 'relative', height: 350, overflow: 'hidden', borderRadius: '16px 16px 0 0', boxShadow: 3 }}>
        <Image
          src={venue.imageUrl || '/LMS_hero_image2.png'}
          alt={venue.name}
          fill
          priority
          style={{ objectFit: 'cover' }}
        />
      </Card>

      {/* Dynamic Sticky Venue Title Bar */}
      <Box 
        id="venue-sticky-bar"
        sx={{ 
        position: 'sticky', 
        top: 64, // Exactly under the sticky Header (64px)
        zIndex: 1100, 
        bgcolor: scrolled ? '#333333' : 'background.paper', 
        px: { xs: 2, sm: 3 },
        py: scrolled ? 1 : 2.5, // Even tighter padding when sticky
        mb: 4, 
        borderRadius: scrolled ? 0 : '0 0 16px 16px', 
        borderBottom: '1px solid',
        borderColor: scrolled ? 'primary.main' : 'divider',
        boxShadow: scrolled ? 10 : 4,
        transition: 'all 0.3s ease-in-out',
        width: 'auto',
        display: 'flex', // Added flex
        justifyContent: 'space-between', // Push content apart
        alignItems: 'center', // Center vertically
      }}>
        <Box> {/* Wrap title and address */}
          <Typography 
            variant={scrolled ? "h5" : "h3"} 
            component="h1" 
            fontWeight="bold" 
            color={scrolled ? "#ffffff" : "primary.main"}
            sx={{ transition: 'font-size 0.2s ease-in-out' }}
          >
            {venue.name}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mt: scrolled ? 0 : 0.5,
            opacity: scrolled ? 0.9 : 1,
            transition: 'all 0.2s ease-in-out',
            color: scrolled ? "#ffffff" : "inherit"
          }}>
            <LocationOnIcon sx={{ fontSize: scrolled ? '0.9rem' : '1.2rem', mr: 0.5, color: scrolled ? "#ffffff" : "secondary.main" }} />
            <Typography variant={scrolled ? "caption" : "subtitle1"} sx={{ color: scrolled ? "#ffffff" : "text.secondary" }} fontWeight="medium">
              {venue.city}, {venue.state} {venue.zipcode && ` ${venue.zipcode}`}
            </Typography>
          </Box>
        </Box>

        {/* New Quick-Jump Button */}
        <Button
          variant={scrolled ? "contained" : "outlined"}
          color="secondary"
          size={scrolled ? "small" : "medium"}
          startIcon={<CalendarMonthIcon />}
          onClick={() => {
            const element = document.getElementById('events');
            const stickyHeader = document.getElementById('venue-sticky-bar');
            if (element) {
              const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 80;
              const yOffset = -(headerHeight + 70); 
              const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }}
          sx={{ 
            borderRadius: 2,
            whiteSpace: 'nowrap',
            ml: 2,
            boxShadow: scrolled ? 2 : 0
          }}
        >
          {scrolled ? 'Events' : 'View Events'}
        </Button>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h5" fontWeight="bold">
                About the Venue
              </Typography>
              {/* Service Icons and Share/Claim actions */}
              <Stack direction="row" spacing={1} alignItems="center">
                <ServiceIcons foodServiceType={venue.foodServiceType} barServiceType={venue.barServiceType} size="medium" />
                <Tooltip title="Share this venue">
                  <IconButton size="small" onClick={handleShare} color="primary">
                    <ShareIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {venue.ownerId ? (
                  <Chip 
                    icon={<VerifiedIcon />} 
                    label="Verified Venue" 
                    color="success" 
                    variant="outlined" 
                    size="small" 
                  />
                ) : (
                  <Tooltip title="Are you the owner? Claim this venue to manage events.">
                    <Button 
                      variant="text" 
                      color="secondary" 
                      size="small" 
                      startIcon={<BusinessIcon />}
                      onClick={() => setIsClaimModalOpen(true)}
                    >
                      Claim this Venue
                    </Button>
                  </Tooltip>
                )}
              </Stack>
            </Box>
            <Typography variant="body1" paragraph color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {venue.description || 'No description available for this venue.'}
            </Typography>            
            {venue.website && (
              <Tooltip title="Visit venue website">
                <Button 
                  variant="outlined" 
                  startIcon={<LanguageIcon />} 
                  component={Link} 
                  href={venue.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => trackVenueEvent(parseInt(id, 10), 'website_click', token || undefined)}
                  sx={{ mt: 2, mr: 2 }}
                >
                  Visit Official Website
                </Button>
              </Tooltip>
            )}
            <Tooltip title="Open in Google Maps">
              <Button 
                variant="outlined" 
                startIcon={<MapIcon />} 
                component={Link} 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} ${venue.city} ${venue.state}`)}`}
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => trackVenueEvent(parseInt(id, 10), 'map_click', token || undefined)}
                sx={{ mt: 2 }}
              >
                View on Google Maps
              </Button>
            </Tooltip>

            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button 
                size="small" 
                color="inherit" 
                startIcon={<ReportProblemIcon />} 
                onClick={() => setIsReportModalOpen(true)}
                sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
              >
                Report an issue with this venue
              </Button>
            </Box>
          </Box>

          {/* Community Verification Widget */}
          {!hasVoted && venue.verificationStatus !== 'OWNER_VERIFIED' && (
            <Box sx={{ 
              p: 3, 
              mb: 4, 
              bgcolor: 'rgba(3, 169, 244, 0.05)', 
              borderRadius: 2, 
              border: '1px dashed', 
              borderColor: 'primary.main',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              <Box sx={{ 
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ThumbsUpDownIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">Help the Community</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Does this venue actually have live performances?
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="success" 
                    startIcon={<ThumbUpIcon />}
                    onClick={() => handleFeedback(true)}
                    disabled={isVoting}
                  >
                    Yes
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="error" 
                    startIcon={<ThumbDownIcon />}
                    onClick={() => handleFeedback(false)}
                    disabled={isVoting}
                  >
                    No
                  </Button>
                </Stack>
              </Box>

              {!venue.website && (
                <Box sx={{ mt: 1, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Know their website? (Optional)
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="https://www.example.com"
                    value={suggestedWebsite}
                    onChange={(e) => setSuggestedWebsite(e.target.value)}
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Box>
              )}
            </Box>
          )}

          {/* Spotlight Gallery */}
          {galleryImages.length > 0 && (
            <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, mb: 4 }}>
              <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CollectionsIcon sx={{ mr: 1, color: 'primary.main' }} />
                Spotlight Gallery
              </Typography>
              <ImageList sx={{ width: '100%', height: 'auto', borderRadius: 2 }} cols={3} gap={12}>
                {galleryImages.map((img) => (
                  <ImageListItem 
                    key={img.id} 
                    sx={{ 
                      cursor: 'pointer', 
                      overflow: 'hidden', 
                      borderRadius: 2,
                      '&:hover img': { transform: 'scale(1.1)' }
                    }}
                    onClick={() => setSelectedGalleryImg(img.imageUrl)}
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.altText || 'Venue photo'}
                      loading="lazy"
                      style={{ height: 200, objectFit: 'cover', transition: 'transform 0.3s ease-in-out' }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          )}

          <Box id="events" sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, mb: 4 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <CalendarMonthIcon sx={{ mr: 1, color: 'primary.main' }} />
              Upcoming Events
            </Typography>
            
            {events.length > 0 ? (
              <Stack spacing={2}>
                {events.map((event) => {
                  const eventDate = new Date(event.date);
                  return (
                    <Paper 
                      key={event.id} 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 3,
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateX(4px)',
                          boxShadow: 2,
                          borderColor: 'primary.main',
                          bgcolor: 'rgba(255, 255, 255, 0.08)'
                        }
                      }}
                    >
                      {/* Date Badge */}
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: 'rgba(3, 169, 244, 0.1)', // Light blue tint
                        color: 'primary.main',
                        borderRadius: 2,
                        minWidth: 70,
                        height: 70,
                        border: '1px solid',
                        borderColor: 'primary.main'
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                          {eventDate.toLocaleDateString(undefined, { month: 'short' })}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                          {eventDate.getDate()}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                          {eventDate.toLocaleDateString(undefined, { weekday: 'short' })}
                        </Typography>
                      </Box>

                      {/* Event Details */}
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
                              {event.tags && event.tags.length > 0 && (
                                event.tags
                                  .filter(tag => !['meals', 'dining', 'bar_bites', 'full_menu', 'none', 'alcoholic_only', 'non_alcoholic', 'full_bar'].includes(tag.toLowerCase())) // Safeguard filter
                                  .map((tag) => (
                                  <Chip 
                                    key={tag}
                                    label={tag} 
                                    size="small" 
                                    color="secondary" 
                                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                                  />
                                ))
                              )}
                            </Stack>
                            <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                              {event.description || 'Live entertainment starting at 7:00 PM'}
                            </Typography>
                          </Box>
                          
                          <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                            <Tooltip title="Share this event">
                              <IconButton 
                                onClick={() => handleShareEvent(event)}
                                size="small"
                              >
                                <ShareIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={savedEventIds.has(event.id) ? 'Remove from schedule' : 'Save to my schedule'}>
                              <IconButton 
                                onClick={() => handleToggleSaveEvent(event.id)}
                                color={savedEventIds.has(event.id) ? 'primary' : 'default'}
                                size="small"
                              >
                                {savedEventIds.has(event.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No upcoming events listed.
              </Typography>
            )}
          </Box>

          {/* User Reviews Section */}
          <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">User Reviews</Typography>
              {avgRating !== null && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Rating value={avgRating} readOnly precision={0.1} size="large" />
                  <Typography variant="h6" sx={{ ml: 1 }}>{avgRating}</Typography>
                </Box>
              )}
            </Box>

            {token ? (
              <Box sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">Leave a Review</Typography>
                <Rating
                  value={userRating}
                  onChange={(event, newValue) => setUserRating(newValue)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Share your experience..."
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <Button 
                  variant="contained" 
                  onClick={handleSubmitReview} 
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? <CircularProgress size={24} /> : 'Submit Review'}
                </Button>
              </Box>
            ) : (
              <Alert severity="info" sx={{ mb: 4 }}>Please log in to leave a review.</Alert>
            )}

            {reviews.length > 0 ? (
              <List>
                {reviews.map((review) => (
                  <React.Fragment key={review.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0, py: 2 }}>
                      <Avatar 
                        src={review.avatarUrl} 
                        sx={{ mr: 2, bgcolor: 'primary.main' }}
                      >
                        {!review.avatarUrl && review.username[0].toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1" fontWeight="bold">{review.username}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Rating value={review.rating} readOnly size="small" sx={{ my: 0.5 }} />
                            <Typography variant="body2" color="text.primary">{review.comment}</Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center">No reviews yet. Be the first to share your experience!</Typography>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Claim Venue Modal */}
      <Dialog open={isClaimModalOpen} onClose={() => setIsClaimModalOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Claim &quot;{venue.name}&quot;</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            To manage this venue and its performances, please provide your business details or a brief explanation of your relationship to the venue.
          </DialogContentText>
          <TextField
            margin="dense"
            label="Verification Details"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="e.g. I am the general manager, my work email is..."
            value={claimDetails}
            onChange={(e) => setClaimDetails(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsClaimModalOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleClaimSubmit} 
            variant="contained" 
            disabled={isSubmittingClaim || !claimDetails.trim()}
          >
            {isSubmittingClaim ? <CircularProgress size={24} /> : 'Submit Claim'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Venue Dialog */}
      <Dialog open={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Report an Issue</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Is something wrong with this venue&apos;s information? Let us know and we&apos;ll fix it.
          </DialogContentText>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                fullWidth
                label="Your Name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={reportEmail}
                onChange={(e) => setReportEmail(e.target.value)}
                required
              />
            </Box>
            <FormControl fullWidth required>
              <InputLabel>Reason for Report</InputLabel>
              <Select
                value={reportReason}
                label="Reason for Report"
                onChange={(e) => setReportReason(e.target.value)}
              >
                <MenuItem value="Incorrect Address">Incorrect Address</MenuItem>
                <MenuItem value="Closed Permanently">Closed Permanently</MenuItem>
                <MenuItem value="Wrong Website">Wrong Website</MenuItem>
                <MenuItem value="Inappropriate Content">Inappropriate Content</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Details"
              placeholder="Please explain the issue..."
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsReportModalOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleReportSubmit} 
            variant="contained" 
            color="error"
            disabled={isSubmittingReport}
          >
            {isSubmittingReport ? <CircularProgress size={24} /> : 'Submit Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fullscreen Gallery Image Dialog */}
      <Dialog 
        open={!!selectedGalleryImg} 
        onClose={() => setSelectedGalleryImg(null)}
        maxWidth="lg"
      >
        <Box sx={{ position: 'relative', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {selectedGalleryImg && (
            <img 
              src={selectedGalleryImg} 
              alt="Venue spotlight" 
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }} 
            />
          )}
        </Box>
      </Dialog>
    </Container>
  );
}
