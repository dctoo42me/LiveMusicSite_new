// server/src/venueRouter.ts
import { Router } from 'express';
import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { verifyToken } from './auth.js';
import { submitVenueFeedback, getVenueImages, getVenueById, getAllVenueIds } from './venueRepository.js';
import { createSupportTicket } from './supportRepository.js';
import { logAction } from './utils/audit.js';
import logger from './utils/logger.js';

export function createVenueRouter(pool: Pool) {
  const router = Router();

  // GET /ids (List all venue IDs - PUBLIC for SEO)
  router.get('/ids', async (req: Request, res: Response) => {
    try {
      const ids = await getAllVenueIds(pool);
      res.json(ids);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve IDs.' });
    }
  });

  // GET /:id/images (Get secondary images for a venue - PUBLIC)
  router.get('/:id/images', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const images = await getVenueImages(pool, parseInt(id as string, 10));
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get images.' });
    }
  });

  // POST /:id/report (Report inaccurate venue data)
  router.post('/:id/report', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason, description, email, name } = req.body;

    if (!reason || !description || !email || !name) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
      const venueIdInt = parseInt(id as string, 10);
      const venue = await getVenueById(pool, venueIdInt);
      
      if (!venue) return res.status(404).json({ error: 'Venue not found.' });

      const subject = `VENUE REPORT: ${venue.name} (#${venueIdInt}) - ${reason}`;
      const message = `Issue reported by ${name}: ${description}`;

      const ticket = await createSupportTicket(pool, name, email, subject, message);
      await logAction(pool, null, 'REPORT_VENUE', 'venues', venueIdInt, { reason, ticketId: ticket.id });

      res.status(201).json({ message: 'Report submitted. Thank you for helping keep our data accurate!' });
    } catch (error) {
      logger.error('Venue report error:', error);
      res.status(500).json({ error: 'Failed to submit report.' });
    }
  });

  // POST /:id/feedback (Submit crowdsourced verification)
  router.post('/:id/feedback', verifyToken, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { hasLivePerformance, suggestedWebsite } = req.body;
    const userId = (req as any).user.userId;

    if (hasLivePerformance === undefined) {
      return res.status(400).json({ error: 'hasLivePerformance field is required.' });
    }

    try {
      const venueIdInt = parseInt(id as string, 10);
      await submitVenueFeedback(pool, userId, venueIdInt, hasLivePerformance, suggestedWebsite);
      
      await logAction(pool, userId, 'SUBMIT_VERIFICATION_FEEDBACK', 'venues', venueIdInt, { hasLivePerformance, suggestedWebsite });
      
      res.status(200).json({ message: 'Thank you for your feedback!' });
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'You have already provided feedback for this venue.' });
      }
      logger.error('Venue feedback error:', error);
      res.status(500).json({ error: 'Failed to submit feedback.' });
    }
  });

  return router;
}
