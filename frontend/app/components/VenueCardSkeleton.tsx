// frontend/app/components/VenueCardSkeleton.tsx
import React from 'react';
import { Card, CardContent, CardActions, Box, Skeleton, Grid } from '@mui/material';

const VenueCardSkeleton = () => {
  return (
    <Card
      variant="elevation"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        maxWidth: 400,
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Skeleton variant="rectangular" height={140} animation="wave" />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rounded" width={60} height={20} animation="wave" />
            <Skeleton variant="rounded" width={60} height={20} animation="wave" />
          </Box>
          <Skeleton variant="circular" width={32} height={32} animation="wave" />
        </Box>
        <Skeleton variant="text" width="80%" height={32} animation="wave" />
        <Skeleton variant="text" width="40%" height={20} animation="wave" />
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="text" width="100%" animation="wave" />
          <Skeleton variant="text" width="100%" animation="wave" />
          <Skeleton variant="text" width="60%" animation="wave" />
        </Box>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Box sx={{ width: '100%' }}>
          <Skeleton variant="rectangular" width="100%" height={36} sx={{ mb: 1, borderRadius: 1 }} animation="wave" />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rectangular" width="50%" height={32} sx={{ borderRadius: 1 }} animation="wave" />
            <Skeleton variant="rectangular" width="50%" height={32} sx={{ borderRadius: 1 }} animation="wave" />
          </Box>
        </Box>
      </CardActions>
    </Card>
  );
};

export default VenueCardSkeleton;
