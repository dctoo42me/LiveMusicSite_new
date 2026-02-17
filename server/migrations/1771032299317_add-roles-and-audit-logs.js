export const up = (pgm) => {
  // 1. Add role and is_active to users table
  pgm.addColumns('users', {
    role: {
      type: 'varchar(20)',
      notNull: true,
      default: 'user',
      check: "role IN ('user', 'admin', 'operator')",
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
  });

  // 2. Create audit_logs table
  pgm.createTable('audit_logs', {
    id: 'id',
    user_id: {
      type: 'integer',
      references: '"users"',
      onDelete: 'SET NULL',
    },
    action: { type: 'varchar(50)', notNull: true },
    entity_type: { type: 'varchar(50)', notNull: true },
    entity_id: { type: 'integer' },
    details: { type: 'jsonb' },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // 3. Index for performance
  pgm.createIndex('audit_logs', 'user_id');
  pgm.createIndex('audit_logs', ['entity_type', 'entity_id']);
};

export const down = (pgm) => {
  pgm.dropTable('audit_logs');
  pgm.dropColumns('users', ['role', 'is_active']);
};
