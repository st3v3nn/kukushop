# VPS Deployment Guide - Kuku ni Sisi

This guide covers setting up and deploying the Kuku ni Sisi application on a VPS using Docker Compose.

## Prerequisites

- **VPS Server**: Ubuntu 20.04 LTS or newer
- **Domain**: kukunisisi.co.ke pointing to your VPS IP (167.86.123.246)
- **Email**: For Let's Encrypt SSL certificate generation
- **Database Password**: Mwa$0152
- **Git Repository**: Access to the project repository

## VPS Information

- **IP Address**:144.99.91.168
- **Domain**: kukunisisi.co.ke (with www subdomain)
- **Database User**: mike_admin
- **Database Password**: Mwa$0152
- **Database Name**: speedy_bites
- **Database Port**: 5432 (internal to Docker)

## Pre-Deployment Checklist

1. **DNS Configuration** ✓
   - Ensure `kukunisisi.co.ke` A record points to `167.86.123.246`
   - Ensure `www.kukunisisi.co.ke` A record points to `167.86.123.246`
   - Allow 24-48 hours for DNS propagation if newly configured

2. **Environment Variables** ✓
   - `.env` file contains all MPESA configuration
   - All required secrets are set

3. **Port Availability**
   - Ports 80, 443 must be available on VPS
   - Port 4000 will be used internally by Docker

## Deployment Steps

### Step 1: SSH into VPS

```bash
ssh root@167.86.123.246
```

### Step 2: Clone the Repository

```bash
cd /opt
git clone <YOUR_GIT_REPO_URL> kukunisisi
cd kukunisisi
```

Replace `<YOUR_GIT_REPO_URL>` with your actual repository URL.

### Step 3: Verify DNS is Propagated

Before running the deployment script, ensure DNS is correctly configured:

```bash
nslookup kukunisisi.co.ke
nslookup www.kukunisisi.co.ke
```

Both should resolve to `167.86.123.246`.

### Step 4: Run Deployment Script

The deployment script will:
1. Install Docker if not present
2. Build and start the database, server, and frontend services
3. Generate SSL certificates via Let's Encrypt
4. Start the nginx proxy
5. Apply all database migrations

**Run the deployment:**

```bash
sudo ./scripts/deploy_vps.sh <git_repo_url> main <your-email@example.com>
```

**Example:**

```bash
sudo ./scripts/deploy_vps.sh https://github.com/yourusername/kukushop main admin@kukunisisi.co.ke
```

**What happens during deployment:**
- Docker and Docker Compose are installed
- Repository is cloned to `/opt/kukunisisi`
- Database container starts with PostgreSQL 15
- Server API container is built and started
- Frontend container is built and started
- Certbot obtains SSL certificates from Let's Encrypt
- Nginx proxy is started
- Database migrations are applied

### Step 5: Monitor Deployment Progress

```bash
# Watch the deployment logs
docker compose -f docker-compose.prod.yml logs -f

# Check service status
docker compose -f docker-compose.prod.yml ps

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f proxy
docker compose -f docker-compose.prod.yml logs -f server
docker compose -f docker-compose.prod.yml logs -f db
```

## Post-Deployment

### Verify Services are Running

```bash
cd /opt/kukunisisi
docker compose -f docker-compose.prod.yml ps
```

All services should show `Up` status.

### Check HTTPS Access

```bash
curl -I https://kukunisisi.co.ke
```

Should return HTTP 200 and valid SSL certificate info.

### View Application Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f server
```

### Test Database Connection

```bash
docker exec -it kukunisisi-db-1 psql -U mike_admin -d speedy_bites -c "SELECT version();"
```

### Initialize/Reset Admin User

```bash
cd /opt/kukunisisi
docker compose -f docker-compose.prod.yml exec server node server/scripts/reset-admin-password.cjs admin@kukunisisi.co.ke your_secure_password
```

## Database Management

### Access Database Directly

```bash
docker compose -f docker-compose.prod.yml exec db psql -U mike_admin -d speedy_bites
```

### Backup Database

```bash
docker compose -f docker-compose.prod.yml exec db pg_dump -U mike_admin speedy_bites > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
docker compose -f docker-compose.prod.yml exec -T db psql -U mike_admin speedy_bites < backup_file.sql
```

## Common Operations

### View Uploaded Files

```bash
ls -la /var/lib/kukunisisi/uploads/
```

### View Application Logs

```bash
tail -f /var/log/kukunisisi/app.log
```

### Restart Services

```bash
cd /opt/kukunisisi

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart server
```

### Update Application

```bash
cd /opt/kukunisisi

# Pull latest code
git fetch origin main
git checkout main
git pull origin main

# Rebuild and restart services
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --build

# Apply new migrations if any
docker compose -f docker-compose.prod.yml exec db psql -U mike_admin -d speedy_bites -f server/migrations/*.sql
```

### View Resource Usage

```bash
docker stats

# Check disk usage
df -h /var/lib/kukunisisi/uploads

# Check database size
docker compose -f docker-compose.prod.yml exec db psql -U mike_admin -d speedy_bites -c "SELECT pg_size_pretty(pg_database_size('speedy_bites'));"
```

## SSL Certificate Management

### View Certificate Details

```bash
# List certificates
sudo ls -la /opt/kukunisisi/certs/live/kukunisisi.co.ke/

# Check expiration
sudo openssl x509 -in /opt/kukunisisi/certs/live/kukunisisi.co.ke/fullchain.pem -text -noout | grep -A 2 "Validity"
```

### Renew SSL Certificates

Let's Encrypt certificates are valid for 90 days. They auto-renew via certbot. To manually renew:

```bash
docker run --rm \
  -v /opt/kukunisisi/certs:/etc/letsencrypt \
  -v /opt/kukunisisi/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot renew
```

## Troubleshooting

### Services Won't Start

Check logs:
```bash
docker compose -f docker-compose.prod.yml logs
```

### Database Connection Issues

```bash
# Test database connectivity
docker compose -f docker-compose.prod.yml exec server nc -zv db 5432

# Check database status
docker compose -f docker-compose.prod.yml exec db pg_isready -U mike_admin
```

### Port Already in Use

```bash
# Find what's using the port
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :4000

# Kill the process if needed
sudo kill -9 <PID>
```

### SSL Certificate Issues

Check nginx error logs:
```bash
docker compose -f docker-compose.prod.yml logs proxy
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Clean up old Docker images and volumes
docker system prune -a

# Check upload directory size
du -sh /var/lib/kukunisisi/uploads
```

## Environment Variables

The `.env` file at `/opt/kukunisisi/.env` contains:

```
# Database Configuration
DATABASE_URL=postgresql://mike_admin:Mwa$0152@db:5432/speedy_bites
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=20

# Upload and Logging
UPLOAD_DIR=/var/lib/kukunisisi/uploads
LOG_DIR=/var/log/kukunisisi

# M-Pesa Configuration
MPESA_SANDBOX=false
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
# ... other MPESA settings
```

**⚠️ Warning**: Never commit the `.env` file to version control. Keep credentials secure.

## Monitoring and Maintenance

### Set Up Log Rotation

Create `/etc/logrotate.d/kukunisisi`:

```
/var/log/kukunisisi/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
}
```

### Set Up Automated Backups

Create `/home/ubuntu/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/kukunisisi"
mkdir -p "$BACKUP_DIR"
cd /opt/kukunisisi
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U mike_admin speedy_bites | gzip > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"
# Keep only last 30 backups
find "$BACKUP_DIR" -type f -mtime +30 -delete
```

Add to crontab:
```bash
sudo crontab -e
# Add: 0 2 * * * /home/ubuntu/backup-db.sh
```

## Security Recommendations

1. **Change Admin Password**: Immediately after deployment
2. **Configure Firewall**: Restrict SSH access, allow only 80/443
3. **Monitor Logs**: Regularly review application and system logs
4. **Update Dependencies**: Regularly update Docker images and OS packages
5. **Enable Backups**: Set up automated database backups
6. **Use Strong Passwords**: For all admin and database accounts
7. **Configure Rate Limiting**: Adjust in server config if needed

## Support

For issues or questions:
- Check the troubleshooting section above
- Review logs: `docker compose -f docker-compose.prod.yml logs -f`
- Consult the main README.md in the project root

---

**Last Updated**: May 21, 2026
**Database Version**: PostgreSQL 15
**Docker Compose Version**: 3.8
