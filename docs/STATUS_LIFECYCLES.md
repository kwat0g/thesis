# Status Lifecycles Documentation

## Purpose

This document defines the complete status lifecycle for all transactional entities in the ERP system. It establishes rules for status transitions, soft delete policies, and deletion constraints.

---

## Master Data Entities

### Soft Delete Policy
All master data entities use **soft delete** via the `is_active` flag:
- Items
- Suppliers
- Customers
- Machines
- Warehouses
- Employees
- Departments
- Molds

**Deletion Rules:**
- ✅ Can be deactivated (soft delete) at any time
- ❌ Cannot be hard deleted if referenced by transactional data
- ✅ Deactivated records are hidden from dropdowns but preserved for historical reporting

---

## Transactional Entities Status Lifecycles

### 1. Production Orders

**Status Flow:**
```
draft → scheduled → in_progress → completed
  ↓                      ↓
cancelled            cancelled
```

**Transition Rules:**
- `draft → scheduled`: Requires approval
- `scheduled → in_progress`: Manual start or automatic
- `in_progress → completed`: When all work orders complete
- `draft → cancelled`: Allowed
- `scheduled → cancelled`: Requires approval
- `in_progress → cancelled`: Not allowed (must complete or handle work orders first)

**Deletion Rules:**
- ✅ Can delete in `draft` status only
- ❌ Cannot delete after submission
- ❌ Cannot delete if work orders exist

**Status Guards:**
```typescript
// Implemented in productionOrderService
if (status !== 'draft') {
  throw new Error('Cannot modify production order after submission');
}
```

---

### 2. Work Orders

**Status Flow:**
```
pending → in_progress → completed
   ↓           ↓
cancelled  cancelled
```

**Transition Rules:**
- `pending → in_progress`: Manual release
- `in_progress → completed`: When output recorded
- `pending → cancelled`: Allowed
- `in_progress → cancelled`: Requires special approval

**Deletion Rules:**
- ✅ Can delete in `pending` status only
- ❌ Cannot delete if output recorded
- ❌ Cannot delete if materials issued

---

### 3. Purchase Requests (PR)

**Status Flow:**
```
draft → pending_approval → approved → converted_to_po
  ↓            ↓              ↓
cancelled  rejected      cancelled
```

**Transition Rules:**
- `draft → pending_approval`: Submit for approval
- `pending_approval → approved`: Approval action
- `pending_approval → rejected`: Rejection action
- `approved → converted_to_po`: When PO created
- `draft → cancelled`: Allowed
- `approved → cancelled`: Requires special approval

**Deletion Rules:**
- ✅ Can delete in `draft` status only
- ❌ Cannot delete after submission
- ❌ Cannot delete if converted to PO

**Status Guards:**
```typescript
// Implemented in purchaseRequestService
if (status !== 'draft') {
  throw new Error('Cannot modify PR after submission');
}
```

---

### 4. Purchase Orders (PO)

**Status Flow:**
```
draft → pending_approval → approved → sent → partially_received → received → closed
  ↓            ↓              ↓        ↓
cancelled  rejected      cancelled  cancelled
```

**Transition Rules:**
- `draft → pending_approval`: Submit for approval
- `pending_approval → approved`: Approval action
- `approved → sent`: Send to supplier
- `sent → partially_received`: First goods receipt
- `partially_received → received`: All items received
- `received → closed`: Manual closure
- Cannot cancel after `partially_received`

**Deletion Rules:**
- ✅ Can delete in `draft` status only
- ❌ Cannot delete after approval
- ❌ Cannot delete if goods received

---

### 5. Goods Receipts

**Status Flow:**
```
pending → completed
   ↓
cancelled
```

**Transition Rules:**
- `pending → completed`: After quality inspection (if required)
- `pending → cancelled`: Before inventory update only

**Deletion Rules:**
- ✅ Can delete in `pending` status only
- ❌ Cannot delete if inventory updated
- ❌ Cannot delete if inspection performed

---

### 6. Goods Issues

**Status Flow:**
```
pending → completed
   ↓
cancelled
```

**Transition Rules:**
- `pending → completed`: Immediate upon creation
- Cannot cancel after inventory deduction

**Deletion Rules:**
- ❌ Cannot delete (inventory impact)
- Must use inventory adjustment for corrections

---

### 7. Quality Inspections

**Status Flow:**
```
pending → in_progress → completed
   ↓
cancelled
```

**Transition Rules:**
- `pending → in_progress`: Inspector assigned
- `in_progress → completed`: Results recorded
- `pending → cancelled`: Before inspection starts

**Deletion Rules:**
- ✅ Can delete in `pending` status only
- ❌ Cannot delete if results recorded
- ❌ Cannot delete if NCR created

---

### 8. Non-Conformance Reports (NCR)

**Status Flow:**
```
open → investigating → resolved → closed
  ↓
cancelled
```

**Transition Rules:**
- `open → investigating`: Investigation started
- `investigating → resolved`: Disposition determined
- `resolved → closed`: Corrective action completed
- `open → cancelled`: Before investigation

**Deletion Rules:**
- ❌ Cannot delete (quality record)
- Must remain for audit trail

---

### 9. Maintenance Work Orders

**Status Flow:**
```
pending → approved → scheduled → in_progress → completed
   ↓         ↓
cancelled rejected
```

**Transition Rules:**
- `pending → approved`: Approval action
- `approved → scheduled`: Schedule assigned
- `scheduled → in_progress`: Work started
- `in_progress → completed`: Work finished
- Cannot cancel after `in_progress`

**Deletion Rules:**
- ✅ Can delete in `pending` status only
- ❌ Cannot delete after approval
- ❌ Cannot delete if parts consumed

---

### 10. Payroll Periods

**Status Flow:**
```
open → calculated → approved → released → closed
  ↓        ↓
cancelled rejected
```

**Transition Rules:**
- `open → calculated`: Payroll calculation run
- `calculated → approved`: Approval action
- `approved → released`: Payment processing
- `released → closed`: Period finalization
- Cannot modify after `released`

**Deletion Rules:**
- ✅ Can delete in `open` status only
- ❌ Cannot delete after calculation
- ❌ Cannot delete if payments made

---

### 11. AP Invoices

**Status Flow:**
```
pending → approved → partially_paid → paid
   ↓         ↓
rejected  overdue (automatic)
```

**Transition Rules:**
- `pending → approved`: Approval action
- `approved → partially_paid`: First payment
- `partially_paid → paid`: Full payment
- `approved → overdue`: Automatic when past due date
- Cannot reject after payment

**Deletion Rules:**
- ✅ Can delete in `pending` status only
- ❌ Cannot delete after approval
- ❌ Cannot delete if payments recorded

---

### 12. Mold Usage

**Status Flow:**
```
Molds have status: available → in_use → maintenance → repair → retired
```

**Transition Rules:**
- `available → in_use`: Assigned to work order
- `in_use → available`: Work order completed
- `available → maintenance`: Scheduled maintenance
- `maintenance → available`: Maintenance completed
- `available → repair`: Breakdown
- `repair → available`: Repair completed
- Any status → `retired`: End of life

**Deletion Rules:**
- ❌ Cannot delete molds (asset record)
- Use `retired` status instead
- Must remain for historical tracking

---

## Status Transition Guards

### Implementation Pattern

All services implement status transition guards:

```typescript
// Example from productionOrderService
function validateStatusTransition(currentStatus: string, action: string) {
  const allowedTransitions = {
    draft: ['scheduled', 'cancelled'],
    scheduled: ['in_progress', 'cancelled'],
    in_progress: ['completed'],
    completed: [],
    cancelled: []
  };
  
  // Validation logic
}
```

### Enforcement Locations

1. **Service Layer** (Primary)
   - All status changes validated before database update
   - Throws descriptive errors for invalid transitions

2. **API Layer** (Secondary)
   - Additional validation for user-initiated actions
   - Returns standardized error responses

3. **Database Layer** (Tertiary)
   - Check constraints where applicable
   - Ensures data integrity even if application logic bypassed

---

## Soft Delete vs Hard Delete Summary

| Entity Type | Strategy | Rationale |
|-------------|----------|-----------|
| Master Data | Soft Delete | Historical reporting, referential integrity |
| Draft Transactions | Hard Delete | No business impact, cleanup |
| Submitted Transactions | No Delete | Audit trail, compliance |
| Inventory Transactions | No Delete | Stock accuracy, traceability |
| Financial Records | No Delete | Accounting standards, audit |
| Quality Records | No Delete | Regulatory compliance |

---

## Audit Trail Requirements

All status transitions are logged in `audit_logs`:
- Previous status
- New status
- User who made the change
- Timestamp
- Reason (if applicable)

---

## Exception Handling

### Manual Overrides
System administrators can override status transitions in exceptional cases:
- Requires special permission: `SYSTEM.OVERRIDE_STATUS`
- Must provide justification
- Logged with high severity in audit logs
- Reviewed in monthly compliance reports

### Data Corrections
For incorrect data requiring status rollback:
1. Document the issue
2. Get approval from department head
3. Use admin override
4. Create corrective transaction
5. Document in audit log

---

**Last Updated:** December 26, 2025
**Maintained By:** ERP Architecture Team
