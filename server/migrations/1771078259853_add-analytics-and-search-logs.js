export const up = (pgm) => {
  // 1. Venue Analytics Table (Views and Clicks)
  pgm.createTable('venue_analytics', {
    id: 'id',
    venue_id: {
      type: 'integer',
      notNull: true,
      references: '"venues"',
      onDelete: 'CASCADE',
    },
    event_type: { 
      type: 'varchar(30)', 
      notNull: true,
      // 'view', 'website_click', 'map_click'
    },
    user_id: {
      type: 'integer',
      references: '"users"',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('venue_analytics', ['venue_id', 'event_type']);
  pgm.createIndex('venue_analytics', 'created_at');

  // 2. Search Logs Table (For Admin Heatmaps)
  pgm.createTable('search_logs', {
    id: 'id',
    location_query: { type: 'varchar(255)' },
    lat: { type: 'double precision' },
    lng: { type: 'double precision' },
    user_id: {
      type: 'integer',
      references: '"users"',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('search_logs', 'created_at');
  pgm.createIndex('search_logs', ['lat', 'lng']);
};

export const down = (pgm) => {
  pgm.dropTable('search_logs');
  pgm.dropTable('venue_analytics');
};
