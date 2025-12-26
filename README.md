# Internal Manufacturing ERP System

A comprehensive, production-grade ERP system designed specifically for internal manufacturing operations. Built with Next.js, TypeScript, React, and MySQL.

## System Overview

This ERP system is designed for **internal manufacturing operations only** - no customer or supplier portals. It's a LAN-based, offline-capable system focused on manufacturing workflows with strong role-based access control, approval workflows, and full audit logging.

## Technology Stack

- **Frontend**: React 18 + Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MySQL 8.0+
- **Authentication**: JWT
- **Language**: TypeScript
- **Architecture**: Layered Modular Monolith

## Core Features

### 1. Authentication & Security
- JWT-based authentication
- Role-Based Access Control (RBAC)
- Comprehensive audit logging
- Session management

### 2. Master Data Management
- Departments & Employees
- Items (Raw Materials, Components, Finished Goods)
- Suppliers
- Machines & Molds
- Warehouses & Units of Measure

### 3. Production Management
- Internal Production Orders
- Production Scheduling
- Work Order Execution
- Bill of Materials (BOM)
- Production Output Recording
- Downtime Tracking

### 4. Material Requirements Planning (MRP)
- Automated material requirement calculation
- Shortage identification
- Auto-generation of Purchase Requests
- Capacity planning

### 5. Purchasing
- Purchase Request (PR) with approval workflow
- Purchase Order (PO) with approval workflow
- Supplier management
- PO tracking

### 6. Inventory & Warehouse
- Real-time inventory balances
- Goods Receipt from suppliers
- Goods Issue to production
- Inventory status tracking (Available, Reserved, Under Inspection, Rejected)
- Reorder level alerts

### 7. Quality Control
- Incoming, in-process, and final inspections
- Accept/Reject decisions
- Non-Conformance Reports (NCR)
- Rework handling
- QC parameters management

### 8. HR & Attendance
- Employee records management
- Attendance tracking (biometric integration ready)
- Leave management with approval workflow
- Payroll input preparation

### 9. Accounting
- Accounts Payable (AP)
- Supplier invoice management
- AP aging reports
- Payroll finalization and release
- Payment processing

### 10. Maintenance Management
- Preventive maintenance scheduling
- Breakdown reporting
- Maintenance history tracking
- Cost tracking

### 11. Mold Management
- Mold usage tracking
- Shot counting
- Repair history
- Availability status

### 12. Management Dashboards
- Production status overview
- Inventory snapshot
- Open PRs/POs tracking
- AP aging summary
- Real-time KPIs

### 13. Notifications & Alerts
- Pending approval notifications
- Low stock alerts
- Overdue AP warnings
- Production delay notifications

## User Roles

### System Admin
- Full system configuration
- Read-only access to business data
- Cannot create/edit/approve transactions

### HR
- Employee records management
- Attendance validation
- Payroll preparation
- **Cannot release payroll**

### Accounting
- Finalize and release payroll
- Manage Accounts Payable
- Financial control

### Purchasing
- PR & PO processing
- **Cannot approve own requests**

### Production Planner
- Production orders
- Scheduling
- MRP execution
- **Cannot execute production**

### Production Supervisor
- Execute work orders
- Assign operators
- Record output and downtime

### Production Operator
- Record production output only

### QC Inspector
- Perform inspections
- Create NCRs
- Quality decisions

### Warehouse
- Inventory management
- Goods receipt/issue

### Maintenance
- Maintenance scheduling
- Breakdown handling

### Management
- Read-only dashboards
- Approval authority

## Installation

### Prerequisites

- Node.js 18+ and npm 9+
- MySQL 8.0+
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/kwat0g/thesis.git
   cd thesis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=manufacturing_erp
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Create database**
   ```sql
   CREATE DATABASE manufacturing_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

5. **Run database migrations**
   ```bash
   # Execute migration files in order
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

6. **Run database seeders**
   ```bash
   # Execute seeder files in order
   mysql -u root -p manufacturing_erp < database/seeders/001_seed_roles_permissions.sql
   mysql -u root -p manufacturing_erp < database/seeders/002_seed_admin_user.sql
   mysql -u root -p manufacturing_erp < database/seeders/003_seed_departments.sql
   mysql -u root -p manufacturing_erp < database/seeders/004_seed_uom.sql
   mysql -u root -p manufacturing_erp < database/seeders/005_seed_shifts.sql
   mysql -u root -p manufacturing_erp < database/seeders/006_seed_warehouses.sql
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

8. **Access the application**
   - URL: http://localhost:3000
   - Default credentials:
     - Username: `admin`
     - Password: `admin123`

## Project Structure

```
thesis/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages
│   │   ├── (dashboard)/       # Dashboard pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── layout/           # Layout components
│   │   └── [modules]/        # Module-specific components
│   ├── lib/
│   │   ├── api/              # API layer
│   │   ├── services/         # Business logic layer
│   │   ├── repositories/     # Data access layer
│   │   ├── database/         # Database connection
│   │   ├── models/           # Data models
│   │   ├── middleware/       # Middleware (Auth, RBAC)
│   │   ├── utils/            # Utility functions
│   │   └── types/            # TypeScript types
│   └── hooks/                # React hooks
├── database/
│   ├── migrations/           # Database migrations
│   └── seeders/              # Database seeders
├── docs/                     # Documentation
└── public/                   # Static assets
```

## Architecture

### Layered Architecture

1. **Presentation Layer** (React Components + Pages)
   - UI rendering and user interaction
   - No business logic or database access

2. **API Layer** (Next.js API Routes)
   - HTTP request handling
   - Authentication and authorization
   - Request validation

3. **Service Layer** (Business Logic)
   - All business rules and calculations
   - Workflow orchestration
   - Approval logic

4. **Repository Layer** (Data Access)
   - Database queries only
   - CRUD operations
   - No business logic

5. **Database Layer** (MySQL)
   - Data persistence
   - ACID compliance

### Key Principles

- **Separation of Concerns**: Each layer has a single responsibility
- **No Logic in Frontend**: UI components only render and handle events
- **No Direct DB Access from API**: All database access through repositories
- **Business Logic in Services**: All rules, calculations, and workflows in service layer
- **RBAC Everywhere**: Role-based access control enforced at all levels
- **Audit Everything**: All critical actions logged

## Development

### Running in Development

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## API Documentation

API endpoints follow RESTful conventions:

- `GET /api/[module]/[resource]` - List resources
- `GET /api/[module]/[resource]/[id]` - Get single resource
- `POST /api/[module]/[resource]` - Create resource
- `PUT /api/[module]/[resource]/[id]` - Update resource
- `DELETE /api/[module]/[resource]/[id]` - Delete resource

All API requests require JWT authentication via `Authorization: Bearer <token>` header.

See `docs/API_DOCUMENTATION.md` for detailed API documentation.

## Security

- **Authentication**: JWT tokens with configurable expiration
- **Password Hashing**: bcrypt with salt rounds
- **RBAC**: Granular permission-based access control
- **Audit Logging**: All critical actions logged with user, timestamp, and changes
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: React's built-in escaping
- **CSRF Protection**: SameSite cookies

## Database

- **Engine**: MySQL 8.0+ with InnoDB
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_unicode_ci
- **Normalization**: 3NF (Third Normal Form)
- **Foreign Keys**: Enforced referential integrity
- **Indexes**: Optimized for common queries
- **Transactions**: ACID-compliant operations

## Backup & Recovery

1. **Database Backups**
   ```bash
   mysqldump -u root -p manufacturing_erp > backup_$(date +%Y%m%d).sql
   ```

2. **Restore from Backup**
   ```bash
   mysql -u root -p manufacturing_erp < backup_20240101.sql
   ```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check credentials in `.env.local`
- Ensure database exists
- Check firewall settings

### Authentication Issues
- Verify JWT_SECRET is set
- Check token expiration
- Clear browser cache/cookies

### Permission Issues
- Verify user roles are assigned
- Check role permissions in database
- Review audit logs for access attempts

## Contributing

This is an academic project. For contributions:

1. Follow the existing code structure
2. Maintain layered architecture
3. Add proper TypeScript types
4. Include comments for complex logic
5. Test thoroughly before committing

## License

Academic/Educational Use Only

## Support

For issues or questions, refer to the documentation in the `docs/` folder.

## Acknowledgments

Built as a comprehensive academic ERP system demonstrating real-world manufacturing workflows and enterprise software architecture.
