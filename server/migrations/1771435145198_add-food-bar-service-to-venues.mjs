/* eslint-disable camelcase */

export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumns('venues', {
    food_service_type: {
      type: 'VARCHAR(20)',
      notNull: true,
      default: 'none', // Default to 'none' if not specified
      check: 'food_service_type IN (\'none\', \'bar_bites\', \'full_menu\')',
    },
    bar_service_type: {
      type: 'VARCHAR(20)',
      notNull: true,
      default: 'none', // Default to 'none' if not specified
      check: 'bar_service_type IN (\'none\', \'non_alcoholic\', \'alcoholic_only\', \'full_bar\')',
    },
  });

  // Update existing venues to a reasonable default if 'none' is not desired for all
  // For example, if a venue has events, it likely has some beverage service.
  pgm.sql(`
    UPDATE venues SET bar_service_type = 'full_bar' WHERE type IN ('music', 'both');
    UPDATE venues SET food_service_type = 'full_menu' WHERE type IN ('meals', 'both');
  `);
};

export const down = (pgm) => {
  pgm.dropColumns('venues', ['food_service_type', 'bar_service_type']);
};
