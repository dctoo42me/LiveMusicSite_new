// server/src/favoritesRouter.ts
import express from 'express';
import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { verifyToken } from './auth.js';
import { addFavorite, removeFavorite, getFavorites } from './favoriteRepository.js';
import logger from './utils/logger.js';
import { logAction } from './utils/audit.js';

export function createFavoritesRouter(pool: Pool) {
  const router = express.Router();

  router.use(verifyToken); // Apply verifyToken to all routes in this router

  // Note: All routes in this router are automatically prefixed with /api/favorites

  // POST / (which corresponds to /api/favorites)
  router.post('/', async (req: Request, res: Response) => {
    const { venueId } = req.body;
    const userId = (req as any).user.userId;

    if (!venueId) {
      return res.status(400).json({ error: 'Venue ID is required.' });
    }

    if (!venueId) {
      return res.status(400).json({ error: 'Venue ID is required.' });
    }

    try {
      const favorite = await addFavorite(pool, userId, venueId);
      if (favorite) {
        // Log the action
        await logAction(pool, userId, 'ADD_FAVORITE', 'venues', venueId);
        res.status(201).json(favorite);
      } else {
        res.status(409).json({ error: 'This venue is already in your favorites.' });
      }
    } catch (error) {
      logger.error('Add favorite error:', error);
      res.status(500).json({ error: 'Failed to add favorite.' });
    }
  });

  // DELETE /:venueId (which corresponds to /api/favorites/:venueId)
  router.delete('/:venueId', async (req: Request, res: Response) => {
    const { venueId } = req.params;
    const userId = (req as any).user.userId;

    if (!venueId) {
      return res.status(400).json({ error: 'Venue ID is required.' });
    }

    if (!venueId) {
      return res.status(400).json({ error: 'Venue ID is required.' });
    }

    try {
      const venueIdInt = parseInt(venueId as string, 10);
      await removeFavorite(pool, userId, venueIdInt);
      // Log the action
      await logAction(pool, userId, 'REMOVE_FAVORITE', 'venues', venueIdInt);
      res.status(204).send();
    } catch (error) {
      logger.error('Remove favorite error:', error);
      res.status(500).json({ error: 'Failed to remove favorite.' });
    }
  });

  // GET / (which corresponds to /api/favorites)
  router.get('/', async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const favorites = await getFavorites(pool, userId, limit, offset);
      res.json(favorites);
    } catch (error) {
      logger.error('Get favorites error:', error);
      res.status(500).json({ error: 'Failed to retrieve favorites.' });
    }
  });

  return router;
}
