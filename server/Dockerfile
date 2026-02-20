# Dockerfile for Node.js Express Backend
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production --silent

# Copy source code
COPY . .

# Expose backend port
EXPOSE 4000

# Start the server
CMD ["node", "index.js"]
