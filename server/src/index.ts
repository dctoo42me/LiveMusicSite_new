// server/src/index.ts
import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Import routers and repositories
import { createPool } from './db.js';
import { searchVenues, getVenueById, getEventsByVenueId, getTrendingEvents, getPerfectPairings } from './venueRepository.js';
import { logSearch } from './analyticsRepository.js';
import { register, login, verifyToken, logout } from './auth.js'; 
import { createFavoritesRouter } from './favoritesRouter.js'; 
import { createSavedEventRouter } from './savedEventRouter.js'; 
import { createVenueReviewRouter } from './venueReviewRouter.js'; 
import { createVenueClaimRouter } from './venueClaimRouter.js'; 
import { createVenueOperatorRouter } from './venueOperatorRouter.js'; 
import { createVenueRouter } from './venueRouter.js'; 
import { createUserRouter } from './userRouter.js'; 
import { createAdminRouter } from './adminRouter.js'; 
import { createSupportRouter } from './supportRouter.js'; 
import { createMediaRouter } from './mediaRouter.js'; 
import { createStripeRouter } from './stripeRouter.js'; 
import { createAnalyticsRouter } from './analyticsRouter.js'; 
import logger from './utils/logger.js'; 
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './swagger.js'; // Import logger
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
// --- MIDDLEWARE ---
app.use(helmet({
  contentSecurityPolicy: false,
}));
// --- CORS CONFIGURATION ---
const corsOptions = {
  origin: 'http://localhost:3000', // Allow requests from frontend dev server
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};
app.use(cors(corsOptions));

// Special middleware for Stripe Webhook to capture raw body
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === '/api/payments/webhook') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      (req as any).rawBody = data;
      next();
    });
  } else {
    next();
  }
});

// Middleware to parse JSON bodies
app.use(express.json());

// --- ROUTES ---

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

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
    const { location, startDate, endDate, type, limit, offset, tag, lat, lng, name } = req.query; 
    
    // Check if we have at least one valid search trigger
    const hasLocation = !!location;
    const hasDates = !!(startDate || endDate);
    const hasTypeOrTag = !!(type || tag);
    const hasCoords = !!(lat && lng);
    const hasName = !!name;

    if (!hasLocation && !hasDates && !hasTypeOrTag && !hasCoords && !hasName) {
      return res.status(400).json({ error: "At least one search parameter (location, name, startDate, endDate, type, tag, or coordinates) is required." });
    }
    
    const searchType = (type || 'both') as string;
    const searchTag = tag as string | undefined;
    const searchLat = lat ? parseFloat(lat as string) : undefined;
    const searchLng = lng ? parseFloat(lng as string) : undefined;
    const searchName = name as string | undefined;
    const pageLimit = parseInt((limit as string) || '10', 10);
    const pageOffset = parseInt((offset as string) || '0', 10);
    const safeLimit = Math.max(1, pageLimit);
    const safeOffset = Math.max(0, pageOffset);

    try {
        const { totalCount, venues } = await searchVenues(
            pool,
            (location as string) || '',
            (startDate as string) || '',
            (endDate as string) || '',
            searchType,
            safeLimit,
            safeOffset,
            searchTag,
            searchLat,
            searchLng,
            searchName
        );

        // Track search for analytics (Heatmap)
        const userId = (req as any).user?.userId;
        logSearch(pool, (location as string) || 'GPS_SEARCH', searchLat, searchLng, userId).catch(err => logger.error('Log search error:', err));

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

// Get Venue by ID
app.get('/api/venues/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const venue = await getVenueById(pool, parseInt(id as string, 10));
        if (!venue) {
            return res.status(404).json({ error: 'Venue not found' });
        }
        res.json(venue);
    } catch (error) {
        logger.error('Error fetching venue by ID:', error);
        res.status(500).json({ error: 'Failed to fetch venue details' });
    }
});

// Get Events by Venue ID
app.get('/api/venues/:id/events', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const events = await getEventsByVenueId(pool, parseInt(id as string, 10));
        res.json(events);
    } catch (error) {
        logger.error('Error fetching events by venue ID:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Get Trending Events
app.get('/api/events/trending', async (req: Request, res: Response) => {
    try {
        const events = await getTrendingEvents(pool);
        res.json(events);
    } catch (error) {
        logger.error('Error fetching trending events:', error);
        res.status(500).json({ error: 'Failed to fetch trending events' });
    }
});

// Get Perfect Pairings for an Event
app.get('/api/events/pairings/:eventId', async (req: Request, res: Response) => {
    const { eventId } = req.params;
    try {
        const pairings = await getPerfectPairings(pool, parseInt(eventId as string, 10));
        res.json(pairings);
    } catch (error) {
        logger.error('Error fetching pairings:', error);
        res.status(500).json({ error: 'Failed to fetch event pairings' });
    }
});

// Authentication routes
app.post('/api/auth/register', (req, res) => register(pool, req, res));
app.post('/api/auth/login', (req, res) => login(pool, req, res));
app.post('/api/auth/logout', verifyToken, (req, res) => logout(req, res));

// Favorites routes - now using the dedicated router
const favoritesRouter = createFavoritesRouter(pool);
app.use('/api/favorites', favoritesRouter);

// Saved Events routes
const savedEventRouter = createSavedEventRouter(pool);
app.use('/api/saved-events', savedEventRouter);

// Venue Reviews routes
const reviewRouter = createVenueReviewRouter(pool);
app.use('/api/reviews', reviewRouter);

// Venue Claim routes
const claimRouter = createVenueClaimRouter(pool);
app.use('/api/claims', claimRouter);

// Venue Operator routes
const operatorRouter = createVenueOperatorRouter(pool);
app.use('/api/manage', operatorRouter);

// General Venue routes
const venueRouter = createVenueRouter(pool);
app.use('/api/venues', venueRouter);

// User Profile routes
const userRouter = createUserRouter(pool);
app.use('/api/users', userRouter);

// Admin Dashboard routes
const adminRouter = createAdminRouter(pool);
app.use('/api/admin', adminRouter);

// Support routes
const supportRouter = createSupportRouter(pool);
app.use('/api/support', supportRouter);

// Media routes
const mediaRouter = createMediaRouter(pool);
app.use('/api/media', mediaRouter);

// Payment routes
const stripeRouter = createStripeRouter(pool);
app.use('/api/payments', stripeRouter);

// Analytics routes
const analyticsRouter = createAnalyticsRouter(pool);
app.use('/api/analytics', analyticsRouter);

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