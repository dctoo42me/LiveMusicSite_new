// frontend/app/favorites/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFavorites, removeFavorite } from '@/services/api';
import { useRouter } from 'next/navigation';
import type { Venue } from '@/types/venue';
import { useToast } from '@/contexts/ToastContext';
// ADD MATERIAL UI IMPORTS
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
  Chip, // For badges
  CardMedia, // ADD THIS IMPORT
  Tooltip, // Import Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete'; // For delete icon
import InfoIcon from '@mui/icons-material/Info'; // For info icon
import LaunchIcon from '@mui/icons-material/Launch'; // For launch icon
import MapIcon from '@mui/icons-material/Map'; // For map icon
import Link from 'next/link'; // For navigation

const ITEMS_PER_PAGE = 9; // Define items per page for favorites

export default function FavoritesPage() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const { showToast } = useToast(); // Initialize useToast

  const [favorites, setFavorites] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0); // For pagination
  const [offset, setOffset] = useState(0); // For pagination

  // Dynamic Sticky State
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!token) {
      showToast('You must be logged in to view favorites.', 'warning');
      router.push('/login'); // Redirect to login if not authenticated
      return;
    }

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        // Pass limit and offset to getFavorites
        const data = await getFavorites(token, ITEMS_PER_PAGE, offset); 
        if (data.error) {
          showToast(data.error, 'error');
          setError(data.error); // Keep local error for display in component
        } else {
          setFavorites(data.venues); // Assuming backend returns { venues: [], totalCount: N }
          setTotalCount(data.totalCount);
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'Authentication failed or session expired') {
          logout('Your session has expired. Please log in again.');
        } else {
          showToast('Failed to fetch favorites.', 'error');
          setError('Failed to fetch favorites.'); // Keep local error for display in component
          console.error('Failed to fetch favorites:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [token, offset, router, showToast]); // Add offset and showToast to dependencies

  const handleRemoveFavorite = async (venueId: number) => {
    if (!token) {
      showToast('You must be logged in to remove favorites.', 'warning');
      return;
    }

    try {
      const res = await removeFavorite(token, venueId);
      if (res.ok) {
        setFavorites(prevFavorites => prevFavorites.filter(venue => venue.id !== venueId));
        setTotalCount(prevCount => prevCount - 1); // Decrement total count
        showToast('Venue removed from favorites!', 'info');
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
        showToast(errorData.error || 'Failed to remove venue from favorites.', 'error');
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Authentication failed or session expired') {
        logout('Your session has expired. Please log in again.');
      } else {
        console.error('Failed to remove favorite:', err);
        showToast('An error occurred while removing favorite.', 'error');
      }
    }
  };

  // Pagination logic - moved before conditional renders
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const currentPage = offset / ITEMS_PER_PAGE + 1;

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setOffset((page - 1) * ITEMS_PER_PAGE);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
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

  if (favorites.length === 0 && !loading) { // Only show "No favorites" if not loading and empty
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          No Favorite Venues
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Start adding some venues to your favorites!
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, pt: 0 }}>
      <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3, mt: 4 }}>
        <Box sx={{ 
          position: 'sticky', 
          top: 64, 
          zIndex: 1000, 
          bgcolor: scrolled ? '#333333' : 'background.paper', 
          pt: scrolled ? 1 : 2, 
          pb: scrolled ? 1 : 2, 
          mb: 2, 
          boxShadow: scrolled ? 10 : 1,
          mx: scrolled ? -3 : -2, // Compensate for parent padding
          px: 3,
          transition: 'all 0.3s ease-in-out',
          borderBottom: scrolled ? '1px solid' : 'none',
          borderColor: 'primary.main'
        }}>
          <Typography 
            variant={scrolled ? "h5" : "h4"} 
            component="h1" 
            gutterBottom 
            sx={{ 
              textAlign: { xs: 'center', md: 'left' },
              fontWeight: 'bold',
              transition: 'all 0.3s ease-in-out',
              mb: 0,
              color: scrolled ? "#ffffff" : "text.primary"
            }}
          >
            My Favorites
          </Typography>
        </Box>
        <Grid container spacing={3} justifyContent="center">
          {favorites.map((venue) => (
            <Grid
              key={venue.id}
              size={{ xs: 12, md: 6, lg: 4 }}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                p: 1.5,
              }}
            >
              <Card
                variant="elevation"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  width: '100%',
                  maxWidth: 350, // Consistent card width
                  bgcolor: 'background.paper',
                  transition: 'box-shadow 0.3s ease-in-out, background-color 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: 6,
                    bgcolor: 'action.hover',
                  },
                }}
              >
                  {/* Conditionally render CardMedia if imageUrl exists */}
                  {venue.imageUrl && (
                      <CardMedia
                          component="img"
                          height="140" // Fixed height for consistency
                          image={venue.imageUrl}
                          alt={venue.name}
                          sx={{ objectFit: 'cover' }} // Ensure image covers the area
                      />
                  )}
                  <CardContent sx={{ flexGrow: 1, minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}> {/* Added minHeight and flex properties */}
                                          <Box> {/* Wrap top part of content in Box */}
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
                                                                          <Tooltip title="Remove from Favorites">
                                                                              <IconButton
                                                                                  onClick={() => handleRemoveFavorite(venue.id)}
                                                                                  color="error" // Use error color for delete
                                                                                  sx={{ ml: 'auto', mt: -0.5 }} // Push to right
                                                                              >
                                                                                  <DeleteIcon />
                                                                              </IconButton>
                                                                          </Tooltip>
                                                                      </Box>                                              <Typography variant="h6" component="h2" gutterBottom sx={{ wordBreak: 'break-word' }}>
                                                  {venue.name}
                                              </Typography>                        <Typography variant="body2" color="text.secondary">
                              {venue.city}, {venue.state}
                          </Typography>
                      </Box>
                      <Typography variant="body2" color="text.primary" sx={{ mt: 2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}> {/* Removed fixed height: 60, relies on WebkitLineClamp for height control */}
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
                                                  href={`/venues/${venue.id}`}
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Stack spacing={2} sx={{ mt: 4, alignItems: 'center' }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Stack>
        )}
      </Box>
    </Container>
  );
}