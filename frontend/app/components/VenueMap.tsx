// frontend/app/components/VenueMap.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMapsLibrary,
  useMap,
  APIProvider
} from '@vis.gl/react-google-maps';
import { Venue } from '@/types/venue';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Tooltip from '@mui/material/Tooltip';
import VerifiedIcon from '@mui/icons-material/Verified';
import GPPGoodIcon from '@mui/icons-material/GppGood';
import Link from 'next/link';
import Image from 'next/image';

interface VenueMapProps {
  venues: Venue[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

interface GeocodedVenue extends Venue {
  position: google.maps.LatLngLiteral;
}

// Default center (Austin, TX)
const DEFAULT_CENTER = { lat: 30.2672, lng: -97.7431 };
const MAP_ID = 'DEMO_MAP_ID';

function MapContent({ venues, center = DEFAULT_CENTER, zoom = 14 }: VenueMapProps) {
  const [selectedVenue, setSelectedVenue] = useState<GeocodedVenue | null>(null);
  const [geocodedVenues, setGeocodedVenues] = useState<GeocodedVenue[]>([]);
  const geocodingLib = useMapsLibrary('geocoding');
  const coreLib = useMapsLibrary('core');
  const map = useMap();

  // 1. Handle Geocoding
  useEffect(() => {
    if (!geocodingLib || venues.length === 0) {
      if (venues.length === 0) setGeocodedVenues([]);
      return;
    }

    // Reset selection when venues change
    setSelectedVenue(null);

    // Deduplicate venues by venueId to avoid overlapping markers
    const uniqueVenues = Array.from(new Map(venues.map(v => [v.venueId, v])).values());

    const geocoder = new geocodingLib.Geocoder();
    const geocodePromises = uniqueVenues.map(async (venue) => {
      const address = `${venue.name}, ${venue.city}, ${venue.state}`;
      try {
        const result = await geocoder.geocode({ address });
        if (result.results[0]) {
          const { lat, lng } = result.results[0].geometry.location;
          return { ...venue, position: { lat: lat(), lng: lng() } };
        }
      } catch (error) {
        console.warn(`Geocoding failed for ${address}:`, error);
      }
      return null;
    });

    Promise.all(geocodePromises).then((results) => {
      const validVenues = results.filter((v): v is GeocodedVenue => v !== null);
      setGeocodedVenues(validVenues);
    });
  }, [geocodingLib, venues]);

  // 2. Automatically Fit Bounds
  useEffect(() => {
    if (!map || !coreLib || geocodedVenues.length === 0) return;

    const bounds = new coreLib.LatLngBounds();
    geocodedVenues.forEach(v => bounds.extend(v.position));
    
    // Use a small timeout to ensure the map is ready for a bounds change
    const timeout = setTimeout(() => {
        if (geocodedVenues.length === 1) {
            map.setCenter(geocodedVenues[0].position);
            map.setZoom(16); // Neighborhood level zoom for single venue
        } else {
            map.fitBounds(bounds, 50);
        }
    }, 100);

    return () => clearTimeout(timeout);
  }, [map, coreLib, geocodedVenues]);

  return (
    <GoogleMap
      defaultCenter={center}
      defaultZoom={zoom}
      mapId={MAP_ID}
      gestureHandling={'cooperative'}
      disableDefaultUI={false}
    >
      {geocodedVenues.map((venue) => (
        <AdvancedMarker
          key={venue.id}
          position={venue.position}
          title={venue.name}
          onClick={() => {
            console.log('Marker clicked:', venue.name);
            setSelectedVenue(venue);
          }}
        >
          <Pin 
            background={venue.type === 'music' ? '#03a9f4' : venue.type === 'meals' ? '#2e7d32' : '#ed6c02'} 
            glyphColor={'#fff'} 
            borderColor={'#000'} 
          />
        </AdvancedMarker>
      ))}

      {selectedVenue && (
        <InfoWindow
          position={selectedVenue.position}
          onCloseClick={() => setSelectedVenue(null)}
          headerDisabled={true}
        >
          <Box sx={{ minWidth: 180, maxWidth: 220, color: '#000', overflow: 'hidden', position: 'relative' }}>
            {/* Custom Close Button */}
            <IconButton
              size="small"
              onClick={() => setSelectedVenue(null)}
              sx={{
                position: 'absolute',
                right: 4,
                top: 4,
                zIndex: 1,
                bgcolor: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                boxShadow: 1
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>

            {selectedVenue.imageUrl && (
              <Box sx={{ position: 'relative', width: '100%', height: 100, mb: 1 }}>
                <Image
                  src={selectedVenue.imageUrl}
                  alt={selectedVenue.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </Box>
            )}
            <Box sx={{ p: 1.5, pt: selectedVenue.imageUrl ? 0 : 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#000', lineHeight: 1.2, flexGrow: 1 }}>
                  {selectedVenue.name}
                </Typography>
                {selectedVenue.verificationStatus === 'OWNER_VERIFIED' && (
                    <Tooltip title="Verified Venue">
                        <VerifiedIcon color="success" sx={{ fontSize: '1rem' }} />
                    </Tooltip>
                )}
                {selectedVenue.verificationStatus === 'COMMUNITY_VERIFIED' && (
                    <Tooltip title="Community Verified">
                        <GPPGoodIcon color="info" sx={{ fontSize: '1rem' }} />
                    </Tooltip>
                )}
              </Box>
              <Typography variant="body2" sx={{ mb: 1.5, color: '#666' }}>
                {selectedVenue.city}, {selectedVenue.state}
              </Typography>
              <Button 
                size="small" 
                variant="contained" 
                component={Link} 
                href={`/venues/${selectedVenue.venueId}`}
                fullWidth
                sx={{ textTransform: 'none' }}
              >
                View Details
              </Button>
            </Box>
          </Box>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

export default function VenueMap(props: VenueMapProps) {
  return (
    <Box sx={{ width: '100%', height: '300px', borderRadius: 2, overflow: 'hidden', boxShadow: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
      <MapContent {...props} />
    </Box>
  );
}
