# Purchasing Module - API Documentation

## Overview

The Purchasing Module manages the complete procurement process from Purchase Requests (PR) to Purchase Orders (PO). It includes approval workflows, supplier selection, and status tracking. The module integrates with MRP-generated PRs and supports manual PR creation.

**Base URLs**: 
- `/api/purchasing/purchase-requests` - Purchase Requests
- `/api/purchasing/purchase-orders` - Purchase Orders

**Authentication**: All requests require `Authorization: Bearer <token>` header

---

## Status Lifecycles

### Purchase Request (PR) Lifecycle

```
DRAFT → PENDING_APPROVAL → APPROVED → CONVERTED_TO_PO
   ↓           ↓              ↓
CANCELLED ← CANCELLED ← CANCELLED
   ↓
REJECTED (returns to DRAFT)
```

**PR Status Definitions**:
- **draft**: Initial state, can be edited or deleted
- **pending_approval**: Submitted for management approval
- **approved**: Approved by management, ready for PO conversion
- **rejected**: Rejected by management, returned to draft
- **converted_to_po**: Converted to Purchase Order
- **cancelled**: Cancelled at any stage

### Purchase Order (PO) Lifecycle

```
DRAFT → PENDING_APPROVAL → APPROVED → SENT → PARTIALLY_RECEIVED → RECEIVED → CLOSED
   ↓           ↓              ↓          ↓
CANCELLED ← CANCELLED ← CANCELLED ← CANCELLED
   ↓
REJECTED (returns to DRAFT)
```

**PO Status Definitions**:
- **draft**: Initial state, can be edited or deleted
- **pending_approval**: Submitted for management approval
- **approved**: Approved by management, ready to send
- **sent**: Sent to supplier
- **partially_received**: Some items received (future)
- **received**: All items received (future)
- **closed**: Order completed and closed
- **cancelled**: Cancelled at any stage

---

## Purchase Request API

### 1. Get Purchase Requests (List)

**GET** `/api/purchasing/purchase-requests`

Get paginated list of purchase requests.

**Required Permission**: `PURCH.VIEW_PR`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `status` (optional): Filter by status
- `approvalStatus` (optional): Filter by approval status (pending, approved, rejected)
- `requestorId` (optional): Filter by requestor
- `fromDate` (optional): Filter by request date from (YYYY-MM-DD)
- `toDate` (optional): Filter by request date to (YYYY-MM-DD)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "prNumber": "PR-20241226-1430",
      "requestDate": "2024-12-26",
      "requiredDate": "2024-12-31",
      "requestorId": 5,
      "justification": "Material shortage from MRP",
      "status": "approved",
      "approvalStatus": "approved",
      "approvedBy": 2,
      "approvedAt": "2024-12-26T15:00:00.000Z",
      "rejectionReason": null,
      "poId": null,
      "createdAt": "2024-12-26T14:30:00.000Z",
      "updatedAt": "2024-12-26T15:00:00.000Z",
      "createdBy": 5,
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

### 2. Create Purchase Request

**POST** `/api/purchasing/purchase-requests`

Create a new purchase request (manual or from MRP).

**Required Permission**: `PURCH.CREATE_PR`

**Request Body**:
```json
{
  "requestDate": "2024-12-26",
  "requiredDate": "2024-12-31",
  "requestorId": 5,
  "justification": "Material shortage for production order PO-2024-001",
  "lines": [
    {
      "itemId": 20,
      "quantity": 5000,
      "notes": "Plastic resin type A"
    },
    {
      "itemId": 21,
      "quantity": 2500,
      "notes": "Packaging material"
    }
  ],
  "submitForApproval": false
}
```

**Field Descriptions**:
- `requestDate` (required): Date of request
- `requiredDate` (required): Date materials are needed
- `requestorId` (required): User ID of requestor
- `justification` (optional): Reason for request
- `lines` (required): Array of line items (minimum 1)
  - `itemId` (required): Item to purchase
  - `quantity` (required): Quantity needed (must be > 0)
  - `notes` (optional): Line item notes
- `submitForApproval` (optional): If true, creates as pending_approval; if false, creates as draft

**Business Rules**:
- Must have at least one line item
- Required date cannot be before request date
- All items must exist
- All quantities must be > 0
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "prNumber": "PR-20241226-1430",
    "requestDate": "2024-12-26",
    "requiredDate": "2024-12-31",
    "requestorId": 5,
    "justification": "Material shortage for production order PO-2024-001",
    "status": "draft",
    "approvalStatus": "pending",
    "createdAt": "2024-12-26T14:30:00.000Z",
    "updatedAt": "2024-12-26T14:30:00.000Z"
  },
  "message": "Purchase request created successfully"
}
```

---

### 3. Get Purchase Request by ID

**GET** `/api/purchasing/purchase-requests/:id`

Get single purchase request with line items.

**Required Permission**: `PURCH.VIEW_PR`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "prNumber": "PR-20241226-1430",
    "requestDate": "2024-12-26",
    "requiredDate": "2024-12-31",
    "requestorId": 5,
    "justification": "Material shortage for production order PO-2024-001",
    "status": "draft",
    "approvalStatus": "pending",
    "createdAt": "2024-12-26T14:30:00.000Z",
    "updatedAt": "2024-12-26T14:30:00.000Z",
    "lines": [
      {
        "id": 1,
        "prId": 1,
        "lineNumber": 1,
        "itemId": 20,
        "quantity": 5000,
        "notes": "Plastic resin type A",
        "createdAt": "2024-12-26T14:30:00.000Z",
        "updatedAt": "2024-12-26T14:30:00.000Z"
      }
    ]
  }
}
```

---

### 4. Update Purchase Request

**PUT** `/api/purchasing/purchase-requests/:id`

Update an existing purchase request.

**Required Permission**: `PURCH.UPDATE_PR`

**Request Body**:
```json
{
  "requiredDate": "2025-01-05",
  "justification": "Updated justification"
}
```

**Business Rules**:
- Only DRAFT PRs can be updated
- Required date cannot be before request date
- Creates audit log entry

**Response**: Same as get PR

---

### 5. Submit PR for Approval

**POST** `/api/purchasing/purchase-requests/:id/submit`

Submit a draft PR for management approval.

**Required Permission**: `PURCH.CREATE_PR`

**Request Body**: None

**Business Rules**:
- Only DRAFT PRs can be submitted
- Must have at least one line item
- Changes status from draft → pending_approval
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "prNumber": "PR-20241226-1430",
    "status": "pending_approval",
    ...
  },
  "message": "Purchase request submitted for approval"
}
```

---

### 6. Approve Purchase Request

**POST** `/api/purchasing/purchase-requests/:id/approve`

Approve a pending PR (Management only).

**Required Permission**: `PURCH.APPROVE_PR`

**Request Body**: None

**Business Rules**:
- Only PENDING_APPROVAL PRs can be approved
- Cannot approve your own PR (prevents self-approval)
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
    "prNumber": "PR-20241226-1430",
    "status": "approved",
    "approvalStatus": "approved",
    "approvedBy": 2,
    "approvedAt": "2024-12-26T15:00:00.000Z",
    ...
  },
  "message": "Purchase request approved successfully"
}
```

---

### 7. Reject Purchase Request

**POST** `/api/purchasing/purchase-requests/:id/reject`

Reject a pending PR (Management only).

**Required Permission**: `PURCH.APPROVE_PR`

**Request Body**:
```json
{
  "reason": "Insufficient budget for this period"
}
```

**Business Rules**:
- Only PENDING_APPROVAL PRs can be rejected
- Cannot reject your own PR (prevents self-rejection)
- Changes status from pending_approval → rejected
- Rejection reason recorded
- Creates audit log entry
- **Management role required**

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "prNumber": "PR-20241226-1430",
    "status": "rejected",
    "approvalStatus": "rejected",
    "rejectionReason": "Insufficient budget for this period",
    ...
  },
  "message": "Purchase request rejected"
}
```

---

### 8. Delete Purchase Request

**DELETE** `/api/purchasing/purchase-requests/:id`

Permanently delete a purchase request.

**Required Permission**: `PURCH.DELETE_PR`

**Request Body**: None

**Business Rules**:
- Only DRAFT PRs can be deleted
- Deletes all line items
- Permanent deletion (not reversible)
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": null,
  "message": "Purchase request deleted successfully"
}
```

---

## Purchase Order API

### 9. Get Purchase Orders (List)

**GET** `/api/purchasing/purchase-orders`

Get paginated list of purchase orders.

**Required Permission**: `PURCH.VIEW_PO`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `status` (optional): Filter by status
- `approvalStatus` (optional): Filter by approval status (pending, approved, rejected)
- `supplierId` (optional): Filter by supplier
- `fromDate` (optional): Filter by order date from (YYYY-MM-DD)
- `toDate` (optional): Filter by order date to (YYYY-MM-DD)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "poNumber": "PO-20241226-1500",
      "prId": 1,
      "supplierId": 10,
      "orderDate": "2024-12-26",
      "expectedDeliveryDate": "2024-12-30",
      "status": "approved",
      "approvalStatus": "approved",
      "approvedBy": 2,
      "approvedAt": "2024-12-26T16:00:00.000Z",
      "rejectionReason": null,
      "totalAmount": 125000.00,
      "notes": null,
      "createdAt": "2024-12-26T15:00:00.000Z",
      "updatedAt": "2024-12-26T16:00:00.000Z",
      "createdBy": 5,
      "updatedBy": 2
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 30,
    "totalPages": 2
  }
}
```

---

### 10. Create Purchase Order

**POST** `/api/purchasing/purchase-orders`

Create a new purchase order (from PR or manual).

**Required Permission**: `PURCH.CREATE_PO`

**Request Body (from PR)**:
```json
{
  "prId": 1,
  "supplierId": 10,
  "orderDate": "2024-12-26",
  "expectedDeliveryDate": "2024-12-30",
  "lines": [
    {
      "itemId": 20,
      "quantity": 5000,
      "unitPrice": 2.50,
      "notes": "Plastic resin type A"
    }
  ],
  "notes": "Urgent order",
  "submitForApproval": false
}
```

**Request Body (manual, no PR)**:
```json
{
  "supplierId": 10,
  "orderDate": "2024-12-26",
  "expectedDeliveryDate": "2024-12-30",
  "lines": [
    {
      "itemId": 20,
      "quantity": 5000,
      "unitPrice": 2.50,
      "notes": "Plastic resin type A"
    }
  ],
  "notes": "Manual purchase order",
  "submitForApproval": false
}
```

**Field Descriptions**:
- `prId` (optional): If provided, creates PO from approved PR
- `supplierId` (required): Supplier to order from
- `orderDate` (required): Date of order
- `expectedDeliveryDate` (required): Expected delivery date
- `lines` (required): Array of line items (minimum 1)
  - `itemId` (required): Item to purchase
  - `quantity` (required): Quantity to order (must be > 0)
  - `unitPrice` (required): Price per unit (must be >= 0)
  - `notes` (optional): Line item notes
- `notes` (optional): PO notes
- `submitForApproval` (optional): If true, creates as pending_approval; if false, creates as draft

**Business Rules**:
- If prId provided, PR must be approved and not already converted
- Supplier must exist and be active
- Must have at least one line item
- All items must exist
- All quantities must be > 0
- All unit prices must be >= 0
- Total amount calculated automatically
- If from PR, updates PR status to converted_to_po
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "poNumber": "PO-20241226-1500",
    "prId": 1,
    "supplierId": 10,
    "orderDate": "2024-12-26",
    "expectedDeliveryDate": "2024-12-30",
    "status": "draft",
    "approvalStatus": "pending",
    "totalAmount": 12500.00,
    "createdAt": "2024-12-26T15:00:00.000Z",
    "updatedAt": "2024-12-26T15:00:00.000Z"
  },
  "message": "Purchase order created successfully"
}
```

---

### 11. Get Purchase Order by ID

**GET** `/api/purchasing/purchase-orders/:id`

Get single purchase order with line items.

**Required Permission**: `PURCH.VIEW_PO`

**Response**: Same format as PR with lines

---

### 12. Update Purchase Order

**PUT** `/api/purchasing/purchase-orders/:id`

Update an existing purchase order.

**Required Permission**: `PURCH.UPDATE_PO`

**Request Body**:
```json
{
  "supplierId": 11,
  "expectedDeliveryDate": "2025-01-05",
  "notes": "Updated notes"
}
```

**Business Rules**:
- Only DRAFT POs can be updated
- Supplier must exist and be active
- Creates audit log entry

**Response**: Same as get PO

---

### 13. Submit PO for Approval

**POST** `/api/purchasing/purchase-orders/:id/submit`

Submit a draft PO for management approval.

**Required Permission**: `PURCH.CREATE_PO`

**Request Body**: None

**Business Rules**:
- Only DRAFT POs can be submitted
- Must have at least one line item
- Changes status from draft → pending_approval
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "poNumber": "PO-20241226-1500",
    "status": "pending_approval",
    ...
  },
  "message": "Purchase order submitted for approval"
}
```

---

### 14. Approve Purchase Order

**POST** `/api/purchasing/purchase-orders/:id/approve`

Approve a pending PO (Management only).

**Required Permission**: `PURCH.APPROVE_PO`

**Request Body**: None

**Business Rules**:
- Only PENDING_APPROVAL POs can be approved
- Cannot approve your own PO (prevents self-approval)
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
    "poNumber": "PO-20241226-1500",
    "status": "approved",
    "approvalStatus": "approved",
    "approvedBy": 2,
    "approvedAt": "2024-12-26T16:00:00.000Z",
    ...
  },
  "message": "Purchase order approved successfully"
}
```

---

### 15. Reject Purchase Order

**POST** `/api/purchasing/purchase-orders/:id/reject`

Reject a pending PO and return to draft (Management only).

**Required Permission**: `PURCH.APPROVE_PO`

**Request Body**:
```json
{
  "reason": "Price too high, negotiate with supplier"
}
```

**Business Rules**:
- Only PENDING_APPROVAL POs can be rejected
- Cannot reject your own PO (prevents self-rejection)
- Changes status from pending_approval → draft
- Rejection reason recorded
- Creates audit log entry
- **Management role required**

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "poNumber": "PO-20241226-1500",
    "status": "draft",
    "approvalStatus": "rejected",
    "rejectionReason": "Price too high, negotiate with supplier",
    ...
  },
  "message": "Purchase order rejected"
}
```

---

### 16. Send Purchase Order

**POST** `/api/purchasing/purchase-orders/:id/send`

Send approved PO to supplier.

**Required Permission**: `PURCH.SEND_PO`

**Request Body**: None

**Business Rules**:
- Only APPROVED POs can be sent
- Changes status from approved → sent
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "poNumber": "PO-20241226-1500",
    "status": "sent",
    ...
  },
  "message": "Purchase order sent to supplier"
}
```

---

### 17. Delete Purchase Order

**DELETE** `/api/purchasing/purchase-orders/:id`

Permanently delete a purchase order.

**Required Permission**: `PURCH.DELETE_PO`

**Request Body**: None

**Business Rules**:
- Only DRAFT POs can be deleted
- If created from PR, reverts PR status back to approved
- Deletes all line items
- Permanent deletion (not reversible)
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": null,
  "message": "Purchase order deleted successfully"
}
```

---

## RBAC Permissions

| Permission | Description | Typical Roles |
|------------|-------------|---------------|
| `PURCH.VIEW_PR` | View purchase requests | Purchasing, Management, Production Planner |
| `PURCH.CREATE_PR` | Create and submit PRs | Purchasing, Production Planner |
| `PURCH.UPDATE_PR` | Update draft PRs | Purchasing, Production Planner |
| `PURCH.APPROVE_PR` | Approve/reject PRs | Management |
| `PURCH.DELETE_PR` | Delete draft PRs | Purchasing |
| `PURCH.VIEW_PO` | View purchase orders | Purchasing, Management, Accounting |
| `PURCH.CREATE_PO` | Create and submit POs | Purchasing |
| `PURCH.UPDATE_PO` | Update draft POs | Purchasing |
| `PURCH.APPROVE_PO` | Approve/reject POs | Management |
| `PURCH.SEND_PO` | Send approved POs | Purchasing |
| `PURCH.DELETE_PO` | Delete draft POs | Purchasing |

---

## Workflow Examples

### Example 1: Manual PR to PO Flow

```bash
# 1. Login as Purchasing
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"purchasing","password":"password"}'

# 2. Create PR
curl -X POST http://localhost:3000/api/purchasing/purchase-requests \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestDate": "2024-12-26",
    "requiredDate": "2024-12-31",
    "requestorId": 5,
    "justification": "Material shortage",
    "lines": [
      {
        "itemId": 20,
        "quantity": 5000,
        "notes": "Plastic resin"
      }
    ]
  }'

# 3. Submit PR for approval
curl -X POST http://localhost:3000/api/purchasing/purchase-requests/1/submit \
  -H "Authorization: Bearer TOKEN"

# 4. Login as Management
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"manager","password":"password"}'

# 5. Approve PR
curl -X POST http://localhost:3000/api/purchasing/purchase-requests/1/approve \
  -H "Authorization: Bearer TOKEN"

# 6. Login as Purchasing
# 7. Create PO from PR
curl -X POST http://localhost:3000/api/purchasing/purchase-orders \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prId": 1,
    "supplierId": 10,
    "orderDate": "2024-12-26",
    "expectedDeliveryDate": "2024-12-30",
    "lines": [
      {
        "itemId": 20,
        "quantity": 5000,
        "unitPrice": 2.50
      }
    ]
  }'

# 8. Submit PO for approval
curl -X POST http://localhost:3000/api/purchasing/purchase-orders/1/submit \
  -H "Authorization: Bearer TOKEN"

# 9. Login as Management
# 10. Approve PO
curl -X POST http://localhost:3000/api/purchasing/purchase-orders/1/approve \
  -H "Authorization: Bearer TOKEN"

# 11. Login as Purchasing
# 12. Send PO to supplier
curl -X POST http://localhost:3000/api/purchasing/purchase-orders/1/send \
  -H "Authorization: Bearer TOKEN"
```

### Example 2: MRP-Generated PR to PO

```bash
# 1. Execute MRP (generates PRs automatically)
curl -X POST http://localhost:3000/api/mrp/runs \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planningHorizonDays": 30}'

# 2. Generate PRs from MRP shortages
curl -X POST http://localhost:3000/api/mrp/runs/1/generate-prs \
  -H "Authorization: Bearer TOKEN"

# 3. View generated PRs (status: draft)
curl -X GET "http://localhost:3000/api/purchasing/purchase-requests?status=draft" \
  -H "Authorization: Bearer TOKEN"

# 4. Submit MRP-generated PR for approval
curl -X POST http://localhost:3000/api/purchasing/purchase-requests/10/submit \
  -H "Authorization: Bearer TOKEN"

# 5. Approve PR (Management)
curl -X POST http://localhost:3000/api/purchasing/purchase-requests/10/approve \
  -H "Authorization: Bearer TOKEN"

# 6. Create PO from approved PR
curl -X POST http://localhost:3000/api/purchasing/purchase-orders \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prId": 10,
    "supplierId": 10,
    "orderDate": "2024-12-26",
    "expectedDeliveryDate": "2024-12-30",
    "lines": [...]
  }'
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Only draft purchase requests can be updated"
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
  "error": "Permission denied: PURCH.APPROVE_PR"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Purchase request not found"
}
```

---

## Audit Logging

All purchasing actions are automatically logged:

**Logged Actions**:
- CREATE - PR/PO creation
- UPDATE - PR/PO modification
- SUBMIT_FOR_APPROVAL - Submission
- APPROVE - Management approval
- REJECT - Management rejection
- SEND - PO sent to supplier
- CANCEL - Cancellation
- DELETE - Deletion
- CREATE_PO_FROM_PR - PO creation from PR

**Audit Log Fields**:
- User ID
- Action type
- Module: PURCHASING
- Record type: purchase_request or purchase_order
- Record ID
- Old and new values
- Timestamp

---

## Integration Points

**Current Module Integrations**:
- **MRP**: Auto-generates PRs from material shortages
- **Master Data**: Validates items and suppliers
- **Auth & RBAC**: Enforces permissions and prevents self-approval
- **Audit Logs**: Records all critical actions

**Future Module Integrations** (Not Yet Implemented):
- **Inventory**: Will update stock on goods receipt
- **Accounts Payable**: Will create AP invoices from POs
- **Payments**: Will track payment status

---

## Business Rules Summary

### Purchase Requests
1. **Line Items Required**: Must have at least one line item
2. **Date Validation**: Required date cannot be before request date
3. **Item Validation**: All items must exist
4. **Quantity Validation**: All quantities must be > 0
5. **Status Restrictions**: Only draft PRs can be edited/deleted
6. **Self-Approval Prevention**: Cannot approve/reject your own PR
7. **Approval Required**: Management must approve before PO conversion

### Purchase Orders
1. **PR Validation**: If from PR, must be approved and not already converted
2. **Supplier Validation**: Supplier must exist and be active
3. **Line Items Required**: Must have at least one line item
4. **Price Validation**: Unit prices must be >= 0
5. **Total Calculation**: Total amount calculated automatically
6. **Status Restrictions**: Only draft POs can be edited/deleted
7. **Self-Approval Prevention**: Cannot approve/reject your own PO
8. **Approval Required**: Management must approve before sending

---

## Notes

- PRs can be created manually or auto-generated from MRP
- MRP-generated PRs start in DRAFT status and require submission
- PO can be created from approved PR or manually
- When PO is created from PR, PR status changes to converted_to_po
- If PO is deleted, PR reverts to approved status
- No inventory movements occur in this module (future)
- No accounting entries created (future)
- Self-approval is prevented to maintain proper controls

---

**End of Purchasing Module API Documentation**
