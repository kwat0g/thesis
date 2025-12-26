# Internal Manufacturing ERP - Database Schema

## Overview
This document describes the complete database schema for the Internal Manufacturing ERP System.
The schema follows normalized relational design with proper foreign keys, audit fields, and ACID compliance.

## Database: MySQL 8.0+

---

## 1. AUTHENTICATION & SECURITY MODULE

### Table: `users`
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  employee_id INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  INDEX idx_username (username),
  INDEX idx_email (email)
);
```

### Table: `roles`
```sql
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_code VARCHAR(50) UNIQUE NOT NULL,
  role_name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role_code (role_code)
);
```

### Table: `permissions`
```sql
CREATE TABLE permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permission_code VARCHAR(100) UNIQUE NOT NULL,
  permission_name VARCHAR(150) NOT NULL,
  module VARCHAR(50) NOT NULL,
  description TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_module (module)
);
```

### Table: `role_permissions`
```sql
CREATE TABLE role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_id, permission_id)
);
```

### Table: `user_roles`
```sql
CREATE TABLE user_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  UNIQUE KEY unique_user_role (user_id, role_id)
);
```

### Table: `audit_logs`
```sql
CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  record_type VARCHAR(50) NOT NULL,
  record_id INT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_action (user_id, action),
  INDEX idx_module (module),
  INDEX idx_created_at (created_at)
);
```

---

## 2. MASTER DATA MODULE

### Table: `departments`
```sql
CREATE TABLE departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dept_code VARCHAR(20) UNIQUE NOT NULL,
  dept_name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  manager_id INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (manager_id) REFERENCES employees(id),
  INDEX idx_dept_code (dept_code)
);
```

### Table: `employees`
```sql
CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_code VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NULL,
  phone VARCHAR(20) NULL,
  department_id INT NULL,
  position VARCHAR(100) NULL,
  hire_date DATE NULL,
  employment_status ENUM('active', 'on_leave', 'resigned', 'terminated') DEFAULT 'active',
  salary DECIMAL(15,2) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  INDEX idx_employee_code (employee_code),
  INDEX idx_department (department_id)
);
```

### Table: `units_of_measure`
```sql
CREATE TABLE units_of_measure (
  id INT PRIMARY KEY AUTO_INCREMENT,
  uom_code VARCHAR(10) UNIQUE NOT NULL,
  uom_name VARCHAR(50) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_uom_code (uom_code)
);
```

### Table: `items`
```sql
CREATE TABLE items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_code VARCHAR(50) UNIQUE NOT NULL,
  item_name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  item_type ENUM('raw_material', 'component', 'finished_good', 'consumable') NOT NULL,
  uom_id INT NOT NULL,
  reorder_level DECIMAL(15,3) DEFAULT 0,
  reorder_quantity DECIMAL(15,3) DEFAULT 0,
  unit_cost DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (uom_id) REFERENCES units_of_measure(id),
  INDEX idx_item_code (item_code),
  INDEX idx_item_type (item_type)
);
```

### Table: `suppliers`
```sql
CREATE TABLE suppliers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supplier_code VARCHAR(20) UNIQUE NOT NULL,
  supplier_name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100) NULL,
  email VARCHAR(100) NULL,
  phone VARCHAR(20) NULL,
  address TEXT NULL,
  payment_terms VARCHAR(50) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  INDEX idx_supplier_code (supplier_code)
);
```

### Table: `machines`
```sql
CREATE TABLE machines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  machine_code VARCHAR(20) UNIQUE NOT NULL,
  machine_name VARCHAR(100) NOT NULL,
  machine_type VARCHAR(50) NULL,
  department_id INT NULL,
  capacity_per_hour DECIMAL(15,3) NULL,
  status ENUM('available', 'in_use', 'maintenance', 'breakdown') DEFAULT 'available',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  INDEX idx_machine_code (machine_code),
  INDEX idx_status (status)
);
```

### Table: `molds`
```sql
CREATE TABLE molds (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mold_code VARCHAR(20) UNIQUE NOT NULL,
  mold_name VARCHAR(100) NOT NULL,
  mold_type VARCHAR(50) NULL,
  cavity_count INT DEFAULT 1,
  status ENUM('available', 'in_use', 'maintenance', 'repair') DEFAULT 'available',
  total_shots INT DEFAULT 0,
  max_shots INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  INDEX idx_mold_code (mold_code),
  INDEX idx_status (status)
);
```

### Table: `warehouses`
```sql
CREATE TABLE warehouses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  warehouse_code VARCHAR(20) UNIQUE NOT NULL,
  warehouse_name VARCHAR(100) NOT NULL,
  location VARCHAR(200) NULL,
  warehouse_type ENUM('raw_material', 'finished_goods', 'general') DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_warehouse_code (warehouse_code)
);
```

---

## 3. PRODUCTION MANAGEMENT MODULE

### Table: `production_orders`
```sql
CREATE TABLE production_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  customer_po_reference VARCHAR(100) NULL,
  item_id INT NOT NULL,
  quantity_ordered DECIMAL(15,3) NOT NULL,
  quantity_produced DECIMAL(15,3) DEFAULT 0,
  required_date DATE NOT NULL,
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  status ENUM('draft', 'released', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id),
  INDEX idx_po_number (po_number),
  INDEX idx_status (status),
  INDEX idx_required_date (required_date)
);
```

### Table: `bom_headers`
```sql
CREATE TABLE bom_headers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  version INT DEFAULT 1,
  effective_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id),
  UNIQUE KEY unique_item_version (item_id, version),
  INDEX idx_item_active (item_id, is_active)
);
```

### Table: `bom_lines`
```sql
CREATE TABLE bom_lines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bom_header_id INT NOT NULL,
  component_item_id INT NOT NULL,
  quantity_per_unit DECIMAL(15,6) NOT NULL,
  scrap_percentage DECIMAL(5,2) DEFAULT 0,
  line_number INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bom_header_id) REFERENCES bom_headers(id) ON DELETE CASCADE,
  FOREIGN KEY (component_item_id) REFERENCES items(id),
  INDEX idx_bom_header (bom_header_id)
);
```

### Table: `production_schedules`
```sql
CREATE TABLE production_schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  production_order_id INT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_quantity DECIMAL(15,3) NOT NULL,
  machine_id INT NULL,
  shift_id INT NULL,
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (production_order_id) REFERENCES production_orders(id),
  FOREIGN KEY (machine_id) REFERENCES machines(id),
  FOREIGN KEY (shift_id) REFERENCES shifts(id),
  INDEX idx_scheduled_date (scheduled_date),
  INDEX idx_status (status)
);
```

### Table: `work_orders`
```sql
CREATE TABLE work_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  wo_number VARCHAR(50) UNIQUE NOT NULL,
  production_order_id INT NOT NULL,
  production_schedule_id INT NULL,
  item_id INT NOT NULL,
  quantity_planned DECIMAL(15,3) NOT NULL,
  quantity_produced DECIMAL(15,3) DEFAULT 0,
  quantity_scrap DECIMAL(15,3) DEFAULT 0,
  quantity_rework DECIMAL(15,3) DEFAULT 0,
  machine_id INT NULL,
  mold_id INT NULL,
  supervisor_id INT NULL,
  start_date DATETIME NULL,
  end_date DATETIME NULL,
  status ENUM('pending', 'released', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (production_order_id) REFERENCES production_orders(id),
  FOREIGN KEY (production_schedule_id) REFERENCES production_schedules(id),
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (machine_id) REFERENCES machines(id),
  FOREIGN KEY (mold_id) REFERENCES molds(id),
  FOREIGN KEY (supervisor_id) REFERENCES employees(id),
  INDEX idx_wo_number (wo_number),
  INDEX idx_status (status)
);
```

### Table: `production_output`
```sql
CREATE TABLE production_output (
  id INT PRIMARY KEY AUTO_INCREMENT,
  work_order_id INT NOT NULL,
  operator_id INT NOT NULL,
  output_date DATETIME NOT NULL,
  quantity_good DECIMAL(15,3) NOT NULL,
  quantity_scrap DECIMAL(15,3) DEFAULT 0,
  quantity_rework DECIMAL(15,3) DEFAULT 0,
  shift_id INT NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL,
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
  FOREIGN KEY (operator_id) REFERENCES employees(id),
  FOREIGN KEY (shift_id) REFERENCES shifts(id),
  INDEX idx_work_order (work_order_id),
  INDEX idx_output_date (output_date)
);
```

### Table: `production_downtime`
```sql
CREATE TABLE production_downtime (
  id INT PRIMARY KEY AUTO_INCREMENT,
  work_order_id INT NOT NULL,
  machine_id INT NULL,
  downtime_start DATETIME NOT NULL,
  downtime_end DATETIME NULL,
  duration_minutes INT NULL,
  reason VARCHAR(200) NOT NULL,
  category ENUM('breakdown', 'changeover', 'material_shortage', 'quality_issue', 'other') NOT NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL,
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
  FOREIGN KEY (machine_id) REFERENCES machines(id),
  INDEX idx_work_order (work_order_id),
  INDEX idx_downtime_start (downtime_start)
);
```

---

## 4. MRP & PLANNING MODULE

### Table: `mrp_runs`
```sql
CREATE TABLE mrp_runs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  run_number VARCHAR(50) UNIQUE NOT NULL,
  run_date DATETIME NOT NULL,
  planning_horizon_days INT DEFAULT 30,
  status ENUM('running', 'completed', 'failed') DEFAULT 'running',
  total_requirements INT DEFAULT 0,
  total_shortages INT DEFAULT 0,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL,
  INDEX idx_run_date (run_date)
);
```

### Table: `mrp_requirements`
```sql
CREATE TABLE mrp_requirements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mrp_run_id INT NOT NULL,
  production_order_id INT NOT NULL,
  item_id INT NOT NULL,
  required_quantity DECIMAL(15,3) NOT NULL,
  available_quantity DECIMAL(15,3) DEFAULT 0,
  shortage_quantity DECIMAL(15,3) DEFAULT 0,
  required_date DATE NOT NULL,
  status ENUM('sufficient', 'shortage', 'pr_created') DEFAULT 'sufficient',
  pr_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mrp_run_id) REFERENCES mrp_runs(id),
  FOREIGN KEY (production_order_id) REFERENCES production_orders(id),
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (pr_id) REFERENCES purchase_requests(id),
  INDEX idx_mrp_run (mrp_run_id),
  INDEX idx_status (status)
);
```

---

## 5. PURCHASING MODULE

### Table: `purchase_requests`
```sql
CREATE TABLE purchase_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pr_number VARCHAR(50) UNIQUE NOT NULL,
  request_date DATE NOT NULL,
  required_date DATE NOT NULL,
  department_id INT NULL,
  requestor_id INT NOT NULL,
  justification TEXT NULL,
  status ENUM('draft', 'pending_approval', 'approved', 'rejected', 'po_created', 'cancelled') DEFAULT 'draft',
  approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT NULL,
  approved_at DATETIME NULL,
  rejection_reason TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (requestor_id) REFERENCES employees(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  INDEX idx_pr_number (pr_number),
  INDEX idx_status (status),
  INDEX idx_approval_status (approval_status)
);
```

### Table: `purchase_request_lines`
```sql
CREATE TABLE purchase_request_lines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pr_id INT NOT NULL,
  line_number INT NOT NULL,
  item_id INT NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  estimated_unit_price DECIMAL(15,2) NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pr_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id),
  INDEX idx_pr (pr_id)
);
```

### Table: `pr_approvals`
```sql
CREATE TABLE pr_approvals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pr_id INT NOT NULL,
  approver_id INT NOT NULL,
  approval_level INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  comments TEXT NULL,
  action_date DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pr_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id),
  INDEX idx_pr (pr_id),
  INDEX idx_status (status)
);
```

### Table: `purchase_orders`
```sql
CREATE TABLE purchase_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  pr_id INT NULL,
  supplier_id INT NOT NULL,
  po_date DATE NOT NULL,
  expected_delivery_date DATE NOT NULL,
  payment_terms VARCHAR(50) NULL,
  total_amount DECIMAL(15,2) DEFAULT 0,
  status ENUM('draft', 'pending_approval', 'approved', 'sent', 'partially_received', 'received', 'cancelled') DEFAULT 'draft',
  approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT NULL,
  approved_at DATETIME NULL,
  rejection_reason TEXT NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (pr_id) REFERENCES purchase_requests(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  INDEX idx_po_number (po_number),
  INDEX idx_status (status),
  INDEX idx_approval_status (approval_status)
);
```

### Table: `purchase_order_lines`
```sql
CREATE TABLE purchase_order_lines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  po_id INT NOT NULL,
  line_number INT NOT NULL,
  item_id INT NOT NULL,
  quantity_ordered DECIMAL(15,3) NOT NULL,
  quantity_received DECIMAL(15,3) DEFAULT 0,
  unit_price DECIMAL(15,2) NOT NULL,
  line_total DECIMAL(15,2) NOT NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id),
  INDEX idx_po (po_id)
);
```

### Table: `po_approvals`
```sql
CREATE TABLE po_approvals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  po_id INT NOT NULL,
  approver_id INT NOT NULL,
  approval_level INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  comments TEXT NULL,
  action_date DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id),
  INDEX idx_po (po_id),
  INDEX idx_status (status)
);
```

---

## 6. INVENTORY & WAREHOUSE MODULE

### Table: `inventory_balances`
```sql
CREATE TABLE inventory_balances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  quantity_available DECIMAL(15,3) DEFAULT 0,
  quantity_reserved DECIMAL(15,3) DEFAULT 0,
  quantity_inspection DECIMAL(15,3) DEFAULT 0,
  quantity_rejected DECIMAL(15,3) DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  UNIQUE KEY unique_item_warehouse (item_id, warehouse_id),
  INDEX idx_item (item_id)
);
```

### Table: `inventory_transactions`
```sql
CREATE TABLE inventory_transactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_date DATETIME NOT NULL,
  transaction_type ENUM('receipt', 'issue', 'adjustment', 'transfer', 'return') NOT NULL,
  item_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  unit_cost DECIMAL(15,2) NULL,
  reference_type VARCHAR(50) NULL,
  reference_id INT NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_item (item_id),
  INDEX idx_reference (reference_type, reference_id)
);
```

### Table: `goods_receipts`
```sql
CREATE TABLE goods_receipts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gr_number VARCHAR(50) UNIQUE NOT NULL,
  po_id INT NOT NULL,
  receipt_date DATETIME NOT NULL,
  warehouse_id INT NOT NULL,
  received_by INT NOT NULL,
  status ENUM('pending_qc', 'qc_passed', 'qc_failed', 'completed') DEFAULT 'pending_qc',
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (received_by) REFERENCES employees(id),
  INDEX idx_gr_number (gr_number),
  INDEX idx_receipt_date (receipt_date)
);
```

### Table: `goods_receipt_lines`
```sql
CREATE TABLE goods_receipt_lines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gr_id INT NOT NULL,
  po_line_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity_received DECIMAL(15,3) NOT NULL,
  quantity_accepted DECIMAL(15,3) DEFAULT 0,
  quantity_rejected DECIMAL(15,3) DEFAULT 0,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gr_id) REFERENCES goods_receipts(id) ON DELETE CASCADE,
  FOREIGN KEY (po_line_id) REFERENCES purchase_order_lines(id),
  FOREIGN KEY (item_id) REFERENCES items(id),
  INDEX idx_gr (gr_id)
);
```

### Table: `goods_issues`
```sql
CREATE TABLE goods_issues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gi_number VARCHAR(50) UNIQUE NOT NULL,
  issue_date DATETIME NOT NULL,
  warehouse_id INT NOT NULL,
  work_order_id INT NULL,
  issued_by INT NOT NULL,
  issued_to INT NULL,
  status ENUM('draft', 'issued', 'cancelled') DEFAULT 'draft',
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
  FOREIGN KEY (issued_by) REFERENCES employees(id),
  FOREIGN KEY (issued_to) REFERENCES employees(id),
  INDEX idx_gi_number (gi_number),
  INDEX idx_issue_date (issue_date)
);
```

### Table: `goods_issue_lines`
```sql
CREATE TABLE goods_issue_lines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gi_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity_issued DECIMAL(15,3) NOT NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gi_id) REFERENCES goods_issues(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id),
  INDEX idx_gi (gi_id)
);
```

### Table: `inventory_reservations`
```sql
CREATE TABLE inventory_reservations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  quantity_reserved DECIMAL(15,3) NOT NULL,
  reference_type VARCHAR(50) NOT NULL,
  reference_id INT NOT NULL,
  reservation_date DATETIME NOT NULL,
  expiry_date DATETIME NULL,
  status ENUM('active', 'fulfilled', 'cancelled') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  INDEX idx_item_warehouse (item_id, warehouse_id),
  INDEX idx_status (status)
);
```

---

## 7. QUALITY CONTROL MODULE

### Table: `qc_inspections`
```sql
CREATE TABLE qc_inspections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  inspection_number VARCHAR(50) UNIQUE NOT NULL,
  inspection_type ENUM('incoming', 'in_process', 'final', 'supplier_audit') NOT NULL,
  reference_type VARCHAR(50) NOT NULL,
  reference_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity_inspected DECIMAL(15,3) NOT NULL,
  quantity_accepted DECIMAL(15,3) DEFAULT 0,
  quantity_rejected DECIMAL(15,3) DEFAULT 0,
  inspector_id INT NOT NULL,
  inspection_date DATETIME NOT NULL,
  status ENUM('pending', 'in_progress', 'passed', 'failed', 'conditional') DEFAULT 'pending',
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (inspector_id) REFERENCES employees(id),
  INDEX idx_inspection_number (inspection_number),
  INDEX idx_reference (reference_type, reference_id),
  INDEX idx_status (status)
);
```

### Table: `qc_inspection_lines`
```sql
CREATE TABLE qc_inspection_lines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  inspection_id INT NOT NULL,
  parameter_id INT NOT NULL,
  specification VARCHAR(100) NULL,
  measured_value VARCHAR(100) NULL,
  result ENUM('pass', 'fail', 'na') NOT NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inspection_id) REFERENCES qc_inspections(id) ON DELETE CASCADE,
  FOREIGN KEY (parameter_id) REFERENCES qc_parameters(id),
  INDEX idx_inspection (inspection_id)
);
```

### Table: `qc_parameters`
```sql
CREATE TABLE qc_parameters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parameter_code VARCHAR(50) UNIQUE NOT NULL,
  parameter_name VARCHAR(100) NOT NULL,
  parameter_type ENUM('dimensional', 'visual', 'functional', 'chemical', 'other') NOT NULL,
  measurement_unit VARCHAR(20) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_parameter_code (parameter_code)
);
```

### Table: `qc_ncr`
```sql
CREATE TABLE qc_ncr (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ncr_number VARCHAR(50) UNIQUE NOT NULL,
  inspection_id INT NULL,
  item_id INT NOT NULL,
  quantity_affected DECIMAL(15,3) NOT NULL,
  defect_description TEXT NOT NULL,
  root_cause TEXT NULL,
  corrective_action TEXT NULL,
  preventive_action TEXT NULL,
  disposition ENUM('rework', 'scrap', 'use_as_is', 'return_to_supplier') NULL,
  status ENUM('open', 'under_investigation', 'action_taken', 'closed') DEFAULT 'open',
  raised_by INT NOT NULL,
  raised_date DATETIME NOT NULL,
  closed_by INT NULL,
  closed_date DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (inspection_id) REFERENCES qc_inspections(id),
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (raised_by) REFERENCES employees(id),
  FOREIGN KEY (closed_by) REFERENCES employees(id),
  INDEX idx_ncr_number (ncr_number),
  INDEX idx_status (status)
);
```

---

## 8. HR & ATTENDANCE MODULE

### Table: `shifts`
```sql
CREATE TABLE shifts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shift_code VARCHAR(20) UNIQUE NOT NULL,
  shift_name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shift_code (shift_code)
);
```

### Table: `attendance_records`
```sql
CREATE TABLE attendance_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  shift_id INT NULL,
  time_in DATETIME NULL,
  time_out DATETIME NULL,
  hours_worked DECIMAL(5,2) DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  status ENUM('present', 'absent', 'late', 'half_day', 'on_leave') DEFAULT 'present',
  notes TEXT NULL,
  imported_from VARCHAR(50) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (shift_id) REFERENCES shifts(id),
  UNIQUE KEY unique_employee_date (employee_id, attendance_date),
  INDEX idx_attendance_date (attendance_date)
);
```

### Table: `leave_requests`
```sql
CREATE TABLE leave_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_number VARCHAR(50) UNIQUE NOT NULL,
  employee_id INT NOT NULL,
  leave_type ENUM('annual', 'sick', 'emergency', 'unpaid', 'other') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(5,2) NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  approved_by INT NULL,
  approved_at DATETIME NULL,
  rejection_reason TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  INDEX idx_request_number (request_number),
  INDEX idx_employee (employee_id),
  INDEX idx_status (status)
);
```

### Table: `leave_approvals`
```sql
CREATE TABLE leave_approvals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  leave_request_id INT NOT NULL,
  approver_id INT NOT NULL,
  approval_level INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  comments TEXT NULL,
  action_date DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id),
  INDEX idx_leave_request (leave_request_id),
  INDEX idx_status (status)
);
```

---

## 9. ACCOUNTING MODULE

### Table: `payroll_periods`
```sql
CREATE TABLE payroll_periods (
  id INT PRIMARY KEY AUTO_INCREMENT,
  period_code VARCHAR(20) UNIQUE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  payment_date DATE NOT NULL,
  status ENUM('open', 'calculated', 'approved', 'released', 'closed') DEFAULT 'open',
  total_employees INT DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  prepared_by INT NULL,
  approved_by INT NULL,
  released_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (prepared_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (released_by) REFERENCES users(id),
  INDEX idx_period_code (period_code),
  INDEX idx_status (status)
);
```

### Table: `payroll_records`
```sql
CREATE TABLE payroll_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payroll_period_id INT NOT NULL,
  employee_id INT NOT NULL,
  basic_salary DECIMAL(15,2) NOT NULL,
  overtime_pay DECIMAL(15,2) DEFAULT 0,
  allowances DECIMAL(15,2) DEFAULT 0,
  deductions DECIMAL(15,2) DEFAULT 0,
  net_pay DECIMAL(15,2) NOT NULL,
  days_worked DECIMAL(5,2) DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  status ENUM('draft', 'calculated', 'approved', 'paid') DEFAULT 'draft',
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  UNIQUE KEY unique_period_employee (payroll_period_id, employee_id),
  INDEX idx_payroll_period (payroll_period_id)
);
```

### Table: `ap_invoices`
```sql
CREATE TABLE ap_invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_invoice_number VARCHAR(50) NULL,
  supplier_id INT NOT NULL,
  po_id INT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  balance DECIMAL(15,2) NOT NULL,
  status ENUM('pending', 'approved', 'partially_paid', 'paid', 'overdue') DEFAULT 'pending',
  payment_terms VARCHAR(50) NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
);
```

### Table: `ap_payments`
```sql
CREATE TABLE ap_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_id INT NOT NULL,
  payment_date DATE NOT NULL,
  payment_amount DECIMAL(15,2) NOT NULL,
  payment_method ENUM('cash', 'check', 'bank_transfer', 'other') NOT NULL,
  reference_number VARCHAR(100) NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL,
  FOREIGN KEY (invoice_id) REFERENCES ap_invoices(id),
  INDEX idx_payment_number (payment_number),
  INDEX idx_payment_date (payment_date)
);
```

---

## 10. MAINTENANCE MODULE

### Table: `maintenance_schedules`
```sql
CREATE TABLE maintenance_schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  schedule_code VARCHAR(50) UNIQUE NOT NULL,
  machine_id INT NOT NULL,
  maintenance_type ENUM('preventive', 'predictive', 'routine') NOT NULL,
  frequency_days INT NOT NULL,
  last_maintenance_date DATE NULL,
  next_maintenance_date DATE NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES machines(id),
  INDEX idx_schedule_code (schedule_code),
  INDEX idx_next_maintenance (next_maintenance_date)
);
```

### Table: `maintenance_records`
```sql
CREATE TABLE maintenance_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  record_number VARCHAR(50) UNIQUE NOT NULL,
  machine_id INT NOT NULL,
  maintenance_schedule_id INT NULL,
  maintenance_type ENUM('preventive', 'breakdown', 'repair', 'inspection') NOT NULL,
  maintenance_date DATETIME NOT NULL,
  technician_id INT NULL,
  downtime_hours DECIMAL(5,2) DEFAULT 0,
  description TEXT NOT NULL,
  parts_used TEXT NULL,
  cost DECIMAL(15,2) DEFAULT 0,
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  FOREIGN KEY (machine_id) REFERENCES machines(id),
  FOREIGN KEY (maintenance_schedule_id) REFERENCES maintenance_schedules(id),
  FOREIGN KEY (technician_id) REFERENCES employees(id),
  INDEX idx_record_number (record_number),
  INDEX idx_maintenance_date (maintenance_date)
);
```

---

## 11. MOLD MANAGEMENT MODULE

### Table: `mold_usage`
```sql
CREATE TABLE mold_usage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mold_id INT NOT NULL,
  work_order_id INT NOT NULL,
  usage_start DATETIME NOT NULL,
  usage_end DATETIME NULL,
  shots_produced INT DEFAULT 0,
  status ENUM('in_use', 'completed') DEFAULT 'in_use',
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mold_id) REFERENCES molds(id),
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
  INDEX idx_mold (mold_id),
  INDEX idx_work_order (work_order_id)
);
```

### Table: `mold_repairs`
```sql
CREATE TABLE mold_repairs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  repair_number VARCHAR(50) UNIQUE NOT NULL,
  mold_id INT NOT NULL,
  repair_date DATETIME NOT NULL,
  repair_type ENUM('minor', 'major', 'overhaul') NOT NULL,
  description TEXT NOT NULL,
  technician_id INT NULL,
  cost DECIMAL(15,2) DEFAULT 0,
  downtime_hours DECIMAL(5,2) DEFAULT 0,
  status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  FOREIGN KEY (mold_id) REFERENCES molds(id),
  FOREIGN KEY (technician_id) REFERENCES employees(id),
  INDEX idx_repair_number (repair_number),
  INDEX idx_mold (mold_id)
);
```

---

## 12. NOTIFICATIONS MODULE

### Table: `notifications`
```sql
CREATE TABLE notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  reference_type VARCHAR(50) NULL,
  reference_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notification_type (notification_type),
  INDEX idx_created_at (created_at)
);
```

### Table: `notification_recipients`
```sql
CREATE TABLE notification_recipients (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  notification_id BIGINT NOT NULL,
  user_id INT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_unread (user_id, is_read),
  INDEX idx_notification (notification_id)
);
```

---

## INDEXES & PERFORMANCE OPTIMIZATION

All tables include:
- Primary key indexes (AUTO_INCREMENT)
- Foreign key indexes for referential integrity
- Status field indexes for filtering
- Date field indexes for reporting
- Unique constraints where applicable
- Composite indexes for common query patterns

---

## AUDIT FIELDS STANDARD

Most transactional tables include:
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp
- `created_by` - User who created the record
- `updated_by` - User who last updated the record

---

## STATUS ENUMS

Status fields use ENUM types for:
- Data integrity
- Query performance
- Clear business logic
- Workflow enforcement

---

## FOREIGN KEY CONSTRAINTS

All foreign keys include:
- ON DELETE CASCADE for dependent data
- ON DELETE RESTRICT for master data
- Proper indexing for join performance

---

## NORMALIZATION

The schema follows 3NF (Third Normal Form):
- No repeating groups
- All non-key attributes depend on the primary key
- No transitive dependencies
- Lookup tables for code values

---

## SCALABILITY CONSIDERATIONS

- BIGINT for high-volume transaction tables
- Partitioning strategy for audit_logs by date
- Archive strategy for historical data
- Index optimization for reporting queries

---

## DATA INTEGRITY

- NOT NULL constraints on required fields
- CHECK constraints via ENUM types
- Unique constraints on business keys
- Foreign key constraints for referential integrity
- Default values for status fields

---

## SECURITY

- Password hashing (bcrypt) at application layer
- Audit logging for all critical operations
- Role-based access control via permissions
- No sensitive data in plain text

---

This schema provides a solid foundation for a production-grade internal manufacturing ERP system with proper normalization, referential integrity, and audit capabilities.
