#!/bin/bash

# VPS Deployment Verification Script
# This script verifies that the Kuku ni Sisi application is properly deployed and running

set -e

echo "🔍 Kuku ni Sisi VPS Deployment Verification"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Check if running from correct directory
if [ ! -f "docker-compose.prod.yml" ]; then
  echo -e "${RED}❌ Error: Must be run from project root directory${NC}"
  exit 1
fi

echo -e "${YELLOW}1. Checking Docker Installation${NC}"
if command -v docker &> /dev/null; then
  echo -e "${GREEN}✅ Docker is installed${NC}"
  docker --version
else
  echo -e "${RED}❌ Docker is not installed${NC}"
  ERRORS=$((ERRORS + 1))
fi

echo ""
echo -e "${YELLOW}2. Checking Docker Compose${NC}"
if docker compose version &> /dev/null; then
  echo -e "${GREEN}✅ Docker Compose is available${NC}"
  docker compose version | head -1
else
  echo -e "${RED}❌ Docker Compose is not available${NC}"
  ERRORS=$((ERRORS + 1))
fi

echo ""
echo -e "${YELLOW}3. Checking Running Services${NC}"
if docker compose -f docker-compose.prod.yml ps &> /dev/null; then
  echo -e "${GREEN}✅ Docker Compose configuration is valid${NC}"
  
  # Check individual services
  RUNNING=$(docker compose -f docker-compose.prod.yml ps --services --filter "status=running" 2>/dev/null | wc -l)
  TOTAL=$(docker compose -f docker-compose.prod.yml config --services 2>/dev/null | wc -l)
  
  echo "Services running: $RUNNING/$TOTAL"
  
  if docker compose -f docker-compose.prod.yml ps db | grep -q "Up"; then
    echo -e "${GREEN}  ✅ Database (db) is running${NC}"
  else
    echo -e "${RED}  ❌ Database (db) is not running${NC}"
    ERRORS=$((ERRORS + 1))
  fi
  
  if docker compose -f docker-compose.prod.yml ps server | grep -q "Up"; then
    echo -e "${GREEN}  ✅ Server (API) is running${NC}"
  else
    echo -e "${RED}  ❌ Server (API) is not running${NC}"
    ERRORS=$((ERRORS + 1))
  fi
  
  if docker compose -f docker-compose.prod.yml ps frontend | grep -q "Up"; then
    echo -e "${GREEN}  ✅ Frontend is running${NC}"
  else
    echo -e "${RED}  ❌ Frontend is not running${NC}"
    ERRORS=$((ERRORS + 1))
  fi
  
  if docker compose -f docker-compose.prod.yml ps proxy | grep -q "Up"; then
    echo -e "${GREEN}  ✅ Proxy (Nginx) is running${NC}"
  else
    echo -e "${YELLOW}  ⚠️  Proxy (Nginx) is not running yet (expected if certs not ready)${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${RED}❌ Cannot read Docker Compose status${NC}"
  ERRORS=$((ERRORS + 1))
fi

echo ""
echo -e "${YELLOW}4. Checking Environment Configuration${NC}"
if [ -f ".env" ]; then
  echo -e "${GREEN}✅ .env file exists${NC}"
  
  # Check for required variables
  if grep -q "DATABASE_URL" .env; then
    echo -e "${GREEN}  ✅ DATABASE_URL is configured${NC}"
  else
    echo -e "${RED}  ❌ DATABASE_URL is not configured${NC}"
    ERRORS=$((ERRORS + 1))
  fi
  
  if grep -q "MPESA_CONSUMER_KEY" .env; then
    echo -e "${GREEN}  ✅ MPESA_CONSUMER_KEY is configured${NC}"
  else
    echo -e "${YELLOW}  ⚠️  MPESA_CONSUMER_KEY is not configured${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${RED}❌ .env file not found${NC}"
  ERRORS=$((ERRORS + 1))
fi

echo ""
echo -e "${YELLOW}5. Checking Database Connectivity${NC}"
if docker compose -f docker-compose.prod.yml ps db | grep -q "Up"; then
  if docker compose -f docker-compose.prod.yml exec -T db pg_isready -U mike_admin &> /dev/null; then
    echo -e "${GREEN}✅ Database is responding${NC}"
    
    # Check if migrations have been applied
    if docker compose -f docker-compose.prod.yml exec -T db psql -U mike_admin -d speedy_bites -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' LIMIT 1;" &> /dev/null; then
      echo -e "${GREEN}✅ Database has tables (migrations likely applied)${NC}"
    else
      echo -e "${YELLOW}⚠️  Database appears to be empty (run migrations)${NC}"
      WARNINGS=$((WARNINGS + 1))
    fi
  else
    echo -e "${RED}❌ Database is not responding to queries${NC}"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo -e "${YELLOW}⚠️  Database service not running, skipping connectivity check${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo -e "${YELLOW}6. Checking Disk Space${NC}"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
  echo -e "${GREEN}✅ Sufficient disk space (${DISK_USAGE}% used)${NC}"
else
  echo -e "${YELLOW}⚠️  Disk usage is high (${DISK_USAGE}% used)${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo -e "${YELLOW}7. Checking Upload Directory${NC}"
UPLOAD_DIR="${UPLOAD_DIR:-/var/lib/kukunisisi/uploads}"
if [ -d "$UPLOAD_DIR" ]; then
  echo -e "${GREEN}✅ Upload directory exists: $UPLOAD_DIR${NC}"
  SIZE=$(du -sh "$UPLOAD_DIR" 2>/dev/null | awk '{print $1}')
  echo "  Size: $SIZE"
else
  echo -e "${YELLOW}⚠️  Upload directory not found: $UPLOAD_DIR${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo -e "${YELLOW}8. Checking SSL Certificates${NC}"
if [ -d "./certs/live/kukunisisi.co.ke" ]; then
  echo -e "${GREEN}✅ SSL certificates found${NC}"
  if [ -f "./certs/live/kukunisisi.co.ke/fullchain.pem" ]; then
    EXPIRY=$(openssl x509 -enddate -noout -in ./certs/live/kukunisisi.co.ke/fullchain.pem | cut -d= -f2)
    echo "  Expiry: $EXPIRY"
  fi
else
  echo -e "${YELLOW}⚠️  SSL certificates not found (run certbot)${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "=============================================="
echo -e "${YELLOW}Summary${NC}"
echo "=============================================="
echo -e "Errors: ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Deployment verification passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Deployment verification failed. Please fix the errors above.${NC}"
  exit 1
fi
