# Deployment Configuration Summary

## Changes Made for VPS Deployment

This document summarizes all configuration changes made to support VPS deployment with the database password `Mwa$0152`.

### 1. Docker Compose Configuration Files

#### `/docker-compose.prod.yml`
**Changes:**
- Updated database service to use `mike_admin` instead of `speedy_admin`
- Updated `POSTGRES_PASSWORD` to `Mwa$0152`
- Added health check to database service
- Updated server service environment to use new database credentials
- Removed `extra_hosts` from server service (not needed in Docker network)

**Key Update:**
```yaml
db:
  environment:
    POSTGRES_USER: mike_admin
    POSTGRES_PASSWORD: Mwa$0152  # Updated password
    POSTGRES_DB: speedy_bites
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U mike_admin"]
    interval: 10s
    timeout: 5s
    retries: 5

server:
  environment:
    DATABASE_URL: postgresql://mike_admin:Mwa$0152@db:5432/speedy_bites
```

#### `/docker-compose.yml` (Development)
**Changes:**
- Updated database service to use `mike_admin`
- Updated `POSTGRES_PASSWORD` to `Mwa$0152`
- Added health check to database service
- Updated server DATABASE_URL to reflect new credentials
- Added `depends_on` with health check condition

### 2. Environment Configuration

#### `/.env` (Production)
**Changes:**
- Updated `DATABASE_URL` to use `mike_admin:Mwa$0152@db:5432/speedy_bites`
- Added database pool configuration: `DB_POOL_MIN=2`, `DB_POOL_MAX=20`
- Added environment variables for production:
  - `NODE_ENV=production`
  - `APP_URL=https://kukunisisi.co.ke`
  - `EMAIL_FROM=Kuku ni Sisi <kukunisisi@gmail.com>`
  - `SUPPORT_EMAIL=kukunisisi@gmail.com`
  - `LOG_LEVEL=info`

### 3. Deployment Scripts

#### `/scripts/deploy_vps.sh`
**Changes:**
- Updated migration step to use `mike_admin` instead of `speedy_admin`
- Script now properly runs migrations with correct database credentials

#### `/scripts/deploy.sh`
**Changes:**
- Updated migration step to use `mike_admin` instead of `speedy_admin`
- Added health check condition for database service

### 4. New Documentation Files

#### `/docs/VPS_DEPLOYMENT.md`
Comprehensive VPS deployment guide covering:
- Prerequisites and VPS information
- Pre-deployment checklist
- Step-by-step deployment instructions
- Post-deployment verification
- Database management
- Common operations
- SSL certificate management
- Troubleshooting guide
- Security recommendations

#### `/docs/VPS_QUICK_START.md`
Quick reference guide with:
- Pre-deployment checklist
- Quick start deployment steps
- Database configuration details
- Monitoring and logging
- Common operations
- Troubleshooting
- Support resources

#### `/scripts/verify-deployment.sh`
Automated verification script that checks:
- Docker installation
- Docker Compose availability
- Running services status
- Environment configuration
- Database connectivity
- Disk space
- Upload directory
- SSL certificates
- Generates summary report

## Database Credentials

**Summary:**
- **Username**: mike_admin
- **Password**: Mwa$0152
- **Database**: speedy_bites
- **Port**: 5432 (internal to Docker)
- **Engine**: PostgreSQL 15

These credentials are now consistently used across:
- `docker-compose.prod.yml`
- `docker-compose.yml`
- `.env`
- `scripts/deploy.sh`
- `scripts/deploy_vps.sh`

## Deployment Architecture

The deployment uses Docker Compose with these services:

```
┌─────────────────────────────────────────┐
│         Nginx Proxy (Port 443)          │
│    Handles SSL/TLS, routes requests    │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼────┐
│Frontend │      │  Server │
│ (Port80)│      │(Port4000)│
└────┬────┘      └────┬────┘
     │                │
     └────────┬───────┘
              │
         ┌────▼────────────┐
         │  PostgreSQL DB  │
         │  (Port 5432)    │
         │  Volume: db_data│
         └─────────────────┘
```

## Network Configuration

- **Frontend Container**: Exposed on port 80 (internal)
- **Server Container**: Exposed on port 4000 (internal)
- **Database Container**: Port 5432 (internal, not exposed externally)
- **Nginx Proxy**: Listens on ports 80, 443 (external)

Services communicate within Docker network:
- Nginx → Frontend/Server via service names
- Server → Database via `db:5432`

## File Paths on VPS

```
/opt/kukunisisi/
├── docker-compose.prod.yml
├── .env
├── scripts/
│   ├── deploy_vps.sh
│   ├── deploy.sh
│   └── verify-deployment.sh
├── server/
│   ├── migrations/
│   └── scripts/
└── certs/
    └── live/kukunisisi.co.ke/
        ├── fullchain.pem
        ├── privkey.pem
        └── chain.pem

/var/lib/kukunisisi/
└── uploads/

/var/log/kukunisisi/
├── app.log
└── access.log
```

## Deployment Command

To deploy to VPS:

```bash
sudo ./scripts/deploy_vps.sh https://github.com/yourusername/kukushop main admin@kukunisisi.co.ke
```

**Parameters:**
1. Git repository URL (required)
2. Branch (optional, defaults to "main")
3. Email for SSL certificates (required)

## Verification

After deployment, verify installation:

```bash
# Run verification script
./scripts/verify-deployment.sh

# Check services
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Test HTTPS
curl -I https://kukunisisi.co.ke
```

## Security Considerations

1. ✅ Database credentials are configured in Docker Compose
2. ✅ SSL/TLS enabled via Let's Encrypt
3. ✅ Database not exposed externally (internal network only)
4. ✅ Firewall rules for ports 80, 443, 22 (SSH)
5. ⚠️ **TODO**: Change admin password after first login
6. ⚠️ **TODO**: Configure rate limiting if needed
7. ⚠️ **TODO**: Set up automated backups
8. ⚠️ **TODO**: Enable audit logging

## Maintenance Tasks

### Daily
- Monitor application logs
- Check disk space

### Weekly
- Review error logs
- Check SSL certificate expiry
- Verify database backups

### Monthly
- Update system packages
- Update Docker images
- Test disaster recovery

### Every 3 Months
- Update Node.js dependencies
- Security audit
- Performance optimization

## Next Steps

1. Transfer project to VPS
2. Update DNS records
3. Run deployment script
4. Verify all services
5. Create admin user
6. Configure backups
7. Set up monitoring
8. Document any customizations

---

**Configuration Version**: 1.0
**Database Version**: PostgreSQL 15
**Node Version**: 18+ (recommended)
**OS**: Ubuntu 20.04 LTS or newer
**Docker Version**: 20.10+
**Docker Compose Version**: 2.0+

**Generated**: May 21, 2026
