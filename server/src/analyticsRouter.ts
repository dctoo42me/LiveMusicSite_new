// server/src/analyticsRouter.ts
import { Router } from 'express';
import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { verifyToken, authorizeRoles } from './auth.js';
import { logVenueEvent, getVenueMetrics, getSearchHeatmapData } from './analyticsRepository.js';
import { getVenueById } from './venueRepository.js';
import logger from './utils/logger.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

export function createAnalyticsRouter(pool: Pool) {
  const router = Router();

  // POST /log-event (Public - track view/click)
  router.post('/log-event', async (req: Request, res: Response) => {
    const { venueId, eventType } = req.body;
    
    let userId: number | undefined;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.userId;
      } catch (err) {}
    }

    if (!venueId || !eventType) return res.status(400).json({ error: 'venueId and eventType are required.' });

    try {
      await logVenueEvent(pool, parseInt(venueId, 10), eventType, userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to log event.' });
    }
  });

  // GET /venue/:venueId (Operators/Admins - get metrics)
  router.get('/venue/:venueId', verifyToken, authorizeRoles('operator', 'admin'), async (req: Request, res: Response) => {
    const { venueId } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    try {
      const venueIdInt = parseInt(venueId as string, 10);
      const venue = await getVenueById(pool, venueIdInt);
      
      if (!venue) return res.status(404).json({ error: 'Venue not found.' });
      if (venue.ownerId !== userId && userRole !== 'admin') return res.status(403).json({ error: 'Access denied.' });

      const metrics = await getVenueMetrics(pool, venueIdInt);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve metrics.' });
    }
  });

  // GET /search-heatmap (Admins - for visuals)
  router.get('/search-heatmap', verifyToken, authorizeRoles('admin'), async (req: Request, res: Response) => {
    try {
      const data = await getSearchHeatmapData(pool);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve heatmap data.' });
    }
  });

  return router;
}
