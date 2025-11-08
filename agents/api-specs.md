# API Specifications (v1)

**Purpose:** Complete REST API endpoint specifications, request/response formats, validation rules, and authentication requirements.

**Prerequisites:**
- Read `architecture.md` for data models and system design
- Read `security.md` for authentication and authorization patterns

---

## API Design Principles

### REST Conventions

- **Versioned endpoints:** All endpoints prefixed with `/api/v1/`
- **Resource-oriented:** Use nouns, not verbs (GET `/tracks`, not `/getTracks`)
- **HTTP methods:** GET (read), POST (create), PATCH (update), DELETE (remove)
- **Status codes:** 200 (ok), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 422 (validation error), 500 (server error)
- **JSON only:** All requests/responses use `application/json`
- **Pagination:** `?limit=20&offset=0` for list endpoints
- **Filtering:** `?type=track&tag=electronic&visibility=public`
- **Sorting:** `?sort=created_at&order=desc`

### Authentication

- **JWT tokens:** Bearer token in Authorization header
- **Session cookies:** httpOnly + SameSite=strict for web sessions
- **Public endpoints:** `/auth/signup`, `/auth/login`, embed endpoints
- **Protected endpoints:** All mutation endpoints require valid JWT
- **Admin endpoints:** Require `is_admin=true` flag on user

---

## Authentication Endpoints

### POST /api/v1/auth/signup

Create new user account.

**Request:**
```json
{
  "email": "artist@example.com",
  "handle": "artistname",
  "password": "secure-password-min-8-chars",
  "display_name": "Artist Name"
}
```

**Validation:**
- Email: valid format, unique
- Handle: 3-20 chars, alphanumeric + underscore, unique
- Password: minimum 8 characters
- Display name: 1-50 characters

**Response:** 201 Created
```json
{
  "user": {
    "id": "uuid",
    "handle": "artistname",
    "display_name": "Artist Name",
    "email": "artist@example.com",
    "created_at": "2025-11-08T12:00:00Z"
  },
  "session": {
    "token": "jwt-token-here",
    "expires_at": "2025-11-09T12:00:00Z"
  }
}
```

**Errors:**
- 400: Missing required fields
- 422: Email already exists / Handle already taken

---

### POST /api/v1/auth/login

Authenticate existing user.

**Request:**
```json
{
  "email": "artist@example.com",
  "password": "secure-password"
}
```

**Response:** 200 OK
```json
{
  "user": { /* user object */ },
  "session": {
    "token": "jwt-token-here",
    "expires_at": "2025-11-09T12:00:00Z"
  }
}
```

**Errors:**
- 401: Invalid credentials
- 403: User is banned

**Rate Limiting:** 5 attempts per IP per 15 minutes

---

### POST /api/v1/auth/logout

Invalidate current session.

**Auth:** Required (JWT)

**Response:** 204 No Content

---

## Upload Endpoints

### POST /api/v1/upload/multipart/init

Initialize multipart upload to MinIO.

**Auth:** Required

**Request:**
```json
{
  "filename": "track.wav",
  "size": 52428800,
  "sha256": "abc123...",
  "mime": "audio/wav"
}
```

**Response:** 200 OK
```json
{
  "upload_id": "uuid",
  "asset_id": "uuid",
  "presigned_parts": [
    {
      "part_number": 1,
      "url": "https://minio:9000/originals/...",
      "expires_at": "2025-11-08T13:00:00Z"
    }
  ]
}
```

**Notes:**
- Client uploads each part to presigned URL
- Part size: 5MB minimum (except last part)
- Maximum 10,000 parts per upload

---

### POST /api/v1/upload/multipart/complete

Finalize multipart upload.

**Auth:** Required

**Request:**
```json
{
  "upload_id": "uuid",
  "etags": [
    { "part_number": 1, "etag": "abc123" },
    { "part_number": 2, "etag": "def456" }
  ]
}
```

**Response:** 200 OK
```json
{
  "asset_id": "uuid",
  "bucket": "originals",
  "key": "abc123.wav",
  "size_bytes": 52428800
}
```

---

## Track Endpoints

### POST /api/v1/tracks

Create new track from uploaded asset.

**Auth:** Required

**Request:**
```json
{
  "title": "My New Track",
  "original_asset_id": "uuid",
  "visibility": "public",
  "description_md": "# Description\n\nMarkdown supported",
  "release_at": "2025-11-10T00:00:00Z",
  "tags": ["electronic", "ambient"],
  "credits": [
    {
      "person_name": "Producer Name",
      "role": "producer",
      "url": "https://example.com"
    }
  ]
}
```

**Validation:**
- Title: 1-200 characters, required
- Visibility: public|unlisted|private
- Release date: future dates allowed (scheduling)
- Tags: max 10 per track
- Credits: max 50 per track

**Response:** 201 Created
```json
{
  "track": {
    "id": "uuid",
    "slug": "my-new-track",
    "title": "My New Track",
    "owner_user_id": "uuid",
    "visibility": "public",
    "status": "pending",
    "primary_version": {
      "id": "uuid",
      "status": "pending",
      "duration_ms": null
    }
  }
}
```

**Notes:**
- Creates track + track_version + enqueues transcode job
- Slug auto-generated from title (unique per user)
- Status=pending until transcode completes

**Errors:**
- 400: Invalid asset_id
- 422: Validation errors
- 429: Rate limit exceeded (10/day unverified, 50/day verified)

---

### GET /api/v1/tracks/:id

Get track details with transcodes and signed playlist URL.

**Auth:** Optional (required for private/unlisted tracks)

**Response:** 200 OK
```json
{
  "id": "uuid",
  "slug": "my-track",
  "title": "My Track",
  "description_md": "...",
  "visibility": "public",
  "created_at": "2025-11-08T12:00:00Z",
  "owner": {
    "id": "uuid",
    "handle": "artistname",
    "display_name": "Artist Name"
  },
  "primary_version": {
    "id": "uuid",
    "status": "ready",
    "duration_ms": 240000,
    "sample_rate": 48000,
    "channels": 2,
    "loudness_lufs": -14.2,
    "transcodes": [
      {
        "format": "hls_opus",
        "playlist_url": "https://your.site/media/hls/version-id/playlist.m3u8?sig=...",
        "expires_at": "2025-11-08T13:00:00Z"
      }
    ],
    "waveform": {
      "json_url": "https://your.site/media/waveforms/version-id.json",
      "png_url": "https://your.site/media/waveforms/version-id.png"
    }
  },
  "artwork": {
    "full_url": "https://your.site/images/artwork-id-full.jpg",
    "thumb_url": "https://your.site/images/artwork-id-thumb.jpg"
  },
  "tags": ["electronic", "ambient"],
  "credits": [ /* credit objects */ ],
  "stats": {
    "plays": 142,
    "likes": 23,
    "reposts": 5,
    "comments": 8
  }
}
```

**Errors:**
- 404: Track not found
- 403: Private track, not authorized

---

### PATCH /api/v1/tracks/:id

Update track metadata.

**Auth:** Required (must be track owner or admin)

**Request:**
```json
{
  "title": "Updated Title",
  "description_md": "New description",
  "visibility": "public",
  "tags": ["new", "tags"],
  "artwork_asset_id": "uuid"
}
```

**Response:** 200 OK (updated track object)

---

### DELETE /api/v1/tracks/:id

Delete track and all associated data.

**Auth:** Required (must be track owner or admin)

**Response:** 204 No Content

**Notes:**
- Soft delete: sets deleted_at timestamp
- Removes from public listings
- Preserves analytics data
- Admin can hard delete from admin panel

---

### POST /api/v1/tracks/:id/versions

Create new version of existing track (alternate mix/master).

**Auth:** Required (must be track owner)

**Request:**
```json
{
  "original_asset_id": "uuid",
  "version_label": "Radio Edit"
}
```

**Response:** 201 Created
```json
{
  "version": {
    "id": "uuid",
    "version_label": "Radio Edit",
    "status": "pending"
  }
}
```

---

### POST /api/v1/versions/:id/stems

Upload stem for specific track version.

**Auth:** Required (must be track owner)

**Request:**
```json
{
  "role": "vocal",
  "title": "Lead Vocal",
  "asset_id": "uuid"
}
```

**Response:** 201 Created

---

### GET /api/v1/versions/:id/waveform

Get waveform JSON for player.

**Auth:** Optional

**Response:** 200 OK
```json
{
  "version": 2,
  "channels": 2,
  "sample_rate": 48000,
  "samples_per_pixel": 256,
  "bits": 8,
  "length": 240000,
  "data": [0, 45, 78, 120, ...]
}
```

---

## Playback & Social Endpoints

### GET /api/v1/stream/:version_id.m3u8

Get signed HLS playlist.

**Auth:** Optional (required for private tracks)

**Query params:**
- `format`: opus|aac|alac (default: opus)
- `sig`: signature parameter (auto-generated by API)

**Response:** 200 OK (application/vnd.apple.mpegurl)
```
#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:6.0,
segment_000.m4s
#EXTINF:6.0,
segment_001.m4s
...
```

**Notes:**
- Signed URL valid for 1 hour
- Nginx validates signature and serves from MinIO
- Segments served via `/media/hls/` path

---

### POST /api/v1/plays

Record play event for analytics.

**Auth:** Optional (anonymous plays allowed)

**Request:**
```json
{
  "track_id": "uuid",
  "ms_listened": 120000,
  "completed": false,
  "referrer": "https://example.com"
}
```

**Response:** 204 No Content

---

### POST /api/v1/comments

Create timestamped comment on track.

**Auth:** Required

**Request:**
```json
{
  "track_id": "uuid",
  "at_ms": 45000,
  "body_md": "Great drop here!",
  "parent_id": "uuid"
}
```

**Validation:**
- Body: 1-1000 characters
- at_ms: 0 to track duration
- parent_id: optional (for replies)

**Response:** 201 Created

**Rate Limiting:** 20 comments per hour per user

---

### POST /api/v1/react

Like or repost content.

**Auth:** Required

**Request:**
```json
{
  "target_type": "track",
  "target_id": "uuid",
  "kind": "like"
}
```

**Validation:**
- target_type: track|comment|playlist
- kind: like|repost
- Idempotent: duplicate reactions ignored

**Response:** 201 Created

---

### POST /api/v1/follow

Follow user.

**Auth:** Required

**Request:**
```json
{
  "user_id": "uuid"
}
```

**Response:** 201 Created

**Notes:**
- Idempotent: following twice is no-op
- Cannot follow yourself

---

## Discovery Endpoints

### GET /api/v1/search

Search across tracks, users, playlists.

**Query params:**
- `q`: search query (required, min 2 chars)
- `type`: track|playlist|user (default: all)
- `tag`: filter by tag
- `visibility`: public|unlisted (default: public only)
- `limit`: 1-100 (default: 20)
- `offset`: pagination offset (default: 0)

**Response:** 200 OK
```json
{
  "results": {
    "tracks": [ /* track objects */ ],
    "users": [ /* user objects */ ],
    "playlists": [ /* playlist objects */ ]
  },
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

**Notes:**
- Uses PostgreSQL full-text search (MVP)
- Searches: track titles, descriptions, tags, user handles/names

---

### GET /api/v1/trending

Get trending tracks.

**Query params:**
- `window`: day|week|month (default: week)
- `limit`: 1-100 (default: 20)

**Response:** 200 OK
```json
{
  "tracks": [ /* track objects with stats */ ]
}
```

**Algorithm:**
- Weighted score: plays × 1.0 + likes × 2.0 + reposts × 3.0
- Within time window only
- Cached for 15 minutes

---

### GET /api/v1/user/:handle

Get user profile.

**Response:** 200 OK
```json
{
  "user": {
    "id": "uuid",
    "handle": "artistname",
    "display_name": "Artist Name",
    "bio": "...",
    "avatar_url": "...",
    "created_at": "...",
    "is_verified": true
  },
  "stats": {
    "tracks": 42,
    "followers": 1337,
    "following": 89
  },
  "spotlight_tracks": [ /* up to 5 tracks */ ],
  "recent_tracks": [ /* 10 most recent */ ]
}
```

---

## Embed Endpoints

### GET /embed/track/:id

Server-side rendered embed page.

**Query params:**
- `theme`: dark|light (default: dark)
- `autoplay`: 0|1 (default: 0)
- `color`: hex color for accents (default: platform primary)

**Response:** 200 OK (text/html)

**Features:**
- Minimal chrome (play button, waveform, title, artist)
- No social actions (comments/likes disabled)
- CORS headers for iframe embedding
- Responsive design

---

## Admin Endpoints

### GET /api/v1/admin/jobs

Inspect job queues.

**Auth:** Required (admin only)

**Response:** 200 OK
```json
{
  "queues": [
    {
      "name": "transcode",
      "waiting": 5,
      "active": 2,
      "completed": 142,
      "failed": 3
    }
  ]
}
```

---

### POST /api/v1/admin/reindex

Rebuild search index.

**Auth:** Required (admin only)

**Response:** 202 Accepted

---

### POST /api/v1/admin/flush_cache

Clear Redis cache.

**Auth:** Required (admin only)

**Response:** 204 No Content

---

## Economics Endpoints (M5)

### POST /api/v1/contributions

Create voluntary contribution.

**Auth:** Required

**Request:**
```json
{
  "amount_cents": 1000,
  "artist_percent": 80,
  "charity_percent": 10,
  "platform_percent": 10,
  "charity_id": "uuid",
  "recurring": false
}
```

**Validation:**
- Amount: $1 - $1000
- Percentages: must sum to 100
- Charity: must be active charity

**Response:** 201 Created

---

### GET /api/v1/contributions/me

Get my contribution history.

**Auth:** Required

**Response:** 200 OK
```json
{
  "contributions": [ /* contribution objects */ ],
  "lifetime_total_cents": 5000,
  "this_month_cents": 1000
}
```

---

### GET /api/v1/charities

List active charities.

**Response:** 200 OK
```json
{
  "charities": [
    {
      "id": "uuid",
      "slug": "eff",
      "name": "Electronic Frontier Foundation",
      "description": "...",
      "website": "https://eff.org"
    }
  ]
}
```

---

## Moderation Endpoints (M5)

### POST /api/v1/reports

Report content.

**Auth:** Required

**Request:**
```json
{
  "target_type": "track",
  "target_id": "uuid",
  "reason": "copyright",
  "description": "This is my copyrighted work"
}
```

**Response:** 201 Created

---

### POST /api/v1/dmca/takedown

Submit DMCA takedown request.

**Auth:** Optional (public form)

**Request:**
```json
{
  "claimant_name": "Copyright Owner",
  "claimant_email": "owner@example.com",
  "claimant_address": "123 Main St...",
  "track_id": "uuid",
  "sworn_statement": "I swear under penalty of perjury..."
}
```

**Response:** 201 Created

**Notes:**
- Public endpoint for legal compliance
- Creates pending DMCA request
- Admin review within 24-48 hours

---

## Error Response Format

All errors return consistent JSON:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "email": ["Email already exists"],
      "handle": ["Handle must be 3-20 characters"]
    }
  }
}
```

**Error codes:**
- `VALIDATION_ERROR` (422)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `RATE_LIMIT_EXCEEDED` (429)
- `SERVER_ERROR` (500)
