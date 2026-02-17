export const up = (pgm) => {
  pgm.addColumns('venues', {
    subscription_tier: {
      type: 'varchar(20)',
      notNull: true,
      default: 'free',
      check: "subscription_tier IN ('free', 'pro', 'enterprise')",
    },
    subscription_status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'active', // For free tier, it's always active
    },
  });

  pgm.createIndex('venues', 'subscription_tier');
};

export const down = (pgm) => {
  pgm.dropColumns('venues', ['subscription_tier', 'subscription_status']);
};
