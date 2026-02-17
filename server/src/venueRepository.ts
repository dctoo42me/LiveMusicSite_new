// server/src/venueRepository.ts


import type { Pool, PoolClient } from 'pg';
import redisClient from './utils/redis.js'; // Import redis client
import logger from './utils/logger.js'; // Import logger


// Interface for the combined result (Venue + Event) used in Search
export interface VenueEvent {
    id: number; // Event ID (unique per search result row)
    venueId: number; // Venue ID
    name: string;
    city: string;
    state: string;
    zipcode: string | null;
    date: string; 
    type: 'music' | 'meals' | 'both';
    description: string | null;
    tags: string[] | null;
    website: string | null;
    imageUrl: string | null;
    verificationStatus: 'UNVERIFIED' | 'COMMUNITY_VERIFIED' | 'OWNER_VERIFIED' | 'FLAGGED';
}

// Interface for Static Venue Details
export interface VenueDetails {
    id: number;
    name: string;
    city: string;
    state: string;
    zipcode: string | null;
    website: string | null;
    imageUrl: string | null;
    description: string | null;
    type: 'music' | 'meals' | 'both';
    ownerId: number | null;
    verificationStatus: 'UNVERIFIED' | 'COMMUNITY_VERIFIED' | 'OWNER_VERIFIED' | 'FLAGGED';
    positiveConfirmations: number;
    negativeConfirmations: number;
    subscriptionTier: 'free' | 'pro' | 'enterprise';
    stripeCustomerId: string | null;
}

// Interface for Event Details
export interface EventDetails {
    id: number;
    date: string;
    type: 'music' | 'meals' | 'both';
    description: string | null;
    tags: string[] | null;
}

// Update the return type to include the total count
export interface SearchResult {
    totalCount: number;
    venues: VenueEvent[];
}

// Helper to sanitize text input (Optional, but safe practice)
const sanitize = (text: string) => text.replace(/[^a-zA-Z0-9\s]/g, '');

const CACHE_TTL_SECONDS = 300; // 5 minutes

const stateAbbreviations: { [key: string]: string } = {
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

export async function searchVenues(
    pool: Pool, // Add pool argument
    location: string,
    startDate: string,
    endDate: string,
    type: string,
    limit: number,
    offset: number,
    tag?: string,
    lat?: number,
    lng?: number,
    name?: string
): Promise<SearchResult> {    
    let client: PoolClient | null = null; // Initialize client to null

    // Generate a unique cache key for this search query
    const cacheKey = `search:${JSON.stringify({ location, startDate, endDate, type, limit, offset, tag, lat, lng, name })}`;

    try {
        const cachedResults = await redisClient.get(cacheKey);
        if (cachedResults) {
            logger.info('Serving venue search results from cache');
            return JSON.parse(cachedResults);
        }

        // 1. Build the WHERE clause dynamically
        let whereClauses: string[] = [];
        let params: any[] = [];
        let paramIndex = 1;

        // Search by Location (City, State, or Zipcode) -> Applies to VENUES table (v)
        if (location) {
            const lowercasedLocation = location.toLowerCase();
            logger.info(`Debugging location: original='${location}', lowercased='${lowercasedLocation}'`);
            let locationConditions: string[] = [];
            let locationParams: any[] = [];

            // Case 1: "City, State" format (e.g., "austin, tx" or "austin, tx, usa")
            if (lowercasedLocation.includes(',')) {
                const parts = lowercasedLocation.split(',').map(p => sanitize(p).trim()).filter(p => p.length > 0);
                if (parts.length >= 2) {
                    const citySearchTerm = parts[0];
                    let stateSearchTerm = parts[1];
                    let zipSearchTerm = '';

                    // Check if the state part contains a zip code (e.g., "TX 78701")
                    const zipMatch = stateSearchTerm?.match(/\d{5}/);
                    if (zipMatch && stateSearchTerm) {
                        zipSearchTerm = zipMatch[0];
                        stateSearchTerm = stateSearchTerm.replace(zipSearchTerm, '').trim();
                    }
                    
                    locationConditions.push(`v.city ILIKE $${paramIndex}`);
                    locationParams.push(`%${citySearchTerm}%`);
                    paramIndex++;

                    if (stateSearchTerm) {
                        const stateAbbrMatch = (stateSearchTerm && stateAbbreviations[stateSearchTerm.toLowerCase()]) ? stateAbbreviations[stateSearchTerm.toLowerCase()] : stateSearchTerm;
                        locationConditions.push(`v.state ILIKE $${paramIndex}`);
                        locationParams.push(`%${stateAbbrMatch}%`);
                        paramIndex++;
                    }

                    if (zipSearchTerm) {
                        locationConditions.push(`v.zipcode = $${paramIndex}`);
                        locationParams.push(zipSearchTerm);
                        paramIndex++;
                    }
                    
                    whereClauses.push(`(${locationConditions.join(' AND ')})`);
                    params.push(...locationParams);

                } else {
                    const sanitizedLocation = sanitize(lowercasedLocation);
                    whereClauses.push(`(v.city ILIKE $${paramIndex} OR v.state ILIKE $${paramIndex})`);
                    params.push(`%${sanitizedLocation}%`);
                    paramIndex++;
                }
            } 
            // Case 2: Single term
            else {
                const sanitizedLocation = sanitize(lowercasedLocation);
                let conditions: string[] = [];
                
                conditions.push(`v.city ILIKE $${paramIndex}`);
                params.push(`%${sanitizedLocation}%`);
                paramIndex++;

                const stateAbbr = stateAbbreviations[sanitizedLocation];
                if (stateAbbr) {
                    conditions.push(`v.state ILIKE $${paramIndex}`);
                    params.push(`%${sanitizedLocation}%`); 
                    paramIndex++;
                    conditions.push(`v.state ILIKE $${paramIndex}`);
                    params.push(`%${stateAbbr}%`); 
                    paramIndex++;
                } else {
                    conditions.push(`v.state ILIKE $${paramIndex}`);
                    params.push(`%${sanitizedLocation}%`);
                    paramIndex++;
                }
                
                if (/^\d{5}$/.test(sanitizedLocation)) {
                    conditions.push(`v.zipcode = $${paramIndex}`);
                    params.push(sanitizedLocation);
                    paramIndex++;
                }

                whereClauses.push(`(${conditions.join(' OR ')})`);
            }
        }

        // Search by Date Range -> Applies to EVENTS table (e)
        if (startDate) {
            whereClauses.push(`e.date >= $${paramIndex}`);
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            whereClauses.push(`e.date <= $${paramIndex}`);
            params.push(endDate);
            paramIndex++;
        }

        // Search by Type -> Applies to EVENTS table (e)
        if (type && type !== 'both' && type !== 'all') {
            whereClauses.push(`e.type = $${paramIndex}`);
            params.push(type);
            paramIndex++;
        }

        // Search by Tag -> Applies to EVENTS table (e)
        if (tag && tag !== 'all') {
            whereClauses.push(`e.tags @> ARRAY[$${paramIndex}]::text[]`);
            params.push(tag);
            paramIndex++;
        }

        // Search by Name/Keyword -> Applies to VENUES table (v)
        if (name) {
            const sanitizedName = sanitize(name);
            whereClauses.push(`v.name ILIKE $${paramIndex}`);
            params.push(`%${sanitizedName}%`);
            paramIndex++;
        }
        
        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        
        // Acquire a client from the pool
        client = await pool.connect();

        if (!client) {
            throw new Error('Failed to acquire a database client from the pool.');
        }

        // 2. COORDINATE RADIUS LOGIC (If coordinates provided)
        let distanceCalc = 'NULL';
        let radiusClause = '';
        if (lat && lng) {
            // Haversine formula for distance in miles
            distanceCalc = `(3959 * acos(cos(radians($${paramIndex})) * cos(radians(v.lat)) * cos(radians(v.lng) - radians($${paramIndex + 1})) + sin(radians($${paramIndex})) * sin(radians(v.lat))))`;
            radiusClause = `AND ${distanceCalc} < 25`; // 25 mile radius
            params.push(lat, lng);
            paramIndex += 2;
        }

        // QUERY 1: GET THE TOTAL COUNT (Joined, Distinct Venues)
        const countQuery = `
            SELECT COUNT(DISTINCT v.id) 
            FROM events e
            JOIN venues v ON e.venue_id = v.id
            ${whereString}
            ${radiusClause}
        `;
        logger.info('Count Query:', { query: countQuery, params });
        const countResult = await client.query(countQuery, params);
        const totalCount = parseInt(countResult.rows[0].count, 10);
        
        if (totalCount === 0) {
            const emptyResult = { totalCount: 0, venues: [] };
            await redisClient.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(emptyResult));
            return emptyResult;
        }

        // QUERY 2: GET THE PAGINATED RESULTS (Joined, Distinct Venues)
        // Group by Venue, pick the next upcoming event details
        const limitIndex = paramIndex;
        const offsetIndex = paramIndex + 1;
        
        const finalParams = [...params, limit, offset];
        
        const query = `
            SELECT * FROM (
                SELECT DISTINCT ON (v.id)
                    e.id,
                    v.id as "venueId",
                    v.name, 
                    v.city, 
                    v.state, 
                    v.zipcode, 
                    e.date, 
                    e.type, 
                    e.tags,
                    v.description, 
                    v.website, 
                    v."imageUrl",
                    v.verification_status as "verificationStatus",
                    v.subscription_tier as "subscriptionTier",
                    ${distanceCalc} as distance
                FROM events e
                JOIN venues v ON e.venue_id = v.id
                ${whereString}
                ${radiusClause}
                ORDER BY v.id, e.date ASC
            ) as unique_venues
            ORDER BY 
                CASE WHEN "subscriptionTier" = 'pro' THEN 0 ELSE 1 END ASC,
                ${lat && lng ? 'distance ASC,' : ''} 
                date ASC
            LIMIT $${limitIndex} 
            OFFSET $${offsetIndex}
        `;

        logger.info('Search Query:', { query, params: finalParams });
        const result = await client.query(query, finalParams);
        
        const searchResult: SearchResult = {
            totalCount: totalCount,
            venues: result.rows as VenueEvent[],
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
        logger.error("SQL Execution Error in searchVenues:", error); 
        throw new Error(errorMessage);
    } finally {
        if (client) {
            client.release();
        }
    }
}

export async function getVenueById(pool: Pool, id: number): Promise<VenueDetails | null> {
    const res = await pool.query(`
        SELECT 
            id, name, city, state, zipcode, website, "imageUrl", description, type, 
            owner_id as "ownerId",
            verification_status as "verificationStatus",
            positive_confirmations as "positiveConfirmations",
            negative_confirmations as "negativeConfirmations",
            subscription_tier as "subscriptionTier",
            stripe_customer_id as "stripeCustomerId"
        FROM venues
        WHERE id = $1
    `, [id]);
    return res.rows[0] || null;
}

export async function getVenuesByOwnerId(pool: Pool, ownerId: number): Promise<VenueDetails[]> {
    const res = await pool.query(`
        SELECT 
            id, name, city, state, zipcode, website, "imageUrl", description, type, 
            owner_id as "ownerId",
            verification_status as "verificationStatus",
            positive_confirmations as "positiveConfirmations",
            negative_confirmations as "negativeConfirmations",
            subscription_tier as "subscriptionTier",
            stripe_customer_id as "stripeCustomerId"
        FROM venues
        WHERE owner_id = $1
        ORDER BY name ASC
    `, [ownerId]);
    return res.rows;
}

export async function getEventsByVenueId(pool: Pool, venueId: number): Promise<EventDetails[]> {
    const res = await pool.query(`
        SELECT id, date, type, description, tags
        FROM events
        WHERE venue_id = $1
        ORDER BY date ASC
    `, [venueId]);
    return res.rows;
}

export async function submitVenueFeedback(pool: Pool, userId: number, venueId: number, hasLivePerformance: boolean, suggestedWebsite?: string) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Record the individual feedback
        await client.query(
            'INSERT INTO venue_feedback (user_id, venue_id, has_live_performance, suggested_website) VALUES ($1, $2, $3, $4)',
            [userId, venueId, hasLivePerformance, suggestedWebsite]
        );

        // 2. Update the venue counters
        const column = hasLivePerformance ? 'positive_confirmations' : 'negative_confirmations';
        const updateRes = await client.query(
            `UPDATE venues SET ${column} = ${column} + 1 WHERE id = $1 RETURNING *`,
            [venueId]
        );

        const venue = updateRes.rows[0];

        // 3. Simple logic: auto-status update and website update
        // If 3 people say NO, we flag it.
        // If 3 people say YES, we mark as community verified (if currently unverified)
        if (venue.negative_confirmations >= 3) {
            await client.query("UPDATE venues SET verification_status = 'FLAGGED' WHERE id = $1", [venueId]);
        } else if (venue.positive_confirmations >= 3 && venue.verification_status === 'UNVERIFIED') {
            await client.query("UPDATE venues SET verification_status = 'COMMUNITY_VERIFIED' WHERE id = $1", [venueId]);
        }

        // 4. Handle suggested website: if venue has no website and we got a suggestion, 
        // for now we'll just update it if it's the first suggestion, 
        // or we could implement a count logic similar to verification.
        if (suggestedWebsite && !venue.website) {
            await client.query("UPDATE venues SET website = $1 WHERE id = $2", [suggestedWebsite, venueId]);
        }

        await client.query('COMMIT');
        return venue;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function getMonthlyEventCount(pool: Pool, venueId: number): Promise<number> {
    const res = await pool.query(`
        SELECT COUNT(*) FROM events 
        WHERE venue_id = $1 
        AND date >= date_trunc('month', CURRENT_DATE)
        AND date < date_trunc('month', CURRENT_DATE) + interval '1 month'
    `, [venueId]);
    return parseInt(res.rows[0].count, 10);
}

export async function createEvent(pool: Pool, venueId: number, date: string, type: string, description: string, tags: string[]) {
    const res = await pool.query(`
        INSERT INTO events (venue_id, date, type, description, tags)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `, [venueId, date, type, description, tags]);
    return res.rows[0];
}

export async function getTrendingEvents(pool: Pool): Promise<VenueEvent[]> {
    // Logic to find upcoming weekend:
    // If today is Monday(1)-Thursday(4), next Friday is this coming Friday.
    // If today is Friday(5)-Sunday(0), we are in the weekend.
    const query = `
        WITH weekend_bounds AS (
            SELECT 
                CASE 
                    WHEN EXTRACT(DOW FROM CURRENT_DATE) BETWEEN 1 AND 4 
                    THEN CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE))::int
                    ELSE CURRENT_DATE 
                END as fri,
                CASE 
                    WHEN EXTRACT(DOW FROM CURRENT_DATE) BETWEEN 1 AND 4 
                    THEN CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE))::int
                    ELSE CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN CURRENT_DATE ELSE CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE))::int END
                END as sun
        )
        SELECT 
            e.id,
            v.id as "venueId",
            v.name, 
            v.city, 
            v.state, 
            v.zipcode, 
            e.date, 
            e.type, 
            e.description, 
            e.tags,
            v.website, 
            v."imageUrl",
            v.verification_status as "verificationStatus",
            COUNT(se.id) as "saveCount",
            CASE WHEN e.date BETWEEN (SELECT fri FROM weekend_bounds) AND (SELECT sun FROM weekend_bounds) THEN 0 ELSE 1 END as is_weekend_priority
        FROM events e
        JOIN venues v ON e.venue_id = v.id
        LEFT JOIN saved_events se ON e.id = se.event_id
        WHERE e.date >= CURRENT_DATE
        GROUP BY e.id, v.id
        ORDER BY is_weekend_priority ASC, "saveCount" DESC, e.date ASC
        LIMIT 10
    `;
    const res = await pool.query(query);
    return res.rows;
}

export async function getPerfectPairings(pool: Pool, eventId: number): Promise<VenueEvent[]> {
    // 1. Get the details of the base event
    const eventRes = await pool.query(`
        SELECT e.type, v.city, e.date 
        FROM events e 
        JOIN venues v ON e.venue_id = v.id 
        WHERE e.id = $1
    `, [eventId]);
    
    if (eventRes.rows.length === 0) return [];
    
    const { type, city, date } = eventRes.rows[0];
    const targetType = type === 'music' ? 'meals' : 'music'; // Suggest the opposite type

    // 2. Find events of the target type in the same city on the same date
    const query = `
        SELECT 
            e.id,
            v.id as "venueId",
            v.name, 
            v.city, 
            v.state, 
            v.zipcode, 
            e.date, 
            e.type, 
            e.description, 
            e.tags,
            v.website, 
            v."imageUrl",
            v.verification_status as "verificationStatus"
        FROM events e
        JOIN venues v ON e.venue_id = v.id
        WHERE v.city = $1 
          AND e.date = $2 
          AND (e.type = $3 OR e.type = 'both')
          AND e.id != $4
        LIMIT 3
    `;
    
    const res = await pool.query(query, [city, date, targetType, eventId]);
    return res.rows;
}

export async function updateVenueMainImage(pool: Pool, venueId: number, imageUrl: string) {
    const res = await pool.query(
        'UPDATE venues SET "imageUrl" = $1 WHERE id = $2 RETURNING *',
        [imageUrl, venueId]
    );
    return res.rows[0];
}

export async function addVenueImage(pool: Pool, venueId: number, imageUrl: string, altText?: string) {
    const res = await pool.query(
        'INSERT INTO venue_images (venue_id, image_url, alt_text) VALUES ($1, $2, $3) RETURNING *',
        [venueId, imageUrl, altText]
    );
    return res.rows[0];
}

export async function getVenueImages(pool: Pool, venueId: number) {
    const res = await pool.query(
        'SELECT id, image_url as "imageUrl", alt_text as "altText", is_primary as "isPrimary" FROM venue_images WHERE venue_id = $1 ORDER BY created_at DESC',
        [venueId]
    );
    return res.rows;
}

export async function deleteVenueImage(pool: Pool, imageId: number, venueId: number) {
    await pool.query('DELETE FROM venue_images WHERE id = $1 AND venue_id = $2', [imageId, venueId]);
}

export async function updateVenueTier(pool: Pool, venueId: number, tier: 'free' | 'pro' | 'enterprise') {
    const res = await pool.query(
        'UPDATE venues SET subscription_tier = $1 WHERE id = $2 RETURNING *',
        [tier, venueId]
    );
    return res.rows[0];
}

export async function getAllVenueIds(pool: Pool): Promise<number[]> {
    const res = await pool.query('SELECT id FROM venues ORDER BY id ASC');
    return res.rows.map(row => row.id);
}