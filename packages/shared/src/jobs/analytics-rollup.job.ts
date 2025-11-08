/**
 * Analytics rollup job data
 * Aggregates play events into daily summaries
 */
export interface AnalyticsRollupJobData {
  day: string; // YYYY-MM-DD format
}

/**
 * Analytics rollup job result
 */
export interface AnalyticsRollupJobResult {
  success: boolean;
  tracks_processed?: number;
  error?: string;
}

/**
 * Job name constant
 */
export const ANALYTICS_ROLLUP_JOB = 'analytics-rollup' as const;
