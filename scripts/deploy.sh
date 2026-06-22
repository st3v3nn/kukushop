#!/usr/bin/env bash
set -euo pipefail

REPO_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$REPO_DIR"

# Build and start containers
echo "Building and starting containers..."
docker compose -f docker-compose.yml pull || true
docker compose -f docker-compose.yml up -d --build

# Locate DB container
DB_CONTAINER=$(docker compose -f docker-compose.yml ps -q db || true)
if [ -z "$DB_CONTAINER" ]; then DB_CONTAINER=$(docker ps --filter "name=db" --format "{{.Names}}" | head -n1); fi
if [ -z "$DB_CONTAINER" ]; then echo "DB container not found"; exit 1; fi

# Apply migrations
for f in server/migrations/*.sql; do
  echo "Applying migration: $f"
  docker exec -i $DB_CONTAINER psql -U mike_admin -d speedy_bites -v ON_ERROR_STOP=1 -f - < "$f"
done

# Optional cleanup (uncomment if desired)
# echo "Running cleanup"
# docker exec -i $DB_CONTAINER psql -U mike_admin -d speedy_bites -v ON_ERROR_STOP=1 <<'SQL'
# -- cleanup SQL here
# SQL

# Restart services to pick up DB changes
docker compose -f docker-compose.yml restart server frontend

echo "Deploy complete."
