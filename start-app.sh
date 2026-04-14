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

start_app() {
    echo -e "${GREEN}🚀 Starting Kuku ni Sisi Environment...${NC}"

    # 1. Start Database
    echo -e "${YELLOW}🗄️  Starting Database ($DB_CONTAINER)...${NC}"
    docker start $DB_CONTAINER > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to start database container. Please ensure Docker is running.${NC}"
        exit 1
    fi
    
    echo "⏳ Waiting for database to initialize..."
    sleep 3

    # 2. Cleanup ports
    echo -e "${YELLOW}🧹 Cleaning up ports $API_PORT and $VITE_PORT...${NC}"
    fuser -k $API_PORT/tcp $VITE_PORT/tcp > /dev/null 2>&1

    # 3. Start Backend
    echo -e "${YELLOW}⚡ Starting Backend API (Port $API_PORT)...${NC}"
    cd server
    nohup npm run start > ../backend.log 2>&1 &
    cd ..

    # 4. Start Frontend (ensure frontend knows backend API URL)
    echo -e "${YELLOW}🌐 Starting Frontend UI (Port $VITE_PORT)...${NC}"
    # Set PORT so the dev frontend calls the backend via proxy (/api)
    nohup env PORT=$VITE_PORT npm run dev > frontend.log 2>&1 &

    echo ""
    echo -e "${GREEN}✅ Kuku ni Sisi is running!${NC}"
    echo "--------------------------------------------------"
    echo "Backend Logs:  tail -f backend.log"
    echo "Frontend Logs: tail -f frontend.log"
    echo "--------------------------------------------------"
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
