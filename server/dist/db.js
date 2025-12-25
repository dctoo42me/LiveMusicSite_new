// server/src/db.ts
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js'; // Import logger
// Replicate __dirname functionality in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export function createPool() {
    // Load environment variables from server/.env, resolving from the current module's directory
    dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
    const pool = new Pool({
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: 5432, // Default PostgreSQL port
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
export default createPool();
//# sourceMappingURL=db.js.map