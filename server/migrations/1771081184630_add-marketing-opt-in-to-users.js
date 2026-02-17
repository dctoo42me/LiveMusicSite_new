export const up = (pgm) => {
  pgm.addColumns('users', {
    marketing_opt_in: { type: 'boolean', notNull: true, default: false },
  });
};

export const down = (pgm) => {
  pgm.dropColumns('users', ['marketing_opt_in']);
};
