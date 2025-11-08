import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { Track } from '../src/entities/track.entity';
import { TrackVersion } from '../src/entities/track-version.entity';
import { Asset } from '../src/entities/asset.entity';
import { Transcode } from '../src/entities/transcode.entity';
import { Download } from '../src/entities/download.entity';
import { Stem } from '../src/entities/stem.entity';

describe('M4 Complete Flow (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let trackRepository: Repository<Track>;
  let versionRepository: Repository<TrackVersion>;
  let assetRepository: Repository<Asset>;
  let transcodeRepository: Repository<Transcode>;
  let downloadRepository: Repository<Download>;
  let stemRepository: Repository<Stem>;

  let authToken: string;
  let testUser: User;
  let trackId: string;
  let versionId: string;
  let uploadKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    trackRepository = moduleFixture.get<Repository<Track>>(getRepositoryToken(Track));
    versionRepository = moduleFixture.get<Repository<TrackVersion>>(getRepositoryToken(TrackVersion));
    assetRepository = moduleFixture.get<Repository<Asset>>(getRepositoryToken(Asset));
    transcodeRepository = moduleFixture.get<Repository<Transcode>>(getRepositoryToken(Transcode));
    downloadRepository = moduleFixture.get<Repository<Download>>(getRepositoryToken(Download));
    stemRepository = moduleFixture.get<Repository<Stem>>(getRepositoryToken(Stem));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Full Upload → Stream → Download Flow', () => {
    it('Step 1: User registration and authentication', async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `test-${Date.now()}@example.com`,
          username: `testuser_${Date.now()}`,
          password: 'Test123!@#',
        })
        .expect(201);

      expect(registerResponse.body.user).toBeDefined();
      expect(registerResponse.body.access_token).toBeDefined();

      authToken = registerResponse.body.access_token;
      testUser = registerResponse.body.user;
    });

    it('Step 2: Initialize multipart upload', async () => {
      const initResponse = await request(app.getHttpServer())
        .post('/api/v1/upload/multipart/init')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          filename: 'test-track.flac',
          contentType: 'audio/flac',
          fileSize: 50 * 1024 * 1024, // 50MB
          sha256: 'a'.repeat(64),
          parts: 10,
        })
        .expect(201);

      expect(initResponse.body.uploadId).toBeDefined();
      expect(initResponse.body.presignedUrls).toHaveLength(10);
      expect(initResponse.body.key).toMatch(/^originals\/.+\/test-track\.flac$/);

      uploadKey = initResponse.body.key;
    });

    it('Step 3: Complete multipart upload and create track', async () => {
      // Simulate completing the upload
      const completeResponse = await request(app.getHttpServer())
        .post('/api/v1/upload/multipart/complete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: uploadKey,
          uploadId: 'mock-upload-id',
          parts: Array.from({ length: 10 }, (_, i) => ({
            partNumber: i + 1,
            etag: `etag-${i + 1}`,
          })),
        })
        .expect(201);

      const assetId = completeResponse.body.assetId;
      expect(assetId).toBeDefined();

      // Create track with the uploaded asset
      const createTrackResponse = await request(app.getHttpServer())
        .post('/api/v1/tracks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Track - M4 E2E',
          description_md: 'A test track for end-to-end testing',
          visibility: 'public',
          originalAssetId: assetId,
          versionLabel: 'v1.0',
          copyrightAttestation: true,
        })
        .expect(201);

      expect(createTrackResponse.body.id).toBeDefined();
      expect(createTrackResponse.body.title).toBe('Test Track - M4 E2E');

      trackId = createTrackResponse.body.id;
    });

    it('Step 4: Verify track version is created', async () => {
      const trackResponse = await request(app.getHttpServer())
        .get(`/api/v1/tracks/${trackId}`)
        .expect(200);

      expect(trackResponse.body.primary_version).toBeDefined();
      expect(trackResponse.body.primary_version.status).toMatch(/pending|ready/);

      versionId = trackResponse.body.primary_version.id;
    });

    it('Step 5: Upload stems for the track', async () => {
      const stemRoles = ['vocal', 'drum', 'bass'];

      for (const role of stemRoles) {
        // Init stem upload
        const initStemResponse = await request(app.getHttpServer())
          .post('/api/v1/upload/multipart/init')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            filename: `${role}.wav`,
            contentType: 'audio/wav',
            fileSize: 20 * 1024 * 1024,
            sha256: role.repeat(16).substring(0, 64),
            parts: 4,
          })
          .expect(201);

        const stemKey = initStemResponse.body.key;

        // Complete stem upload
        await request(app.getHttpServer())
          .post('/api/v1/upload/multipart/complete')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            key: stemKey,
            uploadId: 'stem-upload-id',
            parts: [
              { partNumber: 1, etag: 'etag1' },
              { partNumber: 2, etag: 'etag2' },
              { partNumber: 3, etag: 'etag3' },
              { partNumber: 4, etag: 'etag4' },
            ],
          })
          .expect(201);

        // Create stem record
        const createStemResponse = await request(app.getHttpServer())
          .post(`/api/v1/versions/${versionId}/stems`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            role,
            title: `${role.charAt(0).toUpperCase() + role.slice(1)} Stem`,
            assetKey: stemKey,
          })
          .expect(201);

        expect(createStemResponse.body.role).toBe(role);
      }
    });

    it('Step 6: List stems for the version', async () => {
      const stemsResponse = await request(app.getHttpServer())
        .get(`/api/v1/versions/${versionId}/stems`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(stemsResponse.body).toHaveLength(3);
      expect(stemsResponse.body.map((s: any) => s.role).sort()).toEqual([
        'bass',
        'drum',
        'vocal',
      ]);
    });

    it('Step 7: Get HLS stream URL', async () => {
      const streamResponse = await request(app.getHttpServer())
        .get(`/api/v1/stream/${versionId}.m3u8`)
        .expect(200);

      expect(streamResponse.text).toContain('#EXTM3U');
      expect(streamResponse.text).toContain('.m3u8');
    });

    it('Step 8: Get waveform data', async () => {
      const waveformResponse = await request(app.getHttpServer())
        .get(`/api/v1/versions/${versionId}/waveform`)
        .expect(200);

      expect(waveformResponse.body.json).toBeDefined();
      expect(waveformResponse.body.png).toBeDefined();
    });

    it('Step 9: Update download policy', async () => {
      const policyResponse = await request(app.getHttpServer())
        .patch(`/api/v1/tracks/${trackId}/downloads/policy`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          policy: 'original',
          priceCents: 0,
        })
        .expect(200);

      expect(policyResponse.body.download_policy).toBe('original');
    });

    it('Step 10: Generate download URL', async () => {
      const downloadResponse = await request(app.getHttpServer())
        .get(`/api/v1/tracks/${trackId}/downloads/generate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(downloadResponse.body.url).toBeDefined();
      expect(downloadResponse.body.format).toBe('original');
    });

    it('Step 11: Verify download history is recorded', async () => {
      const historyResponse = await request(app.getHttpServer())
        .get(`/api/v1/tracks/${trackId}/downloads/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(historyResponse.body.length).toBeGreaterThanOrEqual(1);
      expect(historyResponse.body[0].ip_hash).toBeDefined();
      expect(historyResponse.body[0].ip_hash.length).toBe(64); // SHA256
    });

    it('Step 12: Test lossy download policy', async () => {
      // Change to lossy policy
      await request(app.getHttpServer())
        .patch(`/api/v1/tracks/${trackId}/downloads/policy`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          policy: 'lossy',
          priceCents: 0,
        })
        .expect(200);

      // Request lossy download
      const lossyDownloadResponse = await request(app.getHttpServer())
        .get(`/api/v1/tracks/${trackId}/downloads/generate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // May be processing or ready depending on transcoding
      expect(['320kbps', 'processing']).toContain(
        lossyDownloadResponse.body.format || lossyDownloadResponse.body.status,
      );
    });

    it('Step 13: Download individual stem', async () => {
      const stemsResponse = await request(app.getHttpServer())
        .get(`/api/v1/versions/${versionId}/stems`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const stemId = stemsResponse.body[0].id;

      const stemDownloadResponse = await request(app.getHttpServer())
        .get(`/api/v1/stems/${stemId}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(stemDownloadResponse.body.url).toBeDefined();
      expect(stemDownloadResponse.body.url).toContain('http');
    });

    it('Step 14: Delete a stem', async () => {
      const stemsResponse = await request(app.getHttpServer())
        .get(`/api/v1/versions/${versionId}/stems`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const stemToDelete = stemsResponse.body[0].id;

      await request(app.getHttpServer())
        .delete(`/api/v1/stems/${stemToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      const stemsAfterDelete = await request(app.getHttpServer())
        .get(`/api/v1/versions/${versionId}/stems`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(stemsAfterDelete.body.length).toBe(2);
    });

    it('Step 15: Update liner notes', async () => {
      const linerNotes = `
# Session Notes
**Recorded:** January 15, 2024
**Location:** Studio A, Los Angeles

## Credits
- Producer: John Doe
- Engineer: Jane Smith

## Equipment
- Microphone: Neumann U87
- Preamp: API 512c
      `.trim();

      const updateResponse = await request(app.getHttpServer())
        .patch(`/api/v1/versions/${versionId}/liner-notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          linerNotes,
        })
        .expect(200);

      expect(updateResponse.body.liner_notes).toContain('Session Notes');
      expect(updateResponse.body.liner_notes).toContain('Neumann U87');
    });

    it('Step 16: Schedule track release', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week from now

      const scheduleResponse = await request(app.getHttpServer())
        .patch(`/api/v1/tracks/${trackId}/schedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          releaseAt: futureDate.toISOString(),
          embargoUntil: null,
        })
        .expect(200);

      expect(new Date(scheduleResponse.body.release_at).getTime()).toBeCloseTo(
        futureDate.getTime(),
        -3, // Within 1000ms
      );
    });

    it('Step 17: Test unauthorized access prevention', async () => {
      // Create another user
      const otherUserResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `other-${Date.now()}@example.com`,
          username: `otheruser_${Date.now()}`,
          password: 'Test123!@#',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.access_token;

      // Try to update download policy (should fail)
      await request(app.getHttpServer())
        .patch(`/api/v1/tracks/${trackId}/downloads/policy`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          policy: 'disabled',
          priceCents: 0,
        })
        .expect(403);

      // Try to view download history (should fail)
      await request(app.getHttpServer())
        .get(`/api/v1/tracks/${trackId}/downloads/history`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      // Try to upload stem (should fail)
      await request(app.getHttpServer())
        .post(`/api/v1/versions/${versionId}/stems`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          role: 'synth',
          title: 'Unauthorized Stem',
          assetKey: 'fake/key',
        })
        .expect(403);
    });

    it('Step 18: Test disabled download policy', async () => {
      // Set to disabled
      await request(app.getHttpServer())
        .patch(`/api/v1/tracks/${trackId}/downloads/policy`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          policy: 'disabled',
          priceCents: 0,
        })
        .expect(200);

      // Try to download (should fail)
      await request(app.getHttpServer())
        .get(`/api/v1/tracks/${trackId}/downloads/generate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('Step 19: Verify database integrity', async () => {
      // Check track exists
      const track = await trackRepository.findOne({
        where: { id: trackId },
        relations: ['primary_version'],
      });
      expect(track).toBeDefined();
      expect(track.title).toBe('Test Track - M4 E2E');

      // Check version exists
      const version = await versionRepository.findOne({
        where: { id: versionId },
      });
      expect(version).toBeDefined();
      expect(version.track_id).toBe(trackId);

      // Check stems exist (should be 2 after deletion)
      const stems = await stemRepository.find({
        where: { track_version_id: versionId },
      });
      expect(stems.length).toBe(2);

      // Check download records exist
      const downloads = await downloadRepository.find({
        where: { track_id: trackId },
      });
      expect(downloads.length).toBeGreaterThanOrEqual(1);
    });

    it('Step 20: Performance test - concurrent operations', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();

      const requests = Array.from({ length: concurrentRequests }, () =>
        request(app.getHttpServer())
          .get(`/api/v1/tracks/${trackId}`)
          .expect(200),
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      expect(responses).toHaveLength(concurrentRequests);
      responses.forEach((response) => {
        expect(response.body.id).toBe(trackId);
      });

      // Should complete in reasonable time (< 5 seconds for 10 concurrent requests)
      expect(duration).toBeLessThan(5000);

      console.log(
        `✓ ${concurrentRequests} concurrent requests completed in ${duration}ms`,
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should reject invalid file types', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/upload/multipart/init')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          filename: 'malware.exe',
          contentType: 'application/x-msdownload',
          fileSize: 10000,
          sha256: 'a'.repeat(64),
          parts: 1,
        })
        .expect(400);
    });

    it('should reject files that are too large', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/upload/multipart/init')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          filename: 'huge.flac',
          contentType: 'audio/flac',
          fileSize: 10 * 1024 * 1024 * 1024, // 10GB
          sha256: 'a'.repeat(64),
          parts: 1000,
        })
        .expect(400);
    });

    it('should reject invalid SHA256 hash', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/upload/multipart/init')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          filename: 'test.flac',
          contentType: 'audio/flac',
          fileSize: 50 * 1024 * 1024,
          sha256: 'invalid-hash',
          parts: 10,
        })
        .expect(400);
    });

    it('should handle nonexistent track gracefully', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tracks/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should handle nonexistent version gracefully', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/stream/00000000-0000-0000-0000-000000000000.m3u8')
        .expect(404);
    });
  });
});
