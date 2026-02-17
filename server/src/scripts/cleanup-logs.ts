// server/src/scripts/cleanup-logs.ts
import { createPool } from '../db.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupOldLogs() {
  const pool = createPool();
  logger.info('Starting search logs cleanup...');

  try {
    // Delete logs older than 30 days
    const res = await pool.query(`
      DELETE FROM search_logs 
      WHERE created_at < NOW() - INTERVAL '30 days'
    `);
    
    logger.info(`Cleanup successful. Removed ${res.rowCount} old search logs.`);
  } catch (error) {
    logger.error('Cleanup failed:', error);
  } finally {
    await pool.end();
  }
}

cleanupOldLogs();
