# Module Interaction Map

## Purpose

This document describes how modules in the Internal Manufacturing ERP System interact with each other, including data flow, approval handoffs, and status propagation. All interactions are described in text format.

---

## Module Overview

The system consists of the following modules:

1. **Master Data Management** - Items, suppliers, customers, machines, employees
2. **Production Management** - Production orders, work orders, output recording
3. **Material Requirements Planning (MRP)** - Material shortage calculation, PR generation
4. **Purchasing** - Purchase requests, purchase orders, supplier management
5. **Inventory Management** - Goods receipts, goods issues, inventory balances, adjustments
6. **Quality Control** - Inspections, non-conformance reports, quality records
7. **Human Resources** - Employees, attendance, payroll
8. **Accounts Payable** - Invoices, payments, vendor management
9. **Maintenance** - Maintenance schedules, work orders, asset management
10. **Mold Management** - Mold tracking, usage recording, maintenance
11. **Dashboard & Reporting** - KPIs, alerts, executive summaries
12. **Notifications** - User notifications, alerts, reminders

---

## Data Producer-Consumer Relationships

### Master Data Module

**Produces:**
- Item master data (item_id, item_code, description, unit)
- Supplier master data (supplier_id, supplier_name, contact)
- Machine master data (machine_id, machine_name, type)
- Employee master data (employee_id, employee_name, department)
- Warehouse master data (warehouse_id, warehouse_name, location)
- BOM (Bill of Materials) relationships

**Consumed By:**
- Production: Uses item data for production orders
- MRP: Uses BOM data for material calculations
- Purchasing: Uses supplier data for purchase orders
- Inventory: Uses item and warehouse data for balances
- Quality: Uses item data for inspections
- HR: Uses employee data for attendance and payroll
- Maintenance: Uses machine data for work orders
- All modules: Reference master data

**Data Flow:**
```
Master Data → All Modules (read-only reference)
```

**Status:** Master data is soft-deleted (is_active flag), never hard-deleted.

---

### Production Management Module

**Produces:**
- Production orders (production_order_id, item_id, quantity, status)
- Work orders (work_order_id, production_order_id, machine_id, operator_id)
- Production output records (good_qty, scrap_qty, rework_qty)

**Consumes:**
- Items (from Master Data): Which item to produce
- Inventory balances (from Inventory): Material availability
- Machines (from Master Data): Which machine to use
- Employees (from Master Data): Which operator assigned
- Molds (from Mold Management): Which mold to use

**Data Flow:**
```
Production Order Created
    ↓
MRP Module (reads production order requirements)
    ↓
Purchasing Module (procures materials)
    ↓
Inventory Module (materials received)
    ↓
Production Module (issues materials, executes production)
    ↓
Inventory Module (finished goods received)
    ↓
Quality Module (inspects finished goods)
```

**Status Propagation:**
- Production Order: draft → submitted → approved → scheduled → in_progress → completed
- Work Order: pending → in_progress → completed
- Status changes trigger notifications
- Completion updates dashboard metrics

**Approval Handoff:**
- Production Planner creates production order (draft)
- Production Planner submits for approval (submitted)
- Production Manager approves (approved)
- Production Supervisor schedules work orders (scheduled)
- Operator executes production (in_progress)
- Supervisor completes work order (completed)

---

### MRP Module

**Produces:**
- MRP run records (mrp_run_id, execution_date, status)
- Purchase requests (generated automatically from shortages)

**Consumes:**
- Production orders (from Production): What needs to be produced
- BOM data (from Master Data): Component requirements
- Inventory balances (from Inventory): Current stock levels
- Purchase orders (from Purchasing): Incoming materials
- Lead times (from Master Data): Supplier lead times

**Data Flow:**
```
Production Order (approved)
    ↓
MRP Calculation:
  Required = Production Qty × BOM Qty
  Available = Inventory Balance + Incoming POs
  Shortage = Required - Available
    ↓
Purchase Request (generated if shortage > 0)
    ↓
Purchasing Module (processes PR)
```

**Calculation Logic:**
```
For each approved production order:
  For each component in BOM:
    Calculate required quantity
    Check inventory balance
    Check incoming purchase orders
    If shortage exists:
      Generate purchase request
      Set required date based on production date and lead time
```

**Status Propagation:**
- MRP run: pending → in_progress → completed
- Generated PRs: draft (ready for purchasing review)

---

### Purchasing Module

**Produces:**
- Purchase requests (pr_id, item_id, quantity, status)
- Purchase orders (po_id, supplier_id, total_amount, status)
- PO items (po_item_id, po_id, item_id, quantity, unit_price)

**Consumes:**
- Purchase requests (from MRP or manual creation)
- Suppliers (from Master Data)
- Items (from Master Data)

**Data Flow:**
```
Purchase Request (draft)
    ↓
Purchasing Officer reviews and submits (submitted)
    ↓
Purchasing Manager approves (approved)
    ↓
Purchasing Officer creates PO from approved PR
    ↓
Purchasing Officer submits PO (submitted)
    ↓
Purchasing Manager approves PO (approved)
    ↓
PO sent to supplier (sent)
    ↓
Inventory Module (receives goods against PO)
```

**Status Propagation:**
- Purchase Request: draft → submitted → approved → converted
- Purchase Order: draft → submitted → approved → sent → partially_received → completed
- PO status updates when goods received
- Completion triggers notification to accounting

**Approval Handoff:**
- Purchasing Officer creates PR (draft)
- Purchasing Officer submits PR (submitted)
- Purchasing Manager approves PR (approved) ← Different person
- Purchasing Officer creates PO (draft)
- Purchasing Officer submits PO (submitted)
- Purchasing Manager approves PO (approved) ← Different person
- Warehouse receives goods (different department)

**Segregation of Duties:**
- PR creator ≠ PR approver
- PO creator ≠ PO approver
- PO approver ≠ Goods receiver

---

### Inventory Management Module

**Produces:**
- Goods receipts (receipt_id, po_id, receipt_date, status)
- Goods issues (issue_id, work_order_id, issue_date)
- Inventory transactions (transaction_id, item_id, quantity, type)
- Inventory balances (item_id, warehouse_id, quantity)
- Inventory adjustments (adjustment_id, reason, approved_by)

**Consumes:**
- Purchase orders (from Purchasing): What was ordered
- Work orders (from Production): What production needs
- Items (from Master Data): Item details
- Warehouses (from Master Data): Location details

**Data Flow:**

**Inbound (Goods Receipt):**
```
Purchase Order (approved, sent)
    ↓
Warehouse Staff receives physical delivery
    ↓
Goods Receipt created (references PO)
    ↓
Transaction: Inventory increases
    ↓
PO status updated (partially_received or completed)
    ↓
Quality Module (inspects received goods)
```

**Outbound (Goods Issue):**
```
Work Order (in_progress)
    ↓
Warehouse Staff issues materials
    ↓
Goods Issue created (references work order)
    ↓
Transaction: Inventory decreases
    ↓
Production Module (uses materials)
```

**Production Output:**
```
Work Order (in_progress)
    ↓
Operator records production output
    ↓
Transaction: Finished goods inventory increases
    ↓
Quality Module (inspects finished goods)
```

**Status Propagation:**
- Goods Receipt: pending → completed
- Goods Issue: completed (single status)
- Inventory Balance: Updated in real-time
- Low stock triggers notification

**Transaction Atomicity:**
All inventory movements are transactional:
- Goods receipt: Create receipt + Create items + Update balances + Update PO
- Goods issue: Create issue + Create transactions + Update balances
- Production output: Create output + Create transactions + Update balances

---

### Quality Control Module

**Produces:**
- Quality inspections (inspection_id, type, result, disposition)
- Non-conformance reports (ncr_id, issue_description, root_cause, corrective_action)
- Quality records (linked to goods receipts, work orders, finished goods)

**Consumes:**
- Goods receipts (from Inventory): Incoming material inspection
- Work orders (from Production): In-process inspection
- Production output (from Production): Final inspection
- Items (from Master Data): Quality specifications

**Data Flow:**

**Incoming Inspection:**
```
Goods Receipt (completed)
    ↓
Quality Inspector creates inspection
    ↓
Inspector performs physical inspection
    ↓
Inspector records result (pass/fail)
    ↓
Disposition:
  - Accept: Material available for use
  - Reject: Material quarantined, NCR created
  - Conditional: Material usable with restrictions
```

**In-Process Inspection:**
```
Work Order (in_progress)
    ↓
Quality Inspector performs inspection
    ↓
Inspector records result
    ↓
If fail: Production stopped, NCR created
```

**Final Inspection:**
```
Production Output (completed)
    ↓
Quality Inspector inspects finished goods
    ↓
Inspector records result
    ↓
Disposition:
  - Accept: Finished goods available
  - Reject: Goods quarantined, NCR created
  - Rework: Goods returned to production
```

**Status Propagation:**
- Inspection: pending → in_progress → completed
- NCR: open → investigating → corrective_action → closed
- Inspection results affect inventory status

**Data Impact:**
- Rejected materials: Inventory status = 'quarantined'
- Accepted materials: Inventory status = 'available'
- NCR creation triggers notification to management

---

### Human Resources Module

**Produces:**
- Employee records (employee_id, name, department, position)
- Attendance records (attendance_id, employee_id, date, hours, status)
- Payroll periods (payroll_period_id, start_date, end_date, status)
- Payroll records (payroll_id, employee_id, gross_pay, net_pay)

**Consumes:**
- Employees (from Master Data)
- Biometric attendance data (external system import)

**Data Flow:**

**Attendance Recording:**
```
Biometric System
    ↓
Attendance Import (read-only, source='biometric')
    ↓
HR Staff reviews attendance
    ↓
HR Staff makes manual corrections (if needed, with remarks)
    ↓
Attendance data ready for payroll
```

**Payroll Processing:**
```
Payroll Period created
    ↓
HR Staff calculates payroll:
  Gross Pay = (Regular Hours × Rate) + (OT Hours × OT Rate)
  Deductions = Taxes + Benefits
  Net Pay = Gross Pay - Deductions
    ↓
HR Staff submits for approval (submitted)
    ↓
HR Manager reviews and approves (approved)
    ↓
HR Manager releases payroll (released)
    ↓
Accounts Payable Module (creates AP invoices for payroll)
```

**Status Propagation:**
- Payroll Period: draft → calculated → submitted → approved → released
- Released payroll is immutable
- Release triggers AP invoice creation

**Approval Handoff:**
- HR Staff calculates payroll (calculated)
- HR Staff submits for approval (submitted)
- HR Manager approves (approved) ← Different person
- HR Manager releases (released) ← Creates financial obligation

**Segregation of Duties:**
- Payroll calculator ≠ Payroll approver
- Payroll releaser ≠ Payment processor

---

### Accounts Payable Module

**Produces:**
- AP invoices (invoice_id, supplier_id, amount, due_date, status)
- AP payments (payment_id, invoice_id, amount, payment_date)
- Payment records (bank_reference, payment_method)

**Consumes:**
- Purchase orders (from Purchasing): What was ordered
- Goods receipts (from Inventory): What was received
- Suppliers (from Master Data): Vendor details
- Payroll releases (from HR): Employee compensation

**Data Flow:**

**Supplier Invoice Processing:**
```
Purchase Order (sent)
    ↓
Goods Receipt (completed)
    ↓
Supplier sends invoice
    ↓
Accounting Staff creates AP invoice (references PO)
    ↓
System validates three-way match:
  - PO: What was ordered
  - Goods Receipt: What was received
  - Invoice: What is being billed
    ↓
Accounting Staff submits for approval (submitted)
    ↓
Accounting Manager approves (approved)
    ↓
Accounting Staff processes payment
    ↓
Accounting Manager approves payment
    ↓
Payment recorded (paid)
```

**Payroll Invoice Processing:**
```
Payroll Released (from HR)
    ↓
System automatically creates AP invoices for payroll
    ↓
Invoices approved (auto-approved from payroll release)
    ↓
Accounting processes payment
```

**Status Propagation:**
- AP Invoice: pending → submitted → approved → paid
- Overdue invoices flagged (due_date < current_date and status ≠ paid)
- Payment updates invoice balance

**Approval Handoff:**
- Accounting Staff creates invoice (pending)
- Accounting Staff submits invoice (submitted)
- Accounting Manager approves invoice (approved) ← Different person
- Accounting Staff processes payment
- Accounting Manager approves payment ← Different person

**Three-Way Match:**
- PO quantity vs Receipt quantity vs Invoice quantity
- PO unit price vs Invoice unit price
- Discrepancies flagged for investigation
- Ensures payment accuracy

---

### Maintenance Module

**Produces:**
- Maintenance schedules (schedule_id, machine_id, frequency, next_date)
- Maintenance work orders (maint_wo_id, machine_id, type, status)
- Maintenance records (completion_date, parts_used, labor_hours)

**Consumes:**
- Machines (from Master Data): Which machine to maintain
- Items (from Master Data): Spare parts
- Employees (from Master Data): Maintenance technicians

**Data Flow:**

**Preventive Maintenance:**
```
Maintenance Schedule (active)
    ↓
System generates work order (scheduled date reached)
    ↓
Maintenance Supervisor approves work order
    ↓
Maintenance Supervisor schedules technician
    ↓
Technician performs maintenance (in_progress)
    ↓
Technician records parts used and hours
    ↓
Technician completes work order (completed)
    ↓
Next maintenance date calculated
```

**Breakdown Maintenance:**
```
Machine breaks down
    ↓
Operator reports issue
    ↓
Maintenance Supervisor creates work order (type='breakdown')
    ↓
Supervisor assigns priority (urgent)
    ↓
Technician performs repair
    ↓
Technician completes work order
```

**Status Propagation:**
- Maintenance WO: pending → approved → scheduled → in_progress → completed
- Completion updates machine status
- Frequent breakdowns trigger alerts

**Data Impact:**
- Parts used: Inventory decreases
- Labor hours: Tracked for costing
- Machine downtime: Tracked for KPIs

---

### Mold Management Module

**Produces:**
- Mold records (mold_id, mold_code, item_id, status)
- Mold usage records (usage_id, mold_id, work_order_id, shot_count)
- Mold maintenance records (maintenance_date, maintenance_type)

**Consumes:**
- Work orders (from Production): Which mold is used
- Items (from Master Data): Which item the mold produces
- Machines (from Master Data): Which machine uses the mold

**Data Flow:**

**Mold Assignment:**
```
Work Order created
    ↓
Supervisor assigns mold (mold status = 'available')
    ↓
Mold status updated to 'in_use'
    ↓
Production executes
    ↓
Shot count recorded
    ↓
Work order completed
    ↓
Mold released (status = 'available')
```

**Mold Maintenance:**
```
Shot count reaches threshold
    ↓
System triggers maintenance alert
    ↓
Mold status updated to 'maintenance_required'
    ↓
Maintenance performed
    ↓
Mold status updated to 'available'
```

**Status Propagation:**
- Mold: available → in_use → available
- Mold: available → maintenance_required → under_maintenance → available
- Mold: available → damaged → under_repair → available
- Mold: retired (end of life)

**Data Impact:**
- Shot count accumulates over mold lifetime
- Maintenance history tracked
- Mold availability affects production scheduling

---

### Dashboard & Reporting Module

**Produces:**
- Production KPIs (orders completed, delays, completion rate)
- Inventory KPIs (stock levels, shortages, turnover)
- Quality KPIs (inspection pass rate, NCR count)
- Purchasing KPIs (open PRs, open POs, pending approvals)
- Financial KPIs (outstanding AP, overdue invoices, aging)
- Maintenance KPIs (open work orders, frequent breakdowns)

**Consumes:**
- Production orders (from Production)
- Inventory balances (from Inventory)
- Quality inspections (from Quality)
- Purchase requests and orders (from Purchasing)
- AP invoices (from Accounting)
- Maintenance work orders (from Maintenance)
- All modules: Aggregates data for reporting

**Data Flow:**
```
All Modules
    ↓
Dashboard queries aggregate data
    ↓
KPIs calculated in real-time
    ↓
Alerts generated for exceptions
    ↓
Notifications sent to users
```

**Aggregation Examples:**

**Production Dashboard:**
- Total orders by status
- Orders delayed (planned_end_date < current_date and status ≠ completed)
- Completion rate (completed / total)

**Inventory Dashboard:**
- Items below reorder point
- Items with zero balance
- Slow-moving items

**Quality Dashboard:**
- Inspection pass rate
- Open NCRs
- NCRs by supplier

**Purchasing Dashboard:**
- Open PRs pending approval
- Open POs pending approval
- POs pending receipt

**Accounting Dashboard:**
- Outstanding AP balance
- Overdue invoices
- AP aging (0-30, 31-60, 61-90, 90+ days)

---

### Notifications Module

**Produces:**
- User notifications (notification_id, user_id, message, type)
- Alerts (alert_id, severity, message)

**Consumes:**
- All modules: Events that trigger notifications

**Data Flow:**
```
Module Event (e.g., PR submitted)
    ↓
Notification created for approver
    ↓
User sees notification in UI
    ↓
User clicks notification → Navigates to relevant page
    ↓
User marks notification as read
```

**Notification Triggers:**

**Approval Notifications:**
- PR submitted → Notify purchasing manager
- PO submitted → Notify purchasing manager
- Invoice submitted → Notify accounting manager
- Payroll submitted → Notify HR manager

**Status Change Notifications:**
- PR approved → Notify requestor
- PO approved → Notify creator
- Production order completed → Notify planner

**Alert Notifications:**
- Inventory below reorder point → Notify purchasing
- Production order delayed → Notify production manager
- Invoice overdue → Notify accounting manager
- Maintenance due → Notify maintenance supervisor

**Retention:**
- Notifications retained for 30 days (configurable)
- Read notifications can be deleted
- Unread notifications persist

---

## Cross-Module Integration Patterns

### Pattern 1: Reference Data

Master data is referenced by all modules:
- Items referenced by Production, Purchasing, Inventory, Quality
- Suppliers referenced by Purchasing, Accounting
- Employees referenced by Production, HR, Maintenance
- Machines referenced by Production, Maintenance

**Integration:** Foreign key relationships, read-only access

### Pattern 2: Status Propagation

Status changes in one module trigger updates in related modules:
- Goods receipt updates PO status
- Work order completion updates production order status
- Payroll release creates AP invoices

**Integration:** Service-level orchestration, transactional updates

### Pattern 3: Approval Handoffs

Approvals in one module enable actions in another:
- Approved PR enables PO creation
- Approved production order enables work order creation
- Approved payroll enables payment processing

**Integration:** Status-based workflow, validation checks

### Pattern 4: Data Aggregation

Dashboard aggregates data from multiple modules:
- Production + Inventory + Quality → Executive dashboard
- Purchasing + Accounting → Procurement dashboard
- HR + Accounting → Payroll dashboard

**Integration:** Read-only queries, real-time aggregation

### Pattern 5: Event Notification

Events in one module trigger notifications in another:
- PR submitted → Notify approver
- Inventory low → Notify purchasing
- Maintenance due → Notify supervisor

**Integration:** Event-driven notifications, asynchronous

---

## Data Consistency Mechanisms

### Transaction Boundaries

Multi-module operations use transactions:
- Goods receipt: Inventory + Purchasing (single transaction)
- Production output: Production + Inventory (single transaction)
- Payroll release: HR + Accounting (single transaction)

**Guarantee:** All updates succeed together or fail together

### Foreign Key Constraints

Relationships enforced at database level:
- PO items reference PO (cannot delete PO with items)
- Goods receipt references PO (cannot delete PO with receipts)
- Work order references production order (referential integrity)

**Guarantee:** No orphaned records

### Status Validation

Status transitions validated at service level:
- Cannot approve draft (must submit first)
- Cannot complete without approval
- Cannot delete after submission

**Guarantee:** Workflow integrity

### Audit Logging

All cross-module operations logged:
- Who initiated
- What changed
- When it happened
- Which modules affected

**Guarantee:** Complete audit trail

---

## Summary

Module interactions in the ERP system follow clear patterns:
1. **Master data** provides reference data to all modules
2. **Status propagation** coordinates workflows across modules
3. **Approval handoffs** enforce segregation of duties
4. **Data aggregation** supports reporting and dashboards
5. **Event notifications** keep users informed

Data consistency is maintained through:
- Database transactions for multi-table operations
- Foreign key constraints for referential integrity
- Service-level validation for business rules
- Comprehensive audit logging for traceability

The modular design with clear interfaces enables each module to function independently while maintaining system-wide data integrity.

---

**Document Version:** 1.0  
**Last Updated:** December 26, 2025  
**Prepared For:** Thesis Defense Panel
