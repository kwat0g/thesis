# Deployment Guide - Internal Manufacturing ERP System

## Overview

This guide provides step-by-step instructions for deploying the Internal Manufacturing ERP System in a production environment.

---

## System Requirements

### Hardware Requirements

**Minimum:**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 100 GB SSD
- Network: 100 Mbps LAN

**Recommended:**
- CPU: 8+ cores
- RAM: 16+ GB
- Storage: 500 GB SSD (RAID 1)
- Network: 1 Gbps LAN
- Backup Storage: 1 TB

### Software Requirements

- **Operating System**: Ubuntu 20.04 LTS / Windows Server 2019+ / CentOS 8+
- **Node.js**: 18.x or higher
- **MySQL**: 8.0 or higher
- **Web Server**: Nginx (recommended) or Apache
- **Process Manager**: PM2 (for Node.js)

---

## Pre-Deployment Checklist

- [ ] Server provisioned and accessible
- [ ] MySQL 8.0+ installed and configured
- [ ] Node.js 18+ installed
- [ ] Firewall configured
- [ ] SSL certificate obtained (if using HTTPS)
- [ ] Backup strategy defined
- [ ] Database credentials prepared
- [ ] JWT secret key generated
- [ ] Network configuration completed

---

## Installation Steps

### 1. Server Preparation

#### Ubuntu/Linux
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL 8.0
sudo apt install -y mysql-server

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

#### Windows Server
1. Download and install Node.js 18.x from nodejs.org
2. Download and install MySQL 8.0 from mysql.com
3. Download and install Git from git-scm.com
4. Install PM2: `npm install -g pm2`

### 2. MySQL Database Setup

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database
CREATE DATABASE manufacturing_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create dedicated user
CREATE USER 'erp_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON manufacturing_erp.* TO 'erp_user'@'localhost';
FLUSH PRIVILEGES;

# Configure MySQL for production
# Edit /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 4G
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 2
query_cache_size = 0
query_cache_type = 0

# Restart MySQL
sudo systemctl restart mysql
```

### 3. Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/erp
sudo chown -R $USER:$USER /var/www/erp

# Clone repository
cd /var/www/erp
git clone <repository-url> .

# Install dependencies
npm ci --production

# Create environment file
cp .env.example .env

# Edit .env with production values
nano .env
```

### 4. Environment Configuration

Edit `/var/www/erp/.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=erp_user
DB_PASSWORD=strong_password_here
DB_NAME=manufacturing_erp

# JWT Configuration
JWT_SECRET=generate_a_strong_random_secret_key_here
JWT_EXPIRES_IN=8h

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://your-server-ip:3000

# Session Configuration
SESSION_SECRET=generate_another_strong_random_secret_key

# Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/var/www/erp/uploads

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100

# Notification Configuration
NOTIFICATION_RETENTION_DAYS=30

# Audit Log Configuration
AUDIT_LOG_RETENTION_DAYS=365
```

### 5. Database Migration

```bash
# Run migrations in order
cd /var/www/erp

mysql -u erp_user -p manufacturing_erp < database/migrations/001_create_auth_tables.sql
mysql -u erp_user -p manufacturing_erp < database/migrations/002_create_master_data_tables.sql
mysql -u erp_user -p manufacturing_erp < database/migrations/003_create_production_tables.sql
mysql -u erp_user -p manufacturing_erp < database/migrations/004_create_mrp_tables.sql
mysql -u erp_user -p manufacturing_erp < database/migrations/005_create_purchasing_tables.sql
mysql -u erp_user -p manufacturing_erp < database/migrations/006_create_inventory_tables.sql
mysql -u erp_user -p manufacturing_erp < database/migrations/007_create_quality_tables.sql
mysql -u erp_user -p manufacturing_erp < database/migrations/008_create_hr_tables.sql
mysql -u erp_user -p manufacturing_erp < database/migrations/009_create_accounting_tables.sql
mysql -u erp_user -p manufacturing_erp < database/migrations/010_create_maintenance_tables.sql
mysql -u erp_user -p manufacturing_erp < database/migrations/011_create_mold_tables.sql
mysql -u erp_user -p manufacturing_erp < database/migrations/012_create_notification_tables.sql
mysql -u erp_user -p manufacturing_erp < database/migrations/013_create_indexes.sql

# Run seeders
mysql -u erp_user -p manufacturing_erp < database/seeders/001_seed_roles_permissions.sql
mysql -u erp_user -p manufacturing_erp < database/seeders/002_seed_admin_user.sql
mysql -u erp_user -p manufacturing_erp < database/seeders/003_seed_departments.sql
mysql -u erp_user -p manufacturing_erp < database/seeders/004_seed_uom.sql
mysql -u erp_user -p manufacturing_erp < database/seeders/005_seed_shifts.sql
mysql -u erp_user -p manufacturing_erp < database/seeders/006_seed_warehouses.sql
```

### 6. Build Application

```bash
cd /var/www/erp
npm run build
```

### 7. Configure PM2

Create PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'manufacturing-erp',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/erp',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/erp/error.log',
    out_file: '/var/log/erp/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
}
```

Create log directory:
```bash
sudo mkdir -p /var/log/erp
sudo chown -R $USER:$USER /var/log/erp
```

Start application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 8. Configure Nginx (Reverse Proxy)

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/erp
```

```nginx
upstream erp_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-server-ip-or-domain;

    client_max_body_size 10M;

    location / {
        proxy_pass http://erp_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static {
        proxy_pass http://erp_backend;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Configure Firewall

```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

---

## Security Hardening

### 1. MySQL Security

```bash
# Run MySQL secure installation
sudo mysql_secure_installation

# Disable remote root login
# Edit /etc/mysql/mysql.conf.d/mysqld.cnf
bind-address = 127.0.0.1
```

### 2. Application Security

- Change default admin password immediately
- Use strong JWT secret (minimum 32 characters)
- Enable HTTPS with SSL certificate
- Implement rate limiting
- Regular security updates

### 3. File Permissions

```bash
# Set proper ownership
sudo chown -R www-data:www-data /var/www/erp

# Set proper permissions
sudo find /var/www/erp -type d -exec chmod 755 {} \;
sudo find /var/www/erp -type f -exec chmod 644 {} \;

# Protect sensitive files
chmod 600 /var/www/erp/.env
```

---

## Backup Strategy

### 1. Database Backup

Create backup script:

```bash
sudo nano /usr/local/bin/erp-backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/erp"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="manufacturing_erp"
DB_USER="erp_user"
DB_PASS="strong_password_here"

mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

Make executable and schedule:
```bash
sudo chmod +x /usr/local/bin/erp-backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/erp-backup.sh >> /var/log/erp/backup.log 2>&1
```

### 2. Application Backup

```bash
# Backup application files
tar -czf /var/backups/erp/app_$(date +%Y%m%d).tar.gz /var/www/erp
```

---

## Monitoring

### 1. PM2 Monitoring

```bash
# View logs
pm2 logs manufacturing-erp

# Monitor processes
pm2 monit

# View status
pm2 status
```

### 2. MySQL Monitoring

```bash
# Check MySQL status
sudo systemctl status mysql

# Monitor queries
mysql -u root -p -e "SHOW PROCESSLIST;"

# Check slow queries
mysql -u root -p -e "SHOW VARIABLES LIKE 'slow_query%';"
```

### 3. System Monitoring

```bash
# CPU and Memory
htop

# Disk usage
df -h

# Network
netstat -tuln
```

---

## Maintenance

### 1. Regular Updates

```bash
# Update application
cd /var/www/erp
git pull
npm ci --production
npm run build
pm2 restart manufacturing-erp

# Update system
sudo apt update && sudo apt upgrade -y
```

### 2. Database Maintenance

```bash
# Optimize tables
mysql -u erp_user -p manufacturing_erp -e "OPTIMIZE TABLE audit_logs, inventory_transactions;"

# Analyze tables
mysql -u erp_user -p manufacturing_erp -e "ANALYZE TABLE production_orders, work_orders;"
```

### 3. Log Rotation

Create logrotate configuration:

```bash
sudo nano /etc/logrotate.d/erp
```

```
/var/log/erp/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs manufacturing-erp --lines 100

# Check environment variables
pm2 env 0

# Restart application
pm2 restart manufacturing-erp
```

### Database Connection Issues

```bash
# Test MySQL connection
mysql -u erp_user -p manufacturing_erp

# Check MySQL status
sudo systemctl status mysql

# Review MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### Performance Issues

```bash
# Check system resources
htop
free -h
df -h

# Check MySQL performance
mysql -u root -p -e "SHOW STATUS LIKE 'Threads%';"
mysql -u root -p -e "SHOW STATUS LIKE 'Slow_queries';"

# Restart services
pm2 restart manufacturing-erp
sudo systemctl restart mysql
sudo systemctl restart nginx
```

---

## Rollback Procedure

### 1. Application Rollback

```bash
# Stop application
pm2 stop manufacturing-erp

# Restore previous version
cd /var/www/erp
git checkout <previous-commit-hash>
npm ci --production
npm run build

# Restart application
pm2 restart manufacturing-erp
```

### 2. Database Rollback

```bash
# Stop application
pm2 stop manufacturing-erp

# Restore database
mysql -u erp_user -p manufacturing_erp < /var/backups/erp/db_YYYYMMDD_HHMMSS.sql

# Restart application
pm2 restart manufacturing-erp
```

---

## Support and Maintenance Contacts

- **System Administrator**: [Contact Info]
- **Database Administrator**: [Contact Info]
- **Application Support**: [Contact Info]

---

## Appendix

### A. Useful Commands

```bash
# PM2 Commands
pm2 list
pm2 restart manufacturing-erp
pm2 stop manufacturing-erp
pm2 delete manufacturing-erp
pm2 logs manufacturing-erp

# MySQL Commands
mysql -u erp_user -p manufacturing_erp
SHOW TABLES;
SHOW PROCESSLIST;
SHOW STATUS;

# Nginx Commands
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx
```

### B. Default Credentials

- **Username**: admin
- **Password**: admin123
- **⚠️ CHANGE IMMEDIATELY AFTER FIRST LOGIN**

### C. Port Configuration

- Application: 3000 (internal)
- Nginx: 80 (HTTP), 443 (HTTPS)
- MySQL: 3306 (localhost only)

---

**End of Deployment Guide**
