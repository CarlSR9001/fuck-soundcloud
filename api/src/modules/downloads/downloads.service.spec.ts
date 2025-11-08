import { Test, TestingModule } from '@nestjs/testing';
import { DownloadsService } from './downloads.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Track } from '../../entities/track.entity';
import { TrackVersion } from '../../entities/track-version.entity';
import { Download } from '../../entities/download.entity';
import { Transcode } from '../../entities/transcode.entity';
import { StorageService } from '../storage/storage.service';
import { Queue } from 'bull';
import { getQueueToken } from '@nestjs/bull';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('DownloadsService', () => {
  let service: DownloadsService;
  let trackRepository: jest.Mocked<Repository<Track>>;
  let versionRepository: jest.Mocked<Repository<TrackVersion>>;
  let downloadRepository: jest.Mocked<Repository<Download>>;
  let transcodeRepository: jest.Mocked<Repository<Transcode>>;
  let storageService: jest.Mocked<StorageService>;
  let mp3Queue: jest.Mocked<Queue>;

  const mockTrackRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockVersionRepository = {
    findOne: jest.fn(),
  };

  const mockDownloadRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockTranscodeRepository = {
    findOne: jest.fn(),
  };

  const mockStorageService = {
    generatePresignedUrl: jest.fn(),
  };

  const mockMp3Queue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DownloadsService,
        {
          provide: getRepositoryToken(Track),
          useValue: mockTrackRepository,
        },
        {
          provide: getRepositoryToken(TrackVersion),
          useValue: mockVersionRepository,
        },
        {
          provide: getRepositoryToken(Download),
          useValue: mockDownloadRepository,
        },
        {
          provide: getRepositoryToken(Transcode),
          useValue: mockTranscodeRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: getQueueToken('mp3-transcode'),
          useValue: mockMp3Queue,
        },
      ],
    }).compile();

    service = module.get<DownloadsService>(DownloadsService);
    trackRepository = module.get(getRepositoryToken(Track));
    versionRepository = module.get(getRepositoryToken(TrackVersion));
    downloadRepository = module.get(getRepositoryToken(Download));
    transcodeRepository = module.get(getRepositoryToken(Transcode));
    storageService = module.get(StorageService);
    mp3Queue = module.get(getQueueToken('mp3-transcode'));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateDownloadPolicy', () => {
    it('should allow owner to update download policy', async () => {
      const mockTrack = {
        id: 'track-id',
        owner_user_id: 'user-id',
        download_policy: 'disabled',
      };

      trackRepository.findOne.mockResolvedValue(mockTrack as any);
      trackRepository.save.mockResolvedValue({
        ...mockTrack,
        download_policy: 'original',
      } as any);

      const result = await service.updateDownloadPolicy(
        'track-id',
        { policy: 'original', priceCents: 0 },
        'user-id',
      );

      expect(result.download_policy).toBe('original');
      expect(trackRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ download_policy: 'original' }),
      );
    });

    it('should forbid non-owner from updating policy', async () => {
      const mockTrack = {
        id: 'track-id',
        owner_user_id: 'owner-id',
        download_policy: 'disabled',
      };

      trackRepository.findOne.mockResolvedValue(mockTrack as any);

      await expect(
        service.updateDownloadPolicy(
          'track-id',
          { policy: 'original', priceCents: 0 },
          'different-user-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle track not found', async () => {
      trackRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateDownloadPolicy(
          'nonexistent-id',
          { policy: 'original', priceCents: 0 },
          'user-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateDownloadUrl', () => {
    it('should generate original download URL when policy allows', async () => {
      const mockTrack = {
        id: 'track-id',
        download_policy: 'original',
        primary_version: {
          id: 'version-id',
          original_asset: {
            bucket: 'originals',
            key: 'originals/asset-id/file.flac',
          },
        },
      };

      trackRepository.findOne.mockResolvedValue(mockTrack as any);
      storageService.generatePresignedUrl.mockResolvedValue(
        'https://s3.example.com/presigned-url',
      );
      downloadRepository.create.mockReturnValue({} as any);
      downloadRepository.save.mockResolvedValue({} as any);

      const result = await service.generateDownloadUrl(
        'track-id',
        'user-id',
        '127.0.0.1',
      );

      expect(result.url).toBe('https://s3.example.com/presigned-url');
      expect(result.format).toBe('original');
      expect(downloadRepository.save).toHaveBeenCalled();
    });

    it('should generate lossy download URL and trigger transcoding', async () => {
      const mockTrack = {
        id: 'track-id',
        download_policy: 'lossy',
        primary_version: {
          id: 'version-id',
          original_asset: {
            bucket: 'originals',
            key: 'originals/asset-id/file.flac',
          },
        },
      };

      const mockTranscode = {
        id: 'transcode-id',
        status: 'ready',
        track_version_id: 'version-id',
        format: 'mp3_320',
      };

      trackRepository.findOne.mockResolvedValue(mockTrack as any);
      transcodeRepository.findOne.mockResolvedValue(mockTranscode as any);
      storageService.generatePresignedUrl.mockResolvedValue(
        'https://s3.example.com/mp3-url',
      );
      downloadRepository.create.mockReturnValue({} as any);
      downloadRepository.save.mockResolvedValue({} as any);

      const result = await service.generateDownloadUrl(
        'track-id',
        'user-id',
        '127.0.0.1',
      );

      expect(result.url).toBe('https://s3.example.com/mp3-url');
      expect(result.format).toBe('320kbps');
    });

    it('should trigger MP3 transcoding if not ready', async () => {
      const mockTrack = {
        id: 'track-id',
        download_policy: 'lossy',
        primary_version: {
          id: 'version-id',
          original_asset: {
            bucket: 'originals',
            key: 'originals/asset-id/file.flac',
          },
        },
      };

      trackRepository.findOne.mockResolvedValue(mockTrack as any);
      transcodeRepository.findOne.mockResolvedValue(null);
      mp3Queue.add.mockResolvedValue({} as any);

      const result = await service.generateDownloadUrl(
        'track-id',
        'user-id',
        '127.0.0.1',
      );

      expect(result.url).toBeNull();
      expect(result.status).toBe('processing');
      expect(mp3Queue.add).toHaveBeenCalledWith(
        'transcode-mp3',
        expect.objectContaining({ versionId: 'version-id' }),
      );
    });

    it('should forbid download when policy is disabled', async () => {
      const mockTrack = {
        id: 'track-id',
        download_policy: 'disabled',
      };

      trackRepository.findOne.mockResolvedValue(mockTrack as any);

      await expect(
        service.generateDownloadUrl('track-id', 'user-id', '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should record download with hashed IP', async () => {
      const mockTrack = {
        id: 'track-id',
        download_policy: 'original',
        primary_version: {
          id: 'version-id',
          original_asset: {
            bucket: 'originals',
            key: 'originals/asset-id/file.flac',
          },
        },
      };

      let savedDownload: any;
      trackRepository.findOne.mockResolvedValue(mockTrack as any);
      storageService.generatePresignedUrl.mockResolvedValue('url');
      downloadRepository.create.mockImplementation((data) => data as any);
      downloadRepository.save.mockImplementation((data) => {
        savedDownload = data;
        return Promise.resolve(data);
      });

      await service.generateDownloadUrl('track-id', 'user-id', '192.168.1.1');

      expect(savedDownload.ip_hash).toBeDefined();
      expect(savedDownload.ip_hash).not.toBe('192.168.1.1'); // Should be hashed
      expect(savedDownload.ip_hash.length).toBe(64); // SHA256 length
    });
  });

  describe('getDownloadHistory', () => {
    it('should return download history for track owner', async () => {
      const mockTrack = {
        id: 'track-id',
        owner_user_id: 'user-id',
      };

      const mockDownloads = [
        {
          id: 'download-1',
          user_id: 'user-1',
          format: 'original',
          created_at: new Date(),
        },
        {
          id: 'download-2',
          user_id: 'user-2',
          format: '320kbps',
          created_at: new Date(),
        },
      ];

      trackRepository.findOne.mockResolvedValue(mockTrack as any);
      downloadRepository.find.mockResolvedValue(mockDownloads as any);

      const result = await service.getDownloadHistory('track-id', 'user-id');

      expect(result).toHaveLength(2);
      expect(downloadRepository.find).toHaveBeenCalledWith({
        where: { track_id: 'track-id' },
        order: { created_at: 'DESC' },
        take: 100,
      });
    });

    it('should forbid non-owner from viewing history', async () => {
      const mockTrack = {
        id: 'track-id',
        owner_user_id: 'owner-id',
      };

      trackRepository.findOne.mockResolvedValue(mockTrack as any);

      await expect(
        service.getDownloadHistory('track-id', 'different-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent download requests', async () => {
      const mockTrack = {
        id: 'track-id',
        download_policy: 'original',
        primary_version: {
          id: 'version-id',
          original_asset: {
            bucket: 'originals',
            key: 'originals/asset-id/file.flac',
          },
        },
      };

      trackRepository.findOne.mockResolvedValue(mockTrack as any);
      storageService.generatePresignedUrl.mockResolvedValue('url');
      downloadRepository.create.mockReturnValue({} as any);
      downloadRepository.save.mockResolvedValue({} as any);

      const requests = Array(5)
        .fill(null)
        .map(() =>
          service.generateDownloadUrl('track-id', 'user-id', '127.0.0.1'),
        );

      const results = await Promise.all(requests);

      expect(results).toHaveLength(5);
      expect(downloadRepository.save).toHaveBeenCalledTimes(5);
    });

    it('should handle missing primary version gracefully', async () => {
      const mockTrack = {
        id: 'track-id',
        download_policy: 'original',
        primary_version: null,
      };

      trackRepository.findOne.mockResolvedValue(mockTrack as any);

      await expect(
        service.generateDownloadUrl('track-id', 'user-id', '127.0.0.1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
