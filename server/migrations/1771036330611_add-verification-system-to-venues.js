export const up = (pgm) => {
  // 1. Add verification columns to venues
  pgm.addColumns('venues', {
    verification_status: {
      type: 'varchar(30)',
      notNull: true,
      default: 'UNVERIFIED',
      check: "verification_status IN ('UNVERIFIED', 'COMMUNITY_VERIFIED', 'OWNER_VERIFIED', 'FLAGGED')",
    },
    positive_confirmations: { type: 'integer', notNull: true, default: 0 },
    negative_confirmations: { type: 'integer', notNull: true, default: 0 },
  });

  // 2. Create venue_feedback table to track user votes
  pgm.createTable('venue_feedback', {
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
    has_live_performance: { type: 'boolean', notNull: true },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // 3. Prevent multiple votes from the same user on the same venue
  pgm.addConstraint('venue_feedback', 'unique_user_venue_feedback', {
    unique: ['user_id', 'venue_id'],
  });

  pgm.createIndex('venues', 'verification_status');
};

export const down = (pgm) => {
  pgm.dropTable('venue_feedback');
  pgm.dropColumns('venues', ['verification_status', 'positive_confirmations', 'negative_confirmations']);
};
