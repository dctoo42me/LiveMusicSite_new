export const up = (pgm) => {
  pgm.addConstraint('venues', 'unique_venue_identity', {
    unique: ['name', 'city', 'state'],
  });
};

export const down = (pgm) => {
  pgm.dropConstraint('venues', 'unique_venue_identity');
};
