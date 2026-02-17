export const up = (pgm) => {
  // 1. Add owner_id to venues table to link a venue to a user (operator)
  pgm.addColumns('venues', {
    owner_id: {
      type: 'integer',
      references: '"users"',
      onDelete: 'SET NULL', // If a user is deleted, the venue remains but loses its owner
    },
  });

  // 2. Index the owner_id for faster lookups when we build the operator dashboard
  pgm.createIndex('venues', 'owner_id');
};

export const down = (pgm) => {
  pgm.dropIndex('venues', 'owner_id');
  pgm.dropColumn('venues', 'owner_id');
};
