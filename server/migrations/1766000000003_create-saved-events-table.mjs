export const up = async (pgm) => {
  pgm.createTable('saved_events', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    event_id: {
      type: 'integer',
      notNull: true,
      references: '"events"',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Ensure a user can only save a specific event once
  pgm.addConstraint('saved_events', 'unique_user_event', {
    unique: ['user_id', 'event_id'],
  });

  // Add indexes for performance
  pgm.createIndex('saved_events', 'user_id');
  pgm.createIndex('saved_events', 'event_id');
};

export const down = async (pgm) => {
  pgm.dropTable('saved_events');
};
