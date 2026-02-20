# Live Environment Migration & VPS Hosting Guide

This guide provides step-by-step instructions to deploy the **Speedy Bites (Kuku ni Sisi)** application to a VPS, secure it with SSL, and connect it to a public URL.

## 1. Prerequisites

- A VPS (Ubuntu 22.04+ recommended).
- A domain name (e.g., `kukshop.site`).
- Docker and Docker Compose installed on the VPS.
- Your project files uploaded to the VPS.

## 2. Environment Configuration

Create a `.env` file in the root directory and another in the `server` directory based on the provides names in `.env.example`.

### Critical Variables for Production:
- `VITE_API_URL`: Your public API URL (e.g., `https://api.kukshop.site/api`).
- `DATABASE_URL`: The connection string for your Postgres container.
- `TOKEN_SECRET`: A long, random string (min 32 chars).
- `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, etc.

## 3. Deployment with Docker Compose

Run the following command in the project root to build and start the containers:

```bash
docker-compose up -d --build
```

This will start:
- **Frontend**: Port 80
- **Backend (Server)**: Port 4000
- **Database**: Port 5432

## 4. Connecting to a Public URL & SSL Security

We recommend using **Nginx** as a reverse proxy on the host machine to handle SSL via Let's Encrypt.

### Nginx Configuration (`/etc/nginx/sites-available/kukshop`)

```nginx
server {
    listen 80;
    server_name kukshop.site api.kukshop.site;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
    }

    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
    }

    location /api/stream {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
    }
}
```

### Install SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d kukshop.site -d api.kukshop.site
```

## 5. Security & Firewall Setup (UFW)

Securing your VPS is critical. We will use `ufw` to block all unnecessary incoming traffic.

### Firewall Configuration

```bash
# Allow SSH first (DO NOT SKIP or you'll be locked out)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct access to the database (very important)
# The database is accessible within the Docker network, but not from the outside.
sudo ufw deny 5432/tcp

# Enable the firewall
sudo ufw enable
```

### Port Strategy
- **Port 80/443**: Publicly accessible via Nginx.
- **Port 4000**: Internal only (bound to `127.0.0.1` or only accessed by Nginx within Docker).
- **Port 5432**: Internal only (managed by Docker bridge network).

## 6. Nginx Security Hardening

Add these headers to your Nginx configuration to protect against common attacks:

```nginx
server {
    ...
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';";
    ...
}
```

## 7. Migration Checklist

- [ ] Update `VITE_API_URL` in frontend build.
- [ ] Set `NODE_ENV=production` in backend.
- [ ] Verify M-Pesa callbacks are reachable at the public URL.
- [ ] Ensure `uploads/` directory has persistent storage.
- [ ] Test firewall is active (`sudo ufw status`).

