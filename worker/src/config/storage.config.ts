/**
 * Storage configuration
 * MinIO/S3 settings for workers
 */

export interface StorageConfig {
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  buckets: {
    originals: string;
    transcodes: string;
    waveforms: string;
    images: string;
  };
}

/**
 * Load storage configuration from environment
 */
export function loadStorageConfig(): StorageConfig {
  return {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    buckets: {
      originals: process.env.BUCKET_ORIGINALS || 'originals',
      transcodes: process.env.BUCKET_TRANSCODES || 'transcodes',
      waveforms: process.env.BUCKET_WAVEFORMS || 'waveforms',
      images: process.env.BUCKET_IMAGES || 'images',
    },
  };
}
