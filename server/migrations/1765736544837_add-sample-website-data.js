/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`
    UPDATE venues SET website = 'https://www.acl-live.com/' WHERE id = 1 AND name = 'ACL Live';
    UPDATE venues SET website = 'https://oasis-austin.com/' WHERE id = 2 AND name = 'Oasis on Lake Travis';
    UPDATE venues SET website = 'https://continentalclub.com/' WHERE id = 3 AND name = 'The Continental Club';
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    UPDATE venues SET website = NULL WHERE id = 1 AND name = 'ACL Live';
    UPDATE venues SET website = NULL WHERE id = 2 AND name = 'Oasis on Lake Travis';
    UPDATE venues SET website = NULL WHERE id = 3 AND name = 'The Continental Club';
  `);
};
