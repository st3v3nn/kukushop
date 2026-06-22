# VPS Setup Checklist and Quick Start

This document provides a quick reference for deploying the Kuku ni Sisi application to your VPS.

## ✅ Pre-Deployment Checklist

Before running the deployment script, ensure:

- [ ] DNS is configured: `kukunisisi.co.ke` → `167.86.123.246`
- [ ] DNS is configured: `www.kukunisisi.co.ke` → `167.86.123.246`
- [ ] VPS has at least 20GB disk space
- [ ] VPS has at least 2GB RAM
- [ ] SSH access to VPS is working: `ssh root@167.86.123.246`
- [ ] Git repository is accessible
- [ ] Email address ready for SSL certificate (e.g., admin@kukunisisi.co.ke)
- [ ] Database password saved: `Mwa$0152`

## 🚀 Quick Start Deployment

### 1. Connect to VPS

```bash
ssh root@167.86.123.246
```

### 2. Clone Repository

```bash
cd /opt
git clone https://github.com/yourusername/kukushop.git kukunisisi
cd kukunisisi
```

### 3. Run Deployment Script

```bash
sudo ./scripts/deploy_vps.sh https://github.com/yourusername/kukushop main admin@kukunisisi.co.ke
```

The script will:
- ✅ Install Docker and Docker Compose
- ✅ Clone/update the repository
- ✅ Build database with PostgreSQL 15
- ✅ Build and start API server
- ✅ Build and start frontend
- ✅ Generate SSL certificates via Let's Encrypt
- ✅ Start nginx proxy
- ✅ Apply all database migrations

### 4. Monitor Progress

In a new terminal:
```bash
ssh root@167.86.123.246
cd /opt/kukunisisi
docker compose -f docker-compose.prod.yml logs -f
```

### 5. Verify Deployment

Once deployment completes, verify everything is running:

```bash
# Check all services
docker compose -f docker-compose.prod.yml ps

# Run verification script
./scripts/verify-deployment.sh

# Test HTTPS access
curl -I https://kukunisisi.co.ke
```

## 📋 Database Configuration

The deployment uses:
- **Username**: mike_admin
- **Password**: Mwa$0152
- **Database**: speedy_bites
- **Port**: 5432 (internal to Docker)
- **Image**: PostgreSQL 15

Database credentials are automatically set in docker-compose files.

## 🔐 Post-Deployment Security

After successful deployment:

### 1. Create Admin User

```bash
cd /opt/kukunisisi
docker compose -f docker-compose.prod.yml exec server node server/scripts/reset-admin-password.cjs admin@example.com secure_password_here
```

### 2. Configure Firewall

```bash
ufw enable
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
```

### 3. Change Root Password

```bash
passwd
```

### 4. Update System

```bash
apt update && apt upgrade -y
```

## 📊 Monitoring and Logs

### View All Logs

```bash
docker compose -f docker-compose.prod.yml logs -f
```

### View Service-Specific Logs

```bash
# Nginx proxy
docker compose -f docker-compose.prod.yml logs -f proxy

# API Server
docker compose -f docker-compose.prod.yml logs -f server

# Database
docker compose -f docker-compose.prod.yml logs -f db

# Frontend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Check Service Status

```bash
docker compose -f docker-compose.prod.yml ps
```

## 🔄 Common Operations

### Restart All Services

```bash
cd /opt/kukunisisi
docker compose -f docker-compose.prod.yml restart
```

### Stop All Services

```bash
cd /opt/kukunisisi
docker compose -f docker-compose.prod.yml down
```

### Start All Services

```bash
cd /opt/kukunisisi
docker compose -f docker-compose.prod.yml up -d
```

### Update Application

```bash
cd /opt/kukunisisi
git pull origin main
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Apply Database Migrations

```bash
cd /opt/kukunisisi
for f in server/migrations/*.sql; do
  docker compose -f docker-compose.prod.yml exec db psql -U mike_admin -d speedy_bites -f - < "$f"
done
```

## 💾 Backup Database

### Manual Backup

```bash
cd /opt/kukunisisi
docker compose -f docker-compose.prod.yml exec db pg_dump -U mike_admin speedy_bites > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup

```bash
cd /opt/kukunisisi
docker compose -f docker-compose.prod.yml exec -T db psql -U mike_admin speedy_bites < backup_file.sql
```

## 🆘 Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Ensure ports are available
netstat -tlnp | grep :80
netstat -tlnp | grep :443
netstat -tlnp | grep :4000
```

### Database Connection Issues

```bash
# Test database connectivity
docker compose -f docker-compose.prod.yml exec server nc -zv db 5432

# Check database status
docker compose -f docker-compose.prod.yml exec db pg_isready -U mike_admin
```

### SSL Certificate Issues

```bash
# Check certificate status
docker compose -f docker-compose.prod.yml logs proxy

# Check certificate files
ls -la /opt/kukunisisi/certs/live/kukunisisi.co.ke/

# Check certificate expiry
openssl x509 -in /opt/kukunisisi/certs/live/kukunisisi.co.ke/fullchain.pem -noout -enddate
```

### Port Already in Use

```bash
# Find process using port 80
lsof -i :80

# Find process using port 443
lsof -i :443

# Kill the process (if needed)
kill -9 <PID>
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Check upload directory size
du -sh /var/lib/kukunisisi/uploads

# Clean up Docker
docker system prune -a
```

## 📞 Support Resources

- **Full Documentation**: See `docs/VPS_DEPLOYMENT.md`
- **Verification Script**: Run `./scripts/verify-deployment.sh`
- **Logs**: `docker compose -f docker-compose.prod.yml logs -f`
- **GitHub Issues**: Check project repository

## 📝 Environment Variables

Key environment variables in `.env`:

```env
# Database
DATABASE_URL=postgresql://mike_admin:Mwa$0152@db:5432/speedy_bites

# M-Pesa Integration
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=...
MPESA_PASSKEY=...

# Upload Configuration
UPLOAD_DIR=/var/lib/kukunisisi/uploads
LOG_DIR=/var/log/kukunisisi

# Application
NODE_ENV=production
CORS_ORIGIN=https://kukunisisi.co.ke
```

## 🔍 Health Check Endpoints

Once deployed, test these endpoints:

```bash
# Frontend (should return 200)
curl -I https://kukunisisi.co.ke/

# API Health (if available)
curl https://kukunisisi.co.ke/api/health

# Check SSL Certificate
curl -I --insecure https://kukunisisi.co.ke/ 2>&1 | grep SSL
```

---

**Version**: 1.0
**Last Updated**: May 21, 2026
**Database**: PostgreSQL 15
**Supported OS**: Ubuntu 20.04 LTS and newer
