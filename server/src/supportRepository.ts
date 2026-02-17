// server/src/supportRepository.ts
import { Pool } from 'pg';

export interface SupportTicket {
  id: number;
  userId?: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
}

export async function createSupportTicket(
  pool: Pool,
  name: string,
  email: string,
  subject: string,
  message: string,
  userId?: number
): Promise<SupportTicket> {
  const query = `
    INSERT INTO support_tickets (name, email, subject, message, user_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, subject, message, status, created_at as "createdAt"
  `;
  const res = await pool.query(query, [name, email, subject, message, userId || null]);
  return res.rows[0];
}

export async function getAllSupportTickets(pool: Pool): Promise<SupportTicket[]> {
  const query = `
    SELECT id, name, email, subject, message, status, created_at as "createdAt", user_id as "userId"
    FROM support_tickets
    ORDER BY created_at DESC
  `;
  const res = await pool.query(query);
  return res.rows;
}

export async function updateTicketStatus(pool: Pool, ticketId: number, status: string): Promise<void> {
  await pool.query('UPDATE support_tickets SET status = $1 WHERE id = $2', [status, ticketId]);
}
