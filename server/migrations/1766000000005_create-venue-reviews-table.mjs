export async function up(pgm) {
  pgm.createTable('venue_reviews', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    venue_id: {
      type: 'integer',
      notNull: true,
      references: '"venues"',
      onDelete: 'CASCADE',
    },
    rating: {
      type: 'integer',
      notNull: true,
      check: 'rating >= 1 AND rating <= 5',
    },
    comment: {
      type: 'text',
      notNull: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Ensure a user can only review a venue once
  pgm.addConstraint('venue_reviews', 'unique_user_venue_review', {
    unique: ['user_id', 'venue_id'],
  });

  pgm.createIndex('venue_reviews', 'venue_id');
};

export async function down(pgm) {
  pgm.dropTable('venue_reviews');
};
