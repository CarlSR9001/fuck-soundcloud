import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

export interface PresignedPart {
  partNumber: number;
  uploadUrl: string;
}

export interface MultipartUploadInit {
  uploadId: string;
  key: string;
  presignedParts: PresignedPart[];
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private minioClient: Minio.Client;
  private readonly buckets = {
    originals: 'originals',
    transcodes: 'transcodes',
    images: 'images',
    waveforms: 'waveforms',
    stems: 'stems',
  };

  constructor(private configService: ConfigService) {
    const storageConfig = this.configService.get('storage');
    this.minioClient = new Minio.Client({
      endPoint: storageConfig.endpoint,
      port: storageConfig.port,
      useSSL: storageConfig.useSSL,
      accessKey: storageConfig.accessKey,
      secretKey: storageConfig.secretKey,
    });
  }

  async onModuleInit() {
    await this.ensureBucketsExist();
  }

  private async ensureBucketsExist() {
    for (const bucket of Object.values(this.buckets)) {
      const exists = await this.minioClient.bucketExists(bucket);
      if (!exists) {
        this.logger.warn(`Bucket ${bucket} does not exist, creating...`);
        await this.minioClient.makeBucket(bucket, 'us-east-1');
        this.logger.log(`Created bucket: ${bucket}`);
      }
    }
  }

  async initiateMultipartUpload(
    filename: string,
    mimeType: string,
    parts: number,
  ): Promise<MultipartUploadInit> {
    const key = `${uuidv4()}/${filename}`;
    const bucket = this.buckets.originals;

    // Initiate multipart upload
    const uploadId = await this.minioClient.initiateNewMultipartUpload(
      bucket,
      key,
      {
        'Content-Type': mimeType,
      },
    );

    // Generate presigned URLs for each part
    const presignedParts: PresignedPart[] = [];
    for (let i = 1; i <= parts; i++) {
      const uploadUrl = await this.minioClient.presignedPutObject(
        bucket,
        key,
        24 * 60 * 60, // 24 hours
      );
      presignedParts.push({
        partNumber: i,
        uploadUrl: `${uploadUrl}&partNumber=${i}&uploadId=${encodeURIComponent(uploadId)}`,
      });
    }

    return {
      uploadId,
      key,
      presignedParts,
    };
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    etags: Array<{ partNumber: number; etag: string }>,
  ): Promise<{ bucket: string; key: string; size: number }> {
    const bucket = this.buckets.originals;

    await this.minioClient.completeMultipartUpload(
      bucket,
      key,
      uploadId,
      etags,
    );

    // Get object stats to return size
    const stat = await this.minioClient.statObject(bucket, key);

    return {
      bucket,
      key,
      size: stat.size,
    };
  }

  async uploadFile(
    bucket: string,
    key: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    await this.minioClient.putObject(bucket, key, buffer, buffer.length, {
      'Content-Type': mimeType,
    });
  }

  async getObjectUrl(bucket: string, key: string, expirySeconds = 3600): Promise<string> {
    return await this.minioClient.presignedGetObject(bucket, key, expirySeconds);
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    await this.minioClient.removeObject(bucket, key);
  }

  getBucketName(type: keyof typeof this.buckets): string {
    return this.buckets[type];
  }
}
