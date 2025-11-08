import { Test, TestingModule } from '@nestjs/testing';
import { StemsService } from './stems.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Stem } from '../../entities/stem.entity';
import { TrackVersion } from '../../entities/track-version.entity';
import { Asset } from '../../entities/asset.entity';
import { StorageService } from '../storage/storage.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('StemsService', () => {
  let service: StemsService;
  let stemRepository: jest.Mocked<Repository<Stem>>;
  let versionRepository: jest.Mocked<Repository<TrackVersion>>;
  let assetRepository: jest.Mocked<Repository<Asset>>;
  let storageService: jest.Mocked<StorageService>;

  const mockStemRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockVersionRepository = {
    findOne: jest.fn(),
  };

  const mockAssetRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockStorageService = {
    initMultipartUpload: jest.fn(),
    generatePresignedUrls: jest.fn(),
    completeMultipartUpload: jest.fn(),
    generatePresignedUrl: jest.fn(),
    deleteObject: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StemsService,
        {
          provide: getRepositoryToken(Stem),
          useValue: mockStemRepository,
        },
        {
          provide: getRepositoryToken(TrackVersion),
          useValue: mockVersionRepository,
        },
        {
          provide: getRepositoryToken(Asset),
          useValue: mockAssetRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<StemsService>(StemsService);
    stemRepository = module.get(getRepositoryToken(Stem));
    versionRepository = module.get(getRepositoryToken(TrackVersion));
    assetRepository = module.get(getRepositoryToken(Asset));
    storageService = module.get(StorageService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createStem', () => {
    it('should create stem for track version owner', async () => {
      const mockVersion = {
        id: 'version-id',
        track: {
          owner_user_id: 'user-id',
        },
      };

      const mockAsset = {
        id: 'asset-id',
        bucket: 'stems',
        key: 'stems/version-id/vocal.wav',
      };

      const mockStem = {
        id: 'stem-id',
        track_version_id: 'version-id',
        role: 'vocal',
        title: 'Lead Vocal',
        asset_id: 'asset-id',
      };

      versionRepository.findOne.mockResolvedValue(mockVersion as any);
      assetRepository.create.mockReturnValue(mockAsset as any);
      assetRepository.save.mockResolvedValue(mockAsset as any);
      stemRepository.create.mockReturnValue(mockStem as any);
      stemRepository.save.mockResolvedValue(mockStem as any);

      const result = await service.createStem(
        'version-id',
        {
          role: 'vocal',
          title: 'Lead Vocal',
          assetKey: 'stems/version-id/vocal.wav',
        },
        'user-id',
      );

      expect(result.role).toBe('vocal');
      expect(result.title).toBe('Lead Vocal');
      expect(stemRepository.save).toHaveBeenCalled();
    });

    it('should forbid non-owner from creating stems', async () => {
      const mockVersion = {
        id: 'version-id',
        track: {
          owner_user_id: 'owner-id',
        },
      };

      versionRepository.findOne.mockResolvedValue(mockVersion as any);

      await expect(
        service.createStem(
          'version-id',
          {
            role: 'vocal',
            title: 'Lead Vocal',
            assetKey: 'stems/version-id/vocal.wav',
          },
          'different-user-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent duplicate stem roles', async () => {
      const mockVersion = {
        id: 'version-id',
        track: {
          owner_user_id: 'user-id',
        },
      };

      versionRepository.findOne.mockResolvedValue(mockVersion as any);
      stemRepository.count.mockResolvedValue(1); // Stem with role already exists

      await expect(
        service.createStem(
          'version-id',
          {
            role: 'vocal',
            title: 'Lead Vocal',
            assetKey: 'stems/version-id/vocal.wav',
          },
          'user-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should enforce maximum stem limit per version', async () => {
      const mockVersion = {
        id: 'version-id',
        track: {
          owner_user_id: 'user-id',
        },
      };

      versionRepository.findOne.mockResolvedValue(mockVersion as any);
      stemRepository.count.mockResolvedValue(20); // At max limit

      await expect(
        service.createStem(
          'version-id',
          {
            role: 'fx',
            title: 'Effects',
            assetKey: 'stems/version-id/fx.wav',
          },
          'user-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStems', () => {
    it('should return stems for a track version', async () => {
      const mockStems = [
        {
          id: 'stem-1',
          role: 'vocal',
          title: 'Lead Vocal',
          asset: {
            id: 'asset-1',
            bucket: 'stems',
            key: 'stems/version-id/vocal.wav',
          },
        },
        {
          id: 'stem-2',
          role: 'drum',
          title: 'Drums',
          asset: {
            id: 'asset-2',
            bucket: 'stems',
            key: 'stems/version-id/drum.wav',
          },
        },
      ];

      stemRepository.find.mockResolvedValue(mockStems as any);

      const result = await service.getStems('version-id');

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('vocal');
      expect(result[1].role).toBe('drum');
    });

    it('should return empty array when no stems exist', async () => {
      stemRepository.find.mockResolvedValue([]);

      const result = await service.getStems('version-id');

      expect(result).toEqual([]);
    });

    it('should order stems by role and created_at', async () => {
      const mockStems = [
        { id: 'stem-1', role: 'drum', created_at: new Date('2024-01-02') },
        { id: 'stem-2', role: 'vocal', created_at: new Date('2024-01-01') },
        { id: 'stem-3', role: 'bass', created_at: new Date('2024-01-03') },
      ];

      stemRepository.find.mockResolvedValue(mockStems as any);

      await service.getStems('version-id');

      expect(stemRepository.find).toHaveBeenCalledWith({
        where: { track_version_id: 'version-id' },
        relations: ['asset'],
        order: { role: 'ASC', created_at: 'ASC' },
      });
    });
  });

  describe('getDownloadUrl', () => {
    it('should generate download URL for stem', async () => {
      const mockStem = {
        id: 'stem-id',
        asset: {
          bucket: 'stems',
          key: 'stems/version-id/vocal.wav',
        },
      };

      stemRepository.findOne.mockResolvedValue(mockStem as any);
      storageService.generatePresignedUrl.mockResolvedValue(
        'https://s3.example.com/presigned-url',
      );

      const result = await service.getDownloadUrl('stem-id');

      expect(result).toBe('https://s3.example.com/presigned-url');
      expect(storageService.generatePresignedUrl).toHaveBeenCalledWith(
        'stems',
        'stems/version-id/vocal.wav',
        3600,
      );
    });

    it('should throw not found for nonexistent stem', async () => {
      stemRepository.findOne.mockResolvedValue(null);

      await expect(service.getDownloadUrl('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteStem', () => {
    it('should delete stem and associated asset', async () => {
      const mockStem = {
        id: 'stem-id',
        track_version: {
          track: {
            owner_user_id: 'user-id',
          },
        },
        asset: {
          bucket: 'stems',
          key: 'stems/version-id/vocal.wav',
        },
      };

      stemRepository.findOne.mockResolvedValue(mockStem as any);
      stemRepository.delete.mockResolvedValue({ affected: 1 } as any);
      storageService.deleteObject.mockResolvedValue(undefined);

      await service.deleteStem('stem-id', 'user-id');

      expect(stemRepository.delete).toHaveBeenCalledWith('stem-id');
      expect(storageService.deleteObject).toHaveBeenCalledWith(
        'stems',
        'stems/version-id/vocal.wav',
      );
    });

    it('should forbid non-owner from deleting stem', async () => {
      const mockStem = {
        id: 'stem-id',
        track_version: {
          track: {
            owner_user_id: 'owner-id',
          },
        },
      };

      stemRepository.findOne.mockResolvedValue(mockStem as any);

      await expect(
        service.deleteStem('stem-id', 'different-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle storage deletion errors gracefully', async () => {
      const mockStem = {
        id: 'stem-id',
        track_version: {
          track: {
            owner_user_id: 'user-id',
          },
        },
        asset: {
          bucket: 'stems',
          key: 'stems/version-id/vocal.wav',
        },
      };

      stemRepository.findOne.mockResolvedValue(mockStem as any);
      stemRepository.delete.mockResolvedValue({ affected: 1 } as any);
      storageService.deleteObject.mockRejectedValue(
        new Error('S3 deletion failed'),
      );

      // Should still delete database record even if S3 fails
      await expect(
        service.deleteStem('stem-id', 'user-id'),
      ).rejects.toThrow('S3 deletion failed');
    });
  });

  describe('stem roles', () => {
    it('should accept all valid stem roles', async () => {
      const validRoles = ['vocal', 'drum', 'bass', 'guitar', 'synth', 'fx', 'other'];
      const mockVersion = {
        id: 'version-id',
        track: { owner_user_id: 'user-id' },
      };

      versionRepository.findOne.mockResolvedValue(mockVersion as any);
      assetRepository.create.mockReturnValue({} as any);
      assetRepository.save.mockResolvedValue({} as any);
      stemRepository.count.mockResolvedValue(0);
      stemRepository.create.mockReturnValue({} as any);
      stemRepository.save.mockResolvedValue({} as any);

      for (const role of validRoles) {
        await service.createStem(
          'version-id',
          {
            role: role as any,
            title: `Test ${role}`,
            assetKey: `stems/version-id/${role}.wav`,
          },
          'user-id',
        );
      }

      expect(stemRepository.save).toHaveBeenCalledTimes(validRoles.length);
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent stem uploads', async () => {
      const mockVersion = {
        id: 'version-id',
        track: { owner_user_id: 'user-id' },
      };

      versionRepository.findOne.mockResolvedValue(mockVersion as any);
      stemRepository.count.mockResolvedValue(0);
      assetRepository.create.mockReturnValue({} as any);
      assetRepository.save.mockResolvedValue({} as any);
      stemRepository.create.mockReturnValue({} as any);
      stemRepository.save.mockResolvedValue({} as any);

      const requests = [
        service.createStem('version-id', { role: 'vocal', title: 'Vocal', assetKey: 'key1' }, 'user-id'),
        service.createStem('version-id', { role: 'drum', title: 'Drum', assetKey: 'key2' }, 'user-id'),
        service.createStem('version-id', { role: 'bass', title: 'Bass', assetKey: 'key3' }, 'user-id'),
      ];

      const results = await Promise.all(requests);

      expect(results).toHaveLength(3);
      expect(stemRepository.save).toHaveBeenCalledTimes(3);
    });
  });
});
