// server/scripts/seed-placeholder-events.ts
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://live_music_user:MyDev123!@localhost:5432/live_music_db';
const pool = new Pool({ connectionString: DATABASE_URL });

async function seedPlaceholderEvents() {
  console.log('Fetching venues without upcoming events...');

  try {
    // 1. Find all venues that have 0 events scheduled for today or the future
    const venueRes = await pool.query(`
      SELECT v.id, v.name 
      FROM venues v
      LEFT JOIN events e ON v.id = e.venue_id AND e.date >= CURRENT_DATE
      WHERE e.id IS NULL
    `);

    const venues = venueRes.rows;
    console.log(`Found ${venues.length} venues needing events.`);

    for (const venue of venues) {
      // 2. Create a placeholder event for 2 weeks from today
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      const dateString = futureDate.toISOString().split('T')[0];

      await pool.query(`
        INSERT INTO events (venue_id, date, type, description, tags)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        venue.id,
        dateString,
        'both',
        'Join us for a signature evening of great food and local live talent.',
        ['Live Music', 'Acoustic']
      ]);

      console.log(`  - Added event to: ${venue.name}`);
    }

    console.log('Seeding complete! All venues now have an active calendar.');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await pool.end();
  }
}

seedPlaceholderEvents();
