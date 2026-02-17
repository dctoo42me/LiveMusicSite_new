export const up = (pgm) => {
  pgm.addColumns('users', {
    onboarding_completed: { type: 'boolean', notNull: true, default: false },
  });
};

export const down = (pgm) => {
  pgm.dropColumns('users', ['onboarding_completed']);
};
