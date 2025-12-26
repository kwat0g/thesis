# Internal Manufacturing ERP - Project Structure

## Overview
This document outlines the complete folder structure for the Internal Manufacturing ERP system following strict layered architecture principles.

---

## Root Directory Structure

```
thesis/
├── src/
│   ├── app/                          # Next.js App Router (Presentation Layer)
│   ├── components/                   # React Components (UI Layer)
│   ├── lib/                          # Core Libraries
│   │   ├── api/                      # API Layer (Backend Routes)
│   │   ├── services/                 # Service Layer (Business Logic)
│   │   ├── repositories/             # Repository Layer (Data Access)
│   │   ├── database/                 # Database Configuration
│   │   ├── models/                   # Database Models/Schemas
│   │   ├── middleware/               # Middleware (Auth, RBAC, Logging)
│   │   ├── utils/                    # Utility Functions
│   │   └── types/                    # TypeScript Type Definitions
│   └── hooks/                        # React Custom Hooks
├── public/                           # Static Assets
├── database/
│   ├── migrations/                   # Database Migrations
│   └── seeders/                      # Database Seeders
├── docs/                             # Documentation
├── tests/                            # Test Files
├── .env.local                        # Environment Variables
├── .env.example                      # Environment Variables Template
├── next.config.js                    # Next.js Configuration
├── tailwind.config.ts                # Tailwind CSS Configuration
├── tsconfig.json                     # TypeScript Configuration
└── package.json                      # Dependencies
```

---

## Detailed Structure

### 1. Presentation Layer (`src/app/`)

```
src/app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx                  # Login Page
│   └── layout.tsx                    # Auth Layout
├── (dashboard)/
│   ├── layout.tsx                    # Main Dashboard Layout
│   ├── page.tsx                      # Dashboard Home
│   ├── master-data/
│   │   ├── departments/
│   │   │   ├── page.tsx              # Departments List
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Department Details
│   │   │   └── new/
│   │   │       └── page.tsx          # New Department
│   │   ├── employees/
│   │   ├── items/
│   │   ├── suppliers/
│   │   ├── machines/
│   │   ├── molds/
│   │   └── warehouses/
│   ├── production/
│   │   ├── orders/
│   │   ├── schedules/
│   │   ├── work-orders/
│   │   └── bom/
│   ├── mrp/
│   │   ├── runs/
│   │   └── requirements/
│   ├── purchasing/
│   │   ├── purchase-requests/
│   │   └── purchase-orders/
│   ├── inventory/
│   │   ├── balances/
│   │   ├── transactions/
│   │   ├── receipts/
│   │   └── issues/
│   ├── quality/
│   │   ├── inspections/
│   │   ├── ncr/
│   │   └── parameters/
│   ├── hr/
│   │   ├── attendance/
│   │   └── leave/
│   ├── accounting/
│   │   ├── payroll/
│   │   └── accounts-payable/
│   ├── maintenance/
│   │   ├── schedules/
│   │   └── records/
│   ├── mold-management/
│   │   ├── usage/
│   │   └── repairs/
│   └── reports/
│       └── dashboards/
├── api/                              # API Routes (Backend)
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.ts
│   │   ├── logout/
│   │   │   └── route.ts
│   │   └── me/
│   │       └── route.ts
│   ├── master-data/
│   │   ├── departments/
│   │   │   ├── route.ts              # GET, POST
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET, PUT, DELETE
│   │   ├── employees/
│   │   ├── items/
│   │   ├── suppliers/
│   │   ├── machines/
│   │   ├── molds/
│   │   └── warehouses/
│   ├── production/
│   │   ├── orders/
│   │   ├── schedules/
│   │   ├── work-orders/
│   │   └── bom/
│   ├── mrp/
│   │   ├── runs/
│   │   └── requirements/
│   ├── purchasing/
│   │   ├── purchase-requests/
│   │   └── purchase-orders/
│   ├── inventory/
│   │   ├── balances/
│   │   ├── transactions/
│   │   ├── receipts/
│   │   └── issues/
│   ├── quality/
│   │   ├── inspections/
│   │   └── ncr/
│   ├── hr/
│   │   ├── attendance/
│   │   └── leave/
│   ├── accounting/
│   │   ├── payroll/
│   │   └── ap/
│   ├── maintenance/
│   └── notifications/
├── globals.css                       # Global Styles
└── layout.tsx                        # Root Layout
```

### 2. Components Layer (`src/components/`)

```
src/components/
├── ui/                               # Base UI Components (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── dropdown-menu.tsx
│   ├── form.tsx
│   ├── label.tsx
│   ├── toast.tsx
│   └── ...
├── layout/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── Navbar.tsx
│   └── Footer.tsx
├── auth/
│   ├── LoginForm.tsx
│   └── ProtectedRoute.tsx
├── master-data/
│   ├── DepartmentForm.tsx
│   ├── DepartmentList.tsx
│   ├── EmployeeForm.tsx
│   ├── EmployeeList.tsx
│   ├── ItemForm.tsx
│   ├── ItemList.tsx
│   └── ...
├── production/
│   ├── ProductionOrderForm.tsx
│   ├── ProductionOrderList.tsx
│   ├── WorkOrderForm.tsx
│   ├── BOMForm.tsx
│   └── ...
├── purchasing/
│   ├── PRForm.tsx
│   ├── PRList.tsx
│   ├── PRApprovalCard.tsx
│   ├── POForm.tsx
│   └── ...
├── inventory/
│   ├── StockBalanceTable.tsx
│   ├── GoodsReceiptForm.tsx
│   ├── GoodsIssueForm.tsx
│   └── ...
├── quality/
│   ├── InspectionForm.tsx
│   ├── NCRForm.tsx
│   └── ...
├── hr/
│   ├── AttendanceTable.tsx
│   ├── LeaveRequestForm.tsx
│   └── ...
├── accounting/
│   ├── PayrollTable.tsx
│   ├── APInvoiceForm.tsx
│   └── ...
├── dashboards/
│   ├── ProductionDashboard.tsx
│   ├── InventoryDashboard.tsx
│   ├── ManagementDashboard.tsx
│   └── ...
├── notifications/
│   ├── NotificationBell.tsx
│   └── NotificationList.tsx
└── common/
    ├── DataTable.tsx
    ├── StatusBadge.tsx
    ├── ConfirmDialog.tsx
    ├── LoadingSpinner.tsx
    └── ErrorMessage.tsx
```

### 3. Service Layer (`src/lib/services/`)

```
src/lib/services/
├── auth/
│   ├── authService.ts                # Authentication logic
│   └── rbacService.ts                # Role-based access control
├── master-data/
│   ├── departmentService.ts
│   ├── employeeService.ts
│   ├── itemService.ts
│   ├── supplierService.ts
│   ├── machineService.ts
│   ├── moldService.ts
│   └── warehouseService.ts
├── production/
│   ├── productionOrderService.ts
│   ├── productionScheduleService.ts
│   ├── workOrderService.ts
│   └── bomService.ts
├── mrp/
│   ├── mrpService.ts                 # MRP calculation logic
│   └── requirementService.ts
├── purchasing/
│   ├── purchaseRequestService.ts
│   ├── purchaseOrderService.ts
│   └── approvalService.ts            # Approval workflow logic
├── inventory/
│   ├── inventoryService.ts
│   ├── goodsReceiptService.ts
│   ├── goodsIssueService.ts
│   └── reservationService.ts
├── quality/
│   ├── inspectionService.ts
│   └── ncrService.ts
├── hr/
│   ├── attendanceService.ts
│   └── leaveService.ts
├── accounting/
│   ├── payrollService.ts
│   └── apService.ts
├── maintenance/
│   └── maintenanceService.ts
├── mold/
│   └── moldManagementService.ts
└── notification/
    └── notificationService.ts
```

### 4. Repository Layer (`src/lib/repositories/`)

```
src/lib/repositories/
├── auth/
│   ├── userRepository.ts
│   ├── roleRepository.ts
│   └── auditLogRepository.ts
├── master-data/
│   ├── departmentRepository.ts
│   ├── employeeRepository.ts
│   ├── itemRepository.ts
│   ├── supplierRepository.ts
│   ├── machineRepository.ts
│   ├── moldRepository.ts
│   └── warehouseRepository.ts
├── production/
│   ├── productionOrderRepository.ts
│   ├── productionScheduleRepository.ts
│   ├── workOrderRepository.ts
│   └── bomRepository.ts
├── mrp/
│   ├── mrpRunRepository.ts
│   └── mrpRequirementRepository.ts
├── purchasing/
│   ├── purchaseRequestRepository.ts
│   └── purchaseOrderRepository.ts
├── inventory/
│   ├── inventoryBalanceRepository.ts
│   ├── inventoryTransactionRepository.ts
│   ├── goodsReceiptRepository.ts
│   └── goodsIssueRepository.ts
├── quality/
│   ├── inspectionRepository.ts
│   └── ncrRepository.ts
├── hr/
│   ├── attendanceRepository.ts
│   └── leaveRepository.ts
├── accounting/
│   ├── payrollRepository.ts
│   └── apRepository.ts
├── maintenance/
│   └── maintenanceRepository.ts
├── mold/
│   └── moldUsageRepository.ts
└── notification/
    └── notificationRepository.ts
```

### 5. Database Layer (`src/lib/database/`)

```
src/lib/database/
├── connection.ts                     # MySQL connection pool
├── query.ts                          # Query execution wrapper
└── transaction.ts                    # Transaction management
```

### 6. Models Layer (`src/lib/models/`)

```
src/lib/models/
├── auth/
│   ├── User.ts
│   ├── Role.ts
│   ├── Permission.ts
│   └── AuditLog.ts
├── master-data/
│   ├── Department.ts
│   ├── Employee.ts
│   ├── Item.ts
│   ├── Supplier.ts
│   ├── Machine.ts
│   ├── Mold.ts
│   └── Warehouse.ts
├── production/
│   ├── ProductionOrder.ts
│   ├── ProductionSchedule.ts
│   ├── WorkOrder.ts
│   └── BOM.ts
├── purchasing/
│   ├── PurchaseRequest.ts
│   └── PurchaseOrder.ts
├── inventory/
│   ├── InventoryBalance.ts
│   ├── InventoryTransaction.ts
│   ├── GoodsReceipt.ts
│   └── GoodsIssue.ts
├── quality/
│   ├── Inspection.ts
│   └── NCR.ts
├── hr/
│   ├── Attendance.ts
│   └── LeaveRequest.ts
├── accounting/
│   ├── Payroll.ts
│   └── APInvoice.ts
└── index.ts                          # Model exports
```

### 7. Middleware Layer (`src/lib/middleware/`)

```
src/lib/middleware/
├── auth.ts                           # JWT authentication
├── rbac.ts                           # Role-based access control
├── audit.ts                          # Audit logging
├── validation.ts                     # Request validation
└── errorHandler.ts                   # Error handling
```

### 8. Utils Layer (`src/lib/utils/`)

```
src/lib/utils/
├── jwt.ts                            # JWT utilities
├── bcrypt.ts                         # Password hashing
├── date.ts                           # Date formatting
├── number.ts                         # Number formatting
├── validation.ts                     # Validation helpers
├── response.ts                       # API response helpers
└── cn.ts                             # Class name utilities
```

### 9. Types Layer (`src/lib/types/`)

```
src/lib/types/
├── auth.ts
├── master-data.ts
├── production.ts
├── purchasing.ts
├── inventory.ts
├── quality.ts
├── hr.ts
├── accounting.ts
├── api.ts
└── common.ts
```

### 10. Hooks Layer (`src/hooks/`)

```
src/hooks/
├── useAuth.ts
├── usePermissions.ts
├── useDepartments.ts
├── useEmployees.ts
├── useItems.ts
├── useProductionOrders.ts
├── usePurchaseRequests.ts
├── useInventory.ts
├── useNotifications.ts
└── useToast.ts
```

### 11. Database Migrations (`database/migrations/`)

```
database/migrations/
├── 001_create_auth_tables.sql
├── 002_create_master_data_tables.sql
├── 003_create_production_tables.sql
├── 004_create_mrp_tables.sql
├── 005_create_purchasing_tables.sql
├── 006_create_inventory_tables.sql
├── 007_create_quality_tables.sql
├── 008_create_hr_tables.sql
├── 009_create_accounting_tables.sql
├── 010_create_maintenance_tables.sql
├── 011_create_mold_tables.sql
├── 012_create_notification_tables.sql
└── 013_create_indexes.sql
```

### 12. Database Seeders (`database/seeders/`)

```
database/seeders/
├── 001_seed_roles_permissions.sql
├── 002_seed_admin_user.sql
├── 003_seed_departments.sql
├── 004_seed_uom.sql
├── 005_seed_shifts.sql
└── 006_seed_warehouses.sql
```

### 13. Documentation (`docs/`)

```
docs/
├── DATABASE_SCHEMA.md
├── PROJECT_STRUCTURE.md
├── API_DOCUMENTATION.md
├── DEPLOYMENT_GUIDE.md
├── USER_MANUAL.md
└── DEVELOPER_GUIDE.md
```

---

## Layer Responsibilities

### Presentation Layer (React Components + Pages)
- **Responsibility**: UI rendering, user interaction, form handling
- **No**: Business logic, database access, direct API calls to external services
- **Yes**: Call hooks, display data, handle user events

### API Layer (Next.js API Routes)
- **Responsibility**: HTTP request handling, authentication, authorization, validation
- **No**: Business logic, direct database access
- **Yes**: Call service layer, return responses, handle errors

### Service Layer (Business Logic)
- **Responsibility**: All business rules, calculations, workflows, approvals
- **No**: HTTP handling, database queries
- **Yes**: Orchestrate repositories, implement business logic, enforce rules

### Repository Layer (Data Access)
- **Responsibility**: Database queries, data persistence
- **No**: Business logic, HTTP handling
- **Yes**: CRUD operations, complex queries, transactions

### Database Layer
- **Responsibility**: Connection management, query execution
- **No**: Business logic, data transformation
- **Yes**: Execute queries, manage connections, handle transactions

---

## Naming Conventions

### Files
- **Components**: PascalCase (e.g., `ProductionOrderForm.tsx`)
- **Services**: camelCase with Service suffix (e.g., `productionOrderService.ts`)
- **Repositories**: camelCase with Repository suffix (e.g., `productionOrderRepository.ts`)
- **API Routes**: kebab-case (e.g., `purchase-orders/route.ts`)
- **Pages**: kebab-case (e.g., `purchase-orders/page.tsx`)

### Functions
- **Services**: camelCase verbs (e.g., `createProductionOrder`, `calculateMRP`)
- **Repositories**: camelCase CRUD (e.g., `findById`, `create`, `update`, `delete`)
- **Components**: PascalCase (e.g., `ProductionOrderForm`)

### Variables
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_APPROVAL_LEVELS`)
- **Regular**: camelCase (e.g., `productionOrder`, `totalAmount`)

---

## Import Order

1. External libraries (React, Next.js, etc.)
2. Internal components
3. Services
4. Repositories
5. Types
6. Utils
7. Styles

---

This structure ensures clear separation of concerns, maintainability, and scalability for the ERP system.
