#!/bin/bash

set -e

echo "🚀 Starting Self-Hosted Music Platform..."
echo ""

# Check if .env exists, if not copy from .env.example
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please review and update .env with your configuration"
    echo ""
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "🛑 Stopping any existing containers..."
docker compose down

echo ""
echo "🏗️  Building images..."
docker compose build

echo ""
echo "🔄 Starting services..."
docker compose up -d postgres redis minio

echo ""
echo "⏳ Waiting for databases to be healthy..."
until docker compose exec -T postgres pg_isready -U ${POSTGRES_USER:-musicuser} > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done
echo "✅ PostgreSQL is ready"

until docker compose exec -T redis redis-cli --raw incr ping > /dev/null 2>&1; do
    echo "   Waiting for Redis..."
    sleep 2
done
echo "✅ Redis is ready"

until docker compose exec -T minio curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; do
    echo "   Waiting for MinIO..."
    sleep 2
done
echo "✅ MinIO is ready"

echo ""
echo "🪣 Creating MinIO buckets..."
docker compose up createbuckets

echo ""
echo "🔄 Starting application services..."
docker compose up -d api worker web nginx

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check service health
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "✅ Platform is running!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend:      http://localhost:8080"
echo "   API:           http://localhost:8080/api/v1"
echo "   MinIO Console: http://localhost:9001"
echo ""
echo "📋 Useful commands:"
echo "   View logs:     docker compose logs -f [service]"
echo "   Stop all:      ./scripts/dev_down.sh"
echo "   Restart:       docker compose restart [service]"
echo ""
