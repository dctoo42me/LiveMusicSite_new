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
  pgm.createTable('venues', {
    id: {
      type: 'SERIAL',
      primaryKey: true,
    },
    name: {
      type: 'VARCHAR(255)',
      notNull: true,
    },
    city: {
      type: 'VARCHAR(255)',
      notNull: true,
    },
    state: {
      type: 'VARCHAR(255)',
      notNull: true,
    },
    zipcode: {
      type: 'VARCHAR(20)',
    },
    date: {
      type: 'DATE',
      notNull: true,
    },
    type: {
      type: 'VARCHAR(10)',
      notNull: true,
      check: 'type IN (\'music\', \'meals\', \'both\')',
    },
    description: {
      type: 'TEXT',
    },
    website: {
      type: 'VARCHAR(255)',
    },
    "imageUrl": { // Quoted here
      type: 'VARCHAR(255)',
    },
    created_at: {
      type: 'TIMESTAMP WITH TIME ZONE',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.sql(`
    INSERT INTO venues (name, city, state, zipcode, date, type, description, website, "imageUrl") VALUES
    ('ACL Live', 'Austin', 'TX', '78701', '2025-12-25', 'music', 'Premier live music venue.', 'https://www.acl-live.com/', 'https://picsum.photos/id/1040/400/200'),
    ('Oasis on Lake Travis', 'Austin', 'TX', '78734', '2025-12-26', 'meals', 'Restaurant with scenic views and live music.', 'https://oasis-austin.com/', 'https://picsum.photos/id/1043/400/200'),
    ('The Continental Club', 'Austin', 'TX', '78704', '2025-12-27', 'music', 'Historic live music club.', 'https://continentalclub.com/', 'https://picsum.photos/id/1042/400/200'),
    ('Stubb''''s BBQ', 'Austin', 'TX', '78701', '2025-12-28', 'both', 'Famous BBQ with outdoor concert venue.', 'https://www.stubbsaustin.com/', 'https://picsum.photos/id/1045/400/200'),
    ('Mohawk Austin', 'Austin', 'TX', '78701', '2025-12-29', 'music', 'Indoor/outdoor venue for indie and rock.', 'https://mohawkaustin.com/', 'https://picsum.photos/id/1047/400/200'),
    ('Gruene Hall', 'New Braunfels', 'TX', '78130', '2025-12-30', 'music', 'Texas'' oldest continually operating dance hall.', 'https://gruenehall.com/', 'https://picsum.photos/id/1048/400/200'),
    ('The Bluebird Cafe', 'Nashville', 'TN', '37212', '2025-12-31', 'music', 'Intimate venue for acoustic music.', 'https://bluebirdcafe.com/', 'https://picsum.photos/id/1049/400/200');
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('venues');
};