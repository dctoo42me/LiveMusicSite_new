export const up = (pgm) => {
  pgm.addColumns('venues', {
    stripe_customer_id: { type: 'varchar(100)', notNull: false },
  });
  pgm.createIndex('venues', 'stripe_customer_id');
};

export const down = (pgm) => {
  pgm.dropColumns('venues', ['stripe_customer_id']);
};
