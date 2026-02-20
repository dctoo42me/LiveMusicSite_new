/* eslint-disable camelcase */

export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumn('events', {
    status: {
      type: 'VARCHAR(20)',
      notNull: true,
      default: 'published', // Existing events are considered published
      check: "status IN ('draft', 'published', 'cancelled')",
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('events', 'status');
};
