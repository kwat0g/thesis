# Quick Start Guide - Internal Manufacturing ERP System

## 🚀 Get Started in 5 Minutes

This guide will help you get the ERP system up and running quickly.

---

## Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18+ installed
- ✅ MySQL 8.0+ installed and running
- ✅ Git installed
- ✅ A code editor (VS Code recommended)

---

## Step 1: Install Dependencies

```bash
cd thesis
npm install
```

---

## Step 2: Setup Database

### Create Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE manufacturing_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit MySQL
exit
```

### Run Migrations

Execute migration files in order:

```bash
# Windows (PowerShell)
Get-Content database/migrations/001_create_auth_tables.sql | mysql -u root -p manufacturing_erp
Get-Content database/migrations/002_create_master_data_tables.sql | mysql -u root -p manufacturing_erp
Get-Content database/migrations/003_create_production_tables.sql | mysql -u root -p manufacturing_erp
Get-Content database/migrations/004_create_mrp_tables.sql | mysql -u root -p manufacturing_erp
Get-Content database/migrations/005_create_purchasing_tables.sql | mysql -u root -p manufacturing_erp
Get-Content database/migrations/006_create_inventory_tables.sql | mysql -u root -p manufacturing_erp
Get-Content database/migrations/007_create_quality_tables.sql | mysql -u root -p manufacturing_erp
Get-Content database/migrations/008_create_hr_tables.sql | mysql -u root -p manufacturing_erp
Get-Content database/migrations/009_create_accounting_tables.sql | mysql -u root -p manufacturing_erp
Get-Content database/migrations/010_create_maintenance_tables.sql | mysql -u root -p manufacturing_erp
Get-Content database/migrations/011_create_mold_tables.sql | mysql -u root -p manufacturing_erp
Get-Content database/migrations/012_create_notification_tables.sql | mysql -u root -p manufacturing_erp
Get-Content database/migrations/013_create_indexes.sql | mysql -u root -p manufacturing_erp

# Linux/Mac
mysql -u root -p manufacturing_erp < database/migrations/001_create_auth_tables.sql
mysql -u root -p manufacturing_erp < database/migrations/002_create_master_data_tables.sql
mysql -u root -p manufacturing_erp < database/migrations/003_create_production_tables.sql
mysql -u root -p manufacturing_erp < database/migrations/004_create_mrp_tables.sql
mysql -u root -p manufacturing_erp < database/migrations/005_create_purchasing_tables.sql
mysql -u root -p manufacturing_erp < database/migrations/006_create_inventory_tables.sql
mysql -u root -p manufacturing_erp < database/migrations/007_create_quality_tables.sql
mysql -u root -p manufacturing_erp < database/migrations/008_create_hr_tables.sql
mysql -u root -p manufacturing_erp < database/migrations/009_create_accounting_tables.sql
mysql -u root -p manufacturing_erp < database/migrations/010_create_maintenance_tables.sql
mysql -u root -p manufacturing_erp < database/migrations/011_create_mold_tables.sql
mysql -u root -p manufacturing_erp < database/migrations/012_create_notification_tables.sql
mysql -u root -p manufacturing_erp < database/migrations/013_create_indexes.sql
```

### Run Seeders

```bash
# Windows (PowerShell)
Get-Content database/seeders/001_seed_roles_permissions.sql | mysql -u root -p manufacturing_erp
Get-Content database/seeders/002_seed_admin_user.sql | mysql -u root -p manufacturing_erp
Get-Content database/seeders/003_seed_departments.sql | mysql -u root -p manufacturing_erp
Get-Content database/seeders/004_seed_uom.sql | mysql -u root -p manufacturing_erp
Get-Content database/seeders/005_seed_shifts.sql | mysql -u root -p manufacturing_erp
Get-Content database/seeders/006_seed_warehouses.sql | mysql -u root -p manufacturing_erp

# Linux/Mac
mysql -u root -p manufacturing_erp < database/seeders/001_seed_roles_permissions.sql
mysql -u root -p manufacturing_erp < database/seeders/002_seed_admin_user.sql
mysql -u root -p manufacturing_erp < database/seeders/003_seed_departments.sql
mysql -u root -p manufacturing_erp < database/seeders/004_seed_uom.sql
mysql -u root -p manufacturing_erp < database/seeders/005_seed_shifts.sql
mysql -u root -p manufacturing_erp < database/seeders/006_seed_warehouses.sql
```

---

## Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your settings
```

Update `.env.local`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=manufacturing_erp

JWT_SECRET=your_secret_key_minimum_32_characters_long
JWT_EXPIRES_IN=24h

NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 4: Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

---

## Step 5: Login

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANT**: Change the default password immediately after first login!

---

## 🎉 You're Ready!

The foundation is complete. You can now:

1. **Test the Auth API**:
   ```bash
   # Login request
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

2. **Start implementing modules** following the structure in `docs/IMPLEMENTATION_STATUS.md`

3. **Review the architecture** in `docs/PROJECT_STRUCTURE.md`

4. **Check the database schema** in `docs/DATABASE_SCHEMA.md`

---

## 📚 Next Steps

1. **Implement Master Data Module** (Departments, Employees, Items, etc.)
2. **Build UI Components** (Login page, Dashboard, etc.)
3. **Implement Production Module**
4. **Implement Purchasing Module**
5. **Continue with remaining modules**

See `docs/IMPLEMENTATION_STATUS.md` for detailed implementation roadmap.

---

## 🐛 Troubleshooting

### Database Connection Error
- Verify MySQL is running: `mysql -u root -p`
- Check credentials in `.env.local`
- Ensure database exists: `SHOW DATABASES;`

### Port Already in Use
- Change port in `.env.local`: `PORT=3001`
- Or kill process using port 3000

### Module Not Found Errors
- Run `npm install` again
- Delete `node_modules` and `.next` folders, then `npm install`

---

## 📖 Documentation

- **README.md** - Full project documentation
- **docs/DATABASE_SCHEMA.md** - Complete database schema
- **docs/PROJECT_STRUCTURE.md** - Folder structure guide
- **docs/DEPLOYMENT_GUIDE.md** - Production deployment
- **docs/IMPLEMENTATION_STATUS.md** - Implementation progress

---

## 🤝 Need Help?

1. Check the documentation in `docs/` folder
2. Review the implementation status
3. Check the database schema
4. Review the project structure

---

**Happy Coding! 🚀**
