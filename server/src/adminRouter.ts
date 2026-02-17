// server/src/adminRouter.ts
import { Router } from 'express';
import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { verifyToken, authorizeRoles } from './auth.js';
import { getPlatformStats, getRecentAuditLogs, getProVenues } from './adminRepository.js';
import logger from './utils/logger.js';

export function createAdminRouter(pool: Pool) {
  const router = Router();

  router.use(verifyToken);
  router.use(authorizeRoles('admin'));

  // GET /stats - Platform-wide metrics
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await getPlatformStats(pool);
      res.json(stats);
    } catch (error) {
      logger.error('Get admin stats error:', error);
      res.status(500).json({ error: 'Failed to retrieve platform stats.' });
    }
  });

  // GET /logs - Recent system activity
  router.get('/logs', async (req: Request, res: Response) => {
    try {
      const logs = await getRecentAuditLogs(pool);
      res.json(logs);
    } catch (error) {
      logger.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Failed to retrieve audit logs.' });
    }
  });

  // GET /subscriptions - List all Pro/Enterprise venues
  router.get('/subscriptions', async (req: Request, res: Response) => {
    try {
      const subs = await getProVenues(pool);
      res.json(subs);
    } catch (error) {
      logger.error('Get admin subscriptions error:', error);
      res.status(500).json({ error: 'Failed to retrieve subscriptions.' });
    }
  });

  return router;
}
