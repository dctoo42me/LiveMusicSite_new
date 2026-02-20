import 'dotenv/config';
import { createPool } from '../src/db.js';
import logger from '../src/utils/logger.js';

const pool = createPool();

async function seedDiverseData() {
  try {
    logger.info('Starting diverse data seeding (Structural Cleanup Version)...');

    const venues = [
      { name: 'The Blues Attic', city: 'New Orleans', state: 'LA', zipcode: '70112', description: 'Soulful music and Southern hospitality.', food_service_type: 'bar_bites', bar_service_type: 'full_bar', performance_tag: 'Blues' },
      { name: 'Rock Harbor', city: 'Seattle', state: 'WA', zipcode: '98101', description: 'The heart of Seattle rock.', food_service_type: 'bar_bites', bar_service_type: 'full_bar', performance_tag: 'Rock' },
      { name: 'Country Roadhouse', city: 'Nashville', state: 'TN', zipcode: '37201', description: 'True country music with the best BBQ in town.', food_service_type: 'full_menu', bar_service_type: 'full_bar', performance_tag: 'Country' },
      { name: 'Modern Beats', city: 'Miami', state: 'FL', zipcode: '33101', description: 'High energy electronic music and light shows.', food_service_type: 'none', bar_service_type: 'full_bar', performance_tag: 'DJ Set' },
      { name: 'Symphony Hall', city: 'Boston', state: 'MA', zipcode: '02115', description: 'World-class acoustics for world-class music.', food_service_type: 'none', bar_service_type: 'non_alcoholic', performance_tag: 'Classical' },
      { name: 'The Stand-Up Spot', city: 'Chicago', state: 'IL', zipcode: '60601', description: 'A night of laughs and great cocktails.', food_service_type: 'bar_bites', bar_service_type: 'full_bar', performance_tag: 'Stand-up Comedy' },
      { name: 'Oasis on Lake Travis', city: 'Austin', state: 'TX', zipcode: '78734', description: 'Restaurant with scenic views and live music.', food_service_type: 'full_menu', bar_service_type: 'full_bar', performance_tag: 'Dining Entertainment' }
    ];

    for (const v of venues) {
      // Clear existing to avoid conflicts and ensure fresh start
      await pool.query('DELETE FROM venues WHERE name = $1', [v.name]);
      
      const res = await pool.query(
        'INSERT INTO venues (name, city, state, zipcode, description, food_service_type, bar_service_type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [v.name, v.city, v.state, v.zipcode, v.description, v.food_service_type, v.bar_service_type]
      );
      const venueId = res.rows[0].id;
      
      // Add events for this new venue in the 'events' table
      await pool.query(
        'INSERT INTO events (venue_id, date, description, tags) VALUES ($1, $2, $3, $4)',
        [venueId, '2026-03-20', `${v.name} Grand Night`, [v.performance_tag, 'Live']]
      );
    }

    logger.info('Successfully seeded diverse data!');
  } catch (error) {
    logger.error('Error seeding diverse data:', error);
  } finally {
    await pool.end();
  }
}

seedDiverseData();
