export const up = (pgm) => {
  pgm.createTable('venue_claims', {
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
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'PENDING',
      check: "status IN ('PENDING', 'APPROVED', 'REJECTED')",
    },
    proof_url: { type: 'varchar(255)' },
    details: { type: 'text' },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Ensure one user can't claim the same venue multiple times
  pgm.addConstraint('venue_claims', 'unique_user_venue_claim', {
    unique: ['user_id', 'venue_id'],
  });

  pgm.createIndex('venue_claims', 'status');
};

export const down = (pgm) => {
  pgm.dropTable('venue_claims');
};
