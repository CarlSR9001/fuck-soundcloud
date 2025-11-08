# Music Platform API

NestJS-based REST API for the self-hosted music platform.

## Structure

```
src/
├── config/              # Modular configuration files
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── storage.config.ts
│   ├── jwt.config.ts
│   └── queue.config.ts
├── common/              # Shared utilities
│   ├── filters/         # Exception filters
│   ├── interceptors/    # Response transformers
│   └── middleware/      # Request middleware
├── modules/             # Feature modules
│   ├── health/          # Health checks
│   ├── auth/            # Authentication
│   ├── upload/          # File upload
│   ├── tracks/          # Track management
│   └── users/           # User management
├── app.module.ts        # Root module
└── main.ts              # Bootstrap file
```

## Setup

1. Copy `.env.example` to `.env` and configure
2. Install dependencies: `npm install`
3. Run: `npm run start:dev`

## API Endpoints

### Health
- `GET /api/v1/health` - Full health check
- `GET /api/v1/health/ready` - Readiness probe

### Auth (skeleton)
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`

### Upload (skeleton)
- `POST /api/v1/upload/multipart/init`
- `POST /api/v1/upload/multipart/complete`

### Tracks (skeleton)
- `POST /api/v1/tracks`
- `GET /api/v1/tracks/:id`
- `PATCH /api/v1/tracks/:id`
- `POST /api/v1/tracks/:id/versions`

### Users (skeleton)
- `GET /api/v1/users/:handle`

## Notes

- All module skeletons return UNIMPLEMENTED messages
- Business logic will be added by subsequent agents
- All files follow the small-file principle (<200 lines)
- Barrel exports (index.ts) used throughout
