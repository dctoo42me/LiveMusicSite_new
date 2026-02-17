// frontend/app/components/SearchResults.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { Venue } from '@/types/venue';
import { useAuth } from '@/contexts/AuthContext';
import { addFavorite, removeFavorite, getFavorites } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Stack,
  Pagination,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import InfoIcon from '@mui/icons-material/Info';
import LaunchIcon from '@mui/icons-material/Launch';
import MapIcon from '@mui/icons-material/Map';
import VerifiedIcon from '@mui/icons-material/Verified';
import GPPGoodIcon from '@mui/icons-material/GppGood';
import StarIcon from '@mui/icons-material/Star';
import ShareIcon from '@mui/icons-material/Share';
import Link from 'next/link';
import Image from 'next/image';
import VenueCardSkeleton from './VenueCardSkeleton';

interface SearchResultsProps {
  venues: Venue[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
}

export default function SearchResults({ venues, loading, error, totalCount, limit, offset, onPageChange }: SearchResultsProps) {
  const { token, logout } = useAuth();
  const { showToast } = useToast();
  const [favoritedVenueIds, setFavoritedVenueIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchInitialFavorites = async () => {
      if (token) {
        try {
          const allFavoritesData = await getFavorites(token, 1000, 0);
          if (allFavoritesData && allFavoritesData.venues) {
            const ids = new Set<number>(allFavoritesData.venues.map((v: any) => Number(v.id)));
            setFavoritedVenueIds(ids);
          }
        } catch (err) {
          if (err instanceof Error && err.message === 'Authentication failed or session expired') {
            logout('Your session has expired. Please log in again.');
          } else {
            console.error('Failed to fetch initial favorites:', err);
          }
        }
      } else {
        setFavoritedVenueIds(new Set());
      }
    };
    fetchInitialFavorites();
  }, [token, logout]);

  const handleToggleFavorite = async (venueId: number) => {
    if (!token) {
      showToast('Please log in to save favorites.', 'warning');
      return;
    }

    try {
      if (favoritedVenueIds.has(venueId)) {
        await removeFavorite(token, venueId);
        setFavoritedVenueIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(venueId);
          return newSet;
        });
        showToast('Venue removed from favorites!', 'info');
      } else {
        const response = await addFavorite(token, venueId);
        if (response && response.user_id) {
          setFavoritedVenueIds(prev => new Set(prev.add(venueId)));
          showToast('Venue added to favorites!', 'success');
        } else {
          showToast('Failed to add venue to favorites.', 'error');
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Authentication failed or session expired') {
        logout('Your session has expired. Please log in again.');
      } else {
        console.error('Failed to toggle favorite:', err);
        showToast('An error occurred while updating favorites.', 'error');
      }
    }
  };
  
  const handleShare = async (venue: Venue) => {
    const shareData = {
      title: venue.name,
      text: `Check out ${venue.name} on Forks & Feedback!`,
      url: `${window.location.origin}/venues/${venue.venueId}`,
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
        await navigator.clipboard.writeText(shareData.url);
        showToast('Venue link copied to clipboard!', 'success');
      } catch (err) {
        showToast('Failed to copy link.', 'error');
      }
    }
  };

  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = offset / limit + 1;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3} justifyContent="center">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex', justifyContent: 'center', p: 1.5 }}>
              <VenueCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    );
  }

  if (venues.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          No Venues Found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Try adjusting your search criteria or explore other options.
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3} justifyContent="center">
        {venues.map((venue) => (
          <Grid key={venue.id} size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex', justifyContent: 'center', p: 1.5 }}>
            <Card
              variant="elevation"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
                maxWidth: 400,
                bgcolor: 'background.paper',
                transition: 'box-shadow 0.3s ease-in-out, background-color 0.3s ease-in-out',
                '&:hover': { boxShadow: 6, bgcolor: 'action.hover' },
              }}
            >
                <Box sx={{ position: 'relative', height: 140, width: '100%' }}>
                    <Image
                        src={venue.imageUrl || '/LMS_hero_image2.png'}
                        alt={venue.name}
                        fill
                        sizes="(max-width: 600px) 100vw, 400px"
                        style={{ objectFit: 'cover' }}
                        priority={venues.indexOf(venue) < 4}
                    />
                </Box>
                <CardContent sx={{ flexGrow: 1, minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                {venue.tags && venue.tags.length > 0 ? (
                                    venue.tags.map((tag) => (
                                        <Chip key={tag} label={tag} size="small" color="secondary" sx={{ fontWeight: 'bold' }} />
                                    ))
                                ) : (
                                    <Chip label="Live Performance" size="small" color="secondary" variant="outlined" />
                                )}
                            </Stack>
                            <Box sx={{ display: 'flex', gap: 0.5, mt: -0.5 }}>
                                <Tooltip title="Share this venue">
                                    <IconButton
                                        onClick={() => handleShare(venue)}
                                        size="small"
                                    >
                                        <ShareIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={favoritedVenueIds.has(venue.venueId) ? 'Remove from Favorites' : 'Add to Favorites'}>
                                    <IconButton
                                        onClick={() => handleToggleFavorite(venue.venueId)}
                                        color={favoritedVenueIds.has(venue.venueId) ? 'error' : 'default'}
                                    >
                                        <FavoriteIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                            <Typography variant="h6" component="h2" sx={{ wordBreak: 'break-word', flexGrow: 1 }}>
                                {venue.name}
                            </Typography>
                            {venue.subscriptionTier === 'pro' && (
                                <Tooltip title="Featured Venue">
                                    <Chip 
                                        label="FEATURED" 
                                        size="small" 
                                        color="secondary" 
                                        icon={<StarIcon sx={{ fontSize: '0.9rem !important' }} />}
                                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }} 
                                    />
                                </Tooltip>
                            )}
                            {venue.verificationStatus === 'OWNER_VERIFIED' && (
                                <Tooltip title="Verified Venue">
                                    <VerifiedIcon color="success" sx={{ fontSize: '1.2rem' }} />
                                </Tooltip>
                            )}
                            {venue.verificationStatus === 'COMMUNITY_VERIFIED' && (
                                <Tooltip title="Community Verified">
                                    <GPPGoodIcon color="info" sx={{ fontSize: '1.2rem' }} />
                                </Tooltip>
                            )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {venue.city}, {venue.state}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.primary" sx={{ mt: 2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>
                        {venue.description || 'No description available.'}
                    </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                    <Stack spacing={1} sx={{ width: '100%' }}>
                        <Tooltip title="View venue details">
                            <Button 
                                fullWidth
                                size="small" 
                                variant="contained" 
                                startIcon={<InfoIcon />}
                                component={Link} 
                                href={`/venues/${venue.venueId}`}
                                sx={{ textTransform: 'none' }}
                            >
                                Details
                            </Button>
                        </Tooltip>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Open in Google Maps" sx={{ flex: 1 }}>
                                <Button 
                                    fullWidth
                                    size="small" 
                                    variant="outlined" 
                                    startIcon={<MapIcon />}
                                    component={Link} 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} ${venue.city} ${venue.state}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ textTransform: 'none' }}
                                >
                                    Map
                                </Button>
                            </Tooltip>
                            {venue.website && (
                                <Tooltip title="Visit venue website" sx={{ flex: 1 }}>
                                    <Button 
                                        fullWidth
                                        size="small" 
                                        variant="outlined" 
                                        startIcon={<LaunchIcon />}
                                        component={Link} 
                                        href={venue.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Site
                                    </Button>
                                </Tooltip>
                            )}
                        </Box>
                    </Stack>
                </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {totalPages > 1 && (
        <Stack spacing={2} sx={{ mt: 4, alignItems: 'center' }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(event, page) => onPageChange((page - 1) * limit)}
            color="primary"
          />
        </Stack>
      )}
    </Container>
  );
}
