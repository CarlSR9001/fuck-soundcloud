# Code Quality Standards & Development Rules

**Purpose:** Coding standards, anti-patterns to avoid, file size rules, TypeScript best practices, and mandatory instructions for all agents.

**Prerequisites:** Read this FIRST before starting ANY development task.

---

## Anti-BS Guardrails (CRITICAL)

### Rule #1: No Fake Stubs

**NEVER create fake or simulated functionality.**

**❌ WRONG:**
```typescript
async function uploadToS3(file: File) {
  // TODO: Implement actual S3 upload
  console.log('Simulating S3 upload...');
  return { success: true, url: 'fake-url' };
}
```

**✅ CORRECT:**
```typescript
async function uploadToS3(file: File) {
  // Real MinIO/S3 upload
  const result = await s3Client.putObject({
    Bucket: 'originals',
    Key: file.name,
    Body: file,
  });
  return { success: true, url: result.Location };
}
```

**If you cannot implement something:**
- STOP immediately
- Print: `UNIMPLEMENTED: <feature name>`
- Document what's needed in a comment
- Do NOT return fake success responses

---

### Rule #2: Files Only Necessary to Run

**Produce ONLY:**
- Source code files (`.ts`, `.tsx`, `.js`, `.jsx`)
- Configuration files (`package.json`, `tsconfig.json`, `.env.example`)
- ONE `README.md` at project root
- Docker files (`Dockerfile`, `docker-compose.yml`)
- Database migrations

**DO NOT create:**
- Extra documentation files (`.md` besides root README)
- `.txt` files
- Planning documents
- Architecture diagrams (unless explicitly requested)
- Changelog files
- Multiple README files

---

### Rule #3: E2E Proof Required

**Every milestone MUST have:**
- A working E2E script (`scripts/e2e.sh`)
- Script must actually upload a file and play it
- No simulated success — real file in MinIO, real playback via FFmpeg

**Pass criteria:**
- All curl commands return 2xx status codes
- Media files exist in MinIO (verify with `mc ls`)
- FFmpeg can play the HLS stream without errors

---

### Rule #4: Real Storage Writes Only

**After upload:**
- File MUST exist in MinIO bucket
- Database row MUST be written
- Asset record MUST reference actual S3 key

**After transcode:**
- HLS manifests MUST exist (`playlist.m3u8`)
- Segments MUST exist (`segment_000.m4s`, etc.)
- Playlist MUST be playable by FFmpeg/hls.js

**Verification commands:**
```bash
# Check MinIO
mc ls minio/originals/

# Check segments
mc ls minio/transcodes/version-abc123/

# Test playback
ffmpeg -i http://localhost/media/hls/version-abc123/playlist.m3u8 -t 10 -f null -
```

---

### Rule #5: Deterministic Builds

**docker-compose.yml requirements:**
- Pin all image versions (`postgres:15`, not `postgres:latest`)
- Use specific versions in package.json
- No floating dependencies (`^` or `~` in package.json for critical deps)

**Example:**
```yaml
# ❌ WRONG
image: postgres:latest
image: node:lts

# ✅ CORRECT
image: postgres:15.3
image: node:20.9.0
```

---

### Rule #6: Migrations First

**Database schema:**
- Created via migration files ONLY
- Never manually create tables
- App MUST fail loud if migrations not applied

**Startup check:**
```typescript
// api/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Check if migrations applied
  const hasTables = await db.raw(`SELECT 1 FROM tracks LIMIT 1`).catch(() => false);
  if (!hasTables) {
    console.error('ERROR: Database migrations not applied. Run: npm run migrate');
    process.exit(1);
  }

  await app.listen(3000);
}
```

---

### Rule #7: Exit on Error

**CI/Scripts:**
```bash
#!/bin/bash
set -e  # Exit immediately on error

# Every command that fails will exit the script
curl ... || exit 1
docker compose up || exit 1
npm test || exit 1
```

**No silent failures:**
- Don't catch errors and continue
- Don't return success when operation failed
- Log errors with actionable context

---

## File Size & Modularity Rules (CRITICAL)

### Maximum File Sizes

**NEVER create large monolithic files.**

**Limits:**
- Components: 200 lines max
- Services: 300 lines max
- Controllers: 200 lines max
- Utilities: 150 lines max

**Why:**
- Multiple agents can work in parallel
- Easier to read entire file without pagination
- Faster context loading
- More modular, maintainable codebase

### Modularity Guidelines

**Split large files into:**
```
# Before (BAD)
api/src/tracks/tracks.service.ts  (800 lines)

# After (GOOD)
api/src/tracks/
  ├── tracks.service.ts          (150 lines - main orchestration)
  ├── track-creation.service.ts  (120 lines - creation logic)
  ├── track-query.service.ts     (100 lines - query logic)
  ├── track-update.service.ts    (90 lines - update logic)
  └── index.ts                   (barrel export)
```

**Benefits:**
- Each service has single responsibility
- Easier to test in isolation
- Can be edited concurrently by multiple agents
- Clearer boundaries

### Barrel Exports

**Use index.ts for clean imports:**
```typescript
// api/src/tracks/index.ts
export * from './tracks.service';
export * from './track-creation.service';
export * from './track-query.service';
export * from './track-update.service';

// In other files
import { TracksService, TrackCreationService } from '@/tracks';
```

### Configuration Files

**Separate concerns:**
```
api/src/config/
  ├── database.config.ts   (60 lines)
  ├── storage.config.ts    (50 lines)
  ├── jwt.config.ts        (40 lines)
  ├── redis.config.ts      (45 lines)
  └── index.ts             (barrel export)
```

---

## TypeScript Best Practices

### No `any` Types

**❌ WRONG:**
```typescript
function processTrack(data: any) {
  return data.title;
}
```

**✅ CORRECT:**
```typescript
interface TrackData {
  title: string;
  artist: string;
}

function processTrack(data: TrackData) {
  return data.title;
}
```

**Exceptions:**
- Third-party libraries without types (use `unknown` then narrow)
- Dynamic JSON parsing (validate with zod/yup)

### Strict Mode Enabled

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### Type Inference

**Let TypeScript infer when obvious:**
```typescript
// ❌ Redundant
const title: string = 'My Track';
const count: number = 42;

// ✅ Inferred
const title = 'My Track';
const count = 42;

// ✅ Explicit when needed
const track: Track = await fetchTrack(id);
```

### Interfaces Over Types (usually)

**For object shapes, use interface:**
```typescript
// ✅ Preferred
interface Track {
  id: string;
  title: string;
}

// Use type for unions/intersections
type Status = 'pending' | 'ready' | 'failed';
type TrackWithOwner = Track & { owner: User };
```

---

## Error Handling Patterns

### Always Handle Errors

**❌ WRONG:**
```typescript
async function uploadFile(file: File) {
  const result = await s3.upload(file);
  return result;
}
```

**✅ CORRECT:**
```typescript
async function uploadFile(file: File) {
  try {
    const result = await s3.upload(file);
    return result;
  } catch (error) {
    logger.error('S3 upload failed', { error, filename: file.name });
    throw new StorageException('Failed to upload file', { cause: error });
  }
}
```

### Custom Exception Classes

**Define domain exceptions:**
```typescript
// api/src/common/exceptions/storage.exception.ts
export class StorageException extends HttpException {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
    this.name = 'StorageException';
    this.cause = options?.cause;
  }
}

// Usage
throw new StorageException('File not found in bucket', { cause: error });
```

### Validation Errors

**Use class-validator DTOs:**
```typescript
export class CreateTrackDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsEnum(Visibility)
  visibility: Visibility;

  @IsOptional()
  @IsDateString()
  release_at?: string;
}

// Controller automatically validates and returns 422 with details
```

---

## Code Organization Patterns

### Service Layer Pattern

**Controllers → Services → Repositories**

```typescript
// Controller (thin - just routing and validation)
@Controller('tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Post()
  async create(@Body() dto: CreateTrackDto, @User('userId') userId: string) {
    return this.tracksService.createTrack(dto, userId);
  }
}

// Service (business logic)
export class TracksService {
  constructor(
    private readonly tracksRepo: TracksRepository,
    private readonly assetsRepo: AssetsRepository,
    private readonly queueService: QueueService,
  ) {}

  async createTrack(dto: CreateTrackDto, userId: string): Promise<Track> {
    // 1. Validate asset exists
    const asset = await this.assetsRepo.findOne(dto.asset_id);
    if (!asset) throw new NotFoundException('Asset not found');

    // 2. Create track
    const track = await this.tracksRepo.create({
      ...dto,
      owner_user_id: userId,
      slug: generateSlug(dto.title),
    });

    // 3. Enqueue transcode job
    await this.queueService.enqueue('transcode', {
      version_id: track.primary_version_id,
      asset_id: asset.id,
    });

    return track;
  }
}
```

### Repository Pattern

**Abstract database access:**
```typescript
// api/src/tracks/tracks.repository.ts
@Injectable()
export class TracksRepository {
  constructor(@InjectRepository(Track) private repo: Repository<Track>) {}

  async findOne(id: string): Promise<Track | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findBySlug(slug: string, userId: string): Promise<Track | null> {
    return this.repo.findOne({
      where: { slug, owner_user_id: userId },
    });
  }

  async create(data: Partial<Track>): Promise<Track> {
    const track = this.repo.create(data);
    return this.repo.save(track);
  }

  async update(id: string, data: Partial<Track>): Promise<Track> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }
}
```

---

## Naming Conventions

### Files

```
camelCase.ts        → utilities, helpers
PascalCase.tsx      → React components
kebab-case.ts       → services, controllers (NestJS convention)
SCREAMING_SNAKE     → constants
```

**Examples:**
```
formatTime.ts
TrackCard.tsx
tracks.controller.ts
tracks.service.ts
MAX_UPLOAD_SIZE.ts
```

### Variables & Functions

```typescript
// Variables: camelCase
const trackId = 'abc123';
const isPlaying = false;

// Functions: camelCase, verb prefix
function getTrack(id: string) {}
async function createTrack(dto: CreateTrackDto) {}
function isValidSlug(slug: string) {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const DEFAULT_BITRATE = 160;

// Classes: PascalCase
class TrackService {}
class StorageException {}

// Interfaces: PascalCase
interface Track {}
interface CreateTrackDto {}
```

---

## Code Comments

### When to Comment

**DO comment:**
- Complex business logic
- Non-obvious algorithms
- Workarounds for third-party bugs
- Public API documentation (JSDoc)

**DON'T comment:**
- Obvious code (self-documenting)
- What code does (say WHY instead)

**❌ WRONG:**
```typescript
// Increment counter by 1
counter++;

// Loop through tracks
for (const track of tracks) {
  // ...
}
```

**✅ CORRECT:**
```typescript
// EBU R128 recommends -23 LUFS for streaming platforms
const TARGET_LOUDNESS = -23;

// Workaround: FFmpeg opus encoder has 60s max segment duration bug
const MAX_SEGMENT_DURATION = 59;

/**
 * Calculates user-centric payment distribution.
 * Unlike Spotify's pro-rata model, this distributes each user's
 * contribution only to artists THEY listened to.
 */
function distributeUserPool(userId: string, pool: number) {
  // ...
}
```

### JSDoc for Public APIs

```typescript
/**
 * Creates a new track from an uploaded asset.
 *
 * @param dto - Track creation data (title, visibility, etc.)
 * @param userId - ID of user creating the track
 * @returns Newly created track with pending status
 * @throws {NotFoundException} If asset_id does not exist
 * @throws {ForbiddenException} If user does not own asset
 */
async createTrack(dto: CreateTrackDto, userId: string): Promise<Track> {
  // ...
}
```

---

## Testing Standards

### Test File Naming

```
src/tracks/tracks.service.ts        → tracks.service.spec.ts
src/utils/formatTime.ts             → formatTime.spec.ts
```

### Test Structure (AAA Pattern)

```typescript
describe('TracksService', () => {
  describe('createTrack', () => {
    it('should create track with generated slug', async () => {
      // Arrange
      const dto = { title: 'My Track', visibility: 'public' };
      const userId = 'user-123';

      // Act
      const result = await service.createTrack(dto, userId);

      // Assert
      expect(result.slug).toBe('my-track');
      expect(result.owner_user_id).toBe(userId);
    });
  });
});
```

### Coverage Targets

- Services: 80%+ line coverage
- Controllers: 70%+ (integration tests preferred)
- Utilities: 90%+ (pure functions, easy to test)

---

## Git Commit Guidelines

### Commit Message Format

```
<type>: <subject>

<body (optional)>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring (no behavior change)
- `test`: Add or update tests
- `docs`: Documentation only
- `chore`: Build, deps, tooling

**Examples:**
```
feat: Add HLS lossless streaming for verified users

Implements ALAC codec transcoding for premium quality.
Gated behind user.is_verified flag.

---

fix: Prevent duplicate uploads via audio fingerprinting

Uses Chromaprint to detect identical audio files.
Creates admin report for review.

---

refactor: Split tracks.service into smaller modules

Extracted creation, query, and update logic into
separate services for better maintainability.
```

---

## Instructions for Subagents (MANDATORY)

### Before Starting ANY Task

**1. READ AGENT DIRECTIVES COMPLETELY**

Read ALL relevant agent directive files:
- `agents/README.md` - Overview and navigation
- `agents/code-quality.md` - This file (critical rules)
- Domain-specific files (architecture, api-specs, security, etc.)

**2. CHECK DEVELOPMENT LOG**

Review the development log to understand:
- What other agents have done
- Current state of the codebase
- Known issues or blockers

**3. UNDERSTAND THE RULES**

You MUST follow:
- Anti-BS guardrails (no fake stubs)
- File size limits (components < 200 lines)
- Testing requirements (80%+ coverage for services)
- Error handling patterns (fail loud with context)

### During Development

**1. KEEP FILES SMALL**

If a file grows beyond 200 lines:
- STOP immediately
- Refactor into smaller modules
- Use barrel exports (index.ts)

**2. NO FAKE IMPLEMENTATIONS**

If you can't implement something:
- Print: `UNIMPLEMENTED: <feature>`
- Add TODO comment with context
- Do NOT return fake success

**3. TEST AS YOU GO**

Write tests alongside code:
- Unit tests for business logic
- Integration tests for endpoints
- E2E tests for critical flows

### After Completing Work

**1. UPDATE DEVELOPMENT LOG**

Add entry to development log:
```markdown
### [YYYY-MM-DD HH:MM] - Agent: your-agent-name

**Task:** Brief description

**Completed:**
- Feature 1
- Feature 2

**Files created/modified:**
- path/to/file1.ts
- path/to/file2.tsx

**Next steps:**
- Item 1
- Item 2

**Notes:** Important decisions or context
```

**2. RUN TESTS**

Before considering task complete:
```bash
npm test                  # Run all tests
npm run lint              # Check code style
docker compose up -d      # Boot stack
./scripts/e2e.sh          # Run E2E tests
```

**3. VERIFY REAL FUNCTIONALITY**

Don't just test that code runs — verify:
- Files exist in MinIO
- Database rows written
- API returns correct data
- Player can play the stream

### Communication with Other Agents

**In development log, note:**
- What you accomplished
- What files you created/modified
- What remains to be done
- Any blockers or decisions needed

**If you need another agent:**
- Document requirement in "Next steps"
- Provide clear context and scope
- Don't duplicate work — check log first

---

## Code Quality Checklist

**Before submitting code:**

**TypeScript:**
- [ ] No `any` types (use unknown or proper types)
- [ ] Strict mode enabled, no type errors
- [ ] Proper error handling (try/catch with logging)
- [ ] Interfaces for all data shapes

**Architecture:**
- [ ] Files under size limits (components < 200 lines)
- [ ] Single Responsibility Principle followed
- [ ] No duplicate code (DRY principle)
- [ ] Barrel exports for clean imports

**Testing:**
- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical workflows
- [ ] Coverage targets met (80%+ for services)

**Documentation:**
- [ ] JSDoc comments for public APIs
- [ ] Complex logic explained in comments
- [ ] README updated if needed
- [ ] Development log entry added

**Functionality:**
- [ ] No fake stubs or simulated responses
- [ ] Real database writes verified
- [ ] Real MinIO files exist
- [ ] Error cases handled gracefully

**Security:**
- [ ] Input validation on all endpoints
- [ ] Authentication guards on protected routes
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (sanitize user input)

**Performance:**
- [ ] Database queries optimized (indexes used)
- [ ] N+1 queries avoided
- [ ] Large lists paginated
- [ ] Images/media optimized

---

## Common Anti-Patterns to Avoid

### God Objects

**❌ WRONG:**
```typescript
// tracks.service.ts (1000 lines)
class TracksService {
  create() {}
  update() {}
  delete() {}
  search() {}
  trending() {}
  analytics() {}
  transcode() {}
  generateWaveform() {}
  extractArtwork() {}
  // ... 50 more methods
}
```

**✅ CORRECT:**
```typescript
// Split into focused services
class TrackCreationService {}
class TrackQueryService {}
class TrackUpdateService {}
class TrackAnalyticsService {}
class MediaProcessingService {}
```

### Callback Hell

**❌ WRONG:**
```typescript
function uploadTrack(file, callback) {
  uploadToS3(file, (err, result) => {
    if (err) return callback(err);
    createTrack(result, (err, track) => {
      if (err) return callback(err);
      enqueuJob(track, (err) => {
        if (err) return callback(err);
        callback(null, track);
      });
    });
  });
}
```

**✅ CORRECT:**
```typescript
async function uploadTrack(file: File): Promise<Track> {
  const asset = await uploadToS3(file);
  const track = await createTrack(asset);
  await enqueueJob(track);
  return track;
}
```

### Magic Numbers

**❌ WRONG:**
```typescript
if (file.size > 524288000) throw new Error('Too large');
setTimeout(retry, 5000);
```

**✅ CORRECT:**
```typescript
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const RETRY_DELAY_MS = 5000;

if (file.size > MAX_FILE_SIZE) throw new Error('Too large');
setTimeout(retry, RETRY_DELAY_MS);
```

### Premature Optimization

**❌ WRONG:**
```typescript
// Complex caching before profiling shows it's needed
const memoizedTrack = useMemo(() => computeExpensiveThing(track), [track]);
```

**✅ CORRECT:**
```typescript
// Start simple, optimize when metrics show bottleneck
const track = computeThing(track);

// Later, if profiling shows this is slow:
const memoizedTrack = useMemo(() => computeThing(track), [track]);
```

---

## Development Workflow

**1. Understand the task**
- Read all relevant agent directives
- Check development log for context
- Clarify requirements if unclear

**2. Plan the implementation**
- Identify files to create/modify
- Consider file size limits upfront
- Plan test strategy

**3. Implement incrementally**
- Write test first (TDD)
- Implement feature
- Verify with E2E test
- Commit with clear message

**4. Refactor if needed**
- Check file sizes
- Extract duplicated code
- Improve naming/clarity

**5. Document and communicate**
- Update development log
- Add JSDoc for public APIs
- Note any decisions or blockers

**6. Verify completeness**
- Run all tests
- Check E2E script passes
- Verify real functionality (files in MinIO, etc.)
