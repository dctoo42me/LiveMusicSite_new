// server/src/utils/audit.ts
import { Pool } from 'pg';
import logger from './logger.js';

export async function logAction(
  pool: Pool,
  userId: number | null,
  action: string,
  entityType: string,
  entityId: number | null,
  details: any = {}
) {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [userId, action, entityType, entityId, JSON.stringify(details)]
    );
  } catch (error) {
    logger.error('Failed to write audit log:', error);
    // We don't throw here to avoid crashing the main request if logging fails, 
    // but in a production app you might want more robust error handling.
  }
}
