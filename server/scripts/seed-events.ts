import 'dotenv/config';
import { createPool } from '../src/db.js';
import logger from '../src/utils/logger.js';

const pool = createPool();

async function seedEvents() {
  try {
    const venueId = 1; // ACL Live
    const events = [
      { date: '2026-03-15', type: 'music', description: 'Spring Jazz Festival - Main Stage', tags: ['Jazz', 'Festival', 'Live Music'] },
      { date: '2026-03-20', type: 'both', description: 'Dinner & Symphony Night', tags: ['Symphony', 'Fine Dining', 'Formal'] },
      { date: '2026-04-05', type: 'music', description: 'Rock Legends Reunion Tour', tags: ['Rock', 'Concert', 'Classic'] },
      { date: '2026-04-12', type: 'meals', description: 'Sunday Brunch with Live Acoustic', tags: ['Acoustic', 'Brunch', 'Relaxed'] },
    ];

    for (const event of events) {
      await pool.query(
        'INSERT INTO events (venue_id, date, type, description, tags) VALUES ($1, $2, $3, $4, $5)',
        [venueId, event.date, event.type, event.description, event.tags]
      );
    }
    logger.info('Successfully seeded events for ACL Live');
  } catch (error) {
    logger.error('Error seeding events:', error);
  } finally {
    await pool.end();
  }
}

seedEvents();
