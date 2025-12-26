# RBAC Enforcement Strategy

## Purpose

This document defines the Role-Based Access Control (RBAC) enforcement strategy for the ERP system. It establishes the principle of **defense in depth** where authorization is enforced at multiple layers.

---

## Core Principle: Double-Lock Security

**UI Permission Checks are NOT Sufficient**

The ERP system implements a **double-lock** strategy:
1. **Frontend Lock**: UI elements hidden/disabled based on permissions
2. **Backend Lock**: API endpoints enforce permissions regardless of UI

**Why Both?**
- Frontend can be bypassed (browser tools, API clients)
- Backend is the ultimate authority
- Defense in depth protects against security vulnerabilities

---

## RBAC Architecture

### 1. Permission Structure

Permissions follow a hierarchical naming convention:
```
MODULE.ACTION_RESOURCE
```

**Examples:**
- `PROD.CREATE_ORDER` - Create production orders
- `PURCH.APPROVE_PR` - Approve purchase requests
- `INV.VIEW_STOCK` - View inventory balances
- `HR.MANAGE_PAYROLL` - Manage payroll
- `SYSTEM.ADMIN` - System administration

### 2. Role Hierarchy

```
System Admin (All permissions)
  ├── Production Manager
  │   ├── Production Planner
  │   └── Production Operator
  ├── Purchasing Manager
  │   └── Purchasing Officer
  ├── Warehouse Manager
  │   └── Warehouse Staff
  ├── Quality Manager
  │   └── Quality Inspector
  ├── Maintenance Manager
  │   └── Maintenance Technician
  ├── HR Manager
  │   └── HR Staff
  └── Accounting Manager
      └── Accounting Staff
```

---

## Enforcement Layers

### Layer 1: Frontend (UI) Enforcement

**Location:** React components using `usePermissions` hook

**Purpose:**
- Improve user experience
- Hide irrelevant features
- Provide clear feedback

**Implementation:**
```typescript
const { hasPermission } = usePermissions();

// Hide button if no permission
{hasPermission('PROD.CREATE_ORDER') && (
  <button>Create Production Order</button>
)}

// Disable action if no permission
<button disabled={!hasPermission('PURCH.APPROVE_PR')}>
  Approve
</button>
```

**Limitation:** ⚠️ Can be bypassed by modifying client-side code

---

### Layer 2: API Route Enforcement (MANDATORY)

**Location:** All API route handlers

**Purpose:**
- Ultimate authorization authority
- Prevent unauthorized access
- Protect sensitive operations

**Implementation Pattern:**
```typescript
// EVERY API route must include this
import { authenticate, requirePermission } from '@/lib/middleware/auth';

export async function GET(request: Request) {
  // Step 1: Authenticate user
  const user = await authenticate(request);
  if (!user) {
    return Response.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Step 2: Check permission
  const hasPermission = await requirePermission(user.id, 'PROD.VIEW_ORDERS');
  if (!hasPermission) {
    return Response.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Step 3: Execute business logic
  // ...
}
```

**Critical Rule:** ❌ **NEVER skip permission check in API routes**

---

### Layer 3: Service Layer Enforcement (Optional)

**Location:** Service methods for sensitive operations

**Purpose:**
- Additional validation for critical operations
- Business rule enforcement
- Audit trail

**Implementation:**
```typescript
// For highly sensitive operations
async function deleteProductionOrder(orderId: number, userId: number) {
  // Verify user has permission
  const hasPermission = await checkUserPermission(userId, 'PROD.DELETE_ORDER');
  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }

  // Additional business rule: Can only delete draft orders
  const order = await getProductionOrder(orderId);
  if (order.status !== 'draft') {
    throw new Error('Cannot delete non-draft orders');
  }

  // Proceed with deletion
  // ...
}
```

---

## Permission Verification Checklist

### For Every API Endpoint

✅ **Authentication Check**
- Verify JWT token is valid
- Extract user information
- Return 401 if not authenticated

✅ **Authorization Check**
- Verify user has required permission
- Return 403 if insufficient permissions
- Log unauthorized access attempts

✅ **Resource Ownership Check** (if applicable)
- Verify user owns or has access to the resource
- Example: Users can only view their own payroll
- Return 403 if accessing unauthorized resource

✅ **Audit Logging**
- Log all access attempts (success and failure)
- Include user ID, action, resource, timestamp
- Store in `audit_logs` table

---

## Permission Matrix

### Production Module

| Action | Permission | Roles |
|--------|-----------|-------|
| View production orders | `PROD.VIEW_ORDERS` | All production staff |
| Create production order | `PROD.CREATE_ORDER` | Production Planner, Manager |
| Approve production order | `PROD.APPROVE_ORDER` | Production Manager |
| Start work order | `PROD.START_WORK_ORDER` | Production Operator |
| Record output | `PROD.RECORD_OUTPUT` | Production Operator |

### Purchasing Module

| Action | Permission | Roles |
|--------|-----------|-------|
| View PRs | `PURCH.VIEW_PR` | All purchasing staff |
| Create PR | `PURCH.CREATE_PR` | Purchasing Officer, Manager |
| Approve PR | `PURCH.APPROVE_PR` | Purchasing Manager |
| Create PO | `PURCH.CREATE_PO` | Purchasing Officer, Manager |
| Approve PO | `PURCH.APPROVE_PO` | Purchasing Manager |

### Inventory Module

| Action | Permission | Roles |
|--------|-----------|-------|
| View stock | `INV.VIEW_STOCK` | All warehouse staff |
| Receive goods | `INV.RECEIVE_GOODS` | Warehouse Staff |
| Issue goods | `INV.ISSUE_GOODS` | Warehouse Staff |
| Adjust inventory | `INV.ADJUST_INVENTORY` | Warehouse Manager |

### Quality Module

| Action | Permission | Roles |
|--------|-----------|-------|
| View inspections | `QC.VIEW_INSPECTIONS` | All quality staff |
| Create inspection | `QC.CREATE_INSPECTION` | Quality Inspector |
| Record results | `QC.RECORD_RESULTS` | Quality Inspector |
| Create NCR | `QC.CREATE_NCR` | Quality Inspector |
| Approve disposition | `QC.APPROVE_DISPOSITION` | Quality Manager |

### HR Module

| Action | Permission | Roles |
|--------|-----------|-------|
| View employees | `HR.VIEW_EMPLOYEES` | HR Staff, Managers |
| Manage employees | `HR.MANAGE_EMPLOYEES` | HR Manager |
| View attendance | `HR.VIEW_ATTENDANCE` | HR Staff |
| Manage payroll | `HR.MANAGE_PAYROLL` | HR Manager |
| Approve payroll | `HR.APPROVE_PAYROLL` | HR Manager, Accounting Manager |

### Accounting Module

| Action | Permission | Roles |
|--------|-----------|-------|
| View invoices | `AP.VIEW_INVOICES` | Accounting Staff |
| Create invoice | `AP.CREATE_INVOICE` | Accounting Staff |
| Approve invoice | `AP.APPROVE_INVOICE` | Accounting Manager |
| Record payment | `AP.RECORD_PAYMENT` | Accounting Staff |
| Approve payment | `AP.APPROVE_PAYMENT` | Accounting Manager |

### Maintenance Module

| Action | Permission | Roles |
|--------|-----------|-------|
| View schedules | `MAINT.VIEW_SCHEDULES` | All maintenance staff |
| Create work order | `MAINT.CREATE_WORK_ORDER` | Maintenance Technician |
| Approve work order | `MAINT.APPROVE_WORK_ORDER` | Maintenance Manager |
| Complete work order | `MAINT.COMPLETE_WORK_ORDER` | Maintenance Technician |

### Dashboard Module

| Action | Permission | Roles |
|--------|-----------|-------|
| View production dashboard | `DASH.VIEW_PRODUCTION` | Production Manager, System Admin |
| View inventory dashboard | `DASH.VIEW_INVENTORY` | Warehouse Manager, System Admin |
| View purchasing dashboard | `DASH.VIEW_PURCHASING` | Purchasing Manager, System Admin |
| View accounting dashboard | `DASH.VIEW_ACCOUNTING` | Accounting Manager, System Admin |
| View executive summary | `DASH.VIEW_EXECUTIVE_SUMMARY` | All Managers, System Admin |

---

## Security Best Practices

### 1. Principle of Least Privilege
- Users get only the permissions they need
- No blanket "admin" access except for System Admin
- Regular permission audits

### 2. Separation of Duties
- Requestor cannot approve their own requests
- Different roles for creation vs approval
- Financial transactions require dual approval

### 3. Permission Inheritance
- Managers inherit permissions of their staff
- System Admin has all permissions
- Explicit deny overrides allow

### 4. Audit Trail
- All permission checks logged
- Failed authorization attempts flagged
- Monthly security reports generated

### 5. Token Security
- JWT tokens expire after 8 hours
- Refresh tokens stored securely
- Tokens invalidated on logout
- No sensitive data in tokens

---

## Implementation Verification

### API Route Audit Checklist

For each API route, verify:

```typescript
// ✅ Authentication middleware present
const user = await authenticate(request);

// ✅ Permission check present
const hasPermission = await requirePermission(user.id, 'REQUIRED_PERMISSION');

// ✅ Proper error responses
if (!hasPermission) {
  return Response.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
}

// ✅ Audit logging present
await logAuditEvent({
  userId: user.id,
  action: 'ACTION_NAME',
  resourceType: 'RESOURCE_TYPE',
  resourceId: id,
  success: true
});
```

---

## Common Vulnerabilities Prevented

### 1. Direct Object Reference
**Attack:** User modifies URL to access another user's data
**Prevention:** Resource ownership check in API

### 2. Privilege Escalation
**Attack:** User attempts to perform admin actions
**Prevention:** Permission check in every API route

### 3. Session Hijacking
**Attack:** Attacker steals JWT token
**Prevention:** Short token expiry, secure storage, HTTPS only

### 4. CSRF (Cross-Site Request Forgery)
**Attack:** Malicious site makes requests on user's behalf
**Prevention:** JWT in Authorization header (not cookies)

### 5. API Abuse
**Attack:** Automated tools hammer API endpoints
**Prevention:** Rate limiting, authentication required

---

## Monitoring and Alerts

### Security Events to Monitor

1. **Failed Authentication Attempts**
   - Alert after 5 failed attempts
   - Lock account after 10 attempts

2. **Unauthorized Access Attempts**
   - Log all 403 responses
   - Alert on repeated attempts

3. **Permission Changes**
   - Log all role/permission modifications
   - Require approval for sensitive permissions

4. **Unusual Activity Patterns**
   - Multiple logins from different IPs
   - Access outside normal hours
   - Bulk data downloads

---

## Testing Strategy

### Unit Tests
- Test permission checks in isolation
- Verify correct permissions required
- Test edge cases (no permission, wrong permission)

### Integration Tests
- Test full authentication flow
- Verify API routes enforce permissions
- Test permission inheritance

### Security Tests
- Attempt to bypass authentication
- Try to access resources without permission
- Test token expiration handling

---

**Last Updated:** December 26, 2025
**Maintained By:** ERP Security Team
