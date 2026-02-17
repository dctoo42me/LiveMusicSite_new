// server/src/mediaRouter.ts
import { Router } from 'express';
import type { Request, Response } from 'express';
import { verifyToken, authorizeRoles } from './auth.js';
import { venueUpload, avatarUpload } from './utils/cloudinary.js';
import { logAction } from './utils/audit.js';
import { Pool } from 'pg';

export function createMediaRouter(pool: Pool) {
  const router = Router();

  // POST /upload/venue - Operators only
  router.post('/upload/venue', verifyToken, authorizeRoles('operator', 'admin'), venueUpload.single('image'), async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided or file too large.' });
    }

    try {
      // The file is already uploaded to Cloudinary by multer-storage-cloudinary
      const secureUrl = (req.file as any).path;
      
      await logAction(pool, userId, 'UPLOAD_IMAGE', 'media', null, { url: secureUrl, type: 'venue' });
      
      res.json({ url: secureUrl });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process upload.' });
    }
  });

  // POST /upload/avatar - Any registered user
  router.post('/upload/avatar', verifyToken, avatarUpload.single('image'), async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No image provided or file too large.' });
    }

    try {
      const secureUrl = (req.file as any).path;
      
      await logAction(pool, userId, 'UPLOAD_IMAGE', 'media', userId, { url: secureUrl, type: 'avatar' });
      
      res.json({ url: secureUrl });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process upload.' });
    }
  });

  return router;
}
