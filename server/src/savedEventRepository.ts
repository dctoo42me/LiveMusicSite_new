// server/src/savedEventRepository.ts
import { Pool } from 'pg';
import logger from './utils/logger.js';

export interface SavedEvent {
  id: number;
  eventId: number;
  venueId: number;
  venueName: string;
  city: string;
  state: string;
  date: string;
  type: string;
  description: string;
  imageUrl: string;
  tags: string[] | null;
}

export async function addSavedEvent(pool: Pool, userId: number, eventId: number) {
  try {
    const res = await pool.query(
      'INSERT INTO saved_events (user_id, event_id) VALUES ($1, $2) RETURNING *',
      [userId, eventId]
    );
    return res.rows[0];
  } catch (error) {
    // Handle unique constraint violation (already saved)
    if ((error as any).code === '23505') {
      return null; 
    }
    throw error;
  }
}

export async function removeSavedEvent(pool: Pool, userId: number, eventId: number) {
  const res = await pool.query(
    'DELETE FROM saved_events WHERE user_id = $1 AND event_id = $2 RETURNING *',
    [userId, eventId]
  );
  return res.rows[0];
}

export async function getSavedEvents(pool: Pool, userId: number): Promise<SavedEvent[]> {
  const res = await pool.query(`
    SELECT 
      se.id,
      e.id as "eventId",
      v.id as "venueId",
      v.name as "venueName",
      v.city,
      v.state,
      e.date,
      e.type,
      e.description,
      e.tags,
      v."imageUrl"
    FROM saved_events se
    JOIN events e ON se.event_id = e.id
    JOIN venues v ON e.venue_id = v.id
    WHERE se.user_id = $1 AND e.date >= CURRENT_DATE
    ORDER BY e.date ASC
  `, [userId]);
  return res.rows;
}
