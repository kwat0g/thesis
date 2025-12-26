# Compliance & Governance Positioning

## Purpose

This document positions the manufacturing ERP system within established compliance frameworks and governance standards. It demonstrates alignment with industry best practices without claiming formal certification.

**Important Disclaimer:** This document describes system capabilities and design alignment with standards. It does not constitute or claim formal certification, audit, or compliance attestation.

---

## ISO 9001: Quality Management Systems

### Overview

ISO 9001 is the international standard for Quality Management Systems (QMS). It emphasizes process control, continuous improvement, and customer satisfaction.

### System Alignment

#### 1. Document Control (ISO 9001 Clause 7.5)

**Requirement:** Control of documented information

**System Implementation:**
- **Version Control:** All transactions have audit trail with timestamps
- **Change History:** Old/new values logged in audit_logs
- **Approval Records:** Approval workflows documented
- **Access Control:** RBAC ensures only authorized users access documents
- **Retention:** Configurable retention periods (AUDIT_LOG_RETENTION_DAYS)

**Evidence:**
- `audit_logs` table captures all document changes
- Status transitions enforce approval workflows
- User permissions control document access
- Archive process preserves historical records

---

#### 2. Traceability (ISO 9001 Clause 8.5.2)

**Requirement:** Identification and traceability of products

**System Implementation:**
- **Lot Tracking:** Production orders linked to work orders
- **Material Traceability:** Goods receipts linked to purchase orders
- **Process Traceability:** Work orders track machine, operator, mold
- **Quality Records:** Inspections linked to receipts and work orders

**Traceability Chain:**
```
Purchase Order
  ↓
Goods Receipt
  ↓
Quality Inspection (Incoming)
  ↓
Inventory Balance
  ↓
Goods Issue
  ↓
Work Order (Production)
  ↓
Quality Inspection (In-Process)
  ↓
Production Output
  ↓
Quality Inspection (Final)
  ↓
Finished Goods
```

**Evidence:**
- Foreign key relationships maintain traceability
- Reference IDs link related transactions
- Audit logs capture complete history
- Queries can reconstruct full product history

---

#### 3. Control of Nonconforming Outputs (ISO 9001 Clause 8.7)

**Requirement:** Identify and control nonconforming products

**System Implementation:**
- **Identification:** Quality inspections record pass/fail
- **Segregation:** Rejected inventory has separate status
- **Disposition:** NCR (Non-Conformance Report) documents disposition
- **Prevention:** Root cause analysis in NCR
- **Corrective Action:** NCR tracks corrective actions

**NCR Workflow:**
```
Quality Inspection → Rejection
  ↓
NCR Created
  ↓
Investigation (Root Cause)
  ↓
Disposition Decision (Scrap/Rework/Use-As-Is)
  ↓
Corrective Action
  ↓
NCR Closed
```

**Evidence:**
- `quality_inspections` table records results
- `non_conformance_reports` table documents issues
- Inventory status tracks rejected items
- Audit logs capture disposition decisions

---

#### 4. Monitoring and Measurement (ISO 9001 Clause 9.1)

**Requirement:** Monitor, measure, analyze, and evaluate QMS performance

**System Implementation:**
- **Production Metrics:** Dashboard tracks completion rates, delays
- **Quality Metrics:** Inspection pass rates, NCR frequency
- **Inventory Metrics:** Stock levels, turnover rates
- **Process Metrics:** Cycle times, yield rates

**Available Dashboards:**
- Production Dashboard: Order status, completion rates
- Quality Dashboard: Inspection results, NCR trends
- Inventory Dashboard: Stock levels, shortage alerts
- Executive Dashboard: Cross-functional KPIs

**Evidence:**
- Dashboard APIs aggregate real-time data
- Audit logs enable trend analysis
- Reports can be generated for management review

---

#### 5. Internal Audit (ISO 9001 Clause 9.2)

**Requirement:** Conduct internal audits at planned intervals

**System Support:**
- **Audit Trail:** Complete history of all transactions
- **User Actions:** All actions logged with user ID
- **Approval Records:** Approval chains documented
- **Exception Reports:** Queries identify anomalies

**Audit Queries:**
```sql
-- Self-approvals (should be 0)
SELECT * FROM audit_logs 
WHERE action = 'APPROVE' 
  AND old_value->>'requestor_id' = user_id::text;

-- Status transition violations
SELECT * FROM audit_logs 
WHERE action = 'STATUS_CHANGE' 
  AND old_value->>'status' NOT IN (allowed_transitions);

-- Unauthorized access attempts
SELECT * FROM audit_logs 
WHERE success = false 
  AND action LIKE '%UNAUTHORIZED%';
```

**Evidence:**
- Audit logs provide complete audit trail
- Queries enable systematic audit procedures
- Reports support audit findings
- Corrective actions tracked in system

---

## SOX-Like Financial Controls

### Overview

Sarbanes-Oxley Act (SOX) establishes financial reporting and internal control requirements for public companies. While this ERP may not be subject to SOX, the system implements SOX-like controls for financial integrity.

### System Alignment

#### 1. Segregation of Duties

**Principle:** No single person controls entire transaction

**System Implementation:**

| Transaction | Initiator | Approver | Executor | Verifier |
|-------------|-----------|----------|----------|----------|
| Purchase Request | Purchasing Officer | Purchasing Manager | - | - |
| Purchase Order | Purchasing Officer | Purchasing Manager | Supplier | Warehouse |
| Goods Receipt | Warehouse Staff | - | - | Quality Inspector |
| AP Invoice | Accounting Staff | Accounting Manager | - | - |
| Payment | Accounting Staff | Accounting Manager | Bank | Accounting Manager |
| Payroll | HR Staff | HR Manager | - | Accounting Manager |

**Enforcement:**
- Self-approval prevented at service level
- Different roles required for different actions
- Approval permissions separate from creation permissions
- Audit logs capture all actors

**Evidence:**
- Service-level validation: `if (requestor_id === approver_id) throw error`
- Permission matrix enforces role separation
- Audit logs show multiple users in transaction chain

---

#### 2. Access Controls

**Principle:** Restrict access to financial functions

**System Implementation:**
- **Role-Based Access:** Permissions assigned by role
- **Least Privilege:** Users have minimum necessary access
- **Approval Limits:** Configurable approval thresholds
- **Audit Trail:** All access logged

**Financial Permissions:**
- `AP.CREATE_INVOICE` - Create AP invoices
- `AP.APPROVE_INVOICE` - Approve invoices
- `AP.RECORD_PAYMENT` - Record payments
- `AP.APPROVE_PAYMENT` - Approve payments
- `HR.MANAGE_PAYROLL` - Manage payroll
- `HR.APPROVE_PAYROLL` - Approve payroll

**Evidence:**
- RBAC enforcement at API level
- Permission checks logged
- Unauthorized attempts logged
- Regular permission reviews recommended

---

#### 3. Change Management

**Principle:** Control changes to financial data

**System Implementation:**
- **Immutability:** Approved transactions cannot be modified
- **Status-Based:** Only draft transactions editable
- **Audit Trail:** All changes logged with old/new values
- **Approval Required:** Changes require re-approval

**Change Control:**
```typescript
// Service-level validation
if (transaction.status !== 'draft') {
  throw new Error('Cannot modify approved transaction');
}

// All modifications logged
await logAudit({
  action: 'UPDATE',
  resourceType: 'ap_invoice',
  resourceId: invoiceId,
  oldValue: oldInvoice,
  newValue: newInvoice,
  userId: currentUser.id
});
```

**Evidence:**
- Status validation in service layer
- Audit logs capture all changes
- Approval workflows enforce review
- Historical data preserved

---

#### 4. Reconciliation

**Principle:** Verify accuracy through reconciliation

**System Support:**
- **Three-Way Match:** PO → Goods Receipt → AP Invoice
- **Bank Reconciliation:** Payment records vs bank statements
- **Inventory Reconciliation:** Physical count vs system
- **Payroll Reconciliation:** Hours vs attendance

**Reconciliation Queries:**
```sql
-- Three-way match verification
SELECT po.po_number, gr.receipt_number, inv.invoice_number
FROM purchase_orders po
LEFT JOIN goods_receipts gr ON po.id = gr.po_id
LEFT JOIN ap_invoices inv ON po.id = inv.po_id
WHERE gr.id IS NULL OR inv.id IS NULL;

-- Payment reconciliation
SELECT p.payment_number, p.amount, inv.balance
FROM ap_payments p
JOIN ap_invoices inv ON p.invoice_id = inv.id
WHERE inv.balance < 0;
```

**Evidence:**
- Foreign key relationships enable matching
- Queries identify discrepancies
- Reports support reconciliation process
- Audit logs track reconciliation actions

---

## Manufacturing Audit Requirements

### Production Accountability

**Requirement:** Track production activities and materials

**System Implementation:**
- **Work Orders:** Document production activities
- **Material Usage:** Goods issues track material consumption
- **Output Recording:** Good/scrap/rework quantities logged
- **Operator Assignment:** Work orders link to operators
- **Machine Usage:** Work orders link to machines
- **Mold Usage:** Shot counts tracked

**Audit Trail:**
```
Production Order Created → Audit Log
  ↓
Materials Issued → Inventory Transaction + Audit Log
  ↓
Production Started → Work Order Status Change + Audit Log
  ↓
Output Recorded → Inventory Transaction + Audit Log
  ↓
Quality Inspection → Quality Record + Audit Log
  ↓
Production Completed → Work Order Status Change + Audit Log
```

**Evidence:**
- Complete production history in audit logs
- Material consumption tracked
- Yield analysis possible (output vs input)
- Operator accountability established

---

### Inventory Accountability

**Requirement:** Accurate inventory records

**System Implementation:**
- **Perpetual Inventory:** Real-time balance updates
- **Transaction Logging:** All movements logged
- **Cycle Counting:** Physical count vs system comparison
- **Adjustment Tracking:** Adjustments require approval and reason

**Inventory Transaction Types:**
- `RECEIPT` - Goods received from supplier
- `ISSUE` - Materials issued to production
- `PRODUCTION_OUTPUT` - Finished goods from production
- `ADJUSTMENT` - Manual adjustment (with reason)
- `TRANSFER` - Movement between warehouses

**Evidence:**
- `inventory_transactions` table logs all movements
- `inventory_balances` table maintains current state
- Audit logs capture adjustments
- Discrepancy reports identify issues

---

### Cost Accounting

**Requirement:** Track manufacturing costs

**System Support:**
- **Material Costs:** Purchase orders capture unit costs
- **Labor Costs:** Payroll tracks labor hours and costs
- **Overhead Allocation:** Can be calculated from data
- **Work Order Costing:** Material + labor + overhead per WO

**Cost Calculation:**
```
Work Order Cost = 
  Material Cost (from goods issues) +
  Labor Cost (from payroll, allocated by hours) +
  Overhead (allocated by machine hours or other basis)
```

**Evidence:**
- Purchase orders capture material costs
- Goods issues link materials to work orders
- Payroll tracks labor costs
- Work order data enables cost calculation

---

## Data Integrity Principles

### 1. Accuracy

**Principle:** Data accurately represents reality

**Enforcement:**
- **Validation:** Service-level validation prevents invalid data
- **Constraints:** Database constraints enforce data rules
- **Reconciliation:** Regular reconciliation identifies errors
- **Correction Process:** Adjustments logged and approved

**Evidence:**
- Validation functions in service layer
- Check constraints in database
- Reconciliation queries
- Adjustment audit trail

---

### 2. Completeness

**Principle:** All required data is captured

**Enforcement:**
- **Required Fields:** Validation enforces required fields
- **Foreign Keys:** Relationships ensure referential integrity
- **Audit Logging:** All actions logged
- **Transaction Atomicity:** No partial transactions

**Evidence:**
- `validateRequired()` function
- Foreign key constraints
- Audit log completeness verification
- Transaction boundaries documented

---

### 3. Consistency

**Principle:** Data is consistent across system

**Enforcement:**
- **Transactions:** ACID guarantees
- **Constraints:** Foreign keys, check constraints
- **Validation:** Business rule enforcement
- **Reconciliation:** Cross-checks identify inconsistencies

**Evidence:**
- Transaction usage for multi-table operations
- Database constraints
- Service-level validation
- Reconciliation procedures

---

### 4. Timeliness

**Principle:** Data is recorded promptly

**Enforcement:**
- **Real-Time Updates:** No batch processing delays
- **Timestamp Recording:** All transactions timestamped
- **Immediate Posting:** Transactions post immediately
- **No Backdating:** Timestamps cannot be manipulated

**Evidence:**
- Real-time transaction processing
- `created_at` timestamps in all tables
- Audit logs capture timing
- No batch delays

---

## Change Traceability

### Requirement

All changes to critical data must be traceable to:
- Who made the change
- When the change was made
- What was changed (old vs new values)
- Why the change was made (if applicable)

### System Implementation

**Audit Log Structure:**
```typescript
{
  id: number,
  user_id: number,
  action: string,
  resource_type: string,
  resource_id: number,
  old_value: JSON,
  new_value: JSON,
  ip_address: string,
  created_at: timestamp
}
```

**Traceability Queries:**
```sql
-- Who changed this invoice?
SELECT u.username, al.action, al.created_at
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.resource_type = 'ap_invoice' 
  AND al.resource_id = 12345
ORDER BY al.created_at;

-- What did they change?
SELECT 
  al.action,
  al.old_value->>'amount' AS old_amount,
  al.new_value->>'amount' AS new_amount,
  al.created_at
FROM audit_logs al
WHERE al.resource_type = 'ap_invoice' 
  AND al.resource_id = 12345
  AND al.action = 'UPDATE';

-- When was it approved?
SELECT u.username, al.created_at
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.resource_type = 'ap_invoice' 
  AND al.resource_id = 12345
  AND al.action = 'APPROVE';
```

**Evidence:**
- Complete audit trail in database
- Queries reconstruct change history
- User accountability established
- Timeline documented

---

## Governance Positioning Summary

### Strengths

1. **Complete Audit Trail**
   - All actions logged
   - Immutable audit logs
   - User accountability
   - Timeline reconstruction

2. **Segregation of Duties**
   - Role-based access control
   - Self-approval prevention
   - Approval workflows
   - Multiple actors required

3. **Data Integrity**
   - ACID transactions
   - Database constraints
   - Service-level validation
   - Reconciliation support

4. **Traceability**
   - End-to-end traceability
   - Foreign key relationships
   - Audit log linkage
   - Historical preservation

5. **Access Control**
   - Three-layer RBAC
   - Permission-based actions
   - Unauthorized attempt logging
   - Regular access reviews

### Areas for Enhancement

1. **Formal Certification**
   - ISO 9001 certification requires external audit
   - SOX compliance requires attestation
   - Consider pursuing formal certification

2. **Automated Controls**
   - Automated reconciliation reports
   - Automated exception detection
   - Automated compliance monitoring

3. **Enhanced Reporting**
   - Compliance dashboards
   - Audit reports
   - Exception reports
   - Management reports

4. **External Integration**
   - External audit tool integration
   - Regulatory reporting
   - Third-party verification

---

## Compliance Maintenance

### Ongoing Requirements

1. **Regular Audits**
   - Internal audits quarterly
   - External audits annually
   - Compliance reviews monthly

2. **Access Reviews**
   - User access review quarterly
   - Permission audit monthly
   - Role assignment verification

3. **Data Quality**
   - Reconciliation procedures monthly
   - Data integrity checks weekly
   - Exception investigation daily

4. **Documentation**
   - Policy updates as needed
   - Procedure documentation
   - Training materials
   - Audit evidence

### Compliance Checklist

- [ ] Audit logs reviewed monthly
- [ ] Access permissions reviewed quarterly
- [ ] Segregation of duties verified quarterly
- [ ] Reconciliation procedures performed monthly
- [ ] Exception reports reviewed weekly
- [ ] User training conducted annually
- [ ] Policies reviewed and updated annually
- [ ] External audit prepared annually

---

**Last Updated:** December 26, 2025
**Maintained By:** ERP Governance Team

**Disclaimer:** This document describes system capabilities and design alignment with standards. It does not constitute formal certification, audit, or compliance attestation. Organizations should engage qualified auditors for formal compliance verification.
