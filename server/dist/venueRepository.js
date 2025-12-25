// server/src/venueRepository.ts
import pool from './db.js'; // Import the centralized pool
import redisClient from './utils/redis.js'; // Import redis client
import logger from './utils/logger.js'; // Import logger
// Helper to sanitize text input (Optional, but safe practice)
const sanitize = (text) => text.replace(/[^a-zA-Z0-9\s]/g, '');
const CACHE_TTL_SECONDS = 300; // 5 minutes
export async function searchVenues(
// The connected PostgreSQL client is no longer passed as an argument
location, date, type, limit, offset) {
    let client = null; // Initialize client to null
    // Generate a unique cache key for this search query
    const cacheKey = `search:${JSON.stringify({ location, date, type, limit, offset })}`;
    try {
        // Try to fetch from Redis cache first
        const cachedResults = await redisClient.get(cacheKey);
        if (cachedResults) {
            logger.info('Serving venue search results from cache');
            return JSON.parse(cachedResults);
        }
        // 1. Build the WHERE clause dynamically
        let whereClauses = [];
        let params = [];
        let paramIndex = 1;
        // Search by Location (City, State, or Zipcode) - Uses Fuzzy and ILIKE
        if (location) {
            const sanitizedLocation = sanitize(location);
            whereClauses.push(`(
                city % $${paramIndex} OR
                state % $${paramIndex} OR
                zipcode ILIKE $${paramIndex + 1}
            )`);
            params.push(sanitizedLocation);
            params.push(`%${sanitizedLocation}%`);
            paramIndex += 2;
        }
        // Search by Date
        if (date) {
            whereClauses.push(`date = $${paramIndex}`);
            params.push(date);
            paramIndex++;
        }
        // Search by Type
        if (type && type !== 'both') {
            whereClauses.push(`type = $${paramIndex}`);
            params.push(type);
            paramIndex++;
        }
        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        // Acquire a client from the pool
        client = await pool.connect();
        if (!client) {
            throw new Error('Failed to acquire a database client from the pool.');
        }
        // QUERY 1: GET THE TOTAL COUNT 
        const countQuery = `SELECT COUNT(*) FROM venues ${whereString}`;
        const countResult = await client.query(countQuery, params);
        const totalCount = parseInt(countResult.rows[0].count, 10);
        if (totalCount === 0) {
            const emptyResult = { totalCount: 0, venues: [] };
            await redisClient.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(emptyResult));
            return emptyResult;
        }
        // QUERY 2: GET THE PAGINATED RESULTS
        const limitIndex = paramIndex;
        const offsetIndex = paramIndex + 1;
        const finalParams = [...params, limit, offset];
        const query = `
            SELECT id, name, city, state, zipcode, date, type, description, website, null as "imageUrl"
            FROM venues
            ${whereString}
            ORDER BY date ASC, name ASC
            LIMIT $${limitIndex} 
            OFFSET $${offsetIndex}
        `;
        const result = await client.query(query, finalParams);
        const searchResult = {
            totalCount: totalCount,
            venues: result.rows,
        };
        // Store results in Redis cache
        await redisClient.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(searchResult));
        logger.info('Stored venue search results in cache');
        return searchResult;
    }
    catch (error) {
        let errorMessage = "Database query failed.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        logger.error("SQL Execution Error in searchVenues:", error); // Use logger
        throw new Error(errorMessage);
    }
    finally {
        // Ensure the client is released back to the pool
        if (client) {
            client.release();
        }
    }
}
//# sourceMappingURL=venueRepository.js.map