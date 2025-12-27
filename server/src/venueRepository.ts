// server/src/venueRepository.ts


import type { Pool, PoolClient } from 'pg';
import redisClient from './utils/redis.js'; // Import redis client
import logger from './utils/logger.js'; // Import logger


// Define the interface for a single venue result - updated to match ARCHITECTURE.md
export interface Venue {
    id: number;
    name: string;
    city: string;
    state: string;
    zipcode: string | null;
    date: string; 
    type: 'music' | 'meals' | 'both';
    description: string | null;
    website: string | null;
    imageUrl: string | null;
}

// Update the return type to include the total count
export interface SearchResult {
    totalCount: number;
    venues: Venue[];
}

// Helper to sanitize text input (Optional, but safe practice)
const sanitize = (text: string) => text.replace(/[^a-zA-Z0-9\s]/g, '');

const CACHE_TTL_SECONDS = 300; // 5 minutes

export async function searchVenues(
    pool: Pool, // Add pool argument
    location: string,
    date: string,
    type: string,
    limit: number,
    offset: number
): Promise<SearchResult> {    
    let client: PoolClient | null = null; // Initialize client to null

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
        let whereClauses: string[] = [];
        let params: any[] = [];
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
        
        const searchResult: SearchResult = {
            totalCount: totalCount,
            venues: result.rows as Venue[],
        };

        // Store results in Redis cache
        await redisClient.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(searchResult));
        logger.info('Stored venue search results in cache');
        
        return searchResult;

    } catch (error) {
        let errorMessage = "Database query failed.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        logger.error("SQL Execution Error in searchVenues:", error); // Use logger
        throw new Error(errorMessage);
    } finally {
        // Ensure the client is released back to the pool
        if (client) {
            client.release();
        }
    }
}