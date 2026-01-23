// server/src/venueRepository.ts
import redisClient from './utils/redis.js'; // Import redis client
import logger from './utils/logger.js'; // Import logger
// Helper to sanitize text input (Optional, but safe practice)
const sanitize = (text) => text.replace(/[^a-zA-Z0-9\s]/g, '');
const CACHE_TTL_SECONDS = 300; // 5 minutes
const stateAbbreviations = {
    "alabama": "al", "alaska": "ak", "arizona": "az", "arkansas": "ar", "california": "ca",
    "colorado": "co", "connecticut": "ct", "delaware": "de", "florida": "fl", "georgia": "ga",
    "hawaii": "hi", "idaho": "id", "illinois": "il", "indiana": "in", "iowa": "ia",
    "kansas": "ks", "kentucky": "ky", "louisiana": "la", "maine": "me", "maryland": "md",
    "massachusetts": "ma", "michigan": "mi", "minnesota": "mn", "mississippi": "ms",
    "missouri": "mo", "montana": "mt", "nebraska": "ne", "nevada": "nv", "new hampshire": "nh",
    "new jersey": "nj", "new mexico": "nm", "new york": "ny", "north carolina": "nc",
    "north dakota": "nd", "ohio": "oh", "oklahoma": "ok", "oregon": "or", "pennsylvania": "pa",
    "rhode island": "ri", "south carolina": "sc", "south dakota": "sd", "tennessee": "tn",
    "texas": "tx", "utah": "ut", "vermont": "vt", "virginia": "va", "washington": "wa",
    "west virginia": "wv", "wisconsin": "wi", "wyoming": "wy"
};
export async function searchVenues(pool, // Add pool argument
location, date, type, limit, offset) {
    let client = null; // Initialize client to null
    // Generate a unique cache key for this search query
    const cacheKey = `search:${JSON.stringify({ location, date, type, limit, offset })}`;
    try {
        const cachedResults = await redisClient.get(cacheKey);
        if (cachedResults) {
            logger.info('Serving venue search results from cache');
            return JSON.parse(cachedResults);
        }
        // 1. Build the WHERE clause dynamically
        let whereClauses = [];
        let params = [];
        let paramIndex = 1;
        // Search by Location (City, State, or Zipcode)
        if (location) {
            const lowercasedLocation = location.toLowerCase();
            logger.info(`Debugging location: original='${location}', lowercased='${lowercasedLocation}'`);
            let locationConditions = [];
            let locationParams = [];
            // Case 1: "City, State" format (e.g., "austin, tx")
            if (lowercasedLocation.includes(',')) {
                const parts = lowercasedLocation.split(',').map(p => sanitize(p).trim()).filter(p => p.length > 0);
                if (parts.length === 2) {
                    const citySearchTerm = parts[0];
                    const stateSearchTerm = parts[1];
                    logger.info(`Debugging: City, State detected. citySearchTerm='${citySearchTerm}', stateSearchTerm='${stateSearchTerm}'`);
                    locationConditions.push(`city ILIKE $${paramIndex}`);
                    locationParams.push(`%${citySearchTerm}%`);
                    paramIndex++;
                    const stateAbbrMatch = (stateSearchTerm && stateAbbreviations[stateSearchTerm]) ? stateAbbreviations[stateSearchTerm] : stateSearchTerm;
                    locationConditions.push(`state ILIKE $${paramIndex}`);
                    locationParams.push(`%${stateAbbrMatch}%`);
                    paramIndex++;
                    whereClauses.push(`(${locationConditions.join(' AND ')})`);
                    params.push(...locationParams);
                    logger.info(`Debugging: After City, State logic. whereClause='(${locationConditions.join(' AND ')})'`);
                }
                else {
                    // Fallback for malformed comma-separated input. Treat as single term.
                    const sanitizedLocation = sanitize(lowercasedLocation);
                    whereClauses.push(`(city ILIKE $${paramIndex} OR state ILIKE $${paramIndex})`);
                    params.push(`%${sanitizedLocation}%`);
                    paramIndex++;
                    logger.info(`Debugging: Malformed City, State input ('${lowercasedLocation}'). Falling back to single term.`);
                }
            }
            // Case 2: Single term (City, State, or Zipcode)
            else {
                const sanitizedLocation = sanitize(lowercasedLocation);
                logger.info(`Debugging: Single term detected. sanitizedLocation='${sanitizedLocation}'`);
                let conditions = [];
                // Always search by city
                conditions.push(`city ILIKE $${paramIndex}`);
                params.push(`%${sanitizedLocation}%`);
                paramIndex++;
                // Search by state (abbreviation or full name)
                const stateAbbr = stateAbbreviations[sanitizedLocation];
                if (stateAbbr) {
                    // Full state name was entered, search for it AND its abbreviation
                    conditions.push(`state ILIKE $${paramIndex}`);
                    params.push(`%${sanitizedLocation}%`); // e.g., %texas%
                    paramIndex++;
                    conditions.push(`state ILIKE $${paramIndex}`);
                    params.push(`%${stateAbbr}%`); // e.g., %tx%
                    paramIndex++;
                }
                else {
                    // Not a full state name, just search the term as a state
                    conditions.push(`state ILIKE $${paramIndex}`);
                    params.push(`%${sanitizedLocation}%`);
                    paramIndex++;
                }
                // Search by zipcode if applicable
                if (/^\d{5}$/.test(sanitizedLocation)) {
                    conditions.push(`zipcode = $${paramIndex}`);
                    params.push(sanitizedLocation); // Exact match for zipcode
                    paramIndex++;
                }
                whereClauses.push(`(${conditions.join(' OR ')})`);
                logger.info(`Debugging: After single term logic. whereClause='(${conditions.join(' OR ')})'`);
            }
            logger.info(`Debugging: Final whereClauses='${whereClauses.join(' AND ')}', params='${params}', paramIndex=${paramIndex}`);
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
        logger.info('Count Query:', { query: countQuery, params });
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
        logger.info('Search Query:', { query, params: finalParams });
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