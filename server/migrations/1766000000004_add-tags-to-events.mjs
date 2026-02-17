export async function up(pgm) {
  pgm.addColumn('events', {
    tags: { type: 'text[]', default: '{}' },
  });
};

export async function down(pgm) {
  pgm.dropColumn('events', 'tags');
};
