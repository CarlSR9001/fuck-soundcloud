/**
 * Distribution job data
 * Triggered monthly to distribute user contributions to artists
 */
export interface DistributionJobData {
  period: string; // YYYY-MM format
}

/**
 * Distribution job result
 */
export interface DistributionJobResult {
  success: boolean;
  period: string;
  contributions_processed: number;
  payouts_created: number;
  total_distributed_cents: number;
  charity_amount_cents: number;
  platform_amount_cents: number;
  artists_paid: number;
  error?: string;
}

/**
 * Job name constant
 */
export const DISTRIBUTION_JOB = 'distribution' as const;
