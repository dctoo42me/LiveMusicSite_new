'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useColorMode } from '../contexts/ColorModeContext';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useRouter and useSearchParams

// Import Material UI components
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import InputBase from '@mui/material/InputBase';
import { styled, alpha } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider'; // Import Divider


import { BRAND_LOGO_PATH, BRAND_LOGO_LIGHT_PATH } from '../../constants'; // Import both logo paths

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

export default function Header() {
  const { token, user, logout: authLogout } = useAuth();
  const { showToast } = useToast();
  const { mode } = useColorMode();
  const [drawerOpen, setDrawerOpen] = useState(false); // ADD STATE FOR DRAWER
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter(); // Initialize useRouter
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const params = new URLSearchParams();
    params.set('name', searchQuery.trim());
    router.push(`/?${params.toString()}`);
    setSearchQuery('');
  };

  const logout = async () => {
    await authLogout();
    showToast('Logged out successfully', 'success');
  };

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const navItems = [
    { text: 'Performances', href: '/music' },
    { text: 'Dining', href: '/meals' },
    { text: 'About', href: '/about' },
  ];

  return (
    <AppBar position="sticky">
      <Toolbar>
        {/* Logo/Title */}
        {/* FlexGrow on Typography pushes items to the sides */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault(); // Prevent default Link navigation
              let targetPath = '/';
              if (typeof window !== 'undefined') { // Ensure sessionStorage is available
                const storedParams = sessionStorage.getItem('lastSearchParams');
                if (storedParams) {
                  const paramsObject = JSON.parse(storedParams);
                  const newSearchParams = new URLSearchParams();
                  if (paramsObject.location) newSearchParams.set('location', paramsObject.location);
                  if (paramsObject.date) newSearchParams.set('date', paramsObject.date);
                  if (paramsObject.type) newSearchParams.set('type', paramsObject.type);
                  if (paramsObject.limit) newSearchParams.set('limit', paramsObject.limit.toString());
                  if (paramsObject.offset) newSearchParams.set('offset', paramsObject.offset.toString());
                  targetPath = `/?${newSearchParams.toString()}`;
                }
              }
              router.push(targetPath);
            }}
            passHref
            style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}
          >
            <Box
              component="img"
              src={mode === 'light' ? BRAND_LOGO_LIGHT_PATH : BRAND_LOGO_PATH}
              alt="Brand Logo"
              sx={{ height: 48, mr: 1.5, my: 0.5 }} // Increased height and adjusted spacing
            />
            Forks & Feedback
          </Link>
        </Typography>

        <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search venues..."
              inputProps={{ 'aria-label': 'search' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Search>
        </Box>

        {/* Desktop Navigation - before mobile icon on large screens */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          {navItems.map((item) => (
            <Button
              key={item.text}
              color="inherit"
              component={Link}
              href={item.href}
              sx={{
                '&:hover': {
                  color: 'secondary.main', // Use a distinct color for text
                  bgcolor: 'rgba(255, 255, 255, 0.2)', // More visible background
                },
              }}
            >
              {item.text}
            </Button>
          ))}
          
          {token && user ? (
            <>
              <Button color="inherit" component={Link} href="/profile">My Profile</Button>
              {(user.role === 'operator' || user.role === 'admin') && (
                <Button color="inherit" component={Link} href="/manage">Manage Venues</Button>
              )}
              <Button color="inherit" component={Link} href="/favorites">My Favorites</Button>
              <Button color="inherit" component={Link} href="/saved-events">My Schedule</Button>
              <Button color="error" onClick={logout}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} href="/login">Login</Button>
              <Button color="inherit" component={Link} href="/register">Register</Button>
            </>
          )}
        </Box>

        {/* Mobile menu icon - moved to end */}
        <IconButton
          edge="end" // Changed to 'end'
          color="inherit"
          aria-label="open drawer"
          onClick={toggleDrawer(true)}
          sx={{
            ml: 2, // Changed from mr: 2 to ml: 2
            display: { xs: 'flex', md: 'none' },
            justifyContent: 'center',
            alignItems: 'center',
            width: 48,
            height: 48,
            borderRadius: '50%',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&:focus-visible': {
              bgcolor: 'primary.dark',
            }
          }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      <Drawer
        anchor="right" // Changed to 'right'
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <List sx={{ py: 0 }}>
            {navItems.map((item, index) => (
              <React.Fragment key={item.text}>
                <ListItemButton component={Link} href={item.href} sx={{ py: 1.5 }}>
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 'medium' }} />
                </ListItemButton>
                {index < navItems.length - 1 && <Divider />}
              </React.Fragment>
            ))}
            
            <Divider sx={{ borderBottomWidth: 2, bgcolor: 'rgba(0,0,0,0.1)' }} />

            {token && user ? (
              <>
                <ListItemButton component={Link} href="/profile" sx={{ py: 1.5 }}>
                  <ListItemText primary="My Profile" />
                </ListItemButton>
                <Divider />
                {(user.role === 'operator' || user.role === 'admin') && (
                  <>
                    <ListItemButton component={Link} href="/manage" sx={{ py: 1.5 }}>
                      <ListItemText primary="Manage Venues" />
                    </ListItemButton>
                    <Divider />
                  </>
                )}
                <ListItemButton component={Link} href="/favorites" sx={{ py: 1.5 }}>
                  <ListItemText primary="My Favorites" />
                </ListItemButton>
                <Divider />
                <ListItemButton component={Link} href="/saved-events" sx={{ py: 1.5 }}>
                  <ListItemText primary="My Schedule" />
                </ListItemButton>
                <Divider />
                <ListItemButton onClick={logout} sx={{ py: 1.5 }}>
                  <ListItemText primary="Logout" primaryTypographyProps={{ color: 'error.main' }} />
                </ListItemButton>
              </>
            ) : (
              <>
                <ListItemButton component={Link} href="/login" sx={{ py: 1.5 }}>
                  <ListItemText primary="Login" />
                </ListItemButton>
                <Divider />
                <ListItemButton component={Link} href="/register" sx={{ py: 1.5 }}>
                  <ListItemText primary="Register" />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}