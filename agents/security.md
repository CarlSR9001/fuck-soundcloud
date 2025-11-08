# Security & Privacy

**Purpose:** Authentication, authorization, security best practices, privacy compliance, and common vulnerability prevention.

**Prerequisites:**
- Read `api-specs.md` for endpoint authentication requirements
- Read `architecture.md` for data model and system design

---

## Authentication System

### JWT Strategy

**Token Generation:**
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Secret:** Store in `JWT_SECRET` environment variable (min 32 bytes)
- **Expiry:** 24 hours for regular sessions
- **Payload:**
  ```json
  {
    "sub": "user-id",
    "jti": "session-id",
    "iat": 1699459200,
    "exp": 1699545600
  }
  ```

**Token Delivery:**
- **API:** `Authorization: Bearer <token>` header
- **Web:** httpOnly cookie + SameSite=Strict
- **Refresh:** Rotating tokens (new token on each API call)

**Session Management:**
- Store sessions in `sessions` table
- Link JWT `jti` (JWT ID) to session row
- Logout: delete session row + blacklist token
- Expire: cron job deletes expired sessions daily

### Password Security

**Hashing:**
- **Algorithm:** bcrypt with work factor 12
- **Library:** `bcrypt` or `argon2` (preferred)
- **Never:** Store plaintext or reversible encryption

**Requirements:**
- Minimum 8 characters
- No maximum (allow passphrases)
- No complexity requirements (length > complexity)
- Check against common password lists (optional)

**Reset Flow:**
1. User requests reset via email
2. Generate secure token (32 bytes random)
3. Store token hash + expiry (1 hour) in `password_resets` table
4. Email link: `https://site.com/reset?token=...`
5. User submits new password with token
6. Validate token, update password, delete reset record
7. Invalidate all existing sessions

### Admin Authentication

**Requirements:**
- Same JWT system as regular users
- `is_admin` flag in user table
- Admin routes protected with `AdminGuard`
- No separate admin login (reduces attack surface)

**Best Practices:**
- Never hardcode admin credentials
- Seed initial admin via migration or env var
- Audit log all admin actions
- Consider 2FA for admin accounts (future)

---

## Authorization Patterns

### Route Guards (NestJS)

**JwtAuthGuard:**
```typescript
@UseGuards(JwtAuthGuard)
@Get('/me')
getProfile(@User('userId') userId: string) {
  // userId extracted from validated JWT
}
```

**AdminGuard:**
```typescript
@UseGuards(JwtAuthGuard, AdminGuard)
@Get('/admin/users')
listUsers() {
  // Requires is_admin=true
}
```

**OptionalAuthGuard:**
```typescript
@UseGuards(OptionalAuthGuard)
@Get('/tracks/:id')
getTrack(@User('userId') userId: string | null) {
  // Works with or without auth
  // Used for visibility checks
}
```

### Resource Ownership

**Pattern:**
1. Extract `userId` from JWT
2. Fetch resource from database
3. Check `owner_user_id === userId` or `is_admin`
4. Throw `ForbiddenException` if unauthorized

**Example:**
```typescript
async updateTrack(trackId: string, userId: string, dto: UpdateTrackDto) {
  const track = await this.tracksRepo.findOne(trackId);
  if (!track) throw new NotFoundException();
  if (track.owner_user_id !== userId && !user.is_admin) {
    throw new ForbiddenException('Not track owner');
  }
  // Proceed with update
}
```

### Visibility Rules

**Public tracks:**
- Anyone can view (no auth required)
- Listed in search results
- Embeddable

**Unlisted tracks:**
- Anyone with link can view (no auth required)
- Not in search results
- Embeddable with secret link

**Private tracks:**
- Owner only (auth required)
- Not in search results
- Not embeddable

**Implementation:**
```typescript
async getTrack(trackId: string, userId: string | null) {
  const track = await this.tracksRepo.findOne(trackId);
  if (track.visibility === 'public') return track;
  if (track.visibility === 'unlisted') return track;
  if (track.visibility === 'private' && track.owner_user_id === userId) return track;
  throw new ForbiddenException();
}
```

---

## Rate Limiting

### Implementation (Redis-based)

**Strategy:** Token bucket with Redis TTL

**Limits:**
- **Auth endpoints:** 5 attempts per IP per 15 minutes
- **Comment creation:** 20 per user per hour
- **Track upload:** 10/day (unverified), 50/day (verified)
- **API general:** 1000 requests per IP per hour

**NestJS Guard:**
```typescript
@Injectable()
export class RateLimitGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = `rate:${request.ip}:${request.path}`;
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, 3600);
    if (count > this.limit) {
      throw new TooManyRequestsException('Rate limit exceeded');
    }
    return true;
  }
}
```

**Response Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1699545600
```

### Upload Rate Limiting

**Logic:**
1. Check user verification status
2. Query `tracks` created in last 24h
3. If count >= limit, reject with 429
4. Return `X-RateLimit-Remaining` in response

**Bypass:**
- Admin users: no limits
- Verified artists: higher limits (50/day)

---

## CSRF Protection

### Strategy

**Web Forms:**
- Double-submit cookie pattern
- CSRF token in hidden form field
- Validate token on submission

**API Calls:**
- JWT in Authorization header (CSRF-safe)
- No cookies for API auth (tokens only)

**Implementation (NestJS):**
```typescript
app.use(csurf({
  cookie: { httpOnly: true, sameSite: 'strict' },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
}));
```

---

## Input Validation & Sanitization

### Validation (class-validator)

**DTOs with decorators:**
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

  @IsArray()
  @ArrayMaxSize(10)
  tags?: string[];
}
```

**Global validation pipe:**
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Strip unknown properties
  forbidNonWhitelisted: true, // Reject unknown properties
  transform: true,            // Auto-transform to DTO types
}));
```

### Sanitization

**Markdown:**
- Use markdown parser with HTML sanitization
- Allow: headings, lists, links, emphasis
- Block: `<script>`, `<iframe>`, inline JS

**File uploads:**
- Validate MIME type (magic bytes, not extension)
- Scan for malware (ClamAV optional)
- Size limits: 500MB for audio, 10MB for images

**SQL injection:**
- Use parameterized queries (TypeORM/Prisma)
- Never concatenate user input into SQL
- Escape special characters in raw queries

---

## Signed URLs for Media

### HLS Playlist Signing (Nginx)

**Purpose:** Prevent unauthorized access to private track streams

**Implementation:**
1. API generates signed URL with expiry
2. Nginx validates signature using `secure_link` module
3. Rejects invalid/expired signatures

**Nginx config:**
```nginx
location /media/hls/ {
    secure_link $arg_sig,$arg_expires;
    secure_link_md5 "$secure_link_expires$uri$remote_addr $secure_link_secret";

    if ($secure_link = "") { return 403; }
    if ($secure_link = "0") { return 410; }

    proxy_pass http://minio:9000/transcodes/;
}
```

**API signing logic:**
```typescript
function signUrl(path: string, expiresIn: number): string {
  const expires = Math.floor(Date.now() / 1000) + expiresIn;
  const secret = process.env.SECURE_LINK_SECRET;
  const hash = md5(`${expires}${path}${secret}`);
  return `${path}?sig=${hash}&expires=${expires}`;
}
```

**Expiry:** 1 hour (refresh on player load)

---

## Privacy & Data Protection

### GDPR Compliance

**User Rights:**
1. **Access:** GET /api/v1/users/me/data (export all data)
2. **Rectification:** PATCH /api/v1/users/me (update profile)
3. **Erasure:** DELETE /api/v1/users/me (right to be forgotten)
4. **Portability:** JSON export of all user content
5. **Object:** Opt-out of analytics tracking

**Data Retention:**
- User data: deleted on account deletion (30-day grace period)
- Analytics: anonymized after 90 days
- Backups: 30-day retention, then deleted

**Consent:**
- Cookie consent banner (optional cookies only)
- Terms acceptance required on signup
- Privacy policy link on all pages

### Analytics Privacy

**Principles:**
- No third-party trackers (Google Analytics, etc.)
- Self-hosted analytics only
- IP address hashing (SHA-256 with salt)
- No PII in analytics tables

**IP Hashing:**
```typescript
function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT;
  return createHash('sha256').update(ip + salt).digest('hex');
}
```

**User Agent:**
- Store parsed UA (browser, OS, device type)
- Don't store full UA string (reduces fingerprinting)

---

## Content Security Policy

### Headers (Nginx)

```nginx
add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    media-src 'self' blob:;
    connect-src 'self' wss://your.site;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
" always;
```

**Justification:**
- `unsafe-inline` for scripts/styles: Next.js SSR requires it
- `data:` for images: waveform canvas rendering
- `blob:` for media: HLS player creates blob URLs
- `wss:`: WebSocket for real-time features

### Additional Security Headers

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

---

## Malware Scanning (Optional)

### ClamAV Integration

**Setup:**
1. Add `clamav` container to docker-compose
2. Update virus definitions daily
3. Scan uploads in worker job

**Worker implementation:**
```typescript
async scanFile(assetId: string): Promise<void> {
  const filePath = await this.storage.download(assetId);
  const { stdout } = await exec(`clamscan --no-summary ${filePath}`);
  if (stdout.includes('FOUND')) {
    await this.tracksRepo.update({ asset_id: assetId }, {
      status: 'failed',
      error: 'Malware detected'
    });
    await this.storage.delete(assetId);
    throw new Error('Malware detected');
  }
}
```

**Trade-off:**
- Adds 5-10s to upload processing
- Reduces risk of hosting malware
- Optional feature (off by default)

---

## Ban & Moderation

### Ban System

**Middleware (global):**
```typescript
@Injectable()
export class BanCheckMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    if (req.user?.is_banned) {
      throw new ForbiddenException('Account banned');
    }
    next();
  }
}
```

**Apply globally:**
```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(BanCheckMiddleware).forRoutes('*');
  }
}
```

**Ban reasons:** Stored in `users.ban_reason` column

### 3-Strike Policy

**Flow:**
1. Content reported → admin reviews
2. If violation confirmed → strike issued + content removed
3. Strike 1: Warning
4. Strike 2: Warning
5. Strike 3: Automatic permanent ban (`is_banned=true`)

**Strike tracking:**
```sql
SELECT COUNT(*) FROM strikes WHERE user_id = ? AND removed_at IS NULL
```

**Auto-unban:**
- If admin removes strike and count < 3, clear ban flag

---

## DMCA Safe Harbor Compliance

### Legal Requirements

1. **Registered DMCA agent** with US Copyright Office
2. **Takedown process** responds within 24-48 hours
3. **Repeat infringer policy** (3-strike system)
4. **No actual knowledge** of infringement before notification
5. **No financial benefit** from infringing content

### Copyright Attestation

**On upload:**
```typescript
export class UploadAttestationDto {
  @IsBoolean()
  attest_ownership: boolean; // Must be true

  @IsString()
  ip_address: string; // Logged for legal purposes
}
```

**Stored:**
```sql
INSERT INTO copyright_attestations (track_id, user_id, ip_address, attestation_text)
VALUES (?, ?, ?, 'I attest under penalty of perjury that I own the copyright...');
```

**Purpose:** Legal defense (proves uploader claimed ownership)

---

## Common Vulnerabilities to Avoid

### SQL Injection

**DON'T:**
```typescript
const tracks = await db.query(`SELECT * FROM tracks WHERE title = '${title}'`);
```

**DO:**
```typescript
const tracks = await db.query('SELECT * FROM tracks WHERE title = ?', [title]);
```

### XSS (Cross-Site Scripting)

**DON'T:**
```tsx
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**DO:**
```tsx
<div>{sanitizeHtml(userInput)}</div>
```

### Path Traversal

**DON'T:**
```typescript
const file = readFileSync(`/uploads/${req.params.filename}`);
```

**DO:**
```typescript
const filename = path.basename(req.params.filename); // Remove ../ attacks
const file = readFileSync(path.join('/uploads', filename));
```

### Mass Assignment

**DON'T:**
```typescript
await usersRepo.update(userId, req.body); // User could set is_admin=true
```

**DO:**
```typescript
const { email, display_name } = req.body; // Explicit whitelist
await usersRepo.update(userId, { email, display_name });
```

### Insecure Deserialization

**DON'T:**
```typescript
const data = JSON.parse(untrustedInput);
eval(data.code); // NEVER
```

**DO:**
- Use safe parsers (JSON.parse is safe for JSON)
- Validate deserialized data against schema
- Never execute code from user input

---

## Security Checklist

**Authentication:**
- [ ] JWT secret is strong random string (32+ bytes)
- [ ] Passwords hashed with bcrypt/argon2
- [ ] Sessions stored in database
- [ ] Logout invalidates tokens
- [ ] Password reset tokens expire in 1 hour

**Authorization:**
- [ ] All protected routes use JwtAuthGuard
- [ ] Admin routes use AdminGuard
- [ ] Resource ownership checked before mutations
- [ ] Visibility rules enforced

**Input Validation:**
- [ ] Global ValidationPipe configured
- [ ] DTOs define all expected fields
- [ ] File uploads validated (MIME, size)
- [ ] Markdown sanitized before rendering

**Rate Limiting:**
- [ ] Auth endpoints limited (5/15min)
- [ ] Upload endpoints limited (10/day)
- [ ] Comment endpoints limited (20/hour)

**Headers:**
- [ ] CSP header configured
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] HTTPS enforced (redirect HTTP → HTTPS)

**Privacy:**
- [ ] IP addresses hashed in analytics
- [ ] No third-party trackers
- [ ] GDPR data export endpoint
- [ ] Account deletion implemented

**Monitoring:**
- [ ] Failed login attempts logged
- [ ] Admin actions audited
- [ ] Rate limit violations logged
- [ ] Suspicious activity alerts (future)

---

## Secrets Management

### Environment Variables

**Required:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/music

# Redis
REDIS_URL=redis://redis:6379

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# JWT
JWT_SECRET=<32-byte-random-string>
JWT_EXPIRES_IN=24h

# Nginx signed URLs
SECURE_LINK_SECRET=<32-byte-random-string>

# Stripe (M5)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Analytics
IP_HASH_SALT=<32-byte-random-string>
```

**Generation:**
```bash
openssl rand -hex 32  # Generate random secret
```

**Storage:**
- Dev: `.env` file (gitignored)
- Prod: Docker secrets or environment variables
- Never commit secrets to git
- Rotate secrets quarterly (JWT, secure_link)

---

## TLS/HTTPS

### LetsEncrypt (Production)

**Certbot setup:**
```bash
certbot certonly --webroot -w /var/www/html -d your.site
```

**Nginx config:**
```nginx
server {
    listen 443 ssl http2;
    server_name your.site;

    ssl_certificate /etc/letsencrypt/live/your.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your.site/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name your.site;
    return 301 https://$server_name$request_uri;
}
```

**Auto-renewal:**
```bash
0 3 * * * certbot renew --quiet && systemctl reload nginx
```

### Development (Self-Signed)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/dev.key \
  -out nginx/ssl/dev.crt
```
