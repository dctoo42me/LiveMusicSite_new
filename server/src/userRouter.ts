// server/src/userRouter.ts
import { Router } from 'express';
import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { verifyToken } from './auth.js';
import { findUserById, updateUserProfile } from './authRepository.js';
import { logAction } from './utils/audit.js';
import logger from './utils/logger.js';

export function createUserRouter(pool: Pool) {
  const router = Router();

  // GET /profile (Get current user's profile)
  router.get('/profile', verifyToken, async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    try {
      const user = await findUserById(pool, userId);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      res.json(user);
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to retrieve profile.' });
    }
  });

  // PATCH /profile (Update profile)
  router.patch('/profile', verifyToken, async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { avatarUrl, bio, onboardingCompleted, marketingOptIn } = req.body;
    try {
      const updatedUser = await updateUserProfile(pool, userId, avatarUrl, bio, onboardingCompleted, marketingOptIn);
      await logAction(pool, userId, 'UPDATE_PROFILE', 'users', userId, { avatarUrl, bio, onboardingCompleted, marketingOptIn });
      res.json(updatedUser);
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  });

  return router;
}
