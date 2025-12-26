# Final System Narrative

## Executive Summary

This document presents the Internal Manufacturing ERP System as a cohesive enterprise solution designed to manage the complete manufacturing lifecycle within a single organization. The system integrates production planning, material procurement, inventory management, production execution, quality control, and financial operations into a unified platform that enforces business rules, maintains data integrity, and provides comprehensive audit trails.

---

## System Overview

The Internal Manufacturing ERP System is a comprehensive enterprise resource planning solution purpose-built for manufacturing operations. It manages the entire value chain from demand planning through production execution to financial settlement, ensuring data consistency, operational accountability, and regulatory compliance throughout.

**Core Principle:** Every transaction is traceable, every approval is documented, and every state change is validated.

---

## End-to-End Manufacturing Flow

### Phase 1: Internal Production Order Creation

**Business Context:**
Manufacturing begins with demand. A production planner identifies the need to manufacture finished goods based on sales forecasts, inventory levels, or customer orders.

**System Process:**
The production planner creates a Production Order specifying:
- Which item to produce (finished good)
- Quantity required
- Priority level (low, normal, high, urgent)
- Planned start and end dates
- Target warehouse for finished goods

**Workflow:**
1. Production Order created in draft status
2. Planner reviews and validates requirements
3. Order submitted for approval
4. Production Manager reviews order details
5. Manager approves or rejects with reason
6. Approved orders move to scheduled status

**Data Integrity:**
- Item must exist and be active
- Quantity must be positive
- Dates must be logical (start before end)
- Approval cannot be self-approval
- All actions logged in audit trail

**Outcome:**
An approved Production Order ready for material planning and execution.

---

### Phase 2: Production Planning & Material Requirements Planning (MRP)

**Business Context:**
Before production can begin, the system must determine what materials are needed and whether sufficient inventory exists. If materials are insufficient, procurement must be initiated.

**System Process:**
The MRP engine analyzes:
- Production Order requirements (what is needed)
- Bill of Materials (BOM) for each item (component breakdown)
- Current inventory balances (what is available)
- Existing purchase orders (what is incoming)
- Lead times (how long procurement takes)

**MRP Calculation Logic:**
```
For each Production Order:
  For each component in BOM:
    Required Quantity = Production Quantity × BOM Quantity
    Available Quantity = Inventory Balance + Incoming POs
    Shortage = Required Quantity - Available Quantity
    
    If Shortage > 0:
      Generate Purchase Request for Shortage
      Consider Lead Time for delivery date
```

**Workflow:**
1. Planner executes MRP run
2. System calculates material requirements
3. System identifies shortages
4. System generates Purchase Requests automatically
5. Purchase Requests created in draft status
6. Planner reviews generated requests

**Data Integrity:**
- BOM relationships must be defined
- Inventory balances must be accurate
- Lead times must be configured
- All calculations logged

**Outcome:**
Purchase Requests generated for all material shortages, ready for procurement approval.

---

### Phase 3: Material Procurement

**Business Context:**
Materials identified as short must be procured from external suppliers. This involves approval workflows, supplier selection, and purchase order management.

#### 3.1 Purchase Request Approval

**Workflow:**
1. Purchasing Officer reviews MRP-generated requests
2. Officer may modify quantities or add manual requests
3. Officer submits requests for approval
4. Purchasing Manager reviews business justification
5. Manager approves or rejects with reason
6. Approved requests ready for PO conversion

**Segregation of Duties:**
- Requestor cannot approve own request
- Different roles for creation and approval
- All approvals logged with approver identity

#### 3.2 Purchase Order Creation

**Workflow:**
1. Purchasing Officer converts approved PR to PO
2. Officer selects supplier from master data
3. Officer specifies unit prices and delivery terms
4. Officer submits PO for approval
5. Purchasing Manager reviews supplier and pricing
6. Manager approves PO
7. Approved PO sent to supplier

**Three-Way Match Foundation:**
The Purchase Order establishes the first document in the three-way match:
- PO: What was ordered
- Goods Receipt: What was received (to be verified)
- AP Invoice: What is being billed (to be verified)

**Data Integrity:**
- Supplier must exist and be active
- Unit prices must be positive
- Delivery dates must be future dates
- PO references approved PR
- All actions logged

**Outcome:**
Approved Purchase Order sent to supplier, awaiting material delivery.

---

### Phase 4: Inventory Receiving & Quality Control

**Business Context:**
When materials arrive from suppliers, they must be physically received, inspected for quality, and recorded in inventory before they can be used in production.

#### 4.1 Goods Receipt

**Workflow:**
1. Warehouse staff receives physical delivery
2. Staff verifies delivery against PO
3. Staff creates Goods Receipt in system
4. Staff records received quantities per item
5. System creates inventory transactions
6. System updates inventory balances
7. System updates PO status (partial or complete)

**Transaction Atomicity:**
Goods receipt is a multi-table transaction:
- Create goods_receipts record
- Create goods_receipt_items records (multiple)
- Create inventory_transactions records (multiple)
- Update inventory_balances (multiple)
- Update purchase_orders status

All operations succeed together or fail together (ACID guarantee).

#### 4.2 Quality Inspection

**Workflow:**
1. Quality Inspector creates inspection record
2. Inspector links inspection to goods receipt
3. Inspector performs physical inspection
4. Inspector records results (pass/fail)
5. Inspector specifies disposition:
   - Accept: Material moves to available inventory
   - Reject: Material quarantined or returned
   - Conditional: Material usable with restrictions

**Non-Conformance Reporting:**
If materials fail inspection:
1. Inspector creates Non-Conformance Report (NCR)
2. NCR documents defect details
3. NCR specifies root cause
4. NCR defines corrective action
5. NCR tracked until closure

**Data Integrity:**
- Inspection must reference valid goods receipt
- Results must be documented
- Rejected materials segregated
- All inspections logged

**Outcome:**
Accepted materials available in inventory for production use. Rejected materials documented and segregated.

---

### Phase 5: Production Execution

**Business Context:**
With materials available, production can begin. Work Orders translate Production Orders into executable shop floor instructions.

#### 5.1 Work Order Creation

**Workflow:**
1. Production Supervisor creates Work Order from Production Order
2. Supervisor assigns machine and operator
3. Supervisor assigns mold (for injection molding)
4. Supervisor specifies planned quantities
5. Work Order created in pending status
6. Supervisor starts Work Order

**Work Order Lifecycle:**
- Pending → In Progress → Completed
- Cannot skip statuses
- Status changes logged

#### 5.2 Material Issue

**Workflow:**
1. Warehouse staff issues materials to Work Order
2. Staff specifies Work Order reference
3. System validates Work Order is in progress
4. System validates sufficient inventory
5. System creates inventory transactions (negative)
6. System updates inventory balances (decrease)

**Data Integrity:**
- Work Order must be in progress
- Materials must be available
- Quantities must not exceed inventory
- Transaction atomic

#### 5.3 Production Output Recording

**Workflow:**
1. Operator completes production run
2. Operator records output quantities:
   - Good units produced
   - Scrap units (defective)
   - Rework units (repairable)
3. System creates inventory transactions (positive)
4. System updates inventory balances (increase)
5. System updates Work Order progress

**Yield Analysis:**
```
Yield % = (Good Units / Total Units) × 100
Material Efficiency = Output / Input
```

#### 5.4 Work Order Completion

**Workflow:**
1. Supervisor reviews output quantities
2. Supervisor verifies all materials issued
3. Supervisor completes Work Order
4. System updates Production Order progress
5. If all Work Orders complete, Production Order completes

**Data Integrity:**
- Output quantities validated
- Material consumption recorded
- Completion logged with timestamp
- Cannot reopen completed Work Orders

**Outcome:**
Finished goods produced and recorded in inventory, ready for quality inspection.

---

### Phase 6: Final Quality Control

**Business Context:**
Finished goods must pass final inspection before they can be shipped or used.

**Workflow:**
1. Quality Inspector creates final inspection
2. Inspector links to Work Order or Production Order
3. Inspector performs inspection per quality plan
4. Inspector records results
5. Inspector approves or rejects finished goods

**Disposition:**
- **Accept:** Finished goods move to available inventory
- **Reject:** Goods quarantined, NCR created
- **Rework:** Goods returned to production

**Data Integrity:**
- Inspection criteria documented
- Results recorded
- Approved goods available for use
- Rejected goods segregated

**Outcome:**
Quality-approved finished goods available in inventory.

---

### Phase 7: Finished Goods Inventory Management

**Business Context:**
Finished goods inventory is managed separately from raw materials, tracked by warehouse location, and available for shipment or internal use.

**Inventory Transactions:**
- Production output (increase)
- Quality rejection (decrease)
- Inventory adjustments (with approval and reason)
- Transfers between warehouses

**Inventory Accuracy:**
- Perpetual inventory system (real-time updates)
- Cycle counting procedures
- Physical count reconciliation
- Adjustment tracking

**Data Integrity:**
- All movements logged
- Balances cannot be negative
- Adjustments require approval
- Audit trail complete

**Outcome:**
Accurate inventory records supporting business decisions.

---

### Phase 8: Accounts Payable & Financial Settlement

**Business Context:**
Suppliers must be paid for materials received. The three-way match ensures payment accuracy.

#### 8.1 AP Invoice Creation

**Workflow:**
1. Accounting Staff receives supplier invoice
2. Staff creates AP Invoice in system
3. Staff links invoice to Purchase Order
4. System validates three-way match:
   - PO: What was ordered
   - Goods Receipt: What was received
   - Invoice: What is being billed
5. System flags discrepancies for investigation

**Three-Way Match Validation:**
```
For each invoice line:
  PO Quantity vs Receipt Quantity vs Invoice Quantity
  PO Unit Price vs Invoice Unit Price
  
If discrepancies:
  Flag for approval or correction
```

#### 8.2 Invoice Approval

**Workflow:**
1. Accounting Manager reviews invoice
2. Manager verifies three-way match
3. Manager reviews discrepancies (if any)
4. Manager approves or rejects invoice
5. Approved invoices ready for payment

**Segregation of Duties:**
- Invoice creator cannot approve
- Different roles for entry and approval
- All approvals logged

#### 8.3 Payment Processing

**Workflow:**
1. Accounting Staff schedules payment
2. Staff specifies payment method and date
3. Staff submits payment for approval
4. Accounting Manager approves payment
5. System records payment
6. System updates invoice balance
7. Payment reference recorded for bank reconciliation

**Data Integrity:**
- Payment cannot exceed invoice balance
- Overpayment prevented
- Payment logged with bank reference
- All actions audited

**Outcome:**
Supplier paid accurately, financial records complete, audit trail maintained.

---

### Phase 9: Payroll Processing

**Business Context:**
Employees must be compensated for work performed. Payroll integrates attendance tracking, rate management, and payment processing.

#### 9.1 Attendance Recording

**Workflow:**
1. Employees clock in/out via biometric system
2. Biometric data imported to ERP (read-only)
3. HR Staff reviews attendance records
4. Staff makes manual corrections if needed (with remarks)
5. Attendance data ready for payroll calculation

**Data Integrity:**
- Biometric records immutable
- Manual corrections logged
- Corrections require justification
- All changes audited

#### 9.2 Payroll Calculation

**Workflow:**
1. HR Staff creates payroll period
2. Staff executes payroll calculation
3. System calculates:
   - Regular hours × regular rate
   - Overtime hours × overtime rate
   - Deductions (taxes, benefits)
   - Net pay
4. Staff reviews calculated amounts
5. Staff submits payroll for approval

**Calculation Formula:**
```
Gross Pay = (Regular Hours × Regular Rate) + (OT Hours × OT Rate)
Deductions = Taxes + Benefits + Other
Net Pay = Gross Pay - Deductions
```

#### 9.3 Payroll Approval

**Workflow:**
1. HR Manager reviews payroll calculations
2. Manager verifies attendance data
3. Manager checks for anomalies
4. Manager approves or rejects payroll
5. Approved payroll ready for release

**Segregation of Duties:**
- Calculator cannot approve
- Different roles for calculation and approval
- All approvals logged

#### 9.4 Payroll Release

**Workflow:**
1. HR Manager releases approved payroll
2. System creates AP invoices for payroll
3. System marks payroll as released
4. Accounting processes payment
5. Employees receive compensation

**Financial Integration:**
Payroll release creates AP invoices, integrating HR and Accounting modules.

**Data Integrity:**
- Released payroll immutable
- Cannot modify after release
- All actions logged
- Audit trail complete

**Outcome:**
Employees compensated accurately, financial records updated, compliance maintained.

---

## System Integration Points

### Cross-Module Data Flow

**Production → Inventory:**
- Production output increases finished goods inventory
- Material issue decreases raw material inventory
- Work Orders reference inventory items

**Purchasing → Inventory:**
- Goods receipts increase inventory balances
- Purchase orders create expected receipts
- Supplier deliveries update inventory

**Inventory → Production:**
- Material availability drives production scheduling
- Inventory shortages trigger MRP
- Material issues consume inventory

**Quality → Inventory:**
- Inspection results affect inventory status
- Rejected materials quarantined
- Approved materials available

**Purchasing → Accounting:**
- Purchase orders establish payment obligations
- Goods receipts trigger invoice matching
- Three-way match ensures payment accuracy

**HR → Accounting:**
- Payroll release creates AP invoices
- Attendance drives payroll calculation
- Employee compensation recorded

### Status Propagation

**Production Order Status:**
- Draft → Submitted → Approved → Scheduled → In Progress → Completed
- Status changes trigger downstream actions
- Cannot skip statuses

**Purchase Order Status:**
- Draft → Submitted → Approved → Sent → Partially Received → Completed
- Goods receipts update PO status
- Status determines available actions

**Work Order Status:**
- Pending → In Progress → Completed
- Material issues require in-progress status
- Completion updates Production Order

### Approval Handoffs

**Purchase Request → Purchase Order:**
- PR must be approved before PO creation
- PO references approved PR
- Approval chain documented

**Production Order → Work Order:**
- Production Order must be approved
- Work Orders created from approved orders
- Execution follows approval

**Payroll Calculation → Payroll Release:**
- Calculation must be approved
- Release creates financial transactions
- Approval chain maintained

---

## Data Integrity Guarantees

### Transaction Boundaries

All multi-table operations use database transactions:
- Goods receipt (6 tables updated atomically)
- Production output (5 tables updated atomically)
- Payroll release (3 tables updated atomically)

**ACID Properties:**
- Atomicity: All or nothing
- Consistency: Valid state transitions
- Isolation: Concurrent transactions don't interfere
- Durability: Committed data survives failures

### Validation Layers

**Layer 1: Type System**
- Compile-time type checking
- Prevents type errors
- IDE support

**Layer 2: Service Layer**
- Runtime validation
- Business rule enforcement
- Cross-entity validation

**Layer 3: Database Constraints**
- Foreign keys enforce relationships
- Check constraints enforce rules
- Unique constraints prevent duplicates

### Audit Trail

Every action logged:
- User ID (who)
- Timestamp (when)
- Action type (what)
- Old/new values (how)
- IP address (where)

**Audit Log Properties:**
- Immutable (append-only)
- Complete (no gaps)
- Traceable (user accountability)
- Legally defensible

---

## Security & Accountability

### Role-Based Access Control

**Three-Layer Enforcement:**
1. UI Layer: Hide unauthorized actions
2. API Layer: Verify permissions (primary boundary)
3. Service Layer: Validate sensitive operations

**Permission Model:**
- Permissions assigned to roles
- Roles assigned to users
- Least privilege principle
- Regular access reviews

### Segregation of Duties

**Principle:** No single person completes entire transaction

**Examples:**
- PR creator ≠ PR approver
- PO creator ≠ PO approver
- Invoice creator ≠ Invoice approver
- Payroll calculator ≠ Payroll approver

**Enforcement:**
- Service-level validation
- Self-approval prevented
- Approval chains documented
- All violations logged

### Fraud Prevention

**Multiple Controls:**
- Approval workflows
- Segregation of duties
- Comprehensive audit logging
- Three-way matching
- Reconciliation procedures
- Exception monitoring

**Detection Mechanisms:**
- Audit log analysis
- Anomaly detection
- Regular reconciliation
- Internal audits

---

## System Characteristics

### Operational

- **Real-Time:** All transactions post immediately
- **Consistent:** ACID guarantees maintained
- **Traceable:** Complete audit trail
- **Accountable:** User actions logged
- **Validated:** Multiple validation layers

### Architectural

- **Monolithic:** Single deployment unit
- **Layered:** Clear separation of concerns
- **Transactional:** Database transactions for integrity
- **Relational:** MySQL for ACID compliance
- **Stateless:** JWT authentication

### Compliance

- **ISO 9001 Aligned:** Quality management traceability
- **SOX-Like Controls:** Financial segregation of duties
- **Audit Ready:** Complete audit trail
- **Data Integrity:** Multiple enforcement layers
- **Accountability:** Non-repudiation through logging

---

## Conclusion

The Internal Manufacturing ERP System provides a comprehensive, integrated solution for managing manufacturing operations from demand planning through financial settlement. Through careful architectural design, rigorous validation, comprehensive audit logging, and enforced approval workflows, the system ensures data integrity, operational accountability, and regulatory compliance.

The system demonstrates that a well-designed monolithic architecture with strong transactional guarantees, role-based access control, and comprehensive audit trails can effectively support complex manufacturing operations while maintaining data consistency and operational accountability.

**Core Achievement:** Every transaction is validated, every approval is documented, every change is logged, and every user is accountable.

---

**Document Version:** 1.0  
**Last Updated:** December 26, 2025  
**Prepared For:** Thesis Defense Panel
