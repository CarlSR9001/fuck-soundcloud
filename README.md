# Self-Hosted Music Platform

A SoundCloud-class platform you fully control with better creative features and zero fake stubs.

## Features

- **Artist-first**: Liner notes, stems, credits, versions, and context are first-class
- **Own your media**: Files live on your VPS (MinIO object storage), proxied by Nginx
- **No pretend dev**: Every endpoint lands real effects
- **Performance over polish**: HLS/Opus streaming, fast search, good caching
- **Ethical economics**: Voluntary contributions with transparent artist payouts and charity integration
- **Single-tenant ready**: Run it for yourself, schema supports multi-user later

## Tech Stack

- **Frontend**: Next.js 15 (TypeScript) with App Router
- **Backend**: NestJS (TypeScript) REST + WebSocket
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7 with BullMQ
- **Storage**: MinIO S3-compatible object storage
- **Media**: FFmpeg + audiowaveform for transcoding
- **Proxy**: Nginx reverse proxy

## Quick Start

### Prerequisites

- Docker and Docker Compose
- 4GB+ RAM recommended
- 20GB+ disk space

### One-Command Startup

```bash
./scripts/dev_up.sh
```

This will:
1. Start all Docker containers (nginx, api, web, worker, postgres, redis, minio)
2. Create MinIO buckets (originals, transcodes, images, waveforms, stems)
3. Run database migrations (when implemented)
4. Start services in development mode with hot-reload

### Access Points

- **Web App**: http://localhost:8080
- **API**: http://localhost:8080/api/v1
- **MinIO Console**: http://localhost:9001 (user: `minioadmin`, password: see `.env`)

### Health Checks

- API Health: http://localhost:8080/api/v1/health
- API Ready: http://localhost:8080/api/v1/health/ready
- Web Health: http://localhost:8080/health

### Shutdown

```bash
./scripts/dev_down.sh
```

## Project Structure

```
├── api/                    # NestJS API service
│   ├── src/
│   │   ├── config/        # Modular configuration (DB, Redis, MinIO, JWT, Queue)
│   │   ├── common/        # Middleware, filters, interceptors
│   │   ├── modules/       # Feature modules (auth, upload, tracks, users, health)
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
│
├── web/                    # Next.js 15 web app
│   ├── app/               # App Router pages
│   ├── components/        # Reusable components
│   ├── config/            # Branding system (theme, assets, brand identity)
│   ├── public/brand/      # Logos, icons, illustrations
│   └── package.json
│
├── worker/                 # Background job processor
│   ├── src/
│   │   ├── config/        # Queue, storage, database config
│   │   ├── processors/    # FFmpeg transcoding, waveform, artwork, analytics
│   │   ├── queue/         # BullMQ queue manager
│   │   └── main.ts
│   └── package.json
│
├── packages/
│   └── shared/            # Shared TypeScript types
│       ├── src/
│       │   ├── types/     # Domain entities (User, Track, Asset, etc.)
│       │   └── jobs/      # Job type definitions
│       └── package.json
│
├── nginx/                  # Nginx reverse proxy config
├── scripts/               # Development scripts
├── docker-compose.yml     # Full stack orchestration
├── .env.example           # Environment variables template
└── agents.md              # Development spec and log
```

## Development

### Environment Variables

Copy `.env.example` and customize:

```bash
cp .env.example .env
```

### Install Dependencies

```bash
# Shared types (build first)
cd packages/shared && npm install && npm run build

# API service
cd ../../api && npm install

# Web service
cd ../web && npm install

# Worker service
cd ../worker && npm install
```

### Running Services Individually

```bash
# API (development mode with hot-reload)
cd api && npm run start:dev

# Web (development mode)
cd web && npm run dev

# Worker (development mode)
cd worker && npm run dev
```

## Modular Branding System

All branding elements are centralized in `web/config/`:

- **branding.ts**: Brand name, tagline, metadata, contact
- **theme.ts**: Colors, typography, spacing (Year 3035 aesthetic)
- **assets.ts**: Logo paths, icons, illustrations

To rebrand: Edit these config files. Zero hardcoded values in components.

### Year 3035 Aesthetic

- Timeless simplicity over complexity
- Spacious layouts with intentional negative space
- Clean sans-serif typography (Inter)
- Earth-inspired, sophisticated color palette
- NO sci-fi clichés (no "neural", "quantum", "cyber")
- Calm confidence

## Architecture Decisions

- **Small, modular files**: All files <200 lines for better collaboration
- **No fake stubs**: Unimplemented features throw errors, not simulated responses
- **TypeScript everywhere**: Strict mode, path aliases, shared types
- **Barrel exports**: Clean imports via index.ts files
- **Multi-stage Docker builds**: Optimized production images, dev hot-reload
- **Health checks**: All services include proper health endpoints

## Current Status

✅ **Completed Milestones:**
- **M0 - Bootstrap**: Full Docker infrastructure with 8 services
- **M1 - Upload → Stream**: Multipart upload, HLS transcoding (Opus), waveform generation, signed URLs, working player
- **M2 - Profile & Metadata**: Auth (JWT), profiles, tags, credits, playlists, search (PostgreSQL FTS)
- **M3 - Social & Analytics**: Comments with timestamps, likes/reposts/follows, analytics, embed player
- **M5 - Economics & Moderation**: Voluntary contributions (Humble Bundle model), DMCA compliance, content moderation, audio fingerprinting, artist verification

✅ **Production Ready For:**
- Uploading and streaming music (HLS/Opus)
- User authentication and profiles
- Social features (comments, likes, follows)
- Search and discovery
- Content moderation and legal compliance
- Ethical contribution-based economics with transparent artist payouts

🔜 **Next (M4 - Creative Tools):**
- Stems upload and download system
- Track versioning UI with A/B toggle
- Release scheduling and embargos
- Liner notes with markdown support
- Lossless streaming option (HLS + ALAC)
- Per-track download policies

## Documentation

- **Full Spec**: See `agents.md` for complete technical specification
- **Development Log**: Track progress in `agents.md` Development Log section

## License

All Rights Reserved (configurable per-track in application)
