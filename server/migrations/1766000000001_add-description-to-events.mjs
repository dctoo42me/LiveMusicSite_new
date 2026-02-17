export const up = async (pgm) => {
  pgm.addColumns('events', {
    description: { type: 'text' },
  });
};

export const down = async (pgm) => {
  pgm.dropColumns('events', ['description']);
};
