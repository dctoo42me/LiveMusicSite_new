// frontend/app/about/page.tsx
import type { Metadata } from 'next';
import { Container, Box, Typography, Grid, Paper, Stack } from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MapIcon from '@mui/icons-material/Map';

export const metadata: Metadata = {
  title: 'About Us | Forks & Feedback',
}

export default function AboutPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 8, textAlign: { xs: 'center', md: 'left' } }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          The Art of the <Typography component="span" variant="inherit" color="primary">Outing</Typography>
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, lineHeight: 1.6 }}>
          Welcome to <strong>Forks & Feedback</strong>, a premium discovery platform dedicated to the perfect pairing of culinary excellence and live entertainment. We believe that a great meal is best enjoyed with a side of performance.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Mission Statement */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ p: 4, height: '100%', bgcolor: 'background.paper', borderRadius: 3, boxShadow: 2, borderLeft: '6px solid', borderColor: 'primary.main' }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Our Mission
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              We simplify the search for local experiences by curating only the venues that offer both exceptional dining and professional live performances. From intimate acoustic sets over craft cocktails to grand orchestral galas, we help you find the rhythm of your city.
            </Typography>
          </Box>
        </Grid>

        {/* Discovery Hubs */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ p: 4, height: '100%', bgcolor: 'background.paper', borderRadius: 3, boxShadow: 2, borderLeft: '6px solid', borderColor: 'secondary.main' }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Curated Discovery
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Don&apos;t just search—explore. Our dedicated <strong>Performances</strong> and <strong>Dining</strong> hubs allow you to browse by genre and vibe, helping you discover new favorites based on the specific type of entertainment you crave.
            </Typography>
          </Box>
        </Grid>

        {/* Feature Grid */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h4" fontWeight="bold" align="center" sx={{ mt: 4, mb: 6 }}>
            Modern Tools for Modern Plans
          </Typography>
          <Grid container spacing={3}>
            {[
              { 
                title: 'Proximity Search', 
                desc: 'Use our advanced Radius Search to find events happening in your immediate area or specific zip codes.', 
                icon: <ExploreIcon color="primary" /> 
              },
              { 
                title: 'Interactive Mapping', 
                desc: 'Visualize your options with our custom-tuned map, featuring live venue details and neighborhood-level zoom.', 
                icon: <MapIcon color="primary" /> 
              },
              { 
                title: 'Personalized Schedule', 
                desc: 'Build your night. Save specific events to "My Schedule" and never miss a beat.', 
                icon: <CalendarMonthIcon color="primary" /> 
              },
              { 
                title: 'Venue Favorites', 
                desc: 'Keep a curated list of the destinations you love most for quick access and planning.', 
                icon: <FavoriteIcon color="primary" /> 
              }
            ].map((feature) => (
              <Grid key={feature.title} size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 3, height: '100%', textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)' }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Ready to find your next favorite spot? Start exploring the <strong>Forks & Feedback</strong> experience today.
        </Typography>
      </Box>
    </Container>
  );
}
