import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { StorageService } from '../storage/storage.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Asset } from '../../entities/asset.entity';
import { BadRequestException } from '@nestjs/common';

describe('UploadService', () => {
  let service: UploadService;
  let storageService: jest.Mocked<StorageService>;
  let assetRepository: jest.Mocked<Repository<Asset>>;

  const mockStorageService = {
    initMultipartUpload: jest.fn(),
    generatePresignedUrls: jest.fn(),
    completeMultipartUpload: jest.fn(),
    abortMultipartUpload: jest.fn(),
    getObjectMetadata: jest.fn(),
  };

  const mockAssetRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: getRepositoryToken(Asset),
          useValue: mockAssetRepository,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    storageService = module.get(StorageService) as jest.Mocked<StorageService>;
    assetRepository = module.get(getRepositoryToken(Asset)) as jest.Mocked<
      Repository<Asset>
    >;

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initMultipartUpload', () => {
    it('should initialize multipart upload with valid parameters', async () => {
      const mockDto = {
        filename: 'test.flac',
        contentType: 'audio/flac',
        fileSize: 50 * 1024 * 1024, // 50MB
        sha256: 'a'.repeat(64),
        parts: 10,
      };

      const mockUploadId = 'test-upload-id';
      const mockPresignedUrls = ['url1', 'url2', 'url3', 'url4', 'url5', 'url6', 'url7', 'url8', 'url9', 'url10'];

      storageService.initMultipartUpload.mockResolvedValue(mockUploadId);
      storageService.generatePresignedUrls.mockResolvedValue(
        mockPresignedUrls,
      );

      const result = await service.initMultipartUpload(mockDto, 'user-id');

      expect(result.uploadId).toBe(mockUploadId);
      expect(result.presignedUrls).toEqual(mockPresignedUrls);
      expect(result.key).toMatch(/^originals\/.+\/test\.flac$/);
      expect(storageService.initMultipartUpload).toHaveBeenCalledWith(
        'originals',
        expect.any(String),
        mockDto.contentType,
      );
    });

    it('should reject files that are too small', async () => {
      const mockDto = {
        filename: 'tiny.flac',
        contentType: 'audio/flac',
        fileSize: 100, // Too small
        sha256: 'a'.repeat(64),
        parts: 1,
      };

      await expect(
        service.initMultipartUpload(mockDto, 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject files that are too large', async () => {
      const mockDto = {
        filename: 'huge.flac',
        contentType: 'audio/flac',
        fileSize: 6 * 1024 * 1024 * 1024, // 6GB (over limit)
        sha256: 'a'.repeat(64),
        parts: 1000,
      };

      await expect(
        service.initMultipartUpload(mockDto, 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid SHA256 hash', async () => {
      const mockDto = {
        filename: 'test.flac',
        contentType: 'audio/flac',
        fileSize: 50 * 1024 * 1024,
        sha256: 'invalid-hash', // Not 64 hex chars
        parts: 10,
      };

      await expect(
        service.initMultipartUpload(mockDto, 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should sanitize filename to prevent path traversal', async () => {
      const mockDto = {
        filename: '../../../etc/passwd',
        contentType: 'audio/flac',
        fileSize: 50 * 1024 * 1024,
        sha256: 'a'.repeat(64),
        parts: 10,
      };

      storageService.initMultipartUpload.mockResolvedValue('upload-id');
      storageService.generatePresignedUrls.mockResolvedValue(['url1']);

      const result = await service.initMultipartUpload(mockDto, 'user-id');

      // Should strip path separators
      expect(result.key).not.toContain('..');
      expect(result.key).not.toContain('/etc/passwd');
    });
  });

  describe('completeMultipartUpload', () => {
    it('should complete upload and create asset record', async () => {
      const mockDto = {
        key: 'originals/asset-id/file.flac',
        uploadId: 'upload-id',
        parts: [
          { partNumber: 1, etag: 'etag1' },
          { partNumber: 2, etag: 'etag2' },
        ],
      };

      const mockAsset = {
        id: 'asset-id',
        bucket: 'originals',
        key: mockDto.key,
        size_bytes: 100000,
        content_type: 'audio/flac',
        created_at: new Date(),
      };

      storageService.completeMultipartUpload.mockResolvedValue(undefined);
      storageService.getObjectMetadata.mockResolvedValue({
        size: 100000,
        etag: 'final-etag',
        contentType: 'audio/flac',
      });
      assetRepository.create.mockReturnValue(mockAsset as any);
      assetRepository.save.mockResolvedValue(mockAsset as any);

      const result = await service.completeMultipartUpload(mockDto, 'user-id');

      expect(result.assetId).toBe('asset-id');
      expect(storageService.completeMultipartUpload).toHaveBeenCalledWith(
        'originals',
        mockDto.key,
        mockDto.uploadId,
        mockDto.parts,
      );
      expect(assetRepository.save).toHaveBeenCalled();
    });

    it('should handle storage service errors gracefully', async () => {
      const mockDto = {
        key: 'originals/asset-id/file.flac',
        uploadId: 'upload-id',
        parts: [{ partNumber: 1, etag: 'etag1' }],
      };

      storageService.completeMultipartUpload.mockRejectedValue(
        new Error('S3 error'),
      );

      await expect(
        service.completeMultipartUpload(mockDto, 'user-id'),
      ).rejects.toThrow('S3 error');
    });
  });

  describe('abortMultipartUpload', () => {
    it('should abort upload and clean up resources', async () => {
      const key = 'originals/asset-id/file.flac';
      const uploadId = 'upload-id';

      storageService.abortMultipartUpload.mockResolvedValue(undefined);

      await service.abortMultipartUpload(key, uploadId);

      expect(storageService.abortMultipartUpload).toHaveBeenCalledWith(
        'originals',
        key,
        uploadId,
      );
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent uploads from same user', async () => {
      const mockDto1 = {
        filename: 'file1.flac',
        contentType: 'audio/flac',
        fileSize: 50 * 1024 * 1024,
        sha256: 'a'.repeat(64),
        parts: 10,
      };

      const mockDto2 = {
        filename: 'file2.flac',
        contentType: 'audio/flac',
        fileSize: 60 * 1024 * 1024,
        sha256: 'b'.repeat(64),
        parts: 12,
      };

      storageService.initMultipartUpload.mockResolvedValue('upload-id-1');
      storageService.generatePresignedUrls.mockResolvedValue(['url1']);

      const [result1, result2] = await Promise.all([
        service.initMultipartUpload(mockDto1, 'user-id'),
        service.initMultipartUpload(mockDto2, 'user-id'),
      ]);

      expect(result1.key).not.toBe(result2.key);
      expect(storageService.initMultipartUpload).toHaveBeenCalledTimes(2);
    });

    it('should handle special characters in filename', async () => {
      const mockDto = {
        filename: 'Song (2024) [Master] - Artist\'s Mix.flac',
        contentType: 'audio/flac',
        fileSize: 50 * 1024 * 1024,
        sha256: 'a'.repeat(64),
        parts: 10,
      };

      storageService.initMultipartUpload.mockResolvedValue('upload-id');
      storageService.generatePresignedUrls.mockResolvedValue(['url1']);

      const result = await service.initMultipartUpload(mockDto, 'user-id');

      // Should preserve safe characters but sanitize dangerous ones
      expect(result.key).toMatch(/\.flac$/);
    });
  });
});
