# Inventory & Warehouse Module - API Documentation

## Overview

The Inventory & Warehouse Module manages material receiving from Purchase Orders, inventory stock-in/stock-out transactions, inventory status tracking, and inventory adjustments. It provides complete visibility into inventory levels across different statuses and warehouses.

**Base URLs**: 
- `/api/inventory/goods-receipts` - Material Receiving
- `/api/inventory/goods-issues` - Material Issuance
- `/api/inventory/balances` - Inventory Balances
- `/api/inventory/adjustments` - Inventory Adjustments
- `/api/inventory/status-transfer` - Status Transfers

**Authentication**: All requests require `Authorization: Bearer <token>` header

---

## Inventory Status Types

The system tracks inventory in four distinct statuses:

1. **Available**: Ready for use, can be issued to production
2. **Reserved**: Allocated but not yet issued
3. **Under Inspection**: Received but pending quality inspection
4. **Rejected**: Failed inspection or damaged, cannot be used

---

## Goods Receipt API (Material Receiving)

### 1. Get Goods Receipts (List)

**GET** `/api/inventory/goods-receipts`

Get paginated list of goods receipts.

**Required Permission**: `INV.VIEW_RECEIPTS`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (draft, completed, cancelled)
- `warehouseId` (optional): Filter by warehouse
- `fromDate` (optional): Filter by receipt date from (YYYY-MM-DD)
- `toDate` (optional): Filter by receipt date to (YYYY-MM-DD)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "grNumber": "GR-20241226-1500",
      "poId": 10,
      "receiptDate": "2024-12-26",
      "warehouseId": 1,
      "receiverId": 5,
      "status": "completed",
      "notes": null,
      "createdAt": "2024-12-26T15:00:00.000Z",
      "updatedAt": "2024-12-26T15:00:00.000Z",
      "createdBy": 5,
      "updatedBy": 5
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

### 2. Create Goods Receipt

**POST** `/api/inventory/goods-receipts`

Receive materials from an approved/sent Purchase Order.

**Required Permission**: `INV.CREATE_RECEIPT`

**Request Body**:
```json
{
  "poId": 10,
  "receiptDate": "2024-12-26",
  "warehouseId": 1,
  "receiverId": 5,
  "lines": [
    {
      "poLineId": 15,
      "itemId": 20,
      "quantityReceived": 5000,
      "quantityAccepted": 4950,
      "quantityRejected": 50,
      "notes": "Minor damage on 50 units"
    }
  ],
  "notes": "Delivery from Supplier ABC"
}
```

**Field Descriptions**:
- `poId` (required): Purchase Order ID (must be approved or sent)
- `receiptDate` (required): Date of receipt
- `warehouseId` (required): Warehouse receiving the goods
- `receiverId` (required): User ID of receiver
- `lines` (required): Array of line items (minimum 1)
  - `poLineId` (required): PO line being received
  - `itemId` (required): Item being received
  - `quantityReceived` (required): Total quantity received (must be > 0)
  - `quantityAccepted` (required): Quantity accepted (>= 0)
  - `quantityRejected` (required): Quantity rejected (>= 0)
  - `notes` (optional): Line item notes
- `notes` (optional): GR notes

**Business Rules**:
- PO must be in approved or sent status
- Must have at least one line item
- Accepted + Rejected must equal Received quantity
- Cannot over-receive (total received cannot exceed PO quantity)
- Accepted quantity increases Available inventory
- Rejected quantity increases Rejected inventory
- Creates inventory transactions for audit trail
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "grNumber": "GR-20241226-1500",
    "poId": 10,
    "receiptDate": "2024-12-26",
    "warehouseId": 1,
    "receiverId": 5,
    "status": "completed",
    "createdAt": "2024-12-26T15:00:00.000Z",
    "updatedAt": "2024-12-26T15:00:00.000Z"
  },
  "message": "Goods receipt created successfully"
}
```

---

### 3. Get Goods Receipt by ID

**GET** `/api/inventory/goods-receipts/:id`

Get single goods receipt with line items.

**Required Permission**: `INV.VIEW_RECEIPTS`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "grNumber": "GR-20241226-1500",
    "poId": 10,
    "receiptDate": "2024-12-26",
    "warehouseId": 1,
    "receiverId": 5,
    "status": "completed",
    "notes": "Delivery from Supplier ABC",
    "createdAt": "2024-12-26T15:00:00.000Z",
    "updatedAt": "2024-12-26T15:00:00.000Z",
    "lines": [
      {
        "id": 1,
        "grId": 1,
        "lineNumber": 1,
        "poLineId": 15,
        "itemId": 20,
        "quantityReceived": 5000,
        "quantityAccepted": 4950,
        "quantityRejected": 50,
        "notes": "Minor damage on 50 units",
        "createdAt": "2024-12-26T15:00:00.000Z",
        "updatedAt": "2024-12-26T15:00:00.000Z"
      }
    ]
  }
}
```

---

## Goods Issue API (Material Issuance)

### 4. Get Goods Issues (List)

**GET** `/api/inventory/goods-issues`

Get paginated list of goods issues.

**Required Permission**: `INV.VIEW_ISSUES`

**Query Parameters**: Same as Goods Receipts

**Response**: Similar format to Goods Receipts

---

### 5. Create Goods Issue

**POST** `/api/inventory/goods-issues`

Issue materials to a released Production Order.

**Required Permission**: `INV.CREATE_ISSUE`

**Request Body**:
```json
{
  "productionOrderId": 5,
  "issueDate": "2024-12-26",
  "warehouseId": 1,
  "issuedBy": 5,
  "lines": [
    {
      "itemId": 20,
      "quantityIssued": 1000,
      "notes": "For production batch 001"
    },
    {
      "itemId": 21,
      "quantityIssued": 500,
      "notes": "Packaging materials"
    }
  ],
  "notes": "Material issue for PO-2024-001"
}
```

**Field Descriptions**:
- `productionOrderId` (required): Production Order ID (must be released or in-progress)
- `issueDate` (required): Date of issuance
- `warehouseId` (required): Warehouse issuing the goods
- `issuedBy` (required): User ID of issuer
- `lines` (required): Array of line items (minimum 1)
  - `itemId` (required): Item being issued
  - `quantityIssued` (required): Quantity to issue (must be > 0)
  - `notes` (optional): Line item notes
- `notes` (optional): GI notes

**Business Rules**:
- Production Order must be in released or in-progress status
- Must have at least one line item
- Cannot issue more than available inventory
- Decreases Available inventory
- Creates inventory transactions for audit trail
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "giNumber": "GI-20241226-1600",
    "productionOrderId": 5,
    "issueDate": "2024-12-26",
    "warehouseId": 1,
    "issuedBy": 5,
    "status": "completed",
    "createdAt": "2024-12-26T16:00:00.000Z",
    "updatedAt": "2024-12-26T16:00:00.000Z"
  },
  "message": "Goods issue created successfully"
}
```

---

### 6. Get Goods Issue by ID

**GET** `/api/inventory/goods-issues/:id`

Get single goods issue with line items.

**Required Permission**: `INV.VIEW_ISSUES`

**Response**: Similar format to Goods Receipt with lines

---

## Inventory Balance API

### 7. Get Inventory Balances

**GET** `/api/inventory/balances`

Get paginated list of inventory balances.

**Required Permission**: `INV.VIEW_BALANCES`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `itemId` (optional): Filter by item
- `warehouseId` (optional): Filter by warehouse

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "itemId": 20,
      "warehouseId": 1,
      "quantityAvailable": 4950,
      "quantityReserved": 0,
      "quantityUnderInspection": 0,
      "quantityRejected": 50,
      "lastUpdated": "2024-12-26T15:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Balance Fields**:
- `quantityAvailable`: Ready for use, can be issued
- `quantityReserved`: Allocated but not yet issued
- `quantityUnderInspection`: Pending quality inspection
- `quantityRejected`: Failed inspection or damaged

---

## Inventory Adjustment API

### 8. Adjust Inventory

**POST** `/api/inventory/adjustments`

Manually adjust inventory quantity (with reason).

**Required Permission**: `INV.ADJUST_INVENTORY`

**Request Body**:
```json
{
  "itemId": 20,
  "warehouseId": 1,
  "adjustmentType": "available",
  "quantity": 100,
  "reason": "Physical count adjustment",
  "notes": "Annual inventory count - found 100 extra units"
}
```

**Field Descriptions**:
- `itemId` (required): Item to adjust
- `warehouseId` (required): Warehouse location
- `adjustmentType` (required): Status to adjust (available, reserved, under_inspection, rejected)
- `quantity` (required): Adjustment amount (positive or negative)
- `reason` (required): Reason for adjustment (mandatory)
- `notes` (optional): Additional notes

**Business Rules**:
- Reason is mandatory for all adjustments
- Quantity cannot be zero
- Adjustment cannot result in negative inventory
- Creates inventory transaction for audit trail
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "itemId": 20,
    "warehouseId": 1,
    "quantityAvailable": 5050,
    "quantityReserved": 0,
    "quantityUnderInspection": 0,
    "quantityRejected": 50,
    "lastUpdated": "2024-12-26T17:00:00.000Z"
  },
  "message": "Inventory adjusted successfully"
}
```

---

### 9. Transfer Inventory Status

**POST** `/api/inventory/status-transfer`

Transfer inventory between statuses (e.g., Under Inspection → Available).

**Required Permission**: `INV.ADJUST_INVENTORY`

**Request Body**:
```json
{
  "itemId": 20,
  "warehouseId": 1,
  "fromStatus": "under_inspection",
  "toStatus": "available",
  "quantity": 100,
  "reason": "Quality inspection passed",
  "notes": "Batch QC-2024-001 approved"
}
```

**Field Descriptions**:
- `itemId` (required): Item to transfer
- `warehouseId` (required): Warehouse location
- `fromStatus` (required): Source status (available, reserved, under_inspection, rejected)
- `toStatus` (required): Destination status (available, reserved, under_inspection, rejected)
- `quantity` (required): Quantity to transfer (must be > 0)
- `reason` (required): Reason for transfer (mandatory)
- `notes` (optional): Additional notes

**Business Rules**:
- From and To status must be different
- Quantity must be greater than 0
- Reason is mandatory
- Cannot transfer more than available in source status
- Creates inventory transaction for audit trail
- Creates audit log entry

**Common Use Cases**:
- `under_inspection` → `available`: Quality inspection passed
- `under_inspection` → `rejected`: Quality inspection failed
- `rejected` → `available`: Rework completed
- `available` → `reserved`: Reserve for production order

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "itemId": 20,
    "warehouseId": 1,
    "quantityAvailable": 5050,
    "quantityReserved": 0,
    "quantityUnderInspection": 0,
    "quantityRejected": 50,
    "lastUpdated": "2024-12-26T17:30:00.000Z"
  },
  "message": "Inventory status transferred successfully"
}
```

---

## RBAC Permissions

| Permission | Description | Typical Roles |
|------------|-------------|---------------|
| `INV.VIEW_RECEIPTS` | View goods receipts | Warehouse, Purchasing, Management |
| `INV.CREATE_RECEIPT` | Create goods receipts | Warehouse |
| `INV.VIEW_ISSUES` | View goods issues | Warehouse, Production, Management |
| `INV.CREATE_ISSUE` | Create goods issues | Warehouse |
| `INV.VIEW_BALANCES` | View inventory balances | Warehouse, Production, Purchasing, Management |
| `INV.ADJUST_INVENTORY` | Adjust inventory and transfer status | Warehouse Supervisor, Management |

---

## Workflow Examples

### Example 1: Receive Materials from PO

```bash
# 1. Login as Warehouse
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"warehouse","password":"password"}'

# 2. Create Goods Receipt
curl -X POST http://localhost:3000/api/inventory/goods-receipts \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "poId": 10,
    "receiptDate": "2024-12-26",
    "warehouseId": 1,
    "receiverId": 5,
    "lines": [
      {
        "poLineId": 15,
        "itemId": 20,
        "quantityReceived": 5000,
        "quantityAccepted": 4950,
        "quantityRejected": 50
      }
    ]
  }'

# 3. View inventory balance
curl -X GET "http://localhost:3000/api/inventory/balances?itemId=20&warehouseId=1" \
  -H "Authorization: Bearer TOKEN"
```

### Example 2: Issue Materials to Production

```bash
# 1. Create Goods Issue
curl -X POST http://localhost:3000/api/inventory/goods-issues \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productionOrderId": 5,
    "issueDate": "2024-12-26",
    "warehouseId": 1,
    "issuedBy": 5,
    "lines": [
      {
        "itemId": 20,
        "quantityIssued": 1000
      }
    ]
  }'

# 2. View updated balance
curl -X GET "http://localhost:3000/api/inventory/balances?itemId=20&warehouseId=1" \
  -H "Authorization: Bearer TOKEN"
```

### Example 3: Inventory Adjustment

```bash
# 1. Adjust inventory (physical count)
curl -X POST http://localhost:3000/api/inventory/adjustments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": 20,
    "warehouseId": 1,
    "adjustmentType": "available",
    "quantity": -50,
    "reason": "Physical count variance",
    "notes": "Annual inventory count - 50 units missing"
  }'
```

### Example 4: Status Transfer (QC Pass)

```bash
# 1. Transfer from Under Inspection to Available
curl -X POST http://localhost:3000/api/inventory/status-transfer \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": 20,
    "warehouseId": 1,
    "fromStatus": "under_inspection",
    "toStatus": "available",
    "quantity": 100,
    "reason": "Quality inspection passed",
    "notes": "Batch QC-2024-001 approved"
  }'
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Cannot over-receive. PO line quantity: 5000, already received: 4000"
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
  "error": "Permission denied: INV.CREATE_RECEIPT"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Goods receipt not found"
}
```

---

## Audit Logging

All inventory operations are automatically logged:

**Logged Actions**:
- CREATE_GOODS_RECEIPT - Material receiving
- CANCEL_GOODS_RECEIPT - GR cancellation
- CREATE_GOODS_ISSUE - Material issuance
- CANCEL_GOODS_ISSUE - GI cancellation
- INVENTORY_ADJUSTMENT - Manual adjustments
- INVENTORY_STATUS_TRANSFER - Status transfers

**Inventory Transactions**:
Every inventory movement creates a transaction record with:
- Transaction date and type
- Item and warehouse
- Quantity (positive for increases, negative for decreases)
- Status from/to
- Reference type and ID
- Notes
- Created by user

---

## Integration Points

**Current Module Integrations**:
- **Purchasing**: Receives materials from approved/sent POs
- **Production Orders**: Issues materials to released production orders
- **Master Data**: Validates items and warehouses
- **Auth & RBAC**: Enforces permissions
- **Audit Logs**: Records all critical actions

**Future Module Integrations** (Not Yet Implemented):
- **Quality Control**: Will update status based on inspection results
- **Accounting**: Will create inventory valuation entries
- **Production Execution**: Will update based on actual consumption

---

## Business Rules Summary

### Goods Receipt
1. **PO Validation**: PO must be approved or sent
2. **Quantity Validation**: Accepted + Rejected = Received
3. **Over-Receipt Prevention**: Cannot receive more than PO quantity
4. **Inventory Update**: Accepted → Available, Rejected → Rejected
5. **Transaction Logging**: All movements logged

### Goods Issue
1. **Production Order Validation**: Must be released or in-progress
2. **Availability Check**: Cannot issue more than available
3. **Inventory Update**: Decreases Available inventory
4. **Transaction Logging**: All movements logged

### Inventory Adjustment
1. **Reason Required**: Mandatory for all adjustments
2. **Negative Prevention**: Cannot result in negative inventory
3. **Zero Prevention**: Adjustment quantity cannot be zero
4. **Transaction Logging**: All adjustments logged

### Status Transfer
1. **Different Status**: From and To must be different
2. **Positive Quantity**: Transfer quantity must be > 0
3. **Reason Required**: Mandatory for all transfers
4. **Availability Check**: Cannot transfer more than available in source
5. **Transaction Logging**: All transfers logged

---

## Notes

- All inventory movements are transactional (atomic)
- Inventory balances are updated in real-time
- All operations create audit trail via inventory transactions
- No accounting entries created (future module)
- No quality inspection decisions made (future module)
- Warehouse locations are basic (no bin/location tracking yet)

---

**End of Inventory & Warehouse Module API Documentation**
