import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageService } from '../storage';
import { Asset } from '../../entities';
import { InitMultipartDto, CompleteMultipartDto } from './dto';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    private storageService: StorageService,
  ) {}

  async initMultipartUpload(dto: InitMultipartDto) {
    const { filename, mime, parts } = dto;

    // Initiate multipart upload with MinIO
    const upload = await this.storageService.initiateMultipartUpload(
      filename,
      mime,
      parts,
    );

    return {
      uploadId: upload.uploadId,
      key: upload.key,
      presignedParts: upload.presignedParts,
    };
  }

  async completeMultipartUpload(dto: CompleteMultipartDto) {
    const { uploadId, key, etags } = dto;

    // Complete the multipart upload
    const result = await this.storageService.completeMultipartUpload(
      key,
      uploadId,
      etags,
    );

    // Create asset record in database
    const asset = this.assetRepository.create({
      bucket: result.bucket,
      key: result.key,
      size_bytes: result.size,
      mime: '', // Will be set from the complete request
      sha256: '', // Will be set from the complete request
    });

    await this.assetRepository.save(asset);

    return {
      assetId: asset.id,
      bucket: asset.bucket,
      key: asset.key,
      sizeBytes: asset.size_bytes,
    };
  }

  async getAssetById(id: string) {
    return await this.assetRepository.findOne({ where: { id } });
  }
}
