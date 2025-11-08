/**
 * MinIO/S3 storage service
 * Handles file download and upload operations
 */

import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { Client as MinioClient } from 'minio';
import { loadStorageConfig } from '../config/storage.config';

export class StorageService {
  private client: MinioClient;
  private buckets: Record<string, string>;

  constructor() {
    const config = loadStorageConfig();

    this.client = new MinioClient({
      endPoint: config.endpoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });

    this.buckets = config.buckets;
  }

  /**
   * Download file from MinIO to local filesystem
   */
  async downloadFile(bucket: string, key: string, localPath: string): Promise<void> {
    const dirPath = path.dirname(localPath);
    await fs.promises.mkdir(dirPath, { recursive: true });

    await this.client.fGetObject(bucket, key, localPath);
  }

  /**
   * Upload file from local filesystem to MinIO
   */
  async uploadFile(
    bucket: string,
    key: string,
    localPath: string,
    contentType?: string
  ): Promise<void> {
    const stats = await fs.promises.stat(localPath);
    const metadata: Record<string, string> = {};

    if (contentType) {
      metadata['Content-Type'] = contentType;
    }

    await this.client.fPutObject(bucket, key, localPath, stats.size, metadata);
  }

  /**
   * Upload stream to MinIO
   */
  async uploadStream(
    bucket: string,
    key: string,
    stream: Readable,
    size: number,
    contentType?: string
  ): Promise<void> {
    const metadata: Record<string, string> = {};

    if (contentType) {
      metadata['Content-Type'] = contentType;
    }

    await this.client.putObject(bucket, key, stream, size, metadata);
  }

  /**
   * Get bucket name by type
   */
  getBucket(type: 'originals' | 'transcodes' | 'waveforms' | 'images'): string {
    return this.buckets[type];
  }

  /**
   * Delete object from MinIO
   */
  async deleteObject(bucket: string, key: string): Promise<void> {
    await this.client.removeObject(bucket, key);
  }

  /**
   * List objects with prefix
   */
  async listObjects(bucket: string, prefix: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const objects: string[] = [];
      const stream = this.client.listObjects(bucket, prefix, false);

      stream.on('data', (obj) => {
        if (obj.name) {
          objects.push(obj.name);
        }
      });

      stream.on('error', reject);
      stream.on('end', () => resolve(objects));
    });
  }
}
