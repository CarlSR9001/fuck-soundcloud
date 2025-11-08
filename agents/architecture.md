# Architecture & System Design

**Purpose:** Complete technical architecture, data models, and media processing specifications for the self-hosted music platform.

**Prerequisites:** Read this first before implementing any backend services, database schemas, or media processing workflows.

---

## System Architecture

```
[Browser] — Next.js App Router (SSR/ISR) + Player (Wavesurfer.js) + WebSocket
     |                                 |
[Nginx] ─ reverse proxy ───────────────┼───────────────────────────────
     |                                 |
[API: NestJS (TS)]  — REST/WS — [Redis] (queues) — [Workers] (FFmpeg, waveform)
     |                                 |
[PostgreSQL]                       [MinIO S3] (originals, HLS segments, images)
```

### Technology Stack

* **Frontend:** Next.js 15 (TypeScript). No extra .md/.txt artifacts.
* **Backend:** NestJS (TypeScript) with REST + WebSocket gateway.
* **DB:** PostgreSQL 15.
* **Queues/Cache:** Redis 7 (BullMQ for jobs).
* **Object storage:** MinIO S3 (local disks) with bucket‑per‑type (originals, transcodes, images, waveforms, stems).
* **Media pipeline:** FFmpeg CLI via workers; `audiowaveform` for waveform JSON/PNGs.
* **Search:** PostgreSQL full‑text (MVP). Optional Meilisearch later.
* **Proxy/Static:** Nginx serves HLS segments & images; API signs time‑limited URLs.
* **Observability:** OpenTelemetry + Prometheus + Loki (MVP: structured logs + health checks).

### Containerization

Docker Compose for dev/prod parity. Each service has its own container; persistent volumes for Postgres/MinIO; bind mounts for media if desired.

**Services:**
- `nginx` - Reverse proxy and media serving
- `api` - NestJS backend API
- `web` - Next.js frontend
- `worker` - Background job processors
- `postgres` - PostgreSQL database
- `redis` - Redis for queues and caching
- `minio` - S3-compatible object storage
- `createbuckets` - MinIO bucket initialization

---

## Data Model (Primary Tables)

### Core Entities

**users**
```
id, handle, display_name, email, password_hash, bio, avatar_asset_id,
is_admin, is_banned, created_at
```

**sessions**
```
id, user_id, jwt_id, expires_at
```

**tracks**
```
id, owner_user_id, slug, title, description_md, visibility[public|unlisted|private],
release_at, artwork_asset_id, primary_version_id, created_at, updated_at
```

**track_versions**
```
id, track_id, version_label, original_asset_id, duration_ms, loudness_lufs,
sample_rate, channels, status[pending|ready|failed], created_at
```

**assets**
```
id, bucket, key, size_bytes, mime, sha256, created_at
```

**transcodes**
```
id, track_version_id, format[hls_opus|hls_aac|hls_alac|mp3_320],
playlist_asset_id, segment_prefix_key, status, created_at
```

**waveforms**
```
id, track_version_id, json_asset_id, png_asset_id
```

### Creative Tools

**stems**
```
id, track_version_id, role[vocal|drum|bass|guitar|synth|fx|other], title, asset_id
```

**credits**
```
id, track_id, person_name, role[writer|producer|mixer|mastering|feature|musician|other], url
```

### Discovery & Organization

**playlists**
```
id, owner_user_id, title, description_md, visibility, artwork_asset_id
```

**playlist_items**
```
playlist_id, track_id, position
```

**tags**
```
id, tag
```

**track_tags**
```
track_id, tag_id
```

### Social

**comments**
```
id, track_id, user_id, parent_id, at_ms, body_md, visibility, created_at
```

**reactions**
```
id, user_id, target_type[track|comment|playlist], target_id, kind[like|repost]
```

**follows**
```
follower_id, followee_id, created_at
```

### Analytics

**downloads**
```
id, user_id, track_version_id, granted_original, granted_stems, created_at
```

**analytics_play**
```
id, track_id, user_id nullable, ip_hash, user_agent, started_at,
completed, watch_ms, referrer, country
```

**analytics_daily**
```
track_id, day, plays, uniques, likes, reposts, downloads
```

### Economics & Moderation (M5)

**contributions**
```
id, user_id, amount_cents, artist_percent, charity_percent, platform_percent,
charity_id, recurring, status, payment_intent_id
```

**charities**
```
id, slug, name, description, website, is_active
```

**artist_payouts**
```
id, artist_id, period_start, period_end, total_cents, contribution_count,
listener_count, status
```

**reports**
```
id, reporter_id, target_type, target_id, reason, description, status,
reviewed_by, reviewed_at
```

**strikes**
```
id, user_id, reason, evidence_url, admin_id, created_at
```

**copyright_attestations**
```
id, track_id, user_id, ip_address, attestation_text, created_at
```

**audio_fingerprints**
```
id, track_version_id, fingerprint_hash, chromaprint_data, created_at
```

**artist_verifications**
```
id, user_id, method[domain|social|spotify|bandcamp|manual],
verification_data, status, verified_at
```

**dmca_requests**
```
id, claimant_name, claimant_email, claimant_address, track_id,
sworn_statement, status, processed_by, processed_at
```

### Required Indexes

Migrations must create indexes on:
- `tracks.slug`
- `track_tags.tag_id`
- `comments.track_id+at_ms`
- `reactions.target_type+target_id`
- `analytics_daily (track_id, day)`
- `follows (follower_id, followee_id)`
- `audio_fingerprints.fingerprint_hash`

---

## Media & Player

### Upload → Process → Publish Flow

1. **Client requests S3 multipart creds** from API (MinIO presigned).
2. **Client uploads original file** in parts; API finalizes; writes `assets` + `track_versions` rows.
3. **Worker job transcodes** to:
   - **HLS (fMP4/CMAF) + Opus 160 kbps** (primary).
   - **HLS AAC 256 kbps** (compatibility) — optional toggle.
   - Optional **HLS Lossless** (ALAC) for whitelisted audiences.
4. **Generate waveform JSON** (`audiowaveform`), **loudness stats** (R128), and **spectral thumbnail** (optional).
5. **Extract metadata** (ffprobe: duration, sample rate, channels, bitrate) + cover art.
6. **Publish track:** player m3u8 URL is a **signed Nginx path** valid for N minutes.

### Transcode Requirements

- **Keyframe-aligned segments** (6-second segments, 2-second parts)
- **fMP4/CMAF format** for HLS (better browser compatibility than TS)
- **Opus codec** at 160 kbps for primary streams (superior quality/size)
- **AAC codec** at 256 kbps for compatibility fallback (optional)
- **ALAC codec** for lossless streams (whitelisted users only)
- **Segment naming:** `{version_id}/segment_{index}.m4s`
- **Playlist naming:** `{version_id}/playlist.m3u8`

### Waveform Generation

- **Tool:** `audiowaveform -b 8 -z 256`
- **Output:** JSON (for player scrubbing) + PNG preview (200x60px)
- **Store:** Both files in MinIO `waveforms` bucket
- **Link:** Via `waveforms` table with asset references

### Loudness Analysis

- **Standard:** EBU R128 integrated loudness
- **Tool:** FFmpeg ebur128 filter
- **Storage:** `loudness_lufs` column in `track_versions`
- **Use:** Optional normalization toggle in player

### Cover Art Processing

- **Extraction:** FFmpeg from audio file metadata
- **Sizes:** 1000x1000px JPEG (full) + 200x200px (thumbnail)
- **Fallback:** Default platform artwork if none embedded
- **Storage:** MinIO `images` bucket

### Player Technical Requirements

**Core Playback:**
- HLS via Media Source Extensions (MSE)
- Fallback to progressive MP3 if HLS unsupported
- Adaptive bitrate switching (when multiple qualities available)
- Seamless format switching (Opus ↔ AAC ↔ ALAC)

**Waveform Features:**
- Scrubbing with visual feedback
- Loop A‑B section
- Timestamped markers (comments)
- Zoom in/out capability

**Playback Controls:**
- Speed adjustment (0.5x to 2.0x)
- Loudness normalization toggle
- Version toggle (v1/v2/v3) with position preservation
- Keyboard shortcuts (space, J/K/L, M mute, [, ] speed)

**Embedding:**
- Minimal embed URL: `https://your.site/embed/track/:id?theme=dark&autoplay=1`
- CORS-safe implementation
- Restricted features (no social actions in embed)
- Theme parameters: dark/light, accent color

---

## MinIO Bucket Structure

```
originals/           # Original uploaded files (WAV, FLAC, MP3, etc.)
  └── {asset_id}.{ext}

transcodes/          # HLS playlists and segments
  └── {version_id}/
      ├── playlist_opus.m3u8
      ├── playlist_aac.m3u8  (optional)
      ├── playlist_alac.m3u8 (optional)
      ├── segment_000.m4s
      ├── segment_001.m4s
      └── ...

waveforms/          # Waveform data files
  ├── {version_id}.json
  └── {version_id}.png

images/             # Artwork and thumbnails
  ├── artwork_{asset_id}_full.jpg
  └── artwork_{asset_id}_thumb.jpg

stems/              # Individual track stems
  └── {stem_id}.{ext}
```

---

## Database Migration Strategy

1. **Migrations first.** DB schema created via migration; app fails loud if migration not applied.
2. **Use TypeORM or Prisma** for migration management
3. **Seed data** for initial charities, default system user
4. **Version control** all migrations
5. **Rollback strategy** documented for each migration
6. **Test migrations** in CI before deployment

### Initial Seed Data

**Charities:**
1. Electronic Frontier Foundation (EFF)
2. Creative Commons
3. Internet Archive
4. Wikimedia Foundation

**System User:**
- Handle: `system`
- Display name: "System"
- Used for automated actions (DMCA takedowns, moderation)

---

## Performance Considerations

### Database

- **Connection pooling:** Min 5, Max 20 connections
- **Query optimization:** Explain analyze for N+1 queries
- **Materialized views:** For trending/analytics queries
- **Partitioning:** `analytics_play` by month (future optimization)

### Caching Strategy

- **Redis caching:** User sessions, trending tracks, homepage feed
- **CDN caching:** Static assets, waveform images, artwork
- **Nginx caching:** HLS segments (short TTL)
- **Database query cache:** Frequent read queries

### Media Storage

- **Disk space planning:** ~100MB per track (original + transcodes)
- **Lifecycle policies:** Archive old versions after 1 year
- **Compression:** Gzip for JSON waveforms
- **Deduplication:** Audio fingerprinting prevents duplicate uploads

---

## Scalability Path

**Current (MVP):**
- Single VPS (8GB RAM, 4 CPU cores)
- All services on one machine
- MinIO on local disk

**Growth (100+ users):**
- Separate worker nodes
- External S3 (AWS/Backblaze) instead of MinIO
- Read replicas for PostgreSQL
- Redis cluster for job queues

**Scale (1000+ users):**
- Multi-region deployment
- CDN for media delivery
- Meilisearch for advanced search
- Separate analytics database
