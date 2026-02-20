'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Tooltip, IconButton, Typography, ClickAwayListener } from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import FastfoodIcon from '@mui/icons-material/Fastfood';

interface ServiceIconsProps {
  foodServiceType: 'none' | 'bar_bites' | 'full_menu';
  barServiceType: 'none' | 'non_alcoholic' | 'alcoholic_only' | 'full_bar';
  size?: 'small' | 'medium' | 'large';
}

const iconSizeMap = {
  small: '1rem',
  medium: '1.25rem',
  large: '1.5rem',
};

export default function ServiceIcons({ foodServiceType, barServiceType, size = 'medium' }: ServiceIconsProps) {
  console.log('ServiceIcons: Received props:', { foodServiceType, barServiceType }); // Added log
  const [openFoodTooltip, setOpenFoodTooltip] = useState(false);
  const [openBarTooltip, setOpenBarTooltip] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTooltipOpen = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setter(false);
    }, 2000); // Auto-dismiss after 2 seconds
  };

  const handleTooltipClose = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const getFoodTooltipText = () => {
    switch (foodServiceType) {
      case 'full_menu':
        return 'Full Menu Available';
      case 'bar_bites':
        return 'Bar Bites & Snacks';
      case 'none':
        return 'No Food Service';
      default:
        return '';
    }
  };

  const getBarTooltipText = () => {
    switch (barServiceType) {
      case 'full_bar':
        return 'Full Bar Available (Alcoholic & Non-Alcoholic)';
      case 'alcoholic_only':
        return 'Alcoholic Beverages Only';
      case 'non_alcoholic':
        return 'Non-Alcoholic Beverages Only';
      case 'none':
        return 'No Beverage Service';
      default:
        return '';
    }
  };

  const foodIcon = (() => {
    const iconProps = { fontSize: size, color: 'inherit' };
    switch (foodServiceType) {
      case 'full_menu':
        return <RestaurantIcon {...iconProps} color="success" />;
      case 'bar_bites':
        return <FastfoodIcon {...iconProps} color="warning" />;
      case 'none':
        return <DoNotDisturbIcon {...iconProps} color="error" />;
      default:
        return null;
    }
  })();

  const barIcon = (() => {
    const iconProps = { fontSize: size, color: 'inherit' };
    switch (barServiceType) {
      case 'full_bar':
        return <LocalBarIcon {...iconProps} color="primary" />;
      case 'alcoholic_only':
        return <LocalBarIcon {...iconProps} color="primary" sx={{ opacity: 0.7 }} />;
      case 'non_alcoholic':
        return <LocalCafeIcon {...iconProps} color="info" />;
      case 'none':
        return <DoNotDisturbIcon {...iconProps} color="error" />;
      default:
        return null;
    }
  })();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {foodIcon && (
        <ClickAwayListener onClickAway={() => handleTooltipClose(setOpenFoodTooltip)}>
          <Tooltip 
            title={<Typography variant="caption">{getFoodTooltipText()}</Typography>} 
            placement="top" 
            arrow 
            open={openFoodTooltip}
            disableFocusListener
            disableHoverListener
            disableTouchListener
          >
            <IconButton 
              size={size} 
              onClick={() => handleTooltipOpen(setOpenFoodTooltip)} 
              sx={{ p: 0.2 }}
            >
              {foodIcon}
            </IconButton>
          </Tooltip>
        </ClickAwayListener>
      )}

      {barIcon && (
        <ClickAwayListener onClickAway={() => handleTooltipClose(setOpenBarTooltip)}>
          <Tooltip 
            title={<Typography variant="caption">{getBarTooltipText()}</Typography>} 
            placement="top" 
            arrow 
            open={openBarTooltip}
            disableFocusListener
            disableHoverListener
            disableTouchListener
          >
            <IconButton 
              size={size} 
              onClick={() => handleTooltipOpen(setOpenBarTooltip)} 
              sx={{ p: 0.2 }}
            >
              {barIcon}
            </IconButton>
          </Tooltip>
        </ClickAwayListener>
      )}
    </Box>
  );
}
