// server/src/scripts/backup-db.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const execPromise = promisify(exec);

async function runBackup() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    logger.error('DATABASE_URL is not defined in .env');
    return;
  }

  // Create backups directory if it doesn't exist
  const backupDir = path.resolve(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `backup-${timestamp}.sql.gz`;
  const filePath = path.join(backupDir, fileName);

  logger.info(`Starting database backup to ${fileName}...`);

  try {
    // We use the database URL directly with pg_dump
    // -x: do not dump privileges
    // -O: do not dump ownership
    // gzip: compress the output
    const command = `pg_dump "${dbUrl}" -x -O | gzip > "${filePath}"`;
    
    await execPromise(command);
    
    const stats = fs.statSync(filePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    logger.info(`Backup successful! File saved at ${filePath} (${fileSizeMB} MB)`);
    
    // Cleanup: Keep only the last 7 days of backups
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const fullPath = path.join(backupDir, file);
      const fileStats = fs.statSync(fullPath);
      if (now - fileStats.mtimeMs > sevenDaysInMs) {
        fs.unlinkSync(fullPath);
        logger.info(`Deleted old backup file: ${file}`);
      }
    }

  } catch (error) {
    logger.error('Database backup failed:', error);
  }
}

runBackup();
