/**
 * Job types and constants barrel export
 */

export * from './transcode.job';
export * from './waveform.job';
export * from './artwork-extract.job';
export * from './loudness.job';
export * from './analytics-rollup.job';

/**
 * Union type of all job names
 */
export type JobName =
  | typeof import('./transcode.job').TRANSCODE_JOB
  | typeof import('./waveform.job').WAVEFORM_JOB
  | typeof import('./artwork-extract.job').ARTWORK_EXTRACT_JOB
  | typeof import('./loudness.job').LOUDNESS_JOB
  | typeof import('./analytics-rollup.job').ANALYTICS_ROLLUP_JOB;
