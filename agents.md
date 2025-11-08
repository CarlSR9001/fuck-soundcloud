# Self‑Hosted Music Platform — Full Design Spec (v1)

> Goal: Ship a **SoundCloud‑class** platform you fully control (no YouTube/third‑party hosting) with **better creative features** and **zero fake stubs**. This spec is written to hand to a coding agent straight away. It includes acceptance tests, anti‑BS guardrails, and a staging plan so every milestone is actually shippable.

---

## 0) Product Principles

* **Artist‑first.** Liner notes, stems, credits, versions, and context are first‑class—not bolted on.
* **Own your media.** Files live on your VPS (object storage via MinIO), proxied by Nginx. No mystery CDNs.
* **No pretend dev.** Every endpoint lands real effects: files exist on disk, DB rows are written, streams play.
* **Performance over polish.** HLS/Opus streaming, fast search, good caching. UI clean, not ornamental.
* **Composable money.** Tips, pay‑what‑you‑want, memberships. Payment via provider adapters (Stripe now, drop‑in others later). Turn off commerce entirely if desired.
* **Single‑tenant today, multi‑user ready.** You can run it for just you; schema supports more users later.

---

## 1) Feature Parity (SoundCloud 1:1 + better)

**Core parity**

* Upload tracks (private/unlisted/public).
* Transcoding to stream formats; waveform rendering; cover art; tags/genres.
* Playlists/sets; albums/EPs; track re‑ordering; spotlight/pin on profile.
* Timestamped comments; replies; likes; reposts; follows.
* Embeddable player (your own iframe) with theme parameters.
* Search (tracks, playlists, users, tags) with filters; trending & recent.
* Share links; unlisted secret links with token.
* Stats: plays (unique/total), likes, reposts, completions, retention curve, geography, referrers.
* Account management; OAuth login (optional) + email/password.

**Better than SoundCloud**

* **Lossless uploads** with **optional lossless streaming** (HLS‑fMP4 + ALAC/FLAC for whitelisted users).
* **Stems upload & download** per track; per‑stem credits & roles (producer, writer, mixer, etc.).
* **Versioning:** alternate mixes/masters under one canonical track slug; A/B toggle in player.
* **Liner notes & session metadata:** markdown with images; instruments used; outboard chains.
* **Creator notes at timestamps:** private sticky comments visible only to you/collaborators.
* **Release manager:** schedule drops, teasers, private preview links, embargos.
* **Support:** tips, PWYW downloads, memberships for vault content; license picker (CC/All Rights/Custom).
* **Download policy:** per‑track toggles (disabled, 320kbps, original, stems) with ToS gate.
* **No‑tracking analytics mode:** privacy‑respecting (self‑hosted, no third‑party pixels).

---

## 2) Architecture

```
[Browser] — Next.js App Router (SSR/ISR) + Player (Wavesurfer.js) + WebSocket
     |                                 |
[Nginx] ─ reverse proxy ───────────────┼───────────────────────────────
     |                                 |
[API: NestJS (TS)]  — REST/WS — [Redis] (queues) — [Workers] (FFmpeg, waveform)
     |                                 |
[PostgreSQL]                       [MinIO S3] (originals, HLS segments, images)
```

* **Frontend:** Next.js 15 (TypeScript). No extra .md/.txt artifacts.
* **Backend:** NestJS (TypeScript) with REST + WebSocket gateway.
* **DB:** PostgreSQL 15.
* **Queues/Cache:** Redis 7 (BullMQ for jobs).
* **Object storage:** MinIO S3 (local disks) with bucket‑per‑type (originals, transcodes, images, waveforms, stems).
* **Media pipeline:** FFmpeg CLI via workers; `audiowaveform` for waveform JSON/PNGs.
* **Search:** PostgreSQL full‑text (MVP). Optional Meilisearch later.
* **Proxy/Static:** Nginx serves HLS segments & images; API signs time‑limited URLs.
* **Observability:** OpenTelemetry + Prometheus + Loki (MVP: structured logs + health checks).

**Containerization**: Docker Compose for dev/prod parity. Each service has its own container; persistent volumes for Postgres/MinIO; bind mounts for media if desired.

---

## 3) Media & Player

**Upload → Process → Publish**

1. Client requests S3 multipart creds from API (MinIO presigned).
2. Client uploads original file in parts; API finalizes; writes `assets` + `track_versions` rows.
3. Worker job transcodes to:

   * **HLS (fMP4/CMAF) + Opus 160 kbps** (primary).
   * **HLS AAC 256 kbps** (compatibility) — optional toggle.
   * Optional **HLS Lossless** (ALAC) for whitelisted audiences.
4. Generate **waveform JSON** (`audiowaveform`), **loudness stats** (R128), and **spectral thumbnail** (optional).
5. Extract metadata (ffprobe: duration, sample rate, channels, bitrate) + cover art.
6. Publish track: player m3u8 URL is a **signed Nginx path** valid for N minutes.

**Player (Web)**

* HLS via Media Source Extensions. Fallback to progressive MP3 if HLS unsupported.
* Waveform scrubbing; loop A‑B; playback speed; normalize loudness toggle.
* Timestamped comments + markers; hotkeys (space, J/K/L, M mute, [, ] speed).
* Version toggle (v1/v2/v3) with seamless reload and position preserving.
* Minimal embed: `https://your.site/embed/track/:id?theme=dark&autoplay=1`.

---

## 4) Data Model (primary tables)

* **users**(id, handle, display_name, email, password_hash, bio, avatar_asset_id, is_admin, created_at)
* **sessions**(id, user_id, jwt_id, expires_at)
* **tracks**(id, owner_user_id, slug, title, description_md, visibility[public|unlisted|private], release_at, artwork_asset_id, primary_version_id, created_at, updated_at)
* **track_versions**(id, track_id, version_label, original_asset_id, duration_ms, loudness_lufs, sample_rate, channels, status[pending|ready|failed], created_at)
* **assets**(id, bucket, key, size_bytes, mime, sha256, created_at)
* **transcodes**(id, track_version_id, format[hls_opus|hls_aac|hls_alac|mp3_320], playlist_asset_id, segment_prefix_key, status, created_at)
* **waveforms**(id, track_version_id, json_asset_id, png_asset_id)
* **stems**(id, track_version_id, role[vocal|drum|bass|guitar|synth|fx|other], title, asset_id)
* **credits**(id, track_id, person_name, role[writer|producer|mixer|mastering|feature|musician|other], url)
* **playlists**(id, owner_user_id, title, description_md, visibility, artwork_asset_id)
* **playlist_items**(playlist_id, track_id, position)
* **comments**(id, track_id, user_id, parent_id, at_ms, body_md, visibility, created_at)
* **reactions**(id, user_id, target_type[track|comment|playlist], target_id, kind[like|repost])
* **follows**(follower_id, followee_id, created_at)
* **tags**(id, tag)
* **track_tags**(track_id, tag_id)
* **downloads**(id, user_id, track_version_id, granted_original, granted_stems, created_at)
* **commerce** (see §10) — tips, purchases, memberships
* **analytics_play**(id, track_id, user_id nullable, ip_hash, user_agent, started_at, completed, watch_ms, referrer, country)
* **analytics_daily**(track_id, day, plays, uniques, likes, reposts, downloads)

Migrations must create indexes on: `tracks.slug`, `track_tags.tag_id`, `comments.track_id+at_ms`, `reactions.target_type+target_id`, `analytics_daily (track_id, day)`.

---

## 5) API (v1) — Required Endpoints

**Auth**

* `POST /api/v1/auth/signup` (email, handle, password) → user + session
* `POST /api/v1/auth/login` → session (rotating JWT, httpOnly cookie)
* `POST /api/v1/auth/logout`

**Upload**

* `POST /api/v1/upload/multipart/init` (filename, size, sha256) → upload_id, presigned_parts[]
* `POST /api/v1/upload/multipart/complete` (upload_id, etags[]) → asset_id
* `POST /api/v1/tracks` ({title, visibility, release_at, original_asset_id}) → track + version (status=pending) + job enqueued
* `GET /api/v1/tracks/:id` → full track JSON including ready transcodes & signed HLS playlist URL
* `PATCH /api/v1/tracks/:id` (title, desc, tags[], credits[], artwork_asset_id)
* `POST /api/v1/tracks/:id/versions` (original_asset_id, version_label) → new version + job
* `POST /api/v1/versions/:id/stems` (role, title, asset_id)
* `GET /api/v1/versions/:id/waveform` → waveform JSON

**Playback & social**

* `GET /api/v1/stream/:version_id.m3u8` → signed m3u8 (server rewrites to MinIO segments)
* `POST /api/v1/plays` ({track_id, ms_listened, completed})
* `POST /api/v1/comments` ({track_id, at_ms, body_md, parent_id})
* `POST /api/v1/react` ({target_type, target_id, kind})
* `POST /api/v1/follow` ({user_id})

**Discovery**

* `GET /api/v1/search?q=&type=track|playlist|user&tag=`
* `GET /api/v1/trending?window=day|week|month`
* `GET /api/v1/user/:handle` → profile, spotlight, tracks

**Embeds**

* `GET /embed/track/:id` (SSR page) — CORS‑safe, restricted features.

**Admin**

* `GET /api/v1/admin/jobs` — inspect queues
* `POST /api/v1/admin/reindex` — rebuild search
* `POST /api/v1/admin/flush_cache`

---

## 6) Background Jobs

* **TranscodeJob(version_id):** originals → HLS Opus/AAC (and optional ALAC). Enforce keyframe‑aligned segments; 6‑second segments; 2‑second parts.
* **WaveformJob(version_id):** `audiowaveform -b 8 -z 256` to JSON + PNG preview.
* **ArtworkExtractJob(version_id):** ffmpeg cover → 1000px JPEG + 200px thumb.
* **LoudnessJob(version_id):** EBU R128 analysis; store `integrated_lufs`.
* **AnalyticsRollupJob(day):** aggregate plays → `analytics_daily`.

**Failure policy:** retries with backoff; if still failed, `status=failed` with error string; surfaced in UI.

---

## 7) Nginx Layout

* `/` → Next.js
* `/api/` → NestJS
* `/media/hls/` → internal alias to MinIO bucket (read‑only). Requests require signed query param `sig` from API; Nginx `map` + `auth_request` or `secure_link` module to validate.
* `/images/` → MinIO public bucket for artwork/waveforms PNGs
* Gzip/HTTP3/Cache‑Control for static assets and segments.

TLS: LetsEncrypt (automatic renewal). Rate limits on auth and comment endpoints.

---

## 8) Frontend UX

* **Home**: hero (latest release), feed (by recency/trending), quick filters (tag chips).
* **Track page**: large player with waveform; version switch; credits & liner notes tabs; stems panel (locked behind purchase/membership if enabled); timestamped comments; related tracks.
* **Profile**: banner, avatar, bio, spotlight tracks, discography grid, playlists.
* **Upload manager**: drag‑drop, progress bars, per‑track settings, schedule releases.
* **Embed**: minimal chrome; theme params; responsive.
* **Accessibility**: ARIA labels, keyboard controls, high‑contrast theme toggle.

---

## 9) Security & Privacy

* JWT with rotation; httpOnly + SameSite=strict; CSRF tokens for forms.
* Signed HLS playlists + short‑lived segment access; original downloads gated by policy + signed links.
* Virus scan (optional ClamAV) on originals/stems.
* Rate limit login/comment/react; IP hashing for analytics.
* Content moderation toggles (auto‑hide first‑time commenter until approved).

---

## 10) Commerce (optional module)

**Provider adapter** with unified interface:

* Default: **Stripe** (Tips, PWYW, membership tiers, one‑off purchases for originals/stems).
* Later adapters: PayPal, Lemonsqueezy, BTCPay. All off by default.

**Tables**

* **tips**(id, user_id nullable, track_id nullable, amount_cents, provider, intent_id, status)
* **purchases**(id, user_id, track_version_id or stems_bundle_id, amount_cents, license[personal|commercial], provider, status)
* **memberships**(id, user_id, tier_id, status, current_period_end)
* **tiers**(id, slug, title, price_cents, perks_json)

**Gates**

* Download and stems endpoints check entitlement snapshot at request time.

---

## 11) Observability, Backups, Ops

* Health endpoints: `/api/v1/health` (DB/Redis/MinIO checks) and `/api/v1/ready`.
* Structured logs (JSON) with request ids, job ids.
* Nightly DB dumps; MinIO versioning + weekly archive; restore playbook tested.
* Admin UI for job queue, failed jobs, storage usage per bucket.

---

## 12) Anti‑BS Guardrails (for the coding agent)

1. **No fake stubs.** If a feature is not implemented, stop and report “UNIMPLEMENTED: <feature>”. Do **not** simulate success.
2. **Files only necessary to run.** Produce a single `README.md` and code. No extra `.md`/`.txt` docs.
3. **E2E proof required** for each milestone: a scripted flow uploads a file and plays it through the web player.
4. **Real storage writes only.** After upload, the file must exist in MinIO; after transcode, HLS manifests/segments must be present and playable.
5. **Deterministic seeds & versions** in `docker-compose.yml` for reproducible builds.
6. **Migrations first.** DB schema created via migration; app fails loud if migration not applied.
7. **Exit on error.** CI must fail if any step in the E2E script fails.

**Deliverables checklist**

* `docker-compose.yml` (nginx, api, web, workers, postgres, redis, minio, createbuckets)
* `nginx.conf`, `api/` (NestJS), `web/` (Next.js), `worker/` (Node worker)
* `prisma/` or `typeorm/` migrations
* `packages/shared/` for types (track, version, asset, user)
* `scripts/e2e.sh` (see §13)
* **Only one** `README.md` with setup/run steps. Nothing else.

---

## 13) Acceptance Tests (E2E)

**`scripts/e2e.sh` (pseudo)**

```
# 1) Boot stack
./scripts/dev_up.sh

# 2) Create user via API
curl -s -X POST http://localhost:8080/api/v1/auth/signup -d '{...}'

# 3) Multipart upload (3 parts) to MinIO using presigned URLs
# 4) Create track from asset_id -> expect status=pending
# 5) Poll version until status=ready; verify MinIO has playlist + segments
# 6) Fetch /embed/track/:id and parse m3u8 URL
# 7) Use ffmpeg to read m3u8 for 10s to validate playback
# 8) Post comment at timestamp; verify retrieval
# 9) Record play; verify analytics_daily increments after rollup job
```

**Pass criteria:** all steps return 2xx; media files present; ffmpeg can play the stream.

---

## 14) Roadmap (Ship in Milestones)

**M0 — Bootstrap (2–3 days)**

* Dockerized Postgres/Redis/MinIO/Nginx skeleton; NestJS + Next.js hello world; health checks.

**M1 — Upload → Stream (1 week)**

* Multipart upload; track/version rows; FFmpeg HLS (Opus), waveform JSON; signed playlists; working web player; E2E script green.

**M2 — Profile & Metadata (1 week)**

* Profiles; tags; artwork; credits; playlists; spotlight; search (PG FTS).

**M3 — Social & Analytics (1 week)**

* Comments w/ timestamps; likes/reposts/follows; analytics events + daily rollup; embed player.

**M4 — Commerce & Extras (1–2 weeks)**

* Tips/PWYW/memberships (Stripe adapter); stems; downloads policy; release scheduling; versioning UI.

---

## 15) Config & Secrets

* `.env` values for DB URI, Redis, MinIO (access/secret), JWT secrets, Stripe keys (if enabled).
* `SECURE_LINK_SECRET` for Nginx signed URLs; `HLS_TOKEN_TTL_SECONDS`.

---

## 16) Stretch Goals (Post‑launch)

* Meilisearch for fuzzy search; recommendation based on co‑listens.
* Web audio visualizer; Dolby Atmos flag; ISRC/UPC metadata;
* Offline prefetch (PWA).
* Mobile app wrapper (Capacitor) calling same API.

---

## 17) Hand‑off Prompt for the Coding Agent (paste as‑is)

```
You are building the platform described in “Self‑Hosted Music Platform — Full Design Spec (v1)”.

Hard rules:
- Implement only real functionality—no stubs or simulated responses. If something is not implemented, STOP and print: UNIMPLEMENTED: <feature>.
- Produce code + ONE README.md only. Do NOT add other .md/.txt files.
- Provide docker-compose with services: nginx, api, web, worker, postgres, redis, minio, createbuckets.
- Include DB migrations and seed. The app must boot in one command and pass the E2E script.
- Use NestJS (TypeScript) for API, Next.js for web, PostgreSQL, Redis, MinIO, BullMQ, FFmpeg, audiowaveform.
- Implement multipart uploads to MinIO, HLS (Opus) transcodes, waveform JSON, signed HLS playlists via Nginx secure_link, and a working web player with waveform + timestamped comments.
- Add scripts: scripts/dev_up.sh, scripts/e2e.sh. The E2E script must actually upload a real file and confirm playback via ffmpeg reading the m3u8.
- DO NOT invent success. Fail loudly with actionable logs.
```

---

## 18) Definition of Done

* Fresh clone → `docker compose up` → open `/` → upload WAV → after processing, the embed and full page both play HLS Opus with waveform, comments work, and daily analytics roll up.
* No extra documents besides README.md.
* E2E proof green in CI. Backups tested once.

---

## 19) Risks & Mitigations

* **Transcode CPU load** → queue concurrency caps; Opus first, AAC optional; batch night jobs for heavy backfills.
* **Disk space** → MinIO lifecycle + segment pruning for old versions; S3 Glacier‑style archive later.
* **Abuse** → rate limits; moderation toggles; reCAPTCHA (self‑host alternatives) if opened to the public.
* **Browser HLS quirks** → hls.js with MSE fallback; progressive MP3 fallback.

---

## 20) License & Legal

* Upload license picker per track; default All Rights Reserved. Liner notes support CC text snippets.
* Terms/Privacy pages (single pages in Next.js). No third‑party trackers by default.

---

**That’s the whole map.** Build M1 cleanly and you already have a real SoundCloud‑grade spine—then stack the fun bits (versions, liner notes, stems, commerce) as vertical slices. Ship fast, celebrate the music.
