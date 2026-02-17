// frontend/app/components/ImageUpload.tsx
'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  CircularProgress, 
  Typography, 
  IconButton, 
  Tooltip 
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useToast } from '@/contexts/ToastContext';

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  type: 'venue' | 'avatar';
  token: string;
  label?: string;
  fullWidth?: boolean;
}

export default function ImageUpload({ onUploadSuccess, type, token, label = "Upload Image", fullWidth = false }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const maxSize = type === 'avatar' ? 1024 * 1024 : 2 * 1024 * 1024; // 1MB vs 2MB
    if (file.size > maxSize) {
      showToast(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`, 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    setSuccess(false);

    try {
      const endpoint = type === 'avatar' ? '/api/media/upload/avatar' : '/api/media/upload/venue';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        onUploadSuccess(data.url);
        setSuccess(true);
        showToast('Image uploaded successfully!', 'success');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <input
        accept="image/*"
        style={{ display: 'none' }}
        id={`raised-button-file-${type}`}
        type="file"
        onChange={handleFileChange}
      />
      <label htmlFor={`raised-button-file-${type}`}>
        <Button
          variant="outlined"
          component="span"
          fullWidth={fullWidth}
          startIcon={uploading ? <CircularProgress size={20} /> : (success ? <CheckCircleIcon color="success" /> : <CloudUploadIcon />)}
          disabled={uploading}
          sx={{ 
            textTransform: 'none', 
            fontWeight: 'bold',
            borderColor: success ? 'success.main' : 'primary.main',
            color: success ? 'success.main' : 'primary.main'
          }}
        >
          {uploading ? 'Uploading...' : (success ? 'Upload Complete' : label)}
        </Button>
      </label>
      {type === 'avatar' && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, textAlign: 'center' }}>
          JPG, PNG or WebP (Max 1MB)
        </Typography>
      )}
    </Box>
  );
}
