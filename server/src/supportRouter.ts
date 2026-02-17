// server/src/supportRouter.ts
import { Router } from 'express';
import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { verifyToken, authorizeRoles } from './auth.js';
import { createSupportTicket, getAllSupportTickets, updateTicketStatus } from './supportRepository.js';
import { logAction } from './utils/audit.js';
import { sendSupportConfirmationEmail } from './utils/email.js';
import logger from './utils/logger.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

export function createSupportRouter(pool: Pool) {
  const router = Router();

  // POST /submit (Public - anyone can report a bug)
  router.post('/submit', async (req: Request, res: Response) => {
    const { name, email, subject, message } = req.body;
    
    // Optional: Extract user ID if token is present
    let userId: number | undefined;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.userId;
      } catch (err) {
        // Token invalid, proceed as guest
      }
    }

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
      const ticket = await createSupportTicket(pool, name, email, subject, message, userId);
      
      // Log for admin activity feed
      await logAction(pool, userId || null, 'SUBMIT_SUPPORT_TICKET', 'support_tickets', ticket.id, { subject });
      
      // Send confirmation email
      await sendSupportConfirmationEmail(email, ticket.id);

      res.status(201).json({ message: 'Support ticket submitted successfully.', ticketId: ticket.id });
    } catch (error) {
      logger.error('Support ticket submission error:', error);
      res.status(500).json({ error: 'Failed to submit support ticket.' });
    }
  });

  // GET /all (Admin only)
  router.get('/all', verifyToken, authorizeRoles('admin'), async (req: Request, res: Response) => {
    try {
      const tickets = await getAllSupportTickets(pool);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve tickets.' });
    }
  });

  // PATCH /:id/status (Admin only)
  router.patch('/:id/status', verifyToken, authorizeRoles('admin'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = (req as any).user.userId;

    try {
      await updateTicketStatus(pool, parseInt(id as string, 10), status);
      await logAction(pool, adminId, 'UPDATE_TICKET_STATUS', 'support_tickets', parseInt(id as string, 10), { status });
      res.status(200).json({ message: 'Ticket updated.' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update ticket.' });
    }
  });

  return router;
}
