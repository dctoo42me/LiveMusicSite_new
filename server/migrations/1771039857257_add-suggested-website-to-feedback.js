export const up = (pgm) => {
  pgm.addColumns('venue_feedback', {
    suggested_website: { type: 'varchar(255)', notNull: false },
  });
};

export const down = (pgm) => {
  pgm.dropColumns('venue_feedback', ['suggested_website']);
};
