// server/src/venueOperatorRouter.ts
import { Router } from 'express';
import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { verifyToken, authorizeRoles } from './auth.js';
import { 
  getVenuesByOwnerId, 
  createEvent, 
  getVenueById, 
  updateVenueMainImage, 
  addVenueImage, 
  getVenueImages, 
  deleteVenueImage,
  getMonthlyEventCount
} from './venueRepository.js';
import { logAction } from './utils/audit.js';
import logger from './utils/logger.js';

export function createVenueOperatorRouter(pool: Pool) {
  const router = Router();

  router.use(verifyToken);
  router.use(authorizeRoles('operator', 'admin'));

  // GET /my-venues (List venues owned by the user)
  router.get('/my-venues', async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    try {
      const venues = await getVenuesByOwnerId(pool, userId);
      res.json(venues);
    } catch (error) {
      logger.error('Get managed venues error:', error);
      res.status(500).json({ error: 'Failed to retrieve your venues.' });
    }
  });

  // POST /:venueId/events (Add event to a venue)
  router.post('/:venueId/events', async (req: Request, res: Response) => {
    const { venueId } = req.params;
    const { date, type, description, tags } = req.body;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (!date || !type || !description) {
      return res.status(400).json({ error: 'Date, type, and description are required.' });
    }

    try {
      const venueIdInt = parseInt(venueId as string, 10);
      const venue = await getVenueById(pool, venueIdInt);

      if (!venue) {
        return res.status(404).json({ error: 'Venue not found.' });
      }

      // Verify ownership (Admins can bypass)
      if (venue.ownerId !== userId && userRole !== 'admin') {
        return res.status(403).json({ error: 'You do not have permission to manage this venue.' });
      }

      // Enforce Tier Limits
      if (venue.subscriptionTier === 'free' && userRole !== 'admin') {
        const eventCount = await getMonthlyEventCount(pool, venueIdInt);
        if (eventCount >= 4) {
          return res.status(403).json({ 
            error: 'Monthly event limit reached for Free tier (4 events). Upgrade to Pro for unlimited events!',
            limitReached: true,
            tier: 'free'
          });
        }
      }

      const newEvent = await createEvent(pool, venueIdInt, date, type, description, tags || []);
      await logAction(pool, userId, 'CREATE_EVENT', 'events', newEvent.id, { venueId: venueIdInt });
      
      res.status(201).json(newEvent);
    } catch (error) {
      logger.error('Create event error:', error);
      res.status(500).json({ error: 'Failed to create event.' });
    }
  });

  // PATCH /:venueId/main-image (Update main venue image)
  router.patch('/:venueId/main-image', async (req: Request, res: Response) => {
    const { venueId } = req.params;
    const { imageUrl } = req.body;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required.' });

    try {
      const venueIdInt = parseInt(venueId as string, 10);
      const venue = await getVenueById(pool, venueIdInt);
      if (!venue) return res.status(404).json({ error: 'Venue not found.' });
      if (venue.ownerId !== userId && userRole !== 'admin') return res.status(403).json({ error: 'Access denied.' });

      const updated = await updateVenueMainImage(pool, venueIdInt, imageUrl);
      await logAction(pool, userId, 'UPDATE_VENUE_MAIN_IMAGE', 'venues', venueIdInt, { imageUrl });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update image.' });
    }
  });

  // POST /:venueId/images (Add secondary image)
  router.post('/:venueId/images', async (req: Request, res: Response) => {
    const { venueId } = req.params;
    const { imageUrl, altText } = req.body;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required.' });

    try {
      const venueIdInt = parseInt(venueId as string, 10);
      const venue = await getVenueById(pool, venueIdInt);
      if (!venue) return res.status(404).json({ error: 'Venue not found.' });
      if (venue.ownerId !== userId && userRole !== 'admin') return res.status(403).json({ error: 'Access denied.' });

      // Enforce Tier Limits
      if (venue.subscriptionTier === 'free' && userRole !== 'admin') {
        const images = await getVenueImages(pool, venueIdInt);
        if (images.length >= 3) {
          return res.status(403).json({ 
            error: 'Gallery image limit reached for Free tier (3 images). Upgrade to Pro for more storage!',
            limitReached: true,
            tier: 'free'
          });
        }
      }

      const newImg = await addVenueImage(pool, venueIdInt, imageUrl, altText);
      await logAction(pool, userId, 'ADD_VENUE_IMAGE', 'venue_images', newImg.id, { venueId: venueIdInt });
      res.status(201).json(newImg);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add image.' });
    }
  });

  // DELETE /:venueId/images/:imageId
  router.delete('/:venueId/images/:imageId', async (req: Request, res: Response) => {
    const { venueId, imageId } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    try {
      const venueIdInt = parseInt(venueId as string, 10);
      const venue = await getVenueById(pool, venueIdInt);
      if (!venue) return res.status(404).json({ error: 'Venue not found.' });
      if (venue.ownerId !== userId && userRole !== 'admin') return res.status(403).json({ error: 'Access denied.' });

      await deleteVenueImage(pool, parseInt(imageId as string, 10), venueIdInt);
      await logAction(pool, userId, 'DELETE_VENUE_IMAGE', 'venue_images', parseInt(imageId as string, 10), { venueId: venueIdInt });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete image.' });
    }
  });

  return router;
}
