// frontend/app/client-home-page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import SearchForm from './components/SearchForm';
import SearchResults from './components/SearchResults';
import VenueMap from './components/VenueMap';
import type { Venue } from '../types/venue';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CardMedia from '@mui/material/CardMedia';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import VerifiedIcon from '@mui/icons-material/Verified';
import GPPGoodIcon from '@mui/icons-material/GppGood';
import StarIcon from '@mui/icons-material/Star';
import Link from 'next/link';
import { HERO_IMAGE_PATH } from '@/constants';
import { useRouter, useSearchParams } from 'next/navigation';
import { APIProvider } from '@vis.gl/react-google-maps';

export default function ClientHomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const searchFormRef = useRef<HTMLDivElement>(null); // Ref for the search form

  const [venues, setVenues] = useState<Venue[]>([]);
  const [trendingEvents, setTrendingEvents] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [shouldScrollToMap, setShouldScrollToMap] = useState(false);

  // Derived values from searchParams
  const location = searchParams.get('location') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const type = searchParams.get('type') || 'both';
  const tag = searchParams.get('tag') || 'all';
  const name = searchParams.get('name') || '';
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
  const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined;

  // Effect to scroll to map when venues change
  useEffect(() => {
    if (shouldScrollToMap && venues.length > 0 && mapSectionRef.current) {
      // Calculate offset: Header (64px) + TopBar (32px)
      const yOffset = -(64 + 32); 
      
      const y = mapSectionRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      // Only scroll if the map is below the current viewport or the search form is not visible
      if (y > window.pageYOffset + window.innerHeight / 2 || (searchFormRef.current && searchFormRef.current.getBoundingClientRect().top < 0)) {
        window.scrollTo({ top: y, behavior: 'smooth' });
        setShouldScrollToMap(false); // Reset the flag after scrolling
      }
    }
  }, [venues, shouldScrollToMap]); // Add shouldScrollToMap to dependencies

  // Fetch trending events on mount
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch('/api/events/trending');
        if (response.ok) {
          const data = await response.json();
          setTrendingEvents(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch trending events:', err);
      }
    };
    fetchTrending();
  }, []);

  const performSearch = useCallback(async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lastSearchParams', JSON.stringify({ location, name, startDate, endDate, type, tag, limit, offset, lat, lng }));
    }

    if (!location && !lat && !lng && !name) {
      setVenues([]);
      setTotalCount(0);
      setLoading(false);
      setShouldScrollToMap(false); // Do not scroll if no search criteria
      return;
    }

    setLoading(true);
    setError(null);
    setVenues([]);
    setShouldScrollToMap(true); // Indicate that we should scroll to map after new data

    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (name) params.set('name', name);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (type) params.set('type', type);
    if (tag) params.set('tag', tag);
    if (lat) params.set('lat', lat.toString());
    if (lng) params.set('lng', lng.toString());
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());

    const apiUrl = `/api/venues/search?${params.toString()}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(`HTTP error ${response.status}: ${errorData.error || 'Check server logs.'}`);
      }
      const data = await response.json();
      console.log('ClientHomePage: Received venues data:', data.venues); // Added log
      setVenues(data.venues);
      setTotalCount(data.totalCount);
    } catch (err) {
      let errorMessage = "Could not connect to the API. Ensure backend and frontend are running.";
      if (err instanceof Error) errorMessage = err.message;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [location, name, startDate, endDate, type, tag, limit, offset, lat, lng]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleFormSubmit = (newLocation: string, newStartDate: string, newEndDate: string, newType: string, newTag: string, newLat?: number, newLng?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newLocation) params.set('location', newLocation); else params.delete('location');
    if (newStartDate) params.set('startDate', newStartDate); else params.delete('startDate');
    if (newEndDate) params.set('endDate', newEndDate); else params.delete('endDate');
    if (newType) params.set('type', newType); else params.delete('type');
    if (newTag) params.set('tag', newTag); else params.delete('tag');
    if (newLat) params.set('lat', newLat.toString()); else params.delete('lat');
    if (newLng) params.set('lng', newLng.toString()); else params.delete('lng');
    params.set('offset', '0');
    router.push(`?${params.toString()}`, { scroll: false });
    // Explicitly scroll to the search form after the navigation, with a small delay
    setTimeout(() => {
      if (searchFormRef.current) {
        searchFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Use 'center' to be more forgiving
      }
    }, 100);
  };

  const handlePageChange = (newOffset: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('offset', newOffset.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const hasWeekendEvents = trendingEvents.some(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToFri = (5 - dayOfWeek + 7) % 7;
    const fri = new Date(today);
    fri.setDate(today.getDate() + (daysToFri === 0 && dayOfWeek !== 5 ? 7 : daysToFri));
    fri.setHours(0, 0, 0, 0);
    const sun = new Date(fri);
    sun.setDate(fri.getDate() + 2);
    sun.setHours(23, 59, 59, 999);
    return eventDate >= fri && eventDate <= sun;
  });

  const trendingHeading = hasWeekendEvents ? (
    <>What&apos;s Hot <Typography component="span" variant="inherit" color="secondary">This Weekend</Typography></>
  ) : (
    <>Upcoming <Typography component="span" variant="inherit" color="secondary">Spotlights</Typography></>
  );

  return (
    <APIProvider apiKey={apiKey}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ my: 4 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            sx={{ textAlign: { xs: 'center', md: 'left' }, fontWeight: 'bold' }}
          >
            Find Your Perfect <Typography component="span" variant="inherit" color="primary">Plate</Typography> & <Typography component="span" variant="inherit" color="secondary">Performance</Typography>
          </Typography>
          <Typography 
            variant="h6" 
            component="p" 
            color="text.secondary" 
            sx={{ 
              textAlign: { xs: 'center', md: 'left' },
              maxWidth: '600px',
              mx: { xs: 'auto', md: 0 }
            }}
          >
            Discover local venues offering delicious meals paired with live events near you.
          </Typography>
        </Box>

        {/* Hero Image */}
        <Box sx={{ my: 4 }}>
          <CardMedia
            component="img"
            image={HERO_IMAGE_PATH}
            alt="Live Music Venue with Audience and Performer"
            sx={{
              width: '100%',
              height: { xs: 200, md: 400 },
              objectFit: 'cover',
              objectPosition: 'center 35%',
              borderRadius: 2,
              boxShadow: 3,
            }}
          />
        </Box>

        {/* Trending Section */}
        {trendingEvents.length > 0 && !location && (
          <Box sx={{ my: 6 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              {trendingHeading}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              overflowX: 'auto', 
              pb: 2, 
              gap: 3,
              '&::-webkit-scrollbar': { height: 8 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 4 }
            }}>
              {trendingEvents.map((event) => (
                <Card key={event.id} sx={{ minWidth: 280, maxWidth: 280, flexShrink: 0, borderRadius: 2, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={event.imageUrl || HERO_IMAGE_PATH}
                    alt={event.name}
                  />
                  <CardContent>
                    <Chip 
                      label={event.tags && event.tags.length > 0 ? event.tags[0] : "Live Performance"} 
                      size="small" 
                      color="secondary" 
                      sx={{ mb: 1, fontWeight: 'bold' }} 
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                      <Typography variant="h6" noWrap sx={{ wordBreak: 'break-word', flexGrow: 1 }} title={event.name}>
                        {event.name}
                      </Typography>
                      {event.subscriptionTier === 'pro' && (
                          <Tooltip title="Featured Venue">
                              <StarIcon color="secondary" sx={{ fontSize: '1rem' }} />
                          </Tooltip>
                      )}
                      {event.verificationStatus === 'OWNER_VERIFIED' && (
                          <Tooltip title="Verified Venue">
                              <VerifiedIcon color="success" sx={{ fontSize: '1.rem' }} />
                          </Tooltip>
                      )}
                      {event.verificationStatus === 'COMMUNITY_VERIFIED' && (
                          <Tooltip title="Community Verified">
                              <GPPGoodIcon color="info" sx={{ fontSize: '1rem' }} />
                          </Tooltip>
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {event.city}
                    </Typography>
                    <Button 
                      component={Link} 
                      href={`/venues/${event.venueId}`} 
                      fullWidth 
                      variant="outlined" 
                      size="small" 
                      sx={{ mt: 2 }}
                    >
                      View Venue
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* Search Form */}
        <Box sx={{ my: 4 }} ref={searchFormRef}>
          <SearchForm
            initialLocation={location}
            initialStartDate={startDate}
            initialEndDate={endDate}
            initialType={type}
            onSearchSubmit={handleFormSubmit}
            isLoading={loading}
          />
        </Box>

        {/* Interactive Map */}
        {venues.length > 0 && (
          <Box sx={{ mb: 4, mt: 0 }} ref={mapSectionRef}>
            <VenueMap venues={venues} />
          </Box>
        )}

        {/* Results Section */}
        <Box sx={{ my: 4 }} data-testid="search-results">
          <SearchResults
            venues={venues}
            loading={loading}
            error={error}
            totalCount={totalCount}
            limit={limit}
            offset={offset}
            onPageChange={handlePageChange}
          />
        </Box>
      </Container>
    </APIProvider>
  );
}
