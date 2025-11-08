/**
 * Economics configuration for the platform
 * Defines the voluntary contribution and distribution model
 */

export interface EconomicsConfig {
  // Default split percentages (must sum to 100)
  defaultSplits: {
    artists: number; // Percentage going to artists based on listening time
    charity: number; // Percentage going to selected charity
    platform: number; // Percentage going to platform operations
  };

  // Contribution settings
  contribution: {
    minAmountCents: number; // Minimum contribution amount
    maxAmountCents: number; // Maximum contribution amount
    defaultAmountCents: number; // Suggested default amount
    currency: string; // ISO currency code
  };

  // Distribution settings
  distribution: {
    model: 'user-centric'; // Distribution model type
    period: 'monthly'; // Distribution frequency
    minPayoutCents: number; // Minimum payout threshold for artists
  };

  // Supported payment providers
  paymentProviders: {
    stripe: {
      enabled: boolean;
      publicKey: string;
    };
  };
}

export const economicsConfig: EconomicsConfig = {
  defaultSplits: {
    artists: 80, // 80% to artists you listen to
    charity: 10, // 10% to your chosen charity
    platform: 10, // 10% to platform operations
  },

  contribution: {
    minAmountCents: 100, // $1.00 minimum
    maxAmountCents: 100000, // $1,000.00 maximum
    defaultAmountCents: 1000, // $10.00 suggested
    currency: 'USD',
  },

  distribution: {
    model: 'user-centric',
    period: 'monthly',
    minPayoutCents: 1000, // $10.00 minimum payout
  },

  paymentProviders: {
    stripe: {
      enabled: true,
      publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
    },
  },
};

/**
 * User-Centric Distribution Model
 *
 * How it works:
 * 1. User makes a voluntary contribution (e.g., $10/month)
 * 2. Contribution is split according to configured percentages:
 *    - 80% ($8) goes to artists based on listening time
 *    - 10% ($1) goes to selected charity
 *    - 10% ($1) goes to platform operations
 *
 * 3. Artist distribution is user-centric:
 *    - Your $8 artist pool is divided among artists YOU listen to
 *    - Distribution is proportional to listening time
 *    - Example: If you listen to Artist A for 60% of time, they get $4.80
 *               If you listen to Artist B for 40% of time, they get $3.20
 *
 * 4. Monthly distribution:
 *    - All contributions for a month are pooled per user
 *    - At month end, system calculates each user's listening breakdown
 *    - Creates ArtistPayout records with transparent breakdown
 *    - Charity totals are updated
 *
 * Benefits:
 * - Artists are paid directly by fans who actually listen to them
 * - No gaming the system with fake plays (only paying listeners count)
 * - Transparent impact tracking for contributors
 * - Support for charitable causes
 * - Sustainable platform operations
 */
