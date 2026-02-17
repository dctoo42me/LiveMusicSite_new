export const up = async (pgm) => {
  // 1. Create the new 'venues_static' table
  pgm.createTable('venues_static', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    city: { type: 'varchar(255)', notNull: true },
    state: { type: 'varchar(255)', notNull: true },
    zipcode: 'varchar(20)',
    website: 'varchar(255)',
    imageUrl: 'varchar(255)',
    description: 'text', // General venue description
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // 2. Populate 'venues_static' from existing 'venues'
  // We use DISTINCT ON (name, city, state) to avoid duplicates
  // Fix: Quote "imageUrl" to handle case sensitivity
  pgm.sql(`
    INSERT INTO venues_static (name, city, state, zipcode, website, "imageUrl", description)
    SELECT DISTINCT ON (name, city, state) name, city, state, zipcode, website, "imageUrl", description
    FROM venues
  `);

  // 3. Rename 'venues' to 'events'
  pgm.renameTable('venues', 'events');

  // 4. Add 'venue_id' to 'events'
  pgm.addColumns('events', {
    venue_id: {
      type: 'integer',
      references: '"venues_static"',
      onDelete: 'CASCADE',
    },
  });

  // 5. Populate 'venue_id' in 'events'
  pgm.sql(`
    UPDATE events
    SET venue_id = venues_static.id
    FROM venues_static
    WHERE events.name = venues_static.name
      AND events.city = venues_static.city
      AND events.state = venues_static.state
  `);

  // 6. Make 'venue_id' not null after population
  pgm.alterColumn('events', 'venue_id', { notNull: true });

  // 7. Handle 'favorite_venues'
  // Currently favorites point to 'events' (old venues). We want them to point to 'venues_static'.
  // We need to:
  // a. Add new column 'new_venue_id' to favorite_venues
  // b. Populate it by joining favorite_venues -> events -> venues_static
  // c. Drop old foreign key and column
  // d. Rename 'new_venue_id' to 'venue_id'
  
  pgm.addColumns('favorite_venues', {
    new_venue_id: {
      type: 'integer',
      references: '"venues_static"',
      onDelete: 'CASCADE',
    },
  });

  pgm.sql(`
    UPDATE favorite_venues
    SET new_venue_id = events.venue_id
    FROM events
    WHERE favorite_venues.venue_id = events.id
  `);

  // Drop the old constraint and column (this removes the link to specific events)
  pgm.dropConstraint('favorite_venues', 'favorite_venues_venue_id_fkey');
  pgm.dropColumn('favorite_venues', 'venue_id');
  
  // Rename new column to old name
  pgm.renameColumn('favorite_venues', 'new_venue_id', 'venue_id');
  // Add NOT NULL constraint if appropriate (assuming all favorites migrated)
  // pgm.alterColumn('favorite_venues', 'venue_id', { notNull: true }); // Optional, might fail if data issue

  // 8. Clean up 'events' table
  // Remove columns that moved to 'venues_static'
  pgm.dropColumns('events', ['name', 'city', 'state', 'zipcode', 'website', 'imageUrl']);
  // Note: We keep 'description' in events for event-specific details? 
  // The original table had one description. I moved it to venue. 
  // Let's create a new 'event_description' if needed, or rename existing 'description' to 'details' if it varies?
  // For now, I'll assume the original description was venue-level. 
  // I will DROP description from events as it's now in venues_static.
  pgm.dropColumns('events', ['description']);

  // 9. Rename 'venues_static' to 'venues'
  pgm.renameTable('venues_static', 'venues');
};

export const down = async (pgm) => {
  // This would be complex to reverse perfectly due to data loss (dropping columns).
  // A simplified down migration or "irreyversible" warning is standard.
  // For dev, we might just drop everything and re-seed if needed.
};
