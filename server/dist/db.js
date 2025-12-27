// server/src/db.ts
import { Pool } from 'pg';
import * as path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js'; // Import logger
// Replicate __dirname functionality in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export function createPool() {
    // Environment variables are now expected to be provided by the hosting environment (e.g., Render)
    // No explicit dotenv.config() call needed in production.
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    pool.on('connect', () => {
        logger.info('Database client connected'); // Use logger
    });
    pool.on('error', (err) => {
        logger.error('Unexpected error on idle client', err); // Use logger
        process.exit(-1);
    });
    return pool;
}
//# sourceMappingURL=db.js.map