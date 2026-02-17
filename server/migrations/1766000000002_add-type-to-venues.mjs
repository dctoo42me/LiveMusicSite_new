export const up = async (pgm) => {
  // Add 'type' column to 'venues' table
  pgm.addColumns('venues', {
    type: { 
      type: 'varchar(10)', 
      notNull: true, 
      default: 'both',
      check: "type IN ('music', 'meals', 'both')" 
    },
  });

  // Populate 'type' from existing events (using the most common or first type)
  pgm.sql(`
    UPDATE venues v
    SET type = (
      SELECT type 
      FROM events e 
      WHERE e.venue_id = v.id 
      LIMIT 1
    )
    WHERE EXISTS (SELECT 1 FROM events e WHERE e.venue_id = v.id)
  `);
};

export const down = async (pgm) => {
  pgm.dropColumns('venues', ['type']);
};
