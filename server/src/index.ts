// server/src/index.ts
import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Import routers and repositories
import { createPool } from './db.js';
import { searchVenues } from './venueRepository.js';
import { register, login, verifyToken, logout } from './auth.js'; import { createFavoritesRouter } from './favoritesRouter.js'; // Import the new router
import logger from './utils/logger.js'; // Import logger
import { spawnSync } from 'child_process'; // Import to run external commands
import path from 'path'; // Import path to resolve migration script
import { fileURLToPath } from 'url'; // For __dirname in ES Modules

// Replicate __dirname functionality in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to run database migrations
async function runMigrations() {
  logger.info('Running database migrations...');
  try {
    const result = spawnSync('npm', ['run', 'migrate', 'up'], { 
      cwd: path.resolve(__dirname, '..'), // Run from the server directory (parent of dist)
      stdio: 'inherit', 
      shell: true 
    });

    if (result.error) {
      logger.error('Migration failed:', result.error);
      throw result.error;
    }
    if (result.status !== 0) {
      logger.error(`Migration exited with code ${result.status}`);
      throw new Error(`Migration exited with code ${result.status}`);
    }
    logger.info('Database migrations completed successfully.');
  } catch (error) {
    logger.error('Error during migration startup:', error);
    process.exit(1); // Exit if migrations fail
  }
}

export function createApp() {
  const app = express();
  const pool = createPool(); // Initialize pool here

    // Run migrations before the server starts accepting requests
    // Only run if not in test environment to avoid interference with tests
    if (process.env.NODE_ENV !== 'test') {
      runMigrations();
    }
// --- CORS CONFIGURATION ---
const corsOptions = {
  origin: 'http://localhost:3000', // Allow requests from frontend dev server
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware to parse JSON bodies
app.use(express.json());

// --- ROUTES ---

// Basic health check and DB status route
app.get('/api/status', async (req: Request, res: Response) => {
  let db_status = 'Disconnected';
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    db_status = 'Connected';
    logger.info('Database client connected successfully.');
  } catch (e) {
    db_status = 'Error connecting to database';
    logger.error('Error connecting to database:', e);
  }

  res.status(200).json({ 
    message: 'LiveMusicSite API is running successfully!',
    environment: process.env.NODE_ENV || 'development',
    db_status: db_status 
  });
});

// Venue search route
app.get('/api/venues/search', async (req: Request, res: Response) => {
    const { location, date, type, limit, offset } = req.query; 
    
    if (!location && !date && !type) {
      return res.status(400).json({ error: "At least one search parameter (location, date, or type) is required." });
    }
    
    const searchType = (type || 'both') as string;
    const pageLimit = parseInt((limit as string) || '10', 10);
    const pageOffset = parseInt((offset as string) || '0', 10);
    const safeLimit = Math.max(1, pageLimit);
    const safeOffset = Math.max(0, pageOffset);

    try {
        const { totalCount, venues } = await searchVenues(
            pool,
            (location as string) || '',
            (date as string) || '',
            searchType,
            safeLimit,
            safeOffset
        );
        res.json({
          count: venues.length,
          totalCount: totalCount, 
          venues: venues,
          limit: safeLimit,
          offset: safeOffset
        });
    } catch (error) {
        logger.error("API Error in search route:", error);
        res.status(500).json({ error: "Failed to execute venue search." });
    }
});

// Authentication routes
app.post('/api/auth/register', (req, res) => register(pool, req, res));
app.post('/api/auth/login', (req, res) => login(pool, req, res));
app.post('/api/auth/logout', verifyToken, (req, res) => logout(req, res));

// Favorites routes - now using the dedicated router
const favoritesRouter = createFavoritesRouter(pool);
app.use('/api/favorites', favoritesRouter);

// Protected route for testing token verification
app.get('/api/protected', verifyToken, (req: Request, res: Response) => {
  res.status(200).json({
    message: 'This is a protected route.',
    user: (req as any).user,
  });
});

// --- END ROUTES ---

// Global error handler for Express
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Unhandled Express Error: ${err.message}`, err);
  res.status(500).json({ error: 'An internal server error occurred.' });
});

return app;
}

const PORT = process.env.PORT || 5000; 

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // process.exit(1); // Consider exiting in production applications
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1); // Exit with failure in production applications
});

// --- SERVER STARTUP ---
if (process.env.NODE_ENV !== 'test') {
  const app = createApp(); // Create app instance for actual server
  app.listen(PORT, () => {
    logger.info(`Server is running at http://localhost:${PORT}`);
    logger.info(`API Status Check: http://localhost:${PORT}/api/status`);
  });
}

export default createApp();