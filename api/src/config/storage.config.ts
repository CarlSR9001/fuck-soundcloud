import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true' || false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  region: process.env.MINIO_REGION || 'us-east-1',
  buckets: {
    originals: process.env.MINIO_BUCKET_ORIGINALS || 'originals',
    transcodes: process.env.MINIO_BUCKET_TRANSCODES || 'transcodes',
    images: process.env.MINIO_BUCKET_IMAGES || 'images',
    waveforms: process.env.MINIO_BUCKET_WAVEFORMS || 'waveforms',
    stems: process.env.MINIO_BUCKET_STEMS || 'stems',
  },
}));
