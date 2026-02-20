/* eslint-disable camelcase */

export const shorthands = undefined;

export const up = (pgm) => {
  // Remove legacy 'type' column from venues
  pgm.dropColumn('venues', 'type');
  
  // Remove legacy 'type' column from events
  pgm.dropColumn('events', 'type');
};

export const down = (pgm) => {
  // Adding them back would be difficult as we'd lose data, 
  // but for completeness of the migration pattern:
  pgm.addColumn('venues', {
    type: { type: 'VARCHAR(10)', default: 'both' }
  });
  pgm.addColumn('events', {
    type: { type: 'VARCHAR(10)', default: 'both' }
  });
};
