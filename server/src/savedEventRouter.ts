// server/src/savedEventRouter.ts
import express from 'express';
import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { verifyToken } from './auth.js';
import { addSavedEvent, removeSavedEvent, getSavedEvents } from './savedEventRepository.js';
import logger from './utils/logger.js';

export function createSavedEventRouter(pool: Pool) {
  const router = express.Router();

  router.use(verifyToken);

  // POST / (Save an event)
  router.post('/', async (req: Request, res: Response) => {
    const { eventId } = req.body;
    const userId = (req as any).user.userId;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required.' });
    }

    try {
      const savedEvent = await addSavedEvent(pool, userId, eventId);
      if (savedEvent) {
        res.status(201).json(savedEvent);
      } else {
        res.status(409).json({ error: 'Event is already saved.' });
      }
    } catch (error) {
      logger.error('Save event error:', error);
      res.status(500).json({ error: 'Failed to save event.' });
    }
  });

  // DELETE /:eventId (Unsave an event)
  router.delete('/:eventId', async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const userId = (req as any).user.userId;

    try {
      const deleted = await removeSavedEvent(pool, userId, parseInt(eventId as string, 10));
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'Saved event not found.' });
      }
    } catch (error) {
      logger.error('Unsave event error:', error);
      res.status(500).json({ error: 'Failed to unsave event.' });
    }
  });

  // GET / (List saved events)
  router.get('/', async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    try {
      const savedEvents = await getSavedEvents(pool, userId);
      res.json(savedEvents);
    } catch (error) {
      logger.error('Get saved events error:', error);
      res.status(500).json({ error: 'Failed to retrieve saved events.' });
    }
  });

  return router;
}
