// frontend/app/saved-events/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSavedEvents, unsaveEvent } from '@/services/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import type { Venue } from '@/types/venue';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  IconButton,
  Chip,
  Tooltip,
  Paper,
  Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import Link from 'next/link';
import Image from 'next/image';

interface SavedEventFE {
  id: number;
  eventId: number;
  venueId: number;
  venueName: string;
  city: string;
  state: string;
  date: string;
  type: string;
  description: string;
  imageUrl: string;
  tags: string[] | null;
}

function PairingsSection({ eventId, type }: { eventId: number, type: string }) {
  const [pairings, setPairings] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPairings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?pairings=true&eventId=${eventId}`);
        if (response.ok) {
          const data = await response.json();
          setPairings(data.venues || []);
        }
      } catch (err) {
        console.error('Failed to fetch pairings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPairings();
  }, [eventId]);

  if (loading || pairings.length === 0) return null;

  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2, border: '1px dashed', borderColor: 'primary.main' }}>
      <Typography variant="subtitle2" color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 1, fontWeight: 'bold' }}>
        {type === 'music' ? <RestaurantIcon sx={{ mr: 1, fontSize: '1rem' }} /> : <MusicNoteIcon sx={{ mr: 1, fontSize: '1rem' }} />}
        Make it a Perfect Pairing!
      </Typography>
      <Stack spacing={1}>
        {pairings.map((p) => (
          <Paper key={p.id} elevation={0} sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper' }}>
            <Box>
              <Typography variant="body2" fontWeight="bold">{p.name}</Typography>
              <Typography variant="caption" color="text.secondary">{p.description ? p.description.substring(0, 40) : ''}...</Typography>
            </Box>
            <Button size="small" component={Link} href={`/venues/${p.venueId}`}>Details</Button>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}

export default function SavedEventsPage() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [savedEvents, setSavedEvents] = useState<SavedEventFE[]>([]);
  const [remindedEventIds, setRemindedEventIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const storedReminders = localStorage.getItem('event_reminders');
    if (storedReminders) {
      setRemindedEventIds(new Set(JSON.parse(storedReminders)));
    }
  }, []);

  useEffect(() => {
    if (!token) {
      showToast('Please log in to view your schedule.', 'warning');
      router.push('/login');
      return;
    }

    const fetchSaved = async () => {
      setLoading(true);
      try {
        const data = await getSavedEvents(token);
        if (data.error) throw new Error(data.error);
        setSavedEvents(data);
      } catch (err) {
        if (err instanceof Error && err.message === 'Authentication failed or session expired') {
          logout('Your session has expired. Please log in again.');
        } else {
          setError('Failed to load your schedule.');
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSaved();
  }, [token, logout, router, showToast]);

  const handleToggleReminder = async (eventId: number) => {
    if (!("Notification" in window)) {
      showToast("This browser does not support desktop notifications", "error");
      return;
    }

    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        showToast("Notification permission denied", "warning");
        return;
      }
    }

    setRemindedEventIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
        showToast("Reminder removed", "info");
      } else {
        newSet.add(eventId);
        showToast("Reminder set! We'll notify you before the event.", "success");
      }
      localStorage.setItem('event_reminders', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const handleRemoveEvent = async (eventId: number) => {
    try {
      await unsaveEvent(token!, eventId);
      setSavedEvents(prev => prev.filter(se => se.eventId !== eventId));
      showToast('Event removed from your schedule.', 'info');
    } catch (err) {
      if (err instanceof Error && err.message === 'Authentication failed or session expired') {
        logout('Your session has expired. Please log in again.');
      } else {
        console.error('Failed to remove event:', err);
        showToast('Failed to remove event.', 'error');
      }
    }
  };

  const generateGoogleCalendarUrl = (se: SavedEventFE) => {
    const title = encodeURIComponent(`${se.venueName}: ${se.type}`);
    const details = encodeURIComponent(se.description);
    const location = encodeURIComponent(`${se.city}, ${se.state}`);
    const eventDate = new Date(se.date);
    const startDate = new Date(eventDate.setHours(19, 0, 0)).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDate = new Date(eventDate.setHours(22, 0, 0)).toISOString().replace(/-|:|\.\d\d\d/g, "");
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startDate}/${endDate}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
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
            My Schedule
          </Typography>
        </Box>

        {savedEvents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CalendarMonthIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Your schedule is empty.
            </Typography>
            <Button component={Link} href="/" variant="contained" sx={{ mt: 2 }}>
              Discover Events
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {savedEvents.map((se) => (
              <Grid key={se.id} size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex', justifyContent: 'center', p: 1.5 }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 400 }}>
                  <Box sx={{ position: 'relative', height: 140, width: '100%' }}>
                    <Image
                      src={se.imageUrl || '/LMS_hero_image2.png'}
                      alt={se.venueName}
                      fill
                      sizes="(max-width: 600px) 100vw, 400px"
                      style={{ objectFit: 'cover' }}
                    />
                  </Box>
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, pr: 1 }}>
                        {se.tags && se.tags.length > 0 ? (
                          se.tags.map((tag) => (
                            <Chip key={tag} label={tag} size="small" color="secondary" sx={{ fontWeight: 'bold' }} />
                          ))
                        ) : (
                          <Chip label="Live Performance" size="small" color="secondary" variant="outlined" />
                        )}
                      </Stack>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: -0.5 }}>
                        <Tooltip title={remindedEventIds.has(se.eventId) ? "Remove Reminder" : "Set Reminder"}>
                          <IconButton size="small" color="primary" onClick={() => handleToggleReminder(se.eventId)}>
                            {remindedEventIds.has(se.eventId) ? <NotificationsActiveIcon fontSize="small" /> : <NotificationsNoneIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" color="error" onClick={() => handleRemoveEvent(se.eventId)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="h6" component="h2" gutterBottom sx={{ lineHeight: 1.2 }}>
                      {se.venueName}
                    </Typography>
                    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
                      <CalendarMonthIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                      {new Date(se.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LocationOnIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {se.city}, {se.state}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.primary" sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical',
                      minHeight: '3em',
                      mb: 2
                    }}>
                      {se.description}
                    </Typography>

                    <PairingsSection eventId={se.eventId} type={se.type} />
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                    <Stack spacing={1} sx={{ width: '100%' }}>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        startIcon={<InfoIcon />} 
                        component={Link} 
                        href={`/venues/${se.venueId}`}
                        sx={{ textTransform: 'none' }}
                      >
                        Venue Details
                      </Button>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        color="secondary"
                        startIcon={<EventIcon />} 
                        href={generateGoogleCalendarUrl(se)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ textTransform: 'none' }}
                      >
                        Add to Calendar
                      </Button>
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}
