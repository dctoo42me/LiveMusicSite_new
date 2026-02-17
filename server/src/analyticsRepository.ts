// server/src/analyticsRepository.ts
import { Pool } from 'pg';

export interface VenueMetrics {
  views: number;
  websiteClicks: number;
  mapClicks: number;
}

export async function logVenueEvent(
  pool: Pool, 
  venueId: number, 
  eventType: 'view' | 'website_click' | 'map_click', 
  userId?: number
): Promise<void> {
  await pool.query(
    'INSERT INTO venue_analytics (venue_id, event_type, user_id) VALUES ($1, $2, $3)',
    [venueId, eventType, userId || null]
  );
}

export async function logSearch(
  pool: Pool,
  locationQuery: string,
  lat?: number,
  lng?: number,
  userId?: number
): Promise<void> {
  await pool.query(
    'INSERT INTO search_logs (location_query, lat, lng, user_id) VALUES ($1, $2, $3, $4)',
    [locationQuery, lat || null, lng || null, userId || null]
  );
}

export async function getVenueMetrics(pool: Pool, venueId: number): Promise<VenueMetrics> {
  const query = `
    SELECT 
      COUNT(*) FILTER (WHERE event_type = 'view') as views,
      COUNT(*) FILTER (WHERE event_type = 'website_click') as "websiteClicks",
      COUNT(*) FILTER (WHERE event_type = 'map_click') as "mapClicks"
    FROM venue_analytics
    WHERE venue_id = $1
  `;
  const res = await pool.query(query, [venueId]);
  const row = res.rows[0];
  return {
    views: parseInt(row.views, 10),
    websiteClicks: parseInt(row.websiteClicks, 10),
    mapClicks: parseInt(row.mapClicks, 10)
  };
}

export async function getSearchHeatmapData(pool: Pool): Promise<{lat: number, lng: number}[]> {
  const res = await pool.query('SELECT lat, lng FROM search_logs WHERE lat IS NOT NULL AND lng IS NOT NULL LIMIT 5000');
  return res.rows;
}
