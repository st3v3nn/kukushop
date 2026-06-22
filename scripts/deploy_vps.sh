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
EXPECTED_PUBLIC_IP=${EXPECTED_PUBLIC_IP:-$(curl -4 -s ifconfig.me || true)}

if [ -z "$EXPECTED_PUBLIC_IP" ]; then
  echo "Unable to determine this VPS public IP. Please set EXPECTED_PUBLIC_IP or verify network connectivity."
  exit 1
fi

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

if [ ! -f "$APP_DIR/.env" ]; then
  echo "Missing $APP_DIR/.env. Create the root .env with the MPESA_* values before deploying."
  exit 1
fi

UPLOAD_PATH=${UPLOAD_DIR:-/var/lib/kukunisisi/uploads}
LOG_PATH=${LOG_DIR:-/var/log/kukunisisi}
mkdir -p "$UPLOAD_PATH" "$LOG_PATH"

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
: ${CERT_EMAIL:=${3:-}}
if [ -z "$CERT_EMAIL" ]; then
  echo "No CERT_EMAIL provided as 3rd arg or CERT_EMAIL env var. Please re-run as: sudo $0 <git_repo_url> [branch] <email>";
  exit 1
fi

# Fail fast if DNS is still pointing at an old server.
for host in kukunisisi.co.ke www.kukunisisi.co.ke; do
  RESOLVED_IP=$(getent ahostsv4 "$host" | awk 'NR==1 {print $1}')
  if [ -z "$RESOLVED_IP" ]; then
    echo "Could not resolve $host. Update DNS to point at $EXPECTED_PUBLIC_IP before requesting certificates."
    exit 1
  fi
  if [ "$RESOLVED_IP" != "$EXPECTED_PUBLIC_IP" ]; then
    echo "$host resolves to $RESOLVED_IP, but this deployment expects $EXPECTED_PUBLIC_IP."
    echo "Update DNS before running certbot so the ACME challenge reaches this VPS."
    exit 1
  fi
done

# Open firewall ports if ufw is installed (non-fatal)
if command -v ufw >/dev/null 2>&1; then
  echo "Configuring ufw to allow HTTP/HTTPS..."
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
fi

# Use certbot docker image in standalone mode (binds to port 80 temporarily)
# Run non-interactively and without allocating a TTY so this can be automated.
docker run --rm \
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
    docker exec -i $DB_CONTAINER psql -U mike_admin -d speedy_bites -v ON_ERROR_STOP=1 -f - < "$f"
  done
fi

# 8) Cleanup and show status
docker compose -f docker-compose.prod.yml ps

echo "Deployment finished. Check the services above and nginx logs for HTTPS status: docker compose -f docker-compose.prod.yml logs -f proxy" 
