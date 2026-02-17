import React, { useState, FormEvent, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Collapse,
  Typography,
  Stack,
  InputAdornment, // Added for "Near Me" button
  IconButton,     // Added for "Near Me" button
  Tooltip,         // Added for "Near Me" button
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MyLocationIcon from '@mui/icons-material/MyLocation'; // Added for "Near Me" button
import ClearIcon from '@mui/icons-material/Clear'; // Added for "Delete" button
import { useToast } from '../contexts/ToastContext'; // Import useToast
import { useMapsLibrary } from '@vis.gl/react-google-maps'; // Added for Autocomplete

// Define the props the component will receive
interface SearchFormProps {
    initialLocation: string;
    initialStartDate: string;
    initialEndDate: string;
    initialType: string;
    initialTag?: string;
    onSearchSubmit: (location: string, startDate: string, endDate: string, type: string, tag: string, lat?: number, lng?: number) => void;
    isLoading: boolean;
}

export default function SearchForm({
    initialLocation,
    initialStartDate,
    initialEndDate,
    initialType,
    initialTag = 'all',
    onSearchSubmit,
    isLoading
}: SearchFormProps) {
    // STATE MANAGEMENT: Now uses props as initial values and calls onSearchSubmit
    const [location, setLocation] = useState(initialLocation);
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [type, setType] = useState(initialType);
    const [tag, setTag] = useState(initialTag);
    const [showAdvanced, setShowAdvanced] = useState(false); // Toggle for advanced search
    const [isLocating, setIsLocating] = useState(false); // Loading state for geolocation
    const { showToast } = useToast();

    // Autocomplete Logic
    const inputRef = useRef<HTMLInputElement>(null);
    const placesLib = useMapsLibrary('places');

    useEffect(() => {
        if (!placesLib || !inputRef.current) return;

        const options = {
            types: ['(regions)'],
            componentRestrictions: { country: 'us' },
            fields: ['formatted_address', 'geometry', 'name'] // Explicitly request needed fields
        };

        const autocomplete = new placesLib.Autocomplete(inputRef.current, options);

        const listener = autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place && place.formatted_address) {
                setLocation(place.formatted_address);
                
                // If coordinates are available, trigger search immediately with them
                if (place.geometry?.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    onSearchSubmit(place.formatted_address, startDate, endDate, type, tag, lat, lng);
                }
            }
        });

        return () => {
            if (listener) {
                google.maps.event.removeListener(listener);
            }
        };
    }, [placesLib, startDate, endDate, type, tag, onSearchSubmit]);

    // Geolocation Handler
    const handleNearMe = () => {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by your browser.', 'error');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

                try {
                    // Call Google Reverse Geocoding API
                    const response = await fetch(
                        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
                    );
                    const data = await response.json();

                    if (data.status === 'OK' && data.results.length > 0) {
                        // Find the locality (city) and administrative_area_level_1 (state)
                        const addressComponents = data.results[0].address_components;
                        let city = '';
                        let state = '';

                        for (const component of addressComponents) {
                            if (component.types.includes('locality')) {
                                city = component.long_name;
                            }
                            if (component.types.includes('administrative_area_level_1')) {
                                state = component.short_name;
                            }
                        }

                        if (city && state) {
                            const formattedLocation = `${city}, ${state}`;
                            setLocation(formattedLocation);
                            showToast(`Location set to ${city}, ${state}`, 'success');
                            
                            // Trigger search immediately with coordinates
                            onSearchSubmit(formattedLocation, startDate, endDate, type, tag, latitude, longitude);
                        } else {
                            showToast('Could not determine city and state.', 'warning');
                        }
                    } else {
                        throw new Error(data.error_message || 'Geocoding failed');
                    }
                } catch (error) {
                    console.error('Reverse Geocoding Error:', error);
                    showToast('Failed to retrieve location address.', 'error');
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                console.error('Geolocation Error:', error);
                showToast('Unable to retrieve your location.', 'error');
                setIsLocating(false);
            }
        );
    };

    // Date Helper Logic
    const setToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
    };

    const setThisWeekend = () => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
        
        // Find coming Friday
        const fri = new Date(today);
        const daysToFri = (5 - dayOfWeek + 7) % 7;
        
        // If it is Friday, Saturday or Sunday, we use this weekend.
        // Otherwise we look forward to the next Friday.
        let targetFri;
        if (dayOfWeek >= 5 || dayOfWeek === 0) {
            targetFri = new Date(today);
            if (dayOfWeek === 6) targetFri.setDate(today.getDate() - 1);
            if (dayOfWeek === 0) targetFri.setDate(today.getDate() - 2);
        } else {
            targetFri = new Date(today);
            targetFri.setDate(today.getDate() + daysToFri);
        }
        
        const targetSun = new Date(targetFri);
        targetSun.setDate(targetFri.getDate() + 2);

        setStartDate(targetFri.toISOString().split('T')[0]);
        setEndDate(targetSun.toISOString().split('T')[0]);
    };

    const setNext30Days = () => {
        const today = new Date();
        const thirtyDaysLater = new Date(today);
        thirtyDaysLater.setDate(today.getDate() + 30);

        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(thirtyDaysLater.toISOString().split('T')[0]);
    };

    // API SUBMIT LOGIC: Now calls the onSearchSubmit prop
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        onSearchSubmit(location, startDate, endDate, type, tag);
    };
    
    // JSX RENDER: Only the form is left
    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
                p: { xs: 2, md: 4 }, // Responsive padding
                bgcolor: 'background.paper',
                borderRadius: 3, // Slightly rounder for a modern feel
                boxShadow: 4, // More depth
            }}
        >
            <Stack spacing={3}>
                {/* Search Header/Instruction */}
                <Box>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        Discover Your Next Outing
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Enter a location to find unique dining and live entertainment pairings.
                    </Typography>
                </Box>

                {/* Main Search Row */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' }, // Column on small, row on medium+
                        gap: 2, // Spacing between items
                        alignItems: 'center', // Align items vertically
                    }}
                >
                    <TextField
                        id="location"
                        label="Location"
                        variant="outlined"
                        fullWidth
                        value={location}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                        placeholder="City, State, or Zip Code"
                        required
                        sx={{ flex: 1 }} // Take available space
                        inputRef={inputRef} // Added for Autocomplete
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    {location && (
                                        <Tooltip title="Clear search">
                                            <IconButton
                                                aria-label="clear search"
                                                onClick={() => {
                                                    setLocation('');
                                                    // Also notify parent to clear coordinates
                                                    onSearchSubmit('', startDate, endDate, type, tag, undefined, undefined);
                                                }}
                                                edge="end"
                                                size="small"
                                                sx={{ mr: 0.5 }}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    <Tooltip title="Find events near me">
                                        <IconButton
                                            aria-label="use current location"
                                            onClick={handleNearMe}
                                            disabled={isLocating}
                                            edge="end"
                                        >
                                            {isLocating ? <CircularProgress size={20} /> : <MyLocationIcon />}
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={isLoading}
                        sx={{ height: '56px', width: { xs: '100%', md: 'auto' }, minWidth: 120 }} 
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
                    </Button>
                </Box>

                {/* Advanced Search Toggle */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Button
                        size="small"
                        startIcon={<TuneIcon />}
                        endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        sx={{ color: 'text.secondary', textTransform: 'none' }}
                    >
                        {showAdvanced ? 'Hide Advanced Options' : 'More Search Options'}
                    </Button>
                </Box>

                {/* Advanced Search Section (Dropdown) */}
                <Collapse in={showAdvanced}>
                    <Box sx={{ 
                        mt: 2, 
                        p: 2, 
                        bgcolor: 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                            <Button 
                                size="small" 
                                variant="outlined" 
                                onClick={setToday}
                                sx={{ borderRadius: 4, textTransform: 'none' }}
                            >
                                Today
                            </Button>
                            <Button 
                                size="small" 
                                variant="outlined" 
                                onClick={setThisWeekend}
                                sx={{ borderRadius: 4, textTransform: 'none' }}
                            >
                                This Weekend
                            </Button>
                            <Button 
                                size="small" 
                                variant="outlined" 
                                onClick={setNext30Days}
                                sx={{ borderRadius: 4, textTransform: 'none' }}
                            >
                                Next 30 Days
                            </Button>
                            <Button 
                                size="small" 
                                variant="outlined" 
                                onClick={handleNearMe}
                                disabled={isLocating}
                                startIcon={isLocating ? <CircularProgress size={16} /> : <MyLocationIcon sx={{ fontSize: '1rem' }} />}
                                sx={{ borderRadius: 4, textTransform: 'none' }}
                            >
                                Near Me
                            </Button>
                        </Stack>

                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 2,
                                alignItems: 'center',
                            }}
                        >
                            <TextField
                                id="startDate"
                                label="From Date"
                                type="date"
                                variant="outlined"
                                fullWidth
                                value={startDate}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ flex: 1 }}
                            />
                            <TextField
                                id="endDate"
                                label="To Date"
                                type="date"
                                variant="outlined"
                                fullWidth
                                value={endDate}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ flex: 1 }}
                            />
                            <FormControl sx={{ width: { xs: '100%', md: '200px' } }}>
                                <InputLabel id="tag-select-label">Performance Type</InputLabel>
                                <Select
                                    labelId="tag-select-label"
                                    id="tag"
                                    value={tag}
                                    label="Performance Type"
                                    onChange={(e) => setTag(e.target.value as string)}
                                >
                                    <MenuItem value="all">All Performances</MenuItem>
                                    <MenuItem value="Acoustic">Acoustic / Unplugged</MenuItem>
                                    <MenuItem value="Classical">Classical</MenuItem>
                                    <MenuItem value="Symphony">Symphony / Orchestra</MenuItem>
                                    <MenuItem value="Quartet">String Quartet</MenuItem>
                                    <MenuItem value="Jazz">Jazz</MenuItem>
                                    <MenuItem value="Blues">Blues</MenuItem>
                                    <MenuItem value="R&B">R&B / Soul</MenuItem>
                                    <MenuItem value="Latin">Latin / Salsa</MenuItem>
                                    <MenuItem value="Rock">Rock</MenuItem>
                                    <MenuItem value="Country">Country / Western</MenuItem>
                                    <MenuItem value="Piano">Piano Bar</MenuItem>
                                    <MenuItem value="Solo">Solo Performer</MenuItem>
                                    <MenuItem value="DJ">DJ / Electronic</MenuItem>
                                    <MenuItem value="Karaoke">Karaoke</MenuItem>
                                    <MenuItem value="Stand-up">Stand-up Comedy</MenuItem>
                                    <MenuItem value="Magician">Magician / Variety</MenuItem>
                                    <MenuItem value="Open Mic">Open Mic</MenuItem>
                                    <MenuItem value="Trivia">Trivia Night</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </Collapse>
            </Stack>
        </Box>
    );
}
