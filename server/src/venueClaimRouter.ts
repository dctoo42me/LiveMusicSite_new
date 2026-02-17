// server/src/venueClaimRouter.ts
import { Router } from 'express';
import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { verifyToken, authorizeRoles } from './auth.js';
import { createVenueClaim, getAllVenueClaims, updateVenueClaimStatus, getVenueClaimById } from './venueClaimRepository.js';
import { logAction } from './utils/audit.js';
import { sendClaimApprovalEmail } from './utils/email.js';
import logger from './utils/logger.js';

export function createVenueClaimRouter(pool: Pool) {
  const router = Router();

  // POST / (Submit a claim)
  router.post('/', verifyToken, async (req: Request, res: Response) => {
    const { venueId, proofUrl, details } = req.body;
    const userId = (req as any).user.userId;

    if (!venueId) {
      return res.status(400).json({ error: 'Venue ID is required.' });
    }

    try {
      const claim = await createVenueClaim(pool, userId, venueId, proofUrl, details);
      await logAction(pool, userId, 'SUBMIT_CLAIM', 'venues', venueId, { claimId: claim.id });
      res.status(201).json(claim);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'You have already submitted a claim for this venue.' });
      }
      logger.error('Claim submission error:', error);
      res.status(500).json({ error: 'Failed to submit claim.' });
    }
  });

  // GET / (List all claims - Admin Only)
  router.get('/', verifyToken, authorizeRoles('admin'), async (req: Request, res: Response) => {
    try {
      const claims = await getAllVenueClaims(pool);
      res.json(claims);
    } catch (error) {
      logger.error('Get claims error:', error);
      res.status(500).json({ error: 'Failed to retrieve claims.' });
    }
  });

  // PATCH /:id (Approve or Reject - Admin Only)
  router.patch('/:id', verifyToken, authorizeRoles('admin'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = (req as any).user.userId;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED.' });
    }

    try {
      const claim = await getVenueClaimById(pool, parseInt(id as string, 10));
      if (!claim) {
        return res.status(404).json({ error: 'Claim not found.' });
      }

      const updatedClaim = await updateVenueClaimStatus(pool, parseInt(id as string, 10), status);
      
      // If approved, update the venue owner and the user role
      if (status === 'APPROVED') {
        await pool.query('UPDATE venues SET owner_id = $1 WHERE id = $2', [claim.user_id, claim.venue_id]);
        await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['operator', claim.user_id]);
        await logAction(pool, adminId, 'APPROVE_CLAIM', 'venue_claims', claim.id, { venueId: claim.venue_id, userId: claim.user_id });
        
        // Fetch user and venue info for the email
        const userRes = await pool.query('SELECT email FROM users WHERE id = $1', [claim.user_id]);
        const venueRes = await pool.query('SELECT name FROM venues WHERE id = $1', [claim.venue_id]);
        if (userRes.rows[0]?.email && venueRes.rows[0]?.name) {
          await sendClaimApprovalEmail(userRes.rows[0].email, venueRes.rows[0].name);
        }
      } else {
        await logAction(pool, adminId, 'REJECT_CLAIM', 'venue_claims', claim.id);
      }

      res.json(updatedClaim);
    } catch (error) {
      logger.error('Update claim error:', error);
      res.status(500).json({ error: 'Failed to update claim.' });
    }
  });

  return router;
}
