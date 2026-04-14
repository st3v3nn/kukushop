#!/usr/bin/env bash
set -euo pipefail

# deploy_vps.sh
# Provision a fresh Ubuntu/Debian VPS and deploy the KukuniSisi app using Docker Compose (prod).
# Usage: sudo ./scripts/deploy_vps.sh <git_repo_url> <branch>

REPO_URL=${1:-}
BRANCH=${2:-main}
APP_DIR=/opt/kukunisisi
CERTS_DIR=${APP_DIR}/certs
CERTBOT_WEBROOT=${APP_DIR}/certbot/www
COMPOSE_FILE=${APP_DIR}/docker-compose.prod.yml

if [ -z "$REPO_URL" ]; then
  echo "Usage: sudo $0 <git_repo_url> [branch]"
  exit 1
fi

# 1) Basic system packages and Docker
apt update && apt install -y ca-certificates curl gnupg lsb-release git

# Install Docker if missing
if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt update
  apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

# 2) Clone or update repository
if [ ! -d "$APP_DIR" ]; then
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR"
  git fetch origin "$BRANCH" && git checkout "$BRANCH" && git pull --ff-only origin "$BRANCH"
fi
cd "$APP_DIR"

# 3) Ensure directories exist for certbot and certs
mkdir -p "$CERTS_DIR" "$CERTBOT_WEBROOT"
chown -R $USER:$USER "$APP_DIR"

# 4) Build and start DB + server + frontend (but NOT proxy yet)
# This avoids nginx failing on missing certs.
docker compose -f docker-compose.prod.yml pull || true
# Start db, server and frontend first
docker compose -f docker-compose.prod.yml up -d --build db server frontend

# 5) Obtain Let's Encrypt certs using certbot standalone
# Note: certbot cannot issue certificates for bare IP addresses — ensure your domain A record points to this VPS.
read -p "Enter an email for Let's Encrypt registration: " CERT_EMAIL
if [ -z "$CERT_EMAIL" ]; then
  echo "Email is required for cert registration"; exit 1
fi

# Use certbot docker image in standalone mode (binds to port 80 temporarily)
docker run --rm -it \
  -v "$CERTS_DIR":/etc/letsencrypt \
  -v "$CERTBOT_WEBROOT":/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly --standalone --non-interactive --agree-tos --email "$CERT_EMAIL" -d kukunisisi.co.ke -d www.kukunisisi.co.ke

# 6) Start the proxy (nginx) now that certs exist
docker compose -f docker-compose.prod.yml up -d --build proxy

# 7) Apply DB migrations
DB_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q db)
if [ -n "$DB_CONTAINER" ]; then
  for f in server/migrations/*.sql; do
    echo "Applying migration: $f"
    docker exec -i $DB_CONTAINER psql -U speedy_admin -d speedy_bites -v ON_ERROR_STOP=1 -f - < "$f"
  done
fi

# 8) Cleanup and show status
docker compose -f docker-compose.prod.yml ps

echo "Deployment finished. Check the services above and nginx logs for HTTPS status: docker compose -f docker-compose.prod.yml logs -f proxy" 
