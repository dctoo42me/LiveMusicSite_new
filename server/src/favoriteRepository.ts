// server/src/favoriteRepository.ts
import { Pool } from 'pg'; // Import Pool type for declaration
import logger from './utils/logger.js'; // Import logger
import redisClient from './utils/redis.js'; // Import redis client

const CACHE_TTL_SECONDS_FAVORITES = 60; // Shorter TTL for user-specific favorites

// Helper function to invalidate all favorite caches for a given user
async function invalidateUserFavoritesCache(userId: number) {
  const keys = await redisClient.keys(`favorites:${userId}:*`);
  if (keys.length > 0) {
    await redisClient.del(keys);
    logger.info(`Invalidated ${keys.length} favorite cache keys for user ${userId}`);
  }
}

export async function addFavorite(pool: Pool, userId: number, venueId: number) {
  // Check if the favorite already exists
  const existing = await pool.query(
    'SELECT * FROM favorite_venues WHERE user_id = $1 AND venue_id = $2',
    [userId, venueId]
  );

  if (existing.rows.length > 0) {
    return null; // Indicates a conflict
  }

  const res = await pool.query(
    'INSERT INTO favorite_venues (user_id, venue_id) VALUES ($1, $2) RETURNING *',
    [userId, venueId]
  );

  if (res.rows[0]) {
    await invalidateUserFavoritesCache(userId); // Invalidate cache on add
  }
  return res.rows[0];
}

export async function removeFavorite(pool: Pool, userId: number, venueId: number) {
  const res = await pool.query(
    'DELETE FROM favorite_venues WHERE user_id = $1 AND venue_id = $2 RETURNING *',
    [userId, venueId]
  );

  if (res.rows[0]) {
    await invalidateUserFavoritesCache(userId); // Invalidate cache on remove
  }
  return res.rows[0];
}

export async function getFavorites(pool: Pool, userId: number, limit: number, offset: number) {
  const cacheKey = `favorites:${userId}:${limit}:${offset}`;

  try {
    // Try to fetch from Redis cache first
    const cachedResults = await redisClient.get(cacheKey);
    if (cachedResults) {
      logger.info(`Serving favorites for user ${userId} from cache`);
      return JSON.parse(cachedResults);
    }
  } catch (cacheError) {
    logger.error(`Redis cache read error for key ${cacheKey}:`, cacheError);
    // Continue to DB if cache read fails
  }

  logger.info(`FINAL CHECK before query: userId=${userId} (type: ${typeof userId}), limit=${limit} (type: ${typeof limit}), offset=${offset} (type: ${typeof offset})`);
  // Query to get paginated favorite venues
  const venuesRes = await pool.query(
    `SELECT v.* FROM venues v JOIN favorite_venues f ON v.id = f.venue_id WHERE f.user_id = $1 ORDER BY v.name ASC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  // Query to get total count of favorite venues for the user
  const countRes = await pool.query(
    `SELECT COUNT(*) FROM favorite_venues WHERE user_id = $1`,
    [userId]
  );
  const totalCount = parseInt(countRes.rows[0].count, 10);

  const result = { venues: venuesRes.rows, totalCount };

  try {
    // Store results in Redis cache
    await redisClient.setex(cacheKey, CACHE_TTL_SECONDS_FAVORITES, JSON.stringify(result));
    logger.info(`Stored favorites for user ${userId} in cache`);
  } catch (cacheError) {
    logger.error(`Redis cache write error for key ${cacheKey}:`, cacheError);
    // Continue without caching if cache write fails
  }

  return result;
}
