#!/bin/bash

set -e

echo "🛑 Stopping Self-Hosted Music Platform..."
echo ""

# Stop all services
docker compose down

echo ""
echo "✅ All services stopped."
echo ""
echo "📋 Additional commands:"
echo "   Remove volumes:    docker compose down -v"
echo "   Remove images:     docker compose down --rmi all"
echo "   Clean everything:  docker compose down -v --rmi all --remove-orphans"
echo ""
