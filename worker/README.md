# Worker Service

Background job processor for the self-hosted music platform.

## Overview

This service processes background jobs using BullMQ:
- Audio transcoding (HLS Opus, AAC, ALAC)
- Waveform generation
- Artwork extraction
- Loudness analysis (EBU R128)
- Analytics rollup

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Build the project:
```bash
npm run build
```

4. Start the worker:
```bash
npm start
```

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## Health Check

Health endpoint available at:
```
GET http://localhost:3001/health
```

Returns status of worker service and queue connections.

## Job Processors

### Transcode
- Converts audio to HLS formats
- Status: SKELETON (FFmpeg implementation required)

### Waveform
- Generates waveform JSON and PNG
- Status: SKELETON (audiowaveform implementation required)

### Artwork Extract
- Extracts cover art from audio files
- Status: SKELETON (FFmpeg implementation required)

### Loudness
- Performs EBU R128 loudness analysis
- Status: SKELETON (FFmpeg implementation required)

### Analytics Rollup
- Aggregates daily analytics
- Status: SKELETON (Database implementation required)
