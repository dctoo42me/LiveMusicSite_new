// server/src/utils/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const isConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                    process.env.CLOUDINARY_CLOUD_NAME !== 'dev_cloud';

if (!isConfigured) {
  logger.warn('Cloudinary is not configured. Media uploads will fail.');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dev_cloud',
  api_key: process.env.CLOUDINARY_API_KEY || 'dev_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'dev_secret',
});

// Configure storage for Venue Images
export const venueImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'forks-feedback/venues',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [{ width: 1200, height: 800, crop: 'limit' }], // Professional default
    };
  },
});

// Configure storage for User Avatars
export const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'forks-feedback/avatars',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }], // Perfect for profile pics
    };
  },
});

export const venueUpload = multer({ 
  storage: venueImageStorage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB Limit
});

export const avatarUpload = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 1 * 1024 * 1024 } // 1MB Limit for avatars
});

export default cloudinary;
