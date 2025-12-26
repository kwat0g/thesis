# ERP End-to-End Flow Documentation

## Purpose

This document traces the complete lifecycle of a product through the manufacturing ERP system, from initial demand to final delivery and payment. It demonstrates how all modules integrate to support real-world manufacturing operations.

---

## Overview: Complete Manufacturing Cycle

```
Customer Demand
    ↓
Production Planning (MRP)
    ↓
Material Procurement (Purchasing)
    ↓
Inventory Receiving
    ↓
Production Execution
    ↓
Quality Control
    ↓
Finished Goods Inventory
    ↓
Accounts Payable & Payroll
```

---

## Phase 1: Demand Planning & Production Orders

### Step 1.1: Create Production Order

**Trigger:** Sales forecast or customer order

**Process:**
1. Production Planner creates Production Order
   - Module: `Production`
   - Entity: `production_orders`
   - Status: `draft`
   - Fields: Item, Quantity, Priority, Planned Dates

2. Submit for Approval
   - Action: `submitForApproval()`
   - Status: `draft` → `scheduled`
   - Notification: Sent to Production Manager

3. Production Manager Approves
   - Permission: `PROD.APPROVE_ORDER`
   - Audit Log: Created
   - Status: `scheduled`

**Database Tables Affected:**
- `production_orders` (INSERT, UPDATE)
- `audit_logs` (INSERT)
- `notifications` (INSERT)

**API Endpoints:**
- `POST /api/production/orders`
- `POST /api/production/orders/{id}/submit`

---

## Phase 2: Material Requirements Planning (MRP)

### Step 2.1: Execute MRP Run

**Trigger:** Scheduled (daily) or manual

**Process:**
1. MRP Planner executes MRP
   - Module: `Planning`
   - Entity: `mrp_runs`
   - Input: Cutoff date, Lead time
   - Analysis: Production orders vs Inventory balances

2. MRP Calculates Shortages
   - For each production order:
     - Get BOM (Bill of Materials)
     - Check inventory availability
     - Calculate net requirements
     - Consider lead times

3. Generate Shortage Report
   - Entity: `mrp_shortages`
   - Fields: Item, Required Qty, Available Qty, Shortage Qty, Required Date

**Database Tables Affected:**
- `mrp_runs` (INSERT)
- `mrp_shortages` (INSERT multiple)
- `audit_logs` (INSERT)

**API Endpoints:**
- `POST /api/planning/mrp/execute`
- `GET /api/planning/mrp/runs/{id}`

### Step 2.2: Generate Purchase Requests from MRP

**Process:**
1. MRP Planner reviews shortages
2. Click "Generate PRs"
   - Action: `generatePurchaseRequests()`
   - Groups shortages by supplier
   - Creates one PR per supplier

3. PRs Created Automatically
   - Module: `Purchasing`
   - Entity: `purchase_requests`
   - Status: `draft`
   - Items: From MRP shortages

**Database Tables Affected:**
- `purchase_requests` (INSERT multiple)
- `purchase_request_items` (INSERT multiple)
- `mrp_runs` (UPDATE - mark PRs generated)
- `audit_logs` (INSERT)

**API Endpoints:**
- `POST /api/planning/mrp/runs/{id}/generate-prs`

---

## Phase 3: Material Procurement

### Step 3.1: Purchase Request Approval

**Process:**
1. Purchasing Officer reviews PR
   - Module: `Purchasing`
   - Entity: `purchase_requests`
   - Verify quantities and suppliers

2. Submit for Approval
   - Action: `submitForApproval()`
   - Status: `draft` → `pending_approval`
   - Notification: Sent to Purchasing Manager

3. Purchasing Manager Approves
   - Permission: `PURCH.APPROVE_PR`
   - Status: `pending_approval` → `approved`
   - Audit Log: Created

**Database Tables Affected:**
- `purchase_requests` (UPDATE)
- `audit_logs` (INSERT)
- `notifications` (INSERT)

**API Endpoints:**
- `POST /api/purchasing/requests/{id}/submit`
- `POST /api/purchasing/requests/{id}/approve`

### Step 3.2: Create Purchase Order

**Process:**
1. Purchasing Officer creates PO from approved PR
   - Module: `Purchasing`
   - Entity: `purchase_orders`
   - Status: `draft`
   - Copy items from PR
   - Add pricing and terms

2. Submit for Approval
   - Status: `draft` → `pending_approval`
   - Notification: Sent to Purchasing Manager

3. Purchasing Manager Approves
   - Permission: `PURCH.APPROVE_PO`
   - Status: `pending_approval` → `approved`

4. Send to Supplier
   - Action: `sendPurchaseOrder()`
   - Status: `approved` → `sent`
   - Generate PDF
   - Email to supplier

**Database Tables Affected:**
- `purchase_orders` (INSERT, UPDATE)
- `purchase_order_items` (INSERT multiple)
- `purchase_requests` (UPDATE status → `converted_to_po`)
- `audit_logs` (INSERT)
- `notifications` (INSERT)

**API Endpoints:**
- `POST /api/purchasing/orders`
- `POST /api/purchasing/orders/{id}/submit`
- `POST /api/purchasing/orders/{id}/approve`
- `POST /api/purchasing/orders/{id}/send`

---

## Phase 4: Inventory Receiving

### Step 4.1: Goods Receipt

**Trigger:** Materials arrive from supplier

**Process:**
1. Warehouse Staff creates Goods Receipt
   - Module: `Inventory`
   - Entity: `goods_receipts`
   - Reference: Purchase Order
   - Status: `pending`

2. Record Received Quantities
   - Entity: `goods_receipt_items`
   - Fields: Item, Ordered Qty, Received Qty, Accepted Qty, Rejected Qty
   - Warehouse: Receiving area

3. Complete Receipt
   - Action: `completeGoodsReceipt()`
   - Status: `pending` → `completed`
   
   **// TRANSACTION REQUIRED: Multiple tables updated atomically**
   - Create inventory transactions
   - Update inventory balances
   - Update PO status
   - Create audit log

**Database Tables Affected:**
- `goods_receipts` (INSERT, UPDATE)
- `goods_receipt_items` (INSERT multiple)
- `inventory_transactions` (INSERT multiple)
- `inventory_balances` (UPDATE multiple)
- `purchase_orders` (UPDATE status)
- `audit_logs` (INSERT)

**API Endpoints:**
- `POST /api/inventory/receipts`
- `POST /api/inventory/receipts/{id}/complete`

### Step 4.2: Quality Inspection (Incoming)

**Process:**
1. Quality Inspector creates Inspection
   - Module: `Quality Control`
   - Entity: `quality_inspections`
   - Type: `incoming`
   - Reference: Goods Receipt
   - Status: `pending`

2. Perform Inspection
   - Status: `pending` → `in_progress`
   - Record measurements
   - Compare to specifications

3. Record Results
   - Action: `recordInspectionResult()`
   - Status: `in_progress` → `completed`
   - Result: `accepted` or `rejected`
   
   **// TRANSACTION REQUIRED**
   - Update inspection status
   - Update inventory status (available/rejected)
   - Create NCR if rejected
   - Create audit log

**Database Tables Affected:**
- `quality_inspections` (INSERT, UPDATE)
- `inventory_balances` (UPDATE - change status)
- `non_conformance_reports` (INSERT if rejected)
- `audit_logs` (INSERT)

**API Endpoints:**
- `POST /api/quality/inspections`
- `POST /api/quality/inspections/{id}/result`

---

## Phase 5: Production Execution

### Step 5.1: Create Work Orders

**Process:**
1. Production Planner creates Work Orders from Production Order
   - Module: `Production`
   - Entity: `work_orders`
   - Status: `pending`
   - Fields: Production Order, Item, Quantity, Operator, Machine, Mold

2. Assign Mold (if applicable)
   - Module: `Mold Management`
   - Entity: `molds`
   - Status: `available` → `in_use`
   - Link to work order

**Database Tables Affected:**
- `work_orders` (INSERT)
- `molds` (UPDATE status)
- `audit_logs` (INSERT)

**API Endpoints:**
- `POST /api/production/work-orders`
- `POST /api/molds/{id}/assign`

### Step 5.2: Issue Materials

**Process:**
1. Warehouse Staff issues materials to Work Order
   - Module: `Inventory`
   - Entity: `goods_issues`
   - Reference: Work Order
   - Status: `completed` (immediate)
   
   **// TRANSACTION REQUIRED**
   - Create goods issue
   - Create inventory transactions
   - Deduct from inventory balances
   - Update work order status
   - Create audit log

**Database Tables Affected:**
- `goods_issues` (INSERT)
- `goods_issue_items` (INSERT multiple)
- `inventory_transactions` (INSERT multiple)
- `inventory_balances` (UPDATE multiple)
- `work_orders` (UPDATE status)
- `audit_logs` (INSERT)

**API Endpoints:**
- `POST /api/inventory/issues`

### Step 5.3: Start Production

**Process:**
1. Production Operator starts Work Order
   - Action: `startWorkOrder()`
   - Status: `pending` → `in_progress`
   - Record actual start time

**Database Tables Affected:**
- `work_orders` (UPDATE)
- `audit_logs` (INSERT)

**API Endpoints:**
- `POST /api/production/work-orders/{id}/start`

### Step 5.4: Record Production Output

**Process:**
1. Production Operator records output
   - Action: `recordOutput()`
   - Fields: Good Qty, Scrap Qty, Rework Qty
   
   **// TRANSACTION REQUIRED**
   - Update work order quantities
   - Create inventory transactions (finished goods)
   - Update inventory balances
   - Record mold usage (shots)
   - Create audit log

2. Complete Work Order (when finished)
   - Status: `in_progress` → `completed`
   - Record actual end time
   - Release mold

**Database Tables Affected:**
- `work_orders` (UPDATE)
- `inventory_transactions` (INSERT)
- `inventory_balances` (UPDATE)
- `mold_usage_logs` (INSERT)
- `molds` (UPDATE total_shots, status)
- `audit_logs` (INSERT)

**API Endpoints:**
- `POST /api/production/work-orders/{id}/output`
- `POST /api/production/work-orders/{id}/complete`

---

## Phase 6: Quality Control (In-Process & Final)

### Step 6.1: In-Process Inspection

**Process:**
1. Quality Inspector creates Inspection
   - Type: `in_process`
   - Reference: Work Order
   - Sample size: Per quality plan

2. Record Results
   - Measurements
   - Pass/Fail criteria
   - Disposition: Continue or Stop production

**Database Tables Affected:**
- `quality_inspections` (INSERT, UPDATE)
- `work_orders` (UPDATE if stopped)
- `audit_logs` (INSERT)

**API Endpoints:**
- `POST /api/quality/inspections`
- `POST /api/quality/inspections/{id}/result`

### Step 6.2: Final Inspection

**Process:**
1. Quality Inspector creates Final Inspection
   - Type: `final`
   - Reference: Work Order or Finished Goods
   - Full inspection

2. Record Results
   - If accepted: Move to finished goods inventory
   - If rejected: Create NCR, determine disposition

**Database Tables Affected:**
- `quality_inspections` (INSERT, UPDATE)
- `inventory_balances` (UPDATE status)
- `non_conformance_reports` (INSERT if rejected)
- `audit_logs` (INSERT)

**API Endpoints:**
- `POST /api/quality/inspections`
- `POST /api/quality/inspections/{id}/result`

---

## Phase 7: Finished Goods Inventory

### Step 7.1: Transfer to Finished Goods

**Process:**
1. Warehouse Staff transfers completed items
   - From: Work-in-Process
   - To: Finished Goods warehouse
   - Status: `available`

**Database Tables Affected:**
- `inventory_transactions` (INSERT)
- `inventory_balances` (UPDATE)
- `audit_logs` (INSERT)

**API Endpoints:**
- `POST /api/inventory/transfers`

---

## Phase 8: Financial Transactions

### Step 8.1: Accounts Payable (Supplier Invoices)

**Process:**
1. Accounting Staff creates AP Invoice
   - Module: `Accounting`
   - Entity: `ap_invoices`
   - Reference: Purchase Order
   - Status: `pending`
   - Fields: Supplier, Amount, Due Date

2. Submit for Approval
   - Status: `pending` → `approved`
   - Notification: Sent to Accounting Manager

3. Record Payment
   - Action: `recordPayment()`
   - Entity: `ap_payments`
   
   **// TRANSACTION REQUIRED**
   - Create payment record
   - Update invoice balance
   - Update invoice status
   - Create audit log

**Database Tables Affected:**
- `ap_invoices` (INSERT, UPDATE)
- `ap_payments` (INSERT)
- `audit_logs` (INSERT)
- `notifications` (INSERT)

**API Endpoints:**
- `POST /api/accounting/ap/invoices`
- `POST /api/accounting/ap/invoices/{id}/approve`
- `POST /api/accounting/ap/payments`

### Step 8.2: Payroll Processing

**Process:**
1. HR Manager creates Payroll Period
   - Module: `HR`
   - Entity: `payroll_periods`
   - Status: `open`
   - Fields: Period Start, Period End, Pay Date

2. Calculate Payroll
   - Action: `calculatePayroll()`
   - Status: `open` → `calculated`
   - Process: Attendance → Hours → Gross Pay → Deductions → Net Pay
   
   **// TRANSACTION REQUIRED**
   - Update payroll period status
   - Create payroll details for each employee
   - Create audit log

3. Approve Payroll
   - Permission: `HR.APPROVE_PAYROLL`
   - Status: `calculated` → `approved`

4. Release Payroll
   - Action: `releasePayroll()`
   - Status: `approved` → `released`
   
   **// TRANSACTION REQUIRED**
   - Update payroll status
   - Create AP invoice (payroll liability)
   - Create audit log

**Database Tables Affected:**
- `payroll_periods` (INSERT, UPDATE)
- `payroll_details` (INSERT multiple)
- `ap_invoices` (INSERT - payroll liability)
- `audit_logs` (INSERT)
- `notifications` (INSERT)

**API Endpoints:**
- `POST /api/hr/payroll/periods`
- `POST /api/hr/payroll/periods/{id}/calculate`
- `POST /api/hr/payroll/periods/{id}/approve`
- `POST /api/hr/payroll/periods/{id}/release`

---

## Phase 9: Maintenance & Asset Management

### Step 9.1: Preventive Maintenance

**Process:**
1. Maintenance Manager creates Schedule
   - Module: `Maintenance`
   - Entity: `maintenance_schedules`
   - Type: `preventive`
   - Frequency: Based on machine usage or time

2. System generates Work Orders automatically
   - Entity: `maintenance_work_orders`
   - Status: `pending`
   - Trigger: Schedule due date reached

3. Approve and Execute
   - Status: `pending` → `approved` → `scheduled` → `in_progress` → `completed`
   - Record parts used
   - Update machine status

**Database Tables Affected:**
- `maintenance_schedules` (INSERT, UPDATE)
- `maintenance_work_orders` (INSERT, UPDATE)
- `machines` (UPDATE last_maintenance_date)
- `inventory_transactions` (INSERT - parts consumed)
- `inventory_balances` (UPDATE)
- `audit_logs` (INSERT)

**API Endpoints:**
- `POST /api/maintenance/schedules`
- `POST /api/maintenance/work-orders`
- `POST /api/maintenance/work-orders/{id}/complete`

---

## Integration Points Summary

### Cross-Module Data Flow

```
Production Order
  ↓ (triggers)
MRP Run
  ↓ (generates)
Purchase Request
  ↓ (converts to)
Purchase Order
  ↓ (receives)
Goods Receipt
  ↓ (inspects)
Quality Inspection
  ↓ (updates)
Inventory Balance
  ↓ (issues to)
Work Order
  ↓ (produces)
Finished Goods
  ↓ (inspects)
Final Quality Check
  ↓ (creates)
AP Invoice (supplier payment)
Payroll (labor cost)
```

### Key Integration Tables

1. **inventory_balances**
   - Updated by: Goods Receipt, Goods Issue, Production Output, Quality Disposition
   - Read by: MRP, Production Planning, Purchasing

2. **audit_logs**
   - Written by: ALL modules
   - Read by: Audit reports, Compliance checks

3. **notifications**
   - Written by: ALL modules (approval workflows)
   - Read by: Users (notification center)

4. **users & permissions**
   - Read by: ALL modules (RBAC enforcement)
   - Updated by: User management

---

## Real-World Scenario Example

### Scenario: Produce 10,000 Plastic Bottles

**Day 1: Planning**
1. Production Planner creates Production Order for 10,000 bottles
2. Submit for approval → Production Manager approves
3. MRP runs overnight, identifies shortage of 500kg plastic resin

**Day 2: Procurement**
4. MRP generates PR for 500kg plastic resin
5. Purchasing Officer reviews and submits PR for approval
6. Purchasing Manager approves PR
7. Purchasing Officer creates PO and sends to supplier

**Day 5: Receiving**
8. Supplier delivers 500kg plastic resin
9. Warehouse Staff creates Goods Receipt
10. Quality Inspector performs incoming inspection → Accepts material
11. Material moved to raw material warehouse

**Day 6: Production**
12. Production Planner creates Work Order for 10,000 bottles
13. Assigns Mold #123 (bottle mold)
14. Warehouse issues 450kg plastic resin to production floor
15. Production Operator starts work order
16. Records output: 10,200 good, 150 scrap
17. Quality Inspector performs in-process inspection → Pass
18. Work order completed, mold released

**Day 7: Quality & Inventory**
19. Quality Inspector performs final inspection → Accepts 10,000 bottles
20. Warehouse transfers 10,000 bottles to finished goods

**Day 10: Financial**
21. Accounting receives supplier invoice for plastic resin
22. Accounting Staff creates AP Invoice
23. Accounting Manager approves invoice
24. Payment scheduled for due date

**Day 15: Payroll**
25. HR Manager calculates payroll for production operators
26. Includes hours worked on bottle production
27. Approves and releases payroll
28. Creates payroll liability in AP

---

## Performance Metrics Tracked

### Production Efficiency
- Planned vs Actual production time
- Good vs Scrap ratio
- Machine utilization
- Mold shot counts

### Inventory Accuracy
- Physical vs System inventory
- Stock turnover rate
- Obsolete inventory
- Shortage frequency

### Procurement Performance
- PR to PO conversion time
- PO to delivery time
- Supplier on-time delivery rate
- Purchase price variance

### Quality Metrics
- First-pass yield
- Defect rate by supplier
- NCR frequency
- Inspection cycle time

### Financial Metrics
- Days Payable Outstanding (DPO)
- Labor cost per unit
- Material cost per unit
- Overhead allocation

---

**Last Updated:** December 26, 2025
**Maintained By:** ERP Architecture Team
