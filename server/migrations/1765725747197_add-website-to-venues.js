/* eslint-disable camelcase */

export const up = (pgm) => {
  pgm.addColumns('venues', {
    website: {
      type: 'text',
      notNull: false, // Or true if you want to enforce it
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumns('venues', ['website']);
};