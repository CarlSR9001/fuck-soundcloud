# Operations, Deployment & Monitoring

**Purpose:** Production deployment procedures, Nginx configuration, monitoring setup, backup strategies, and operational runbooks.

**Prerequisites:**
- Read `architecture.md` for system components
- Read `security.md` for TLS/secrets management
- Read `workers.md` for job queue monitoring

---

## Deployment Guide

### Prerequisites

**VPS Requirements:**
- OS: Ubuntu 22.04 LTS or Debian 12
- RAM: 8GB minimum (16GB recommended)
- CPU: 4 cores minimum
- Disk: 100GB minimum (SSD recommended)
- Bandwidth: 1TB/month minimum

**Domain setup:**
- Domain name (e.g., `yoursite.com`)
- DNS A record pointing to VPS IP
- DNS AAAA record for IPv6 (optional)

**Initial VPS setup:**
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install certbot for SSL
apt install certbot -y
```

---

### First-Time Deployment

**1. Clone repository:**
```bash
git clone https://github.com/yourusername/music-platform.git
cd music-platform
```

**2. Configure environment:**
```bash
cp .env.example .env
nano .env
```

**Environment variables to set:**
```bash
# Domain
DOMAIN=yoursite.com

# Database
DATABASE_URL=postgresql://postgres:CHANGE_ME@postgres:5432/music
POSTGRES_PASSWORD=CHANGE_ME

# Redis
REDIS_URL=redis://redis:6379

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=CHANGE_ME
MINIO_ENDPOINT=minio:9000

# JWT
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h

# Nginx signed URLs
SECURE_LINK_SECRET=$(openssl rand -hex 32)

# Stripe (M5)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Analytics
IP_HASH_SALT=$(openssl rand -hex 32)

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@yoursite.com
SMTP_PASS=password
```

**3. Obtain SSL certificate:**
```bash
# Stop Nginx if running
docker compose stop nginx

# Get certificate
certbot certonly --standalone -d yoursite.com -d www.yoursite.com

# Certificates will be in /etc/letsencrypt/live/yoursite.com/
```

**4. Configure Nginx:**
```bash
# Update nginx/nginx.conf with your domain
sed -i 's/your.site/yoursite.com/g' nginx/nginx.conf

# Symlink certificates
mkdir -p nginx/ssl
ln -s /etc/letsencrypt/live/yoursite.com/fullchain.pem nginx/ssl/
ln -s /etc/letsencrypt/live/yoursite.com/privkey.pem nginx/ssl/
```

**5. Start services:**
```bash
docker compose up -d
```

**6. Run database migrations:**
```bash
docker compose exec api npm run migrate
```

**7. Seed initial data:**
```bash
docker compose exec api npm run seed
```

**8. Verify deployment:**
```bash
# Check services are running
docker compose ps

# Check health endpoints
curl https://yoursite.com/api/v1/health
curl http://localhost:3001/health  # Worker health

# Run E2E test
./scripts/e2e.sh
```

---

## Nginx Configuration

### Main Config

**File:** `nginx/nginx.conf`

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/vnd.apple.mpegurl;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=comment:10m rate=20r/h;

    # Upstream servers
    upstream api {
        server api:3000;
    }

    upstream web {
        server web:3001;
    }

    upstream minio {
        server minio:9000;
    }

    # HTTP → HTTPS redirect
    server {
        listen 80;
        listen [::]:80;
        server_name yoursite.com www.yoursite.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name yoursite.com www.yoursite.com;

        # SSL
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # HSTS
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Security headers
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # CSP
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' blob:; connect-src 'self' wss://yoursite.com;" always;

        # Max upload size
        client_max_body_size 500M;

        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Auth endpoints (stricter rate limit)
        location /api/v1/auth/ {
            limit_req zone=auth burst=3 nodelay;
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Comment endpoints (rate limited)
        location /api/v1/comments {
            limit_req zone=comment burst=5 nodelay;
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # HLS media (signed URLs)
        location /media/hls/ {
            # Secure link validation
            secure_link $arg_sig,$arg_expires;
            secure_link_md5 "$secure_link_expires$uri $secure_link_secret";

            if ($secure_link = "") { return 403; }
            if ($secure_link = "0") { return 410; }

            # Proxy to MinIO
            proxy_pass http://minio/transcodes/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;

            # Caching
            proxy_cache_valid 200 1h;
            add_header X-Cache-Status $upstream_cache_status;
        }

        # Images (public, cached)
        location /images/ {
            proxy_pass http://minio/images/;
            proxy_http_version 1.1;
            expires 7d;
            add_header Cache-Control "public, immutable";
        }

        # Waveforms (public, cached)
        location /waveforms/ {
            proxy_pass http://minio/waveforms/;
            proxy_http_version 1.1;
            expires 7d;
            add_header Cache-Control "public, immutable";
        }

        # Next.js web app (default)
        location / {
            proxy_pass http://web;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### Signed URL Configuration

**secure_link module:**
```nginx
# In main nginx.conf
http {
    # Secret for signing URLs (matches API env var)
    map $arg_sig $secure_link_secret {
        default "your-secure-link-secret";
    }
}

# In location /media/hls/
secure_link $arg_sig,$arg_expires;
secure_link_md5 "$secure_link_expires$uri $secure_link_secret";

if ($secure_link = "") { return 403; }  # Missing signature
if ($secure_link = "0") { return 410; }  # Expired
```

**API signing function:**
```typescript
import { createHash } from 'crypto';

function signUrl(path: string, expiresInSeconds: number): string {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const secret = process.env.SECURE_LINK_SECRET;

  // MD5(expires + path + secret)
  const hash = createHash('md5')
    .update(`${expires}${path} ${secret}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${path}?sig=${hash}&expires=${expires}`;
}

// Usage
const signedUrl = signUrl('/media/hls/version-123/playlist.m3u8', 3600);
// Returns: /media/hls/version-123/playlist.m3u8?sig=abc123&expires=1699545600
```

---

## Monitoring & Observability

### Health Checks

**API health endpoint:**
```typescript
// api/src/health/health.controller.ts
@Get('/health')
async health() {
  const checks = await Promise.all([
    this.checkDatabase(),
    this.checkRedis(),
    this.checkMinIO(),
  ]);

  const allHealthy = checks.every((c) => c.healthy);

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  };
}

private async checkDatabase(): Promise<HealthCheck> {
  try {
    await this.db.raw('SELECT 1');
    return { service: 'database', healthy: true };
  } catch (error) {
    return { service: 'database', healthy: false, error: error.message };
  }
}
```

**Worker health endpoint:**
```typescript
// worker/src/health/health-check.ts
export async function healthCheck() {
  const queues = ['transcode', 'waveform', 'artwork-extract', 'loudness', 'analytics-rollup'];
  const stats = {};

  for (const queueName of queues) {
    const queue = getQueue(queueName);
    const counts = await queue.getJobCounts();

    stats[queueName] = {
      waiting: counts.waiting,
      active: counts.active,
      failed: counts.failed,
    };
  }

  const totalFailed = Object.values(stats).reduce((sum, q: any) => sum + q.failed, 0);
  const status = totalFailed > 100 ? 'unhealthy' : 'healthy';

  return { status, queues: stats };
}
```

**Docker healthchecks:**
```yaml
# docker-compose.yml
services:
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  worker:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Structured Logging

**Winston logger configuration:**
```typescript
// api/src/logger/logger.config.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'api',
    environment: process.env.NODE_ENV,
  },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Usage
logger.info('Track created', {
  track_id: track.id,
  user_id: userId,
  title: track.title,
});

logger.error('Upload failed', {
  error: error.message,
  stack: error.stack,
  asset_id: assetId,
});
```

**Log aggregation (Loki):**
```yaml
# docker-compose.yml
services:
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
      - loki-data:/loki

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - /var/log:/var/log
      - ./promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
```

### Metrics (Prometheus)

**Expose metrics:**
```typescript
// api/src/metrics/metrics.controller.ts
import { register, Counter, Histogram } from 'prom-client';

// Define metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Middleware to track requests
export function metricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode,
    });

    httpRequestDuration.observe(
      { method: req.method, route: req.route?.path || req.path },
      duration
    );
  });

  next();
}

// Metrics endpoint
@Get('/metrics')
async metrics() {
  return register.metrics();
}
```

**Prometheus config:**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['api:3000']

  - job_name: 'worker'
    static_configs:
      - targets: ['worker:3001']
```

### Dashboards (Grafana)

**Docker Compose:**
```yaml
services:
  grafana:
    image: grafana/grafana:10.0.0
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
```

**Key dashboards:**
1. **API Performance:** Request rate, latency, error rate
2. **Worker Status:** Queue depth, job duration, failure rate
3. **System Resources:** CPU, RAM, disk usage
4. **Business Metrics:** Uploads/day, plays/day, new users

---

## Backup Strategy

### Database Backups

**Automated nightly backups:**
```bash
#!/bin/bash
# scripts/backup-db.sh

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="music_db_${DATE}.sql.gz"

# Create backup
docker compose exec -T postgres pg_dump -U postgres music | gzip > "${BACKUP_DIR}/${FILENAME}"

# Keep only last 30 days
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${FILENAME}"
```

**Cron schedule:**
```bash
# Run nightly at 2 AM
0 2 * * * /path/to/scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

**Restore procedure:**
```bash
#!/bin/bash
# scripts/restore-db.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-db.sh <backup-file.sql.gz>"
  exit 1
fi

# Stop services
docker compose stop api worker

# Drop and recreate database
docker compose exec postgres psql -U postgres -c "DROP DATABASE music;"
docker compose exec postgres psql -U postgres -c "CREATE DATABASE music;"

# Restore
gunzip < "$BACKUP_FILE" | docker compose exec -T postgres psql -U postgres music

# Restart services
docker compose start api worker

echo "Restore completed"
```

### MinIO Backups

**Versioning enabled:**
```bash
# Enable versioning on buckets
mc version enable myminio/originals
mc version enable myminio/transcodes
mc version enable myminio/images
```

**Weekly archive to external storage:**
```bash
#!/bin/bash
# scripts/backup-minio.sh

BACKUP_DIR="/backups/minio"
DATE=$(date +%Y%m%d)

# Mirror to backup location
mc mirror --preserve myminio/originals ${BACKUP_DIR}/originals-${DATE}/
mc mirror --preserve myminio/transcodes ${BACKUP_DIR}/transcodes-${DATE}/

# Optional: Upload to S3/Backblaze
mc mirror ${BACKUP_DIR}/ remote-s3/backups/

# Keep only last 4 weeks
find ${BACKUP_DIR} -name "*" -mtime +28 -delete
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 24 hours (nightly backups)

**Recovery steps:**

1. **Provision new VPS** (if needed)
2. **Install Docker and dependencies**
3. **Clone repository:**
   ```bash
   git clone https://github.com/yourusername/music-platform.git
   ```
4. **Restore .env file** (from secure backup)
5. **Restore database:**
   ```bash
   ./scripts/restore-db.sh /backups/postgres/music_db_20251107.sql.gz
   ```
6. **Restore MinIO data:**
   ```bash
   mc mirror /backups/minio/originals-20251107/ myminio/originals/
   mc mirror /backups/minio/transcodes-20251107/ myminio/transcodes/
   ```
7. **Start services:**
   ```bash
   docker compose up -d
   ```
8. **Verify health:**
   ```bash
   curl https://yoursite.com/api/v1/health
   ```

---

## Maintenance Procedures

### Update Application

```bash
#!/bin/bash
# scripts/update.sh

# Pull latest code
git pull origin main

# Rebuild containers
docker compose build

# Run migrations
docker compose exec api npm run migrate

# Restart services (zero-downtime with rolling restart)
docker compose up -d --no-deps --build api
docker compose up -d --no-deps --build web
docker compose up -d --no-deps --build worker

# Verify health
sleep 10
curl https://yoursite.com/api/v1/health
```

### SSL Certificate Renewal

**Auto-renewal with certbot:**
```bash
# Add to crontab
0 3 * * * certbot renew --quiet --deploy-hook "docker compose restart nginx"
```

**Manual renewal:**
```bash
# Stop Nginx
docker compose stop nginx

# Renew certificate
certbot renew

# Start Nginx
docker compose start nginx
```

### Database Migrations

**Create migration:**
```bash
docker compose exec api npm run migration:create -- add_new_column
```

**Run migrations:**
```bash
docker compose exec api npm run migrate
```

**Rollback migration:**
```bash
docker compose exec api npm run migrate:rollback
```

### Clear Cache

**Redis cache:**
```bash
# Clear all cache
docker compose exec redis redis-cli FLUSHALL

# Clear specific pattern
docker compose exec redis redis-cli KEYS "cache:*" | xargs docker compose exec redis redis-cli DEL
```

### Restart Services

**All services:**
```bash
docker compose restart
```

**Specific service:**
```bash
docker compose restart api
docker compose restart worker
```

**Graceful restart (zero-downtime):**
```bash
# Scale up
docker compose up -d --scale api=2

# Wait for health check
sleep 10

# Scale down old instance
docker compose up -d --scale api=1
```

---

## Configuration Management

### Secrets Management

**Production secrets (DO NOT commit to git):**

**Option 1: Docker secrets**
```yaml
# docker-compose.prod.yml
services:
  api:
    secrets:
      - db_password
      - jwt_secret

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

**Option 2: Environment variables**
```bash
# /etc/environment
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
STRIPE_SECRET_KEY="sk_live_..."
```

**Option 3: External secrets manager (AWS Secrets Manager, Vault)**

### Multi-Environment Config

**Development:**
```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/music_dev
```

**Staging:**
```bash
# .env.staging
NODE_ENV=staging
LOG_LEVEL=info
DATABASE_URL=postgresql://postgres:...@staging-db:5432/music_staging
```

**Production:**
```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=warn
DATABASE_URL=postgresql://postgres:...@prod-db:5432/music_prod
```

---

## Monitoring Checklist

**Daily checks:**
- [ ] Health endpoints green
- [ ] No critical errors in logs
- [ ] Disk space > 20% free
- [ ] Failed job queue < 10

**Weekly checks:**
- [ ] Database backup successful
- [ ] MinIO backup successful
- [ ] SSL certificate valid (> 30 days)
- [ ] Review error logs for patterns

**Monthly checks:**
- [ ] Update dependencies (security patches)
- [ ] Review and rotate API keys
- [ ] Check disk usage trends
- [ ] Review metrics dashboards

---

## Troubleshooting Runbook

### Service Won't Start

**Check logs:**
```bash
docker compose logs api
docker compose logs worker
```

**Common issues:**
- Database migration not applied: `docker compose exec api npm run migrate`
- Port already in use: `lsof -i :3000`
- Missing environment variable: Check `.env` file

### High CPU Usage

**Identify process:**
```bash
docker stats
```

**Common causes:**
- Too many concurrent transcode jobs: Reduce worker concurrency
- N+1 database queries: Check slow query log
- Infinite loop in code: Review recent code changes

### High Memory Usage

**Check container memory:**
```bash
docker stats
```

**Common causes:**
- Memory leak in Node.js: Restart service, review code
- Large file uploads buffered in memory: Use streaming
- Too many concurrent jobs: Reduce queue concurrency

### Database Connection Pool Exhausted

**Symptoms:** "Too many connections" error

**Fix:**
```typescript
// Increase pool size
// api/src/database/database.config.ts
{
  pool: {
    min: 5,
    max: 30,  // Increase from 20
  }
}
```

### Failed Jobs Accumulating

**Check queue:**
```bash
curl http://localhost:3001/health
```

**Retry failed jobs:**
```typescript
// admin endpoint
POST /api/v1/admin/jobs/retry
{
  "queue": "transcode",
  "limit": 10
}
```

### Disk Full

**Check usage:**
```bash
df -h
```

**Clear space:**
```bash
# Remove old logs
docker compose exec api sh -c "find /app/logs -name '*.log' -mtime +7 -delete"

# Prune Docker
docker system prune -a

# Clear MinIO old versions
mc rm --recursive --force --older-than 30d myminio/transcodes/
```

---

## Performance Tuning

### Database

**Enable query logging:**
```sql
-- postgresql.conf
log_statement = 'all'
log_min_duration_statement = 1000  -- Log queries > 1s
```

**Analyze slow queries:**
```sql
EXPLAIN ANALYZE SELECT * FROM tracks WHERE ...;
```

**Add indexes:**
```sql
CREATE INDEX idx_tracks_owner_created ON tracks(owner_user_id, created_at DESC);
```

### Redis

**Increase memory:**
```yaml
# docker-compose.yml
services:
  redis:
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
```

### Nginx

**Enable caching:**
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/v1/trending {
    proxy_cache api_cache;
    proxy_cache_valid 200 15m;
    proxy_cache_key "$request_uri";
}
```

### Worker Concurrency

**Tune based on CPU:**
```typescript
// worker/src/config/queue.config.ts
const cpuCount = os.cpus().length;

export const QUEUE_CONFIG = {
  transcode: {
    concurrency: Math.max(1, cpuCount - 1),
  },
  waveform: {
    concurrency: cpuCount,
  },
};
```

---

## Scaling Guide

### Vertical Scaling (Upgrade VPS)

**When to scale:**
- CPU consistently > 80%
- Memory consistently > 90%
- Disk I/O wait > 20%

**Upgrade path:**
- 8GB → 16GB RAM
- 4 cores → 8 cores
- 100GB → 500GB SSD

### Horizontal Scaling

**Scale workers:**
```bash
docker compose up -d --scale worker=4
```

**Load balancer (future):**
```nginx
upstream api_cluster {
    server api1:3000;
    server api2:3000;
    server api3:3000;
}
```

### External Services

**When to migrate:**
- MinIO → AWS S3 / Backblaze B2 (> 1TB storage)
- PostgreSQL → Managed RDS (> 10K users)
- Redis → Managed ElastiCache (> 100 req/s)
