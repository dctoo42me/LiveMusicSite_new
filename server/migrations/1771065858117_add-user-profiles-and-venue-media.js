export const up = (pgm) => {
  // 1. Add profile fields to users
  pgm.addColumns('users', {
    avatar_url: { type: 'varchar(255)', notNull: false },
    bio: { type: 'text', notNull: false },
  });

  // 2. Create venue_images table for secondary gallery images
  pgm.createTable('venue_images', {
    id: 'id',
    venue_id: {
      type: 'integer',
      notNull: true,
      references: '"venues"',
      onDelete: 'CASCADE',
    },
    image_url: { type: 'varchar(255)', notNull: true },
    is_primary: { type: 'boolean', notNull: true, default: false },
    alt_text: { type: 'varchar(100)' },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('venue_images', 'venue_id');
};

export const down = (pgm) => {
  pgm.dropTable('venue_images');
  pgm.dropColumns('users', ['avatar_url', 'bio']);
};
