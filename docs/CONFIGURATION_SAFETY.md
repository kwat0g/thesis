# Configuration Safety Documentation

## Purpose

This document defines the required environment variables and configuration safety checks for the ERP system. It ensures that the application cannot start with missing or insecure configuration.

---

## Required Environment Variables

### Critical Variables (Application Won't Start Without These)

#### 1. DATABASE_URL
**Purpose:** MySQL connection string
**Format:** `mysql://user:password@host:port/database`
**Validation:**
- Must be a valid MySQL connection string
- Must be accessible at startup
- Connection pool must be established

**Example:**
```
DATABASE_URL=mysql://erp_user:secure_password@localhost:3306/manufacturing_erp
```

#### 2. JWT_SECRET
**Purpose:** Secret key for signing JWT tokens
**Security:** CRITICAL - Must be strong and random
**Validation:**
- Must be at least 32 characters
- Should be randomly generated
- Must not be default value

**Generation:**
```bash
openssl rand -base64 32
```

**Example:**
```
JWT_SECRET=Kx9mP2nQ7rS4tU8vW1xY5zA3bC6dE9fG2hJ4kL7mN0pR
```

#### 3. APP_ENV
**Purpose:** Application environment identifier
**Values:** `development`, `staging`, `production`
**Validation:**
- Must be one of the allowed values
- Affects logging, error handling, and security settings

**Example:**
```
APP_ENV=production
```

#### 4. AUDIT_LOG_RETENTION_DAYS
**Purpose:** Number of days to retain audit logs
**Validation:**
- Must be a positive integer
- Minimum: 365 (1 year for compliance)
- Recommended: 2555 (7 years for financial records)

**Example:**
```
AUDIT_LOG_RETENTION_DAYS=2555
```

---

## Optional But Recommended Variables

### 5. SESSION_SECRET
**Purpose:** Secret key for session management
**Security:** HIGH - Should be strong and random
**Default:** Falls back to JWT_SECRET if not set
**Validation:**
- Should be at least 32 characters
- Should be different from JWT_SECRET

### 6. SMTP Configuration
**Purpose:** Email notifications
**Variables:**
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`

**Impact if Missing:**
- Email notifications disabled
- System logs warning
- Users notified via in-app notifications only

### 7. REDIS_URL
**Purpose:** Caching and session storage
**Default:** In-memory cache if not configured
**Impact if Missing:**
- Reduced performance
- No distributed caching
- Sessions not shared across instances

---

## Configuration Validation at Startup

### Validation Script

```typescript
// src/lib/config/validateConfig.ts

import { z } from 'zod';

const configSchema = z.object({
  DATABASE_URL: z.string().url().startsWith('mysql://'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  APP_ENV: z.enum(['development', 'staging', 'production']),
  AUDIT_LOG_RETENTION_DAYS: z.coerce.number().min(365),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  REDIS_URL: z.string().url().optional(),
});

export function validateConfig() {
  try {
    const config = configSchema.parse(process.env);
    
    // Additional security checks
    if (config.APP_ENV === 'production') {
      if (config.JWT_SECRET.includes('CHANGE_THIS')) {
        throw new Error('JWT_SECRET must be changed in production');
      }
      
      if (config.JWT_SECRET.length < 64) {
        console.warn('WARNING: JWT_SECRET should be at least 64 characters in production');
      }
    }
    
    return config;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    process.exit(1);
  }
}
```

### Startup Checks

The application performs these checks on startup:

1. **Environment Variables Loaded**
   - Verify .env file exists (in development)
   - Verify all required variables are set

2. **Database Connection**
   - Test connection to database
   - Verify database schema version
   - Check connection pool size

3. **JWT Configuration**
   - Verify JWT_SECRET is set
   - Verify JWT_SECRET is strong enough
   - Test token generation and verification

4. **File System Permissions**
   - Verify upload directory is writable
   - Verify log directory is writable
   - Verify backup directory is writable (if configured)

5. **External Services**
   - Test SMTP connection (if configured)
   - Test Redis connection (if configured)
   - Verify API endpoints are accessible

---

## Security Hardening Checklist

### Development Environment

✅ Use `.env` file (not committed to git)
✅ Use default passwords for local database
✅ Enable debug logging
✅ Disable rate limiting
✅ Allow CORS from localhost

### Staging Environment

✅ Use strong passwords
✅ Enable moderate logging
✅ Enable rate limiting
✅ Restrict CORS to staging domain
✅ Use staging database
✅ Test backup and restore procedures

### Production Environment

✅ **CRITICAL: Change all default secrets**
✅ Use strong, randomly generated secrets
✅ Enable production logging (errors only)
✅ Enable strict rate limiting
✅ Restrict CORS to production domain
✅ Use SSL/TLS for all connections
✅ Enable database connection encryption
✅ Configure automated backups
✅ Set up monitoring and alerts
✅ Enable audit log archiving
✅ Configure firewall rules
✅ Disable debug endpoints
✅ Enable HTTPS only
✅ Set secure cookie flags
✅ Configure CSP headers

---

## Environment-Specific Configuration

### Development (.env.development)
```bash
NODE_ENV=development
APP_ENV=development
DATABASE_URL=mysql://root:root@localhost:3306/erp_dev
JWT_SECRET=dev_secret_not_for_production
JWT_EXPIRES_IN=24h
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
```

### Staging (.env.staging)
```bash
NODE_ENV=production
APP_ENV=staging
DATABASE_URL=mysql://erp_user:SECURE_PASSWORD@staging-db:3306/erp_staging
JWT_SECRET=GENERATED_SECURE_SECRET_64_CHARS_MINIMUM
JWT_EXPIRES_IN=8h
LOG_LEVEL=info
CORS_ORIGIN=https://staging.example.com
SMTP_HOST=smtp.example.com
REDIS_URL=redis://staging-redis:6379
```

### Production (.env.production)
```bash
NODE_ENV=production
APP_ENV=production
DATABASE_URL=mysql://erp_user:VERY_SECURE_PASSWORD@prod-db:3306/erp_production
JWT_SECRET=GENERATED_SECURE_SECRET_128_CHARS_RECOMMENDED
JWT_EXPIRES_IN=8h
LOG_LEVEL=error
CORS_ORIGIN=https://erp.example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=SECURE_EMAIL_PASSWORD
REDIS_URL=redis://:REDIS_PASSWORD@prod-redis:6379
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
```

---

## Secret Management Best Practices

### 1. Never Commit Secrets to Git
```gitignore
# .gitignore
.env
.env.local
.env.production
.env.staging
*.pem
*.key
secrets/
```

### 2. Use Secret Management Tools

**Recommended Tools:**
- **AWS Secrets Manager** (for AWS deployments)
- **HashiCorp Vault** (for on-premise)
- **Azure Key Vault** (for Azure deployments)
- **Google Secret Manager** (for GCP deployments)

**Example with AWS Secrets Manager:**
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

async function getSecret(secretName: string) {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return JSON.parse(response.SecretString);
}
```

### 3. Rotate Secrets Regularly

**Rotation Schedule:**
- JWT_SECRET: Every 90 days
- Database passwords: Every 90 days
- API keys: Every 180 days
- SMTP passwords: Every 180 days

### 4. Use Different Secrets Per Environment

Never reuse production secrets in staging or development.

---

## Configuration Monitoring

### Health Check Endpoint

```typescript
// /api/health
{
  status: 'healthy',
  database: 'connected',
  redis: 'connected',
  smtp: 'configured',
  version: '1.0.0',
  environment: 'production'
}
```

### Configuration Audit

Log configuration changes:
- When: Configuration file modified
- Who: User or automated process
- What: Which variables changed (not the values)
- Where: Which environment

---

## Troubleshooting

### Common Configuration Issues

#### 1. "JWT_SECRET is required"
**Solution:** Set JWT_SECRET in .env file
```bash
JWT_SECRET=$(openssl rand -base64 32)
```

#### 2. "Database connection failed"
**Checks:**
- Is DATABASE_URL correct?
- Is database server running?
- Are credentials correct?
- Is network accessible?

#### 3. "SMTP configuration invalid"
**Checks:**
- Are SMTP credentials correct?
- Is SMTP port correct (usually 587 or 465)?
- Is firewall blocking SMTP?

#### 4. "Redis connection failed"
**Solution:** Redis is optional, application will work without it
**Impact:** Reduced performance, no distributed caching

---

## Deployment Checklist

### Pre-Deployment

✅ Review .env.example
✅ Create environment-specific .env file
✅ Generate strong secrets
✅ Test database connection
✅ Test SMTP configuration
✅ Verify file permissions
✅ Run configuration validation
✅ Test backup procedures

### Post-Deployment

✅ Verify application starts successfully
✅ Check health endpoint
✅ Verify database migrations ran
✅ Test authentication
✅ Test email notifications
✅ Verify audit logging
✅ Check error logs
✅ Test backup restore

---

**Last Updated:** December 26, 2025
**Maintained By:** ERP DevOps Team
