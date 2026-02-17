export const up = (pgm) => {
  pgm.createTable('support_tickets', {
    id: 'id',
    user_id: {
      type: 'integer',
      references: '"users"',
      onDelete: 'SET NULL',
    },
    name: { type: 'varchar(100)', notNull: true },
    email: { type: 'varchar(255)', notNull: true },
    subject: { type: 'varchar(200)', notNull: true },
    message: { type: 'text', notNull: true },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'OPEN',
      check: "status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')",
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('support_tickets', 'status');
  pgm.createIndex('support_tickets', 'user_id');
};

export const down = (pgm) => {
  pgm.dropTable('support_tickets');
};
