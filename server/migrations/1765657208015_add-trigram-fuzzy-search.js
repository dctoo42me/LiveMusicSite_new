/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
// The "up" function applies the migration
export const up = (pgm) => { // <-- Use 'export const' instead of 'exports.up'
    // 1. Enable the pg_trgm extension
    pgm.sql(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // 2. Create the GIN index for fast fuzzy search on the city column
    pgm.sql(`CREATE INDEX idx_venues_city_trgm ON venues USING GIN (city gin_trgm_ops);`);

    // 3. Create the GIN index for fast fuzzy search on the state column
    pgm.sql(`CREATE INDEX idx_venues_state_trgm ON venues USING GIN (state gin_trgm_ops);`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
// The "down" function rolls back the migration
export const down = (pgm) => { // <-- Use 'export const' instead of 'exports.down'
    // Clean up (optional but good practice)
    pgm.sql(`DROP INDEX IF EXISTS idx_venues_city_trgm;`);
    pgm.sql(`DROP INDEX IF EXISTS idx_venues_state_trgm;`);
    // Note: Dropping the extension is usually not necessary for a simple rollback.
};