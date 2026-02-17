// frontend/app/meals/page.tsx
'use client';

import { Container, Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { useRouter } from 'next/navigation';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WineBarIcon from '@mui/icons-material/WineBar';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CoffeeIcon from '@mui/icons-material/Coffee';

const VIBES = [
  { name: 'Dinner & Show', type: 'both', icon: <RestaurantIcon fontSize="large" />, color: '#e91e63' },
  { name: 'Craft Cocktails', type: 'music', icon: <LocalBarIcon fontSize="large" />, color: '#673ab7' },
  { name: 'Late Night Bites', type: 'both', icon: <FastfoodIcon fontSize="large" />, color: '#ff5722' },
  { name: 'Wine & Jazz', type: 'music', icon: <WineBarIcon fontSize="large" />, color: '#3f51b5' },
  { name: 'Cafe & Acoustic', type: 'music', icon: <CoffeeIcon fontSize="large" />, color: '#795548' },
  { name: 'Gala & Performance', type: 'both', icon: <CelebrationIcon fontSize="large" />, color: '#607d8b' },
];

export default function DiningPage() {
  const router = useRouter();

  const handleVibeClick = (type: string) => {
    // Redirect to search with this experience type pre-selected
    router.push(`/?type=${type}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 6, textAlign: { xs: 'center', md: 'left' } }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          The <Typography component="span" variant="inherit" color="secondary">Forks</Typography> Side of Life
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600 }}>
          Explore curated dining experiences perfectly paired with live entertainment.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {VIBES.map((vibe) => (
          <Grid key={vibe.name} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card 
              sx={{ 
                height: '100%', 
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-8px)', boxShadow: 6 }
              }}
            >
              <CardActionArea 
                onClick={() => handleVibeClick(vibe.type)}
                sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <Box sx={{ 
                  p: 2, 
                  borderRadius: '50%', 
                  bgcolor: `${vibe.color}22`,
                  color: vibe.color,
                  mb: 2
                }}>
                  {vibe.icon}
                </Box>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" component="h2" fontWeight="bold">
                    {vibe.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Browse {vibe.name} pairings
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
