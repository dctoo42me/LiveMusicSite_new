// server/src/index.ts
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Import the new connection pool and the repository function
import { createPool } from './db.js'; 
import { searchVenues } from './venueRepository.js';
import { register, login, verifyToken } from './auth.js';
import { addFavorite, removeFavorite, getFavorites } from './favoriteRepository.js';
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



// Basic health check and DB status route
app.get('/api/status', async (req: Request, res: Response) => {
  let db_status = 'Disconnected';
  try {
    // Ping the database via the pool to check connectivity
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    db_status = 'Connected';
    logger.info('Database client connected successfully.'); // Log success
  } catch (e) {
    db_status = 'Error connecting to database';
    logger.error('Error connecting to database:', e); // Log error
  }

  res.status(200).json({ 
    message: 'LiveMusicSite API is running successfully!',
    environment: process.env.NODE_ENV || 'development',
    db_status: db_status 
  });
});

// --- VENUE SEARCH ROUTE ---
app.get('/api/venues/search', async (req: Request, res: Response) => {
    const { location, date, type, limit, offset } = req.query; 
    
    if (!location && !date && !type) {
      return res.status(400).json({ error: "At least one search parameter (location, date, or type) is required." });
    }
    
    const searchType = (type || 'both') as string;

    // --- PAGINATION DEFAULTS AND PARSING ---
    const pageLimit = parseInt((limit as string) || '10', 10);
    const pageOffset = parseInt((offset as string) || '0', 10);
    
    const safeLimit = Math.max(1, pageLimit);
    const safeOffset = Math.max(0, pageOffset);
    // ------------------------------------------

    try {
        // Call the repository function (no longer passing the client)
        const { totalCount, venues } = await searchVenues(
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
        logger.error("API Error in search route:", error); // Use logger
        res.status(500).json({ error: "Failed to execute venue search." });
    }
});

// --- AUTHENTICATION ROUTES ---
app.post('/api/auth/register', (req, res) => register(pool, req, res));
app.post('/api/auth/login', (req, res) => login(pool, req, res));

app.get('/api/protected', verifyToken, (req: Request, res: Response) => {
  res.json({ message: 'This is a protected route.', user: (req as any).user });
});

// --- FAVORITES ROUTES ---
app.post('/api/favorites', verifyToken, async (req: Request, res: Response) => {
  const { venueId } = req.body;
  const userId = (req as any).user.userId;

  if (!venueId) {
    return res.status(400).json({ error: 'Venue ID is required.' });
  }

  try {
    const favorite = await addFavorite(pool, userId, venueId);
    if (favorite) {
      res.status(201).json(favorite);
    } else {
      res.status(409).json({ error: 'This venue is already in your favorites.' });
    }
  } catch (error) {
    logger.error('Add favorite error:', error); // Use logger
    res.status(500).json({ error: 'Failed to add favorite.' });
  }
});

app.delete('/api/favorites/:venueId', verifyToken, async (req: Request, res: Response) => {
  const { venueId } = req.params;
  const userId = (req as any).user.userId;

  if (!venueId) {
    return res.status(400).json({ error: 'Venue ID is required.' });
  }

  try {
    await removeFavorite(pool, userId, parseInt(venueId, 10));
    res.status(204).send(); // No content for successful deletion
  } catch (error) {
    logger.error('Remove favorite error:', error); // Use logger
    res.status(500).json({ error: 'Failed to remove favorite.' });
  }
});

app.get('/api/favorites', verifyToken, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  try {
    // Define default limit and offset for this API call if not provided by query params
    const defaultLimit = 10;
    const defaultOffset = 0;
    const favorites = await getFavorites(pool, userId, defaultLimit, defaultOffset);
    res.json(favorites);
  } catch (error) {
    logger.error('Get favorites error:', error); // Use logger
    res.status(500).json({ error: 'Failed to retrieve favorites.' });
  }
});

  // Global error handler for Express
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Unhandled Express Error: ${err.message}`, err); // Log the error with stack trace
    res.status(500).json({ error: 'An internal server error occurred.' });
  });

  return app;
}

const PORT = process.env.PORT || 5000; 

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific termination or recovery logic
  // process.exit(1); // Consider exiting in production applications
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Application specific termination or recovery logic
  process.exit(1); // Exit with failure in production applications
});

// --- SERVER STARTUP ---
if (process.env.NODE_ENV !== 'test') {
  const app = createApp(); // Create app instance for actual server
  app.listen(PORT, () => {
    logger.info(`Server is running at http://localhost:${PORT}`); // Use logger
    logger.info(`API Status Check: http://localhost:${PORT}/api/status`); // Use logger
  });
}

export default createApp();