# Internal Production Order Module - API Documentation

## Overview

The Internal Production Order Module manages production orders for finished goods manufacturing. It includes a complete approval workflow (Draft → Pending Approval → Approved → Released) with full RBAC enforcement and audit logging.

**Base URL**: `/api/production/orders`

**Authentication**: All requests require `Authorization: Bearer <token>` header

---

## Status Lifecycle

Production orders follow this strict lifecycle:

```
DRAFT → PENDING_APPROVAL → APPROVED → RELEASED → IN_PROGRESS → COMPLETED
   ↓              ↓            ↓           ↓
CANCELLED ← CANCELLED ← CANCELLED ← CANCELLED
```

**Status Definitions**:
- **draft**: Initial state, can be edited or deleted
- **pending_approval**: Submitted for management approval
- **approved**: Approved by management, ready for release
- **released**: Released to production planning/execution
- **in_progress**: Production has started (set by production execution)
- **completed**: Production finished (set by production execution)
- **cancelled**: Order cancelled at any stage

---

## API Endpoints

### 1. Get Production Orders (List)

**GET** `/api/production/orders`

Get paginated list of production orders with filtering.

**Required Permission**: `PROD.VIEW_ORDERS`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (draft, pending_approval, approved, released, in_progress, completed, cancelled)
- `priority` (optional): Filter by priority (low, normal, high, urgent)
- `itemId` (optional): Filter by item ID
- `fromDate` (optional): Filter by required date from (YYYY-MM-DD)
- `toDate` (optional): Filter by required date to (YYYY-MM-DD)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "poNumber": "PO-2024-001",
      "customerPoReference": "CUST-PO-12345",
      "itemId": 10,
      "quantityOrdered": 5000,
      "quantityProduced": 0,
      "requiredDate": "2024-12-31",
      "priority": "high",
      "status": "approved",
      "notes": "Urgent customer order",
      "createdAt": "2024-12-26T10:00:00.000Z",
      "updatedAt": "2024-12-26T11:00:00.000Z",
      "createdBy": 1,
      "updatedBy": 2
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### 2. Get Production Order by ID

**GET** `/api/production/orders/:id`

Get single production order details.

**Required Permission**: `PROD.VIEW_ORDERS`

**Response**: Same as single production order object

---

### 3. Create Production Order

**POST** `/api/production/orders`

Create a new production order.

**Required Permission**: `PROD.CREATE_ORDER`

**Request Body**:
```json
{
  "poNumber": "PO-2024-001",
  "customerPoReference": "CUST-PO-12345",
  "itemId": 10,
  "quantityOrdered": 5000,
  "requiredDate": "2024-12-31",
  "priority": "high",
  "notes": "Urgent customer order",
  "submitForApproval": false
}
```

**Field Descriptions**:
- `poNumber` (required): Unique production order number
- `customerPoReference` (optional): Customer PO number for reference only
- `itemId` (required): Item ID (must be a finished good)
- `quantityOrdered` (required): Quantity to produce (must be > 0)
- `requiredDate` (required): Required completion date (cannot be in the past)
- `priority` (optional): Priority level (low, normal, high, urgent) - default: normal
- `notes` (optional): Additional notes
- `submitForApproval` (optional): If true, creates as pending_approval; if false, creates as draft

**Business Rules**:
- PO number must be unique
- Item must exist and be of type 'finished_good'
- Quantity must be greater than 0
- Required date cannot be in the past
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "poNumber": "PO-2024-001",
    "customerPoReference": "CUST-PO-12345",
    "itemId": 10,
    "quantityOrdered": 5000,
    "quantityProduced": 0,
    "requiredDate": "2024-12-31",
    "priority": "high",
    "status": "draft",
    "notes": "Urgent customer order",
    "createdAt": "2024-12-26T10:00:00.000Z",
    "updatedAt": "2024-12-26T10:00:00.000Z",
    "createdBy": 1,
    "updatedBy": 1
  },
  "message": "Production order created successfully"
}
```

---

### 4. Update Production Order

**PUT** `/api/production/orders/:id`

Update an existing production order.

**Required Permission**: `PROD.UPDATE_ORDER`

**Request Body**:
```json
{
  "customerPoReference": "CUST-PO-12345-REV1",
  "itemId": 10,
  "quantityOrdered": 6000,
  "requiredDate": "2024-12-31",
  "priority": "urgent",
  "notes": "Updated quantity and priority"
}
```

**Business Rules**:
- Only DRAFT orders can be updated
- Cannot change PO number
- Same validation as create
- Creates audit log entry with old and new values

**Response**: Same as get production order

---

### 5. Submit for Approval

**POST** `/api/production/orders/:id/submit`

Submit a draft production order for management approval.

**Required Permission**: `PROD.CREATE_ORDER`

**Request Body**: None

**Business Rules**:
- Only DRAFT orders can be submitted
- Changes status from draft → pending_approval
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "poNumber": "PO-2024-001",
    "status": "pending_approval",
    ...
  },
  "message": "Production order submitted for approval"
}
```

---

### 6. Approve Production Order

**POST** `/api/production/orders/:id/approve`

Approve a pending production order (Management only).

**Required Permission**: `PROD.APPROVE_ORDER`

**Request Body**: None

**Business Rules**:
- Only PENDING_APPROVAL orders can be approved
- Changes status from pending_approval → approved
- Records approver ID and timestamp
- Creates audit log entry
- **Management role required**

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "poNumber": "PO-2024-001",
    "status": "approved",
    ...
  },
  "message": "Production order approved successfully"
}
```

---

### 7. Reject Production Order

**POST** `/api/production/orders/:id/reject`

Reject a pending production order and return to draft (Management only).

**Required Permission**: `PROD.APPROVE_ORDER`

**Request Body**:
```json
{
  "reason": "Insufficient capacity for required date"
}
```

**Business Rules**:
- Only PENDING_APPROVAL orders can be rejected
- Changes status from pending_approval → draft
- Rejection reason appended to notes
- Creates audit log entry
- **Management role required**

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "poNumber": "PO-2024-001",
    "status": "draft",
    "notes": "Original notes\n[REJECTED: Insufficient capacity for required date]",
    ...
  },
  "message": "Production order rejected"
}
```

---

### 8. Release Production Order

**POST** `/api/production/orders/:id/release`

Release an approved production order to production.

**Required Permission**: `PROD.RELEASE_ORDER`

**Request Body**: None

**Business Rules**:
- Only APPROVED orders can be released
- Changes status from approved → released
- Records releaser ID and timestamp
- Creates audit log entry
- **Production Planner role required**

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "poNumber": "PO-2024-001",
    "status": "released",
    ...
  },
  "message": "Production order released successfully"
}
```

---

### 9. Cancel Production Order

**POST** `/api/production/orders/:id/cancel`

Cancel a production order at any stage.

**Required Permission**: `PROD.CANCEL_ORDER`

**Request Body**:
```json
{
  "reason": "Customer cancelled order"
}
```

**Business Rules**:
- Can cancel orders in any status except completed or already cancelled
- Creates audit log entry with cancellation reason
- **Management approval recommended for released orders**

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "poNumber": "PO-2024-001",
    "status": "cancelled",
    ...
  },
  "message": "Production order cancelled successfully"
}
```

---

### 10. Delete Production Order

**DELETE** `/api/production/orders/:id`

Permanently delete a production order.

**Required Permission**: `PROD.DELETE_ORDER`

**Request Body**: None

**Business Rules**:
- Only DRAFT orders can be deleted
- Permanent deletion (not reversible)
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": null,
  "message": "Production order deleted successfully"
}
```

---

## Priority Levels

- **low**: Standard production, flexible timeline
- **normal**: Regular production order (default)
- **high**: Important order, prioritize in scheduling
- **urgent**: Critical order, highest priority

---

## RBAC Permissions

| Permission | Description | Typical Roles |
|------------|-------------|---------------|
| `PROD.VIEW_ORDERS` | View production orders | All production staff, Management |
| `PROD.CREATE_ORDER` | Create and submit orders | Production Planner |
| `PROD.UPDATE_ORDER` | Update draft orders | Production Planner |
| `PROD.APPROVE_ORDER` | Approve/reject orders | Management |
| `PROD.RELEASE_ORDER` | Release to production | Production Planner |
| `PROD.CANCEL_ORDER` | Cancel orders | Management, Production Planner |
| `PROD.DELETE_ORDER` | Delete draft orders | Production Planner |

---

## Workflow Examples

### Example 1: Create and Approve Order

```bash
# 1. Login as Production Planner
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"planner","password":"password"}'

# 2. Create draft order
curl -X POST http://localhost:3000/api/production/orders \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "poNumber": "PO-2024-001",
    "customerPoReference": "CUST-12345",
    "itemId": 10,
    "quantityOrdered": 5000,
    "requiredDate": "2024-12-31",
    "priority": "high"
  }'

# 3. Submit for approval
curl -X POST http://localhost:3000/api/production/orders/1/submit \
  -H "Authorization: Bearer TOKEN"

# 4. Login as Management
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"manager","password":"password"}'

# 5. Approve order
curl -X POST http://localhost:3000/api/production/orders/1/approve \
  -H "Authorization: Bearer TOKEN"

# 6. Login as Production Planner
# 7. Release to production
curl -X POST http://localhost:3000/api/production/orders/1/release \
  -H "Authorization: Bearer TOKEN"
```

### Example 2: Reject and Revise Order

```bash
# 1. Management rejects order
curl -X POST http://localhost:3000/api/production/orders/1/reject \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Insufficient capacity"}'

# 2. Planner updates order
curl -X PUT http://localhost:3000/api/production/orders/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requiredDate": "2025-01-15",
    "priority": "normal"
  }'

# 3. Resubmit for approval
curl -X POST http://localhost:3000/api/production/orders/1/submit \
  -H "Authorization: Bearer TOKEN"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Only draft production orders can be updated"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Permission denied: PROD.APPROVE_ORDER"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Production order not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Production order number 'PO-2024-001' already exists"
}
```

---

## Audit Logging

All production order actions are automatically logged:

**Logged Actions**:
- CREATE - Order creation
- UPDATE - Order modification
- SUBMIT_FOR_APPROVAL - Submission
- APPROVE - Management approval
- REJECT - Management rejection
- RELEASE - Release to production
- CANCEL - Order cancellation
- DELETE - Order deletion

**Audit Log Fields**:
- User ID (who performed action)
- Action type
- Module: PRODUCTION
- Record type: production_order
- Record ID
- Old values (for updates)
- New values
- Timestamp
- IP address
- User agent

---

## Business Rules Summary

1. **Item Validation**: Only finished goods can be ordered
2. **Quantity Validation**: Must be greater than 0
3. **Date Validation**: Required date cannot be in the past
4. **Status Transitions**: Must follow defined lifecycle
5. **Edit Restrictions**: Only draft orders can be edited
6. **Delete Restrictions**: Only draft orders can be deleted
7. **Approval Required**: Management must approve before release
8. **Audit Trail**: All actions logged for compliance

---

## Integration Points

**Current Module Integrations**:
- **Master Data**: Validates item exists and is finished good
- **Auth & RBAC**: Enforces permissions and user authentication
- **Audit Logs**: Records all critical actions

**Future Module Integrations** (Not Yet Implemented):
- **Production Planning**: Uses released orders for scheduling
- **MRP**: Calculates material requirements from orders
- **Work Orders**: Creates work orders from released production orders
- **Inventory**: Updates finished goods inventory on completion

---

## Notes

- Customer PO reference is for tracking only, not enforced
- Quantity produced is updated by production execution module (not yet implemented)
- Status transitions to in_progress and completed will be handled by production execution module
- No inventory movements occur in this module
- No material planning occurs in this module

---

**End of Production Order API Documentation**
