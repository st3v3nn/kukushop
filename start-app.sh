#!/bin/bash

# Kuku ni Sisi Application Management Script
# Usage: ./start-app.sh [start|stop|restart]

COMMAND=${1:-start}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DB_CONTAINER="speedy-bites-db"
API_PORT=4000
VITE_PORT=5173
DB_PORT=54812
DB_URL="postgresql://mike_admin:Mwa\$0152@127.0.0.1:${DB_PORT}/speedy_bites"

start_app() {
    echo -e "${GREEN}🚀 Starting Kuku ni Sisi Environment...${NC}"

    # 1. Check required local tools
    if ! command -v docker > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not installed or not on PATH.${NC}"
        exit 1
    fi

    if ! command -v npm > /dev/null 2>&1; then
        echo -e "${RED}❌ npm is not installed or not on PATH. Install Node.js/npm before starting the dev app.${NC}"
        exit 1
    fi

    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is installed, but this user cannot access the Docker daemon.${NC}"
        echo "Add this user to the docker group, start Docker, or run the script from a shell with Docker access."
        exit 1
    fi

    NODE_MAJOR=$(node -v | sed 's/^v//' | cut -d. -f1)
    if [ "$NODE_MAJOR" -lt 20 ]; then
        echo -e "${YELLOW}⚠️  Node $(node -v) detected; backend dependency resend@6.9.2 declares Node >=20.${NC}"
    fi

    # 2. Install dependencies if needed
    if [ ! -d node_modules ]; then
        echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
        npm ci || exit 1
    fi

    if [ ! -d server/node_modules ]; then
        echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
        (cd server && npm ci) || exit 1
    fi

    # 3. Start Database
    echo -e "${YELLOW}🗄️  Starting Database ($DB_CONTAINER on localhost:$DB_PORT)...${NC}"
    docker compose -f docker-compose.yml up -d db
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to start database container. Please ensure Docker is running and this user can access it.${NC}"
        exit 1
    fi

    echo "⏳ Waiting for database to initialize..."
    sleep 3

    # 4. Cleanup ports
    echo -e "${YELLOW}🧹 Cleaning up ports $API_PORT and $VITE_PORT...${NC}"
    fuser -k $API_PORT/tcp $VITE_PORT/tcp > /dev/null 2>&1

    # 5. Start Backend
    echo -e "${YELLOW}⚡ Starting Backend API (Port $API_PORT, DB localhost:$DB_PORT/speedy_bites)...${NC}"
    cd server
    nohup env DATABASE_URL="$DB_URL" PORT=$API_PORT npm run start > ../backend.log 2>&1 &
    cd ..

    # 6. Start Frontend (ensure frontend knows backend API URL)
    echo -e "${YELLOW}🌐 Starting Frontend UI (Port $VITE_PORT)...${NC}"
    nohup env PORT=$VITE_PORT VITE_API_URL=/api npm run dev > frontend.log 2>&1 &

    echo ""
    echo -e "${GREEN}✅ Kuku ni Sisi is running!${NC}"
    echo "--------------------------------------------------"
    echo "Backend Logs:  tail -f backend.log"
    echo "Frontend Logs: tail -f frontend.log"
    echo "--------------------------------------------------"
    echo "Database URL:  postgresql://mike_admin:***@127.0.0.1:$DB_PORT/speedy_bites"
    echo "API URL:       http://localhost:$API_PORT/api"
    echo "Frontend URL:  http://localhost:$VITE_PORT"
    echo "--------------------------------------------------"
}

stop_app() {
    echo -e "${YELLOW}🛑 Stopping Kuku ni Sisi...${NC}"

    # Kill processes on ports
    fuser -k $API_PORT/tcp > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backend API stopped${NC}"
    else
        echo "Backend API not running"
    fi

    fuser -k $VITE_PORT/tcp > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Frontend UI stopped${NC}"
    else
        echo "Frontend UI not running"
    fi
    
    echo -e "${GREEN}👋 Application stopped.${NC}"
}

case "$COMMAND" in
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        stop_app
        sleep 2
        start_app
        ;;
    *)
        echo "Usage: $0 {start|stop|restart}"
        exit 1
        ;;
esac
