# Shared Types Package

Cross-service TypeScript types and interfaces for the self-hosted music platform.

## Overview

This package provides shared type definitions used across all services (API, Worker, Web).

## Structure

```
src/
├── types/              # Entity and domain types
│   ├── user.types.ts
│   ├── session.types.ts
│   ├── asset.types.ts
│   ├── track.types.ts
│   ├── track-version.types.ts
│   ├── transcode.types.ts
│   ├── waveform.types.ts
│   ├── playlist.types.ts
│   ├── comment.types.ts
│   ├── reaction.types.ts
│   ├── stem.types.ts
│   └── credit.types.ts
└── jobs/               # Background job types
    ├── transcode.job.ts
    ├── waveform.job.ts
    ├── artwork-extract.job.ts
    ├── loudness.job.ts
    └── analytics-rollup.job.ts
```

## Usage

Install in other packages:

```json
{
  "dependencies": {
    "@soundcloud-clone/shared": "file:../packages/shared"
  }
}
```

Import types:

```typescript
import {
  User,
  Track,
  TrackVersion,
  TranscodeJobData,
  TRANSCODE_JOB,
} from '@soundcloud-clone/shared';
```

## Building

```bash
npm run build
```

This compiles TypeScript to JavaScript with declaration files in `dist/`.

## Development

Watch mode for auto-rebuild:

```bash
npm run watch
```

## Design Principles

- **Small files**: Each type/interface in its own file (§21 compliance)
- **Barrel exports**: Clean imports via index.ts files
- **No implementation**: Pure type definitions only
- **Shared enums**: Constants shared across services
