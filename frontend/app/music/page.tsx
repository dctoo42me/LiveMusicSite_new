// frontend/app/music/page.tsx
'use client';

import { Container, Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { useRouter } from 'next/navigation';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import MicExternalOnIcon from '@mui/icons-material/MicExternalOn';
import PianoIcon from '@mui/icons-material/Piano';
import NightlifeIcon from '@mui/icons-material/Nightlife';
import GroupsIcon from '@mui/icons-material/Groups';

const GENRES = [
  { name: 'Jazz', icon: <MusicNoteIcon fontSize="large" />, color: '#9c27b0' },
  { name: 'Rock', icon: <NightlifeIcon fontSize="large" />, color: '#f44336' },
  { name: 'Karaoke', icon: <MicExternalOnIcon fontSize="large" />, color: '#03a9f4' },
  { name: 'Stand-up', label: 'Comedy', icon: <TheaterComedyIcon fontSize="large" />, color: '#ff9800' },
  { name: 'Piano', label: 'Piano Bar', icon: <PianoIcon fontSize="large" />, color: '#4caf50' },
  { name: 'Acoustic', icon: <GroupsIcon fontSize="large" />, color: '#795548' },
];

export default function PerformancesPage() {
  const router = useRouter();

  const handleGenreClick = (genre: string) => {
    // Redirect to search with this tag pre-selected
    // Using a default location like Austin for the demo logic if no location is set
    router.push(`/?tag=${encodeURIComponent(genre)}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 6, textAlign: { xs: 'center', md: 'left' } }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Browse by <Typography component="span" variant="inherit" color="primary">Performance</Typography>
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600 }}>
          Find the perfect rhythm for your night out. Choose a genre to see who&apos;s taking the stage.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {GENRES.map((genre) => (
          <Grid key={genre.name} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card 
              sx={{ 
                height: '100%', 
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-8px)', boxShadow: 6 }
              }}
            >
              <CardActionArea 
                onClick={() => handleGenreClick(genre.name)}
                sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <Box sx={{ 
                  p: 2, 
                  borderRadius: '50%', 
                  bgcolor: `${genre.color}22`, // 22 is ~13% opacity
                  color: genre.color,
                  mb: 2
                }}>
                  {genre.icon}
                </Box>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" component="h2" fontWeight="bold">
                    {genre.label || genre.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Discover {genre.label || genre.name} venues & sessions
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
