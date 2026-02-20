// server/scripts/seed-google-places.ts
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

// SECURITY FIX: Use environment variables, NEVER hardcode keys in scripts pushed to public repos.
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!GOOGLE_API_KEY) {
  console.error('Error: GOOGLE_MAPS_API_KEY is not defined in environment variables.');
  process.exit(1);
}

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
      
      const addrParts = address.split(',').map((p: string) => p.trim());
      const cityPart = addrParts[addrParts.length - 3] || city;
      const stateZipPart = addrParts[addrParts.length - 2] || '';
      const [statePart, zipPart] = stateZipPart.split(' ');

      const lat = place.geometry.location.lat;
      const lng = place.geometry.location.lng;
      const rating = place.rating;
      
      // 3. Insert into DB (Aligned with Structural Cleanup Schema)
      await pool.query(`
        INSERT INTO venues (name, city, state, zipcode, lat, lng, description, food_service_type, bar_service_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (name, city, state) DO NOTHING
      `, [
        name,
        cityPart,
        statePart || 'TX',
        zipPart || null,
        lat,
        lng,
        `Vibrant venue found via discovery. Rated ${rating} stars on Google.`,
        'bar_bites', // Default for discovered venues
        'full_bar'   // Default for discovered venues
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
