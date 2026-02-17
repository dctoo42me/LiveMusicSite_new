export const up = (pgm) => {
  // 1. Add lat and lng columns
  pgm.addColumns('venues', {
    lat: { type: 'double precision' },
    lng: { type: 'double precision' },
  });

  // 2. Populate sample data coordinates
  // Austin center is roughly 30.2672, -97.7431
  // Nashville center is roughly 36.1627, -86.7816
  pgm.sql(`
    UPDATE venues SET lat = 30.2651, lng = -97.7433 WHERE name = 'ACL Live';
    UPDATE venues SET lat = 30.4015, lng = -97.8912 WHERE name = 'Oasis on Lake Travis';
    UPDATE venues SET lat = 30.2497, lng = -97.7505 WHERE name = 'The Continental Club';
    UPDATE venues SET lat = 30.2661, lng = -97.7362 WHERE name = 'Stubb''s BBQ';
    UPDATE venues SET lat = 30.2701, lng = -97.7361 WHERE name = 'Mohawk Austin';
    UPDATE venues SET lat = 29.7384, lng = -98.1033 WHERE name = 'Gruene Hall';
    UPDATE venues SET lat = 36.1025, lng = -86.8169 WHERE name = 'The Bluebird Cafe';
  `);

  // 3. Create a spatial index (standard index for lat/lng)
  pgm.createIndex('venues', ['lat', 'lng']);
};

export const down = (pgm) => {
  pgm.dropIndex('venues', ['lat', 'lng']);
  pgm.dropColumn('venues', 'lat');
  pgm.dropColumn('venues', 'lng');
};
