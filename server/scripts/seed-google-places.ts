// server/scripts/seed-google-places.ts
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAtp_i9VDwu4WP5E9X3zYZfsd-FwlzCX9I';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://live_music_user:MyDev123!@localhost:5432/live_music_db';

const pool = new Pool({ connectionString: DATABASE_URL });

async function seedFromGoogle(city: string) {
  console.log(`Searching for venues in ${city}...`);
  
  // 1. Find places using Text Search
  // We look for 'live music restaurants' to get the best pairings
  const query = encodeURIComponent(`live music restaurants in ${city}`);
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json() as any;

    if (data.status !== 'OK') {
      throw new Error(`Google API Error: ${data.status} - ${data.error_message || 'No message'}`);
    }

    const places = data.results;
    console.log(`Found ${places.length} potential venues.`);

    for (const place of places) {
      // 2. Map Google data to our schema
      const name = place.name;
      const address = place.formatted_address || '';
      
      // Extract city/state/zip from formatted_address if possible
      // Google usually gives: "123 Main St, Austin, TX 78701, USA"
      const addrParts = address.split(',').map((p: string) => p.trim());
      const cityPart = addrParts[addrParts.length - 3] || city;
      const stateZipPart = addrParts[addrParts.length - 2] || '';
      const [statePart, zipPart] = stateZipPart.split(' ');

      const lat = place.geometry.location.lat;
      const lng = place.geometry.location.lng;
      const rating = place.rating;
      
      // 3. Insert into DB
      // We use ON CONFLICT to avoid duplicates if we run this multiple times
      await pool.query(`
        INSERT INTO venues (name, city, state, zipcode, lat, lng, description, type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (name, city, state) DO NOTHING
      `, [
        name,
        cityPart,
        statePart || 'TX',
        zipPart || null,
        lat,
        lng,
        `Vibrant venue found via discovery. Rated ${rating} stars on Google.`,
        'both' // Default to both for our platform pairing mission
      ]);

      console.log(`  - Processed: ${name}`);
    }

    console.log(`Seeding for ${city} complete.`);
  } catch (error) {
    console.error(`Failed to seed ${city}:`, error);
  }
}

async function main() {
  const targetCities = ['Austin, TX', 'Nashville, TN', 'New Orleans, LA'];
  
  for (const city of targetCities) {
    await seedFromGoogle(city);
  }
  
  await pool.end();
}

main();
