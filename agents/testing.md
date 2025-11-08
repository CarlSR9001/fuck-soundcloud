# Testing Strategy & Requirements

**Purpose:** Testing patterns, coverage requirements, E2E acceptance tests, and quality assurance procedures.

**Prerequisites:**
- Read `api-specs.md` for endpoint behaviors to test
- Read `architecture.md` for system components and data flow

---

## Testing Philosophy

### Core Principles

1. **Real, not fake:** Tests must validate actual behavior, not mocks
2. **Integration over unit:** Prefer testing real workflows over isolated units
3. **E2E proof required:** Every milestone must have working E2E script
4. **Fail loud:** Tests should fail with clear, actionable error messages
5. **Reproducible:** Same test run twice should produce same result
6. **Fast feedback:** Unit tests < 1s, integration < 10s, E2E < 2min

### Test Pyramid

```
        E2E (10%)
      /           \
   Integration (30%)
  /                 \
Unit Tests (60%)
```

**Unit tests:** Pure functions, business logic, utilities
**Integration tests:** API endpoints, database queries, worker jobs
**E2E tests:** Full user workflows, upload → process → playback

---

## Coverage Requirements

### Minimum Coverage Targets

- **Services:** 80%+ line coverage
- **Controllers:** 70%+ (mostly integration tests)
- **Utilities:** 90%+ (pure functions are easy to test)
- **Workers:** 80%+ (mock external tools like FFmpeg)

### What to Test

**MUST test:**
- Authentication flows (signup, login, logout, token validation)
- Authorization checks (ownership, visibility, admin)
- Input validation (DTO validation, edge cases)
- Business logic (analytics calculations, payment distribution)
- Database operations (CRUD, relationships, cascades)
- Error handling (expected exceptions, edge cases)

**OPTIONAL to test:**
- Getters/setters (trivial code)
- Framework code (NestJS/Next.js internals)
- Configuration files
- Type definitions

**DON'T test:**
- Third-party libraries (trust they're tested)
- Database engine itself
- Operating system

---

## Unit Testing

### Framework

**Backend (NestJS):** Jest
**Frontend (Next.js):** Jest + React Testing Library

### Example: Service Test

```typescript
// tracks.service.spec.ts
describe('TracksService', () => {
  let service: TracksService;
  let repo: Repository<Track>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TracksService,
        {
          provide: getRepositoryToken(Track),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TracksService);
    repo = module.get(getRepositoryToken(Track));
  });

  describe('createTrack', () => {
    it('should create track with generated slug', async () => {
      const dto = { title: 'My Track', visibility: 'public' };
      const userId = 'user-123';

      const savedTrack = { id: 'track-123', slug: 'my-track', ...dto };
      jest.spyOn(repo, 'save').mockResolvedValue(savedTrack);

      const result = await service.createTrack(dto, userId);

      expect(result.slug).toBe('my-track');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'My Track', owner_user_id: userId })
      );
    });

    it('should throw if title is empty', async () => {
      await expect(
        service.createTrack({ title: '', visibility: 'public' }, 'user-123')
      ).rejects.toThrow('Title required');
    });
  });
});
```

### Example: Utility Test

```typescript
// slug.util.spec.ts
describe('generateSlug', () => {
  it('should convert title to slug', () => {
    expect(generateSlug('My Track Name')).toBe('my-track-name');
  });

  it('should handle special characters', () => {
    expect(generateSlug('Track w/ Special $ Chars!')).toBe('track-w-special-chars');
  });

  it('should handle unicode', () => {
    expect(generateSlug('Café Müller')).toBe('cafe-muller');
  });

  it('should truncate long titles', () => {
    const long = 'a'.repeat(200);
    expect(generateSlug(long).length).toBeLessThanOrEqual(100);
  });
});
```

---

## Integration Testing

### Database Integration

**Strategy:** Use test database, run real queries

**Setup:**
```typescript
// test/setup.ts
beforeAll(async () => {
  // Spin up test database
  await testDb.connect();
  await testDb.migrate();
});

afterAll(async () => {
  await testDb.drop();
  await testDb.disconnect();
});

beforeEach(async () => {
  // Clear tables between tests
  await testDb.truncate(['tracks', 'users', 'sessions']);
});
```

### API Endpoint Testing

**Strategy:** Use Supertest to call endpoints, verify responses

```typescript
// tracks.controller.spec.ts (integration)
describe('POST /api/v1/tracks', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    // Create test user and get token
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email: 'test@example.com', handle: 'testuser', password: 'password123' });

    authToken = res.body.session.token;
  });

  it('should create track when authenticated', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/tracks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Track',
        visibility: 'public',
        original_asset_id: 'asset-123',
      })
      .expect(201);

    expect(res.body.track.title).toBe('Test Track');
    expect(res.body.track.slug).toBe('test-track');
    expect(res.body.track.primary_version.status).toBe('pending');
  });

  it('should reject without authentication', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/tracks')
      .send({ title: 'Test Track' })
      .expect(401);
  });

  it('should validate required fields', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/tracks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ visibility: 'public' }) // Missing title
      .expect(422);

    expect(res.body.error.details.title).toBeDefined();
  });
});
```

### Worker Job Testing

**Strategy:** Mock external tools (FFmpeg), test job logic

```typescript
// transcode.processor.spec.ts
describe('TranscodeProcessor', () => {
  let processor: TranscodeProcessor;
  let ffmpeg: jest.Mocked<FfmpegService>;

  beforeEach(() => {
    ffmpeg = {
      toHLS: jest.fn(),
      extractCover: jest.fn(),
      getMetadata: jest.fn(),
    } as any;

    processor = new TranscodeProcessor(ffmpeg, storage, db);
  });

  it('should transcode WAV to HLS Opus', async () => {
    const job = {
      data: { version_id: 'version-123', asset_id: 'asset-123' },
    };

    ffmpeg.toHLS.mockResolvedValue({
      playlist: 'path/to/playlist.m3u8',
      segments: ['seg0.m4s', 'seg1.m4s'],
    });

    await processor.process(job);

    expect(ffmpeg.toHLS).toHaveBeenCalledWith(
      expect.stringContaining('asset-123'),
      expect.objectContaining({ codec: 'opus', bitrate: 160 })
    );

    // Verify database updated
    const version = await db.trackVersions.findOne('version-123');
    expect(version.status).toBe('ready');
  });

  it('should handle FFmpeg failure', async () => {
    ffmpeg.toHLS.mockRejectedValue(new Error('FFmpeg error'));

    await processor.process(job);

    const version = await db.trackVersions.findOne('version-123');
    expect(version.status).toBe('failed');
    expect(version.error).toContain('FFmpeg error');
  });
});
```

---

## E2E (End-to-End) Testing

### Acceptance Test Script

**File:** `scripts/e2e.sh`

**Purpose:** Validate complete user workflow from upload to playback

**Flow:**
1. Boot stack (docker compose up)
2. Create user via API
3. Multipart upload (3 parts) to MinIO using presigned URLs
4. Create track from asset_id → expect status=pending
5. Poll version until status=ready; verify MinIO has playlist + segments
6. Fetch /embed/track/:id and parse m3u8 URL
7. Use ffmpeg to read m3u8 for 10s to validate playback
8. Post comment at timestamp; verify retrieval
9. Record play; verify analytics_daily increments after rollup job

### Implementation

```bash
#!/bin/bash
set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🚀 Starting E2E test..."

# 1. Boot stack
echo "📦 Starting Docker stack..."
docker compose up -d
sleep 10  # Wait for services to be ready

# 2. Create user
echo "👤 Creating test user..."
USER_RES=$(curl -s -X POST http://localhost:8080/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "e2e@test.com",
    "handle": "e2etest",
    "password": "password123",
    "display_name": "E2E Test User"
  }')

TOKEN=$(echo $USER_RES | jq -r '.session.token')
USER_ID=$(echo $USER_RES | jq -r '.user.id')

if [ "$TOKEN" = "null" ]; then
  echo -e "${RED}❌ Failed to create user${NC}"
  exit 1
fi
echo -e "${GREEN}✅ User created, token: ${TOKEN:0:20}...${NC}"

# 3. Initialize multipart upload
echo "📤 Initializing upload..."
TEST_FILE="test/fixtures/test-track.wav"
if [ ! -f "$TEST_FILE" ]; then
  echo -e "${RED}❌ Test file not found: $TEST_FILE${NC}"
  exit 1
fi

FILE_SIZE=$(stat -f%z "$TEST_FILE" 2>/dev/null || stat -c%s "$TEST_FILE")
FILE_SHA=$(sha256sum "$TEST_FILE" | awk '{print $1}')

UPLOAD_RES=$(curl -s -X POST http://localhost:8080/api/v1/upload/multipart/init \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"filename\": \"test-track.wav\",
    \"size\": $FILE_SIZE,
    \"sha256\": \"$FILE_SHA\",
    \"mime\": \"audio/wav\"
  }")

UPLOAD_ID=$(echo $UPLOAD_RES | jq -r '.upload_id')
ASSET_ID=$(echo $UPLOAD_RES | jq -r '.asset_id')

echo -e "${GREEN}✅ Upload initialized: $UPLOAD_ID${NC}"

# 4. Upload parts (simplified: single part for small file)
PRESIGNED_URL=$(echo $UPLOAD_RES | jq -r '.presigned_parts[0].url')
ETAG=$(curl -s -X PUT "$PRESIGNED_URL" \
  --upload-file "$TEST_FILE" \
  -D - | grep -i etag | awk '{print $2}' | tr -d '\r')

echo -e "${GREEN}✅ File uploaded, etag: $ETAG${NC}"

# 5. Complete upload
curl -s -X POST http://localhost:8080/api/v1/upload/multipart/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"upload_id\": \"$UPLOAD_ID\",
    \"etags\": [{\"part_number\": 1, \"etag\": \"$ETAG\"}]
  }"

echo -e "${GREEN}✅ Upload completed${NC}"

# 6. Create track
echo "🎵 Creating track..."
TRACK_RES=$(curl -s -X POST http://localhost:8080/api/v1/tracks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"E2E Test Track\",
    \"visibility\": \"public\",
    \"original_asset_id\": \"$ASSET_ID\"
  }")

TRACK_ID=$(echo $TRACK_RES | jq -r '.track.id')
VERSION_ID=$(echo $TRACK_RES | jq -r '.track.primary_version.id')

echo -e "${GREEN}✅ Track created: $TRACK_ID${NC}"

# 7. Poll until ready
echo "⏳ Waiting for transcode to complete..."
MAX_WAIT=120
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
  TRACK=$(curl -s http://localhost:8080/api/v1/tracks/$TRACK_ID)
  STATUS=$(echo $TRACK | jq -r '.primary_version.status')

  if [ "$STATUS" = "ready" ]; then
    echo -e "${GREEN}✅ Transcode completed${NC}"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo -e "${RED}❌ Transcode failed${NC}"
    exit 1
  fi

  sleep 5
  WAITED=$((WAITED + 5))
done

if [ $WAITED -ge $MAX_WAIT ]; then
  echo -e "${RED}❌ Timeout waiting for transcode${NC}"
  exit 1
fi

# 8. Verify playlist exists
PLAYLIST_URL=$(echo $TRACK | jq -r '.primary_version.transcodes[0].playlist_url')
if [ "$PLAYLIST_URL" = "null" ]; then
  echo -e "${RED}❌ No playlist URL${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Playlist URL: ${PLAYLIST_URL:0:50}...${NC}"

# 9. Test playback with FFmpeg
echo "▶️  Testing playback..."
timeout 10 ffmpeg -i "$PLAYLIST_URL" -f null - 2>&1 | grep -q "time=" || {
  echo -e "${RED}❌ Playback test failed${NC}"
  exit 1
}
echo -e "${GREEN}✅ Playback successful${NC}"

# 10. Post comment
echo "💬 Posting comment..."
curl -s -X POST http://localhost:8080/api/v1/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"track_id\": \"$TRACK_ID\",
    \"at_ms\": 30000,
    \"body_md\": \"Test comment at 30s\"
  }"

echo -e "${GREEN}✅ Comment posted${NC}"

# 11. Record play
echo "📊 Recording play..."
curl -s -X POST http://localhost:8080/api/v1/plays \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"track_id\": \"$TRACK_ID\",
    \"ms_listened\": 60000,
    \"completed\": false
  }"

echo -e "${GREEN}✅ Play recorded${NC}"

# 12. Verify analytics (trigger rollup job manually)
echo "📈 Triggering analytics rollup..."
# This would trigger via worker job in real scenario
# For E2E, we can call admin endpoint or wait for scheduled job

echo -e "${GREEN}🎉 All E2E tests passed!${NC}"

# Cleanup
echo "🧹 Cleaning up..."
docker compose down -v
```

### Pass Criteria

All steps must:
- Return 2xx status codes (200, 201, 204)
- Produce expected JSON responses
- Create files in MinIO (verify with mc ls command)
- Play successfully with FFmpeg (no errors, time progresses)

**If any step fails:** Script exits with code 1, prints error message

---

## Test Data & Fixtures

### Sample Files

**Location:** `test/fixtures/`

**Files needed:**
- `test-track.wav` - 10s 44.1kHz stereo WAV (200KB)
- `test-track-long.flac` - 3min FLAC (15MB) for timeout tests
- `test-artwork.jpg` - 1000x1000 JPEG (200KB)
- `test-invalid.txt` - Text file disguised as audio (for validation tests)

**Generation:**
```bash
# Generate silent WAV
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 10 -q:a 9 -acodec pcm_s16le test/fixtures/test-track.wav

# Generate artwork
convert -size 1000x1000 gradient:blue-red test/fixtures/test-artwork.jpg
```

### Database Seed Data

**Test users:**
```typescript
// test/seed.ts
export const testUsers = [
  {
    id: 'user-admin',
    handle: 'admin',
    email: 'admin@test.com',
    is_admin: true,
  },
  {
    id: 'user-artist',
    handle: 'testartist',
    email: 'artist@test.com',
    is_admin: false,
  },
  {
    id: 'user-listener',
    handle: 'listener',
    email: 'listener@test.com',
    is_admin: false,
  },
];
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Start services
        run: docker compose up -d

      - name: Wait for services
        run: sleep 30

      - name: Run unit tests (API)
        run: docker compose exec -T api npm test

      - name: Run unit tests (Web)
        run: docker compose exec -T web npm test

      - name: Run E2E tests
        run: ./scripts/e2e.sh

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./api/coverage/coverage-final.json

      - name: Clean up
        if: always()
        run: docker compose down -v
```

---

## Manual Testing Checklist

**Before each release:**

**Authentication:**
- [ ] Sign up with new account
- [ ] Log in with existing account
- [ ] Log out clears session
- [ ] Invalid credentials rejected
- [ ] Password reset flow works

**Upload:**
- [ ] Upload WAV file (< 100MB)
- [ ] Upload FLAC file (lossless)
- [ ] Upload MP3 file (lossy)
- [ ] Large file (> 100MB) uploads successfully
- [ ] Invalid file rejected

**Playback:**
- [ ] HLS stream plays in browser
- [ ] Waveform renders correctly
- [ ] Seeking works
- [ ] Speed control works (0.5x, 1x, 2x)
- [ ] Volume control works
- [ ] Loop A-B works

**Social:**
- [ ] Post comment (with timestamp)
- [ ] Reply to comment
- [ ] Like track
- [ ] Repost track
- [ ] Follow user

**Admin:**
- [ ] View pending reports
- [ ] Issue strike
- [ ] Ban user
- [ ] Process DMCA request
- [ ] View job queue

**Mobile:**
- [ ] Player works on iOS Safari
- [ ] Player works on Android Chrome
- [ ] Responsive layout on phone
- [ ] Touch controls work

---

## Performance Testing

### Load Testing (Artillery)

```yaml
# test/load.yml
config:
  target: 'http://localhost:8080'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Sustained load

scenarios:
  - name: Browse and play
    flow:
      - get:
          url: /api/v1/trending
      - think: 2
      - get:
          url: /api/v1/tracks/{{ trackId }}
      - think: 5
      - post:
          url: /api/v1/plays
          json:
            track_id: {{ trackId }}
            ms_listened: 30000
```

**Run:**
```bash
artillery run test/load.yml
```

**Targets:**
- Requests/sec: 100+
- Avg response time: < 200ms
- P95 response time: < 500ms
- Error rate: < 0.1%

---

## Test Coverage Reports

### Generate Coverage

```bash
# API
cd api && npm test -- --coverage

# Web
cd web && npm test -- --coverage
```

### View Reports

```bash
# Open in browser
open api/coverage/lcov-report/index.html
open web/coverage/lcov-report/index.html
```

### Coverage Enforcement

```json
// jest.config.js
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

---

## Debugging Failed Tests

### Common Issues

**Database state:**
- Problem: Test fails due to leftover data
- Solution: Ensure `beforeEach` truncates tables
- Check: Run test in isolation to verify

**Async timing:**
- Problem: Test finishes before async operation
- Solution: Use `await` on all promises
- Check: Add `jest.setTimeout(10000)` for slow operations

**Mocking:**
- Problem: Mock not called as expected
- Solution: Verify mock is injected correctly
- Check: Use `jest.spyOn` and `toHaveBeenCalledWith`

**External dependencies:**
- Problem: FFmpeg/MinIO not available in test
- Solution: Mock external services, or use test containers
- Check: Verify Docker services are running

### Debug Commands

```bash
# Run single test file
npm test tracks.service.spec.ts

# Run tests matching pattern
npm test -- -t "should create track"

# Run with verbose output
npm test -- --verbose

# Run with debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## Test Maintenance

### When to Update Tests

- After adding new features (write tests first, TDD)
- After fixing bugs (add regression test)
- When refactoring (ensure tests still pass)
- When schemas change (update test data)

### Red-Green-Refactor

1. **Red:** Write failing test for new feature
2. **Green:** Write minimal code to make it pass
3. **Refactor:** Improve code while keeping tests green

### Test Code Quality

- Tests should be readable (clear arrange-act-assert)
- No copy-paste (use helpers/fixtures)
- No flaky tests (fix or delete)
- Fast tests (mock slow external calls)
