# Quality Control Module - API Documentation

## Overview

The Quality Control Module manages incoming inspection (from Goods Receipts), in-process inspection (from Production Orders), inspection records, pass/fail decisions, Non-Conformance Reports (NCR), and rework/scrap decisions. QC decisions automatically update inventory status.

**Base URLs**: 
- `/api/quality/inspections` - Inspection Records
- `/api/quality/ncr` - Non-Conformance Reports

**Authentication**: All requests require `Authorization: Bearer <token>` header

---

## Key Concepts

### Inspection Types
1. **Incoming Inspection**: Inspects materials received from suppliers (references Goods Receipt)
2. **In-Process Inspection**: Inspects work-in-progress during production (references Production Order)
3. **Final Inspection**: Final product inspection before delivery (future)

### Inspection Results
- **Pass**: All inspected quantity passed
- **Fail**: All inspected quantity failed
- **Conditional Pass**: Some passed, some failed

### NCR Dispositions
- **Pending**: Awaiting disposition decision
- **Rework**: Send for rework, then re-inspect
- **Scrap**: Dispose of defective material
- **Use As-Is**: Accept despite defects (with approval)
- **Return to Supplier**: Return to supplier for credit/replacement

### Inventory Status Updates
QC decisions automatically update inventory status:
- **Pass**: Under Inspection → Available
- **Fail**: Under Inspection → Rejected
- **Rework**: Rejected → Under Inspection
- **Scrap**: Rejected → (removed from inventory)
- **Use As-Is**: Rejected → Available

---

## Inspection API

### 1. Get Inspections (List)

**GET** `/api/quality/inspections`

Get paginated list of inspection records.

**Required Permission**: `QC.VIEW_INSPECTIONS`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `inspectionType` (optional): Filter by type (incoming, in_process, final)
- `status` (optional): Filter by status (pending, in_progress, completed)
- `result` (optional): Filter by result (pass, fail, conditional_pass)
- `fromDate` (optional): Filter by inspection date from (YYYY-MM-DD)
- `toDate` (optional): Filter by inspection date to (YYYY-MM-DD)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "inspectionNumber": "INS-20241226-1500",
      "inspectionType": "incoming",
      "inspectionDate": "2024-12-26",
      "inspectorId": 5,
      "referenceType": "goods_receipt",
      "referenceId": 10,
      "itemId": 20,
      "quantityInspected": 5000,
      "quantityPassed": 4950,
      "quantityFailed": 50,
      "status": "completed",
      "result": "conditional_pass",
      "notes": "Minor surface defects on 50 units",
      "createdAt": "2024-12-26T15:00:00.000Z",
      "updatedAt": "2024-12-26T15:00:00.000Z",
      "createdBy": 5,
      "updatedBy": 5
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

### 2. Create Inspection

**POST** `/api/quality/inspections`

Create an incoming or in-process inspection.

**Required Permission**: `QC.CREATE_INSPECTION`

**Request Body (Incoming Inspection)**:
```json
{
  "inspectionType": "incoming",
  "goodsReceiptId": 10,
  "inspectionDate": "2024-12-26",
  "inspectorId": 5,
  "itemId": 20,
  "quantityInspected": 5000,
  "quantityPassed": 4950,
  "quantityFailed": 50,
  "notes": "Minor surface defects on 50 units"
}
```

**Request Body (In-Process Inspection)**:
```json
{
  "inspectionType": "in_process",
  "productionOrderId": 5,
  "inspectionDate": "2024-12-26",
  "inspectorId": 5,
  "itemId": 30,
  "quantityInspected": 1000,
  "quantityPassed": 980,
  "quantityFailed": 20,
  "notes": "Dimensional issues on 20 units"
}
```

**Field Descriptions**:
- `inspectionType` (required): Type of inspection (incoming, in_process)
- `goodsReceiptId` (required for incoming): Goods Receipt being inspected
- `productionOrderId` (required for in_process): Production Order being inspected
- `inspectionDate` (required): Date of inspection
- `inspectorId` (required): User ID of inspector
- `itemId` (required): Item being inspected
- `quantityInspected` (required): Total quantity inspected (must be > 0)
- `quantityPassed` (required): Quantity that passed (>= 0)
- `quantityFailed` (required): Quantity that failed (>= 0)
- `notes` (optional): Inspection notes

**Business Rules**:
- Passed + Failed must equal Inspected quantity
- For incoming: GR must be completed
- Result automatically determined:
  - All passed → "pass"
  - All failed → "fail"
  - Mixed → "conditional_pass"
- **Inventory Updates (Incoming Only)**:
  - Passed: Under Inspection → Available
  - Failed: Under Inspection → Rejected
- Creates inventory transactions
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "inspectionNumber": "INS-20241226-1500",
    "inspectionType": "incoming",
    "inspectionDate": "2024-12-26",
    "inspectorId": 5,
    "referenceType": "goods_receipt",
    "referenceId": 10,
    "itemId": 20,
    "quantityInspected": 5000,
    "quantityPassed": 4950,
    "quantityFailed": 50,
    "status": "completed",
    "result": "conditional_pass",
    "createdAt": "2024-12-26T15:00:00.000Z",
    "updatedAt": "2024-12-26T15:00:00.000Z"
  },
  "message": "Inspection created successfully"
}
```

---

### 3. Get Inspection by ID

**GET** `/api/quality/inspections/:id`

Get single inspection record.

**Required Permission**: `QC.VIEW_INSPECTIONS`

**Response**: Same as single inspection object

---

## NCR (Non-Conformance Report) API

### 4. Get NCRs (List)

**GET** `/api/quality/ncr`

Get paginated list of NCRs.

**Required Permission**: `QC.VIEW_NCR`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `disposition` (optional): Filter by disposition (pending, rework, scrap, use_as_is, return_to_supplier)
- `status` (optional): Filter by status (open, in_progress, closed)
- `fromDate` (optional): Filter by NCR date from (YYYY-MM-DD)
- `toDate` (optional): Filter by NCR date to (YYYY-MM-DD)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ncrNumber": "NCR-20241226-1530",
      "inspectionId": 1,
      "ncrDate": "2024-12-26",
      "itemId": 20,
      "quantityAffected": 50,
      "defectDescription": "Surface scratches and minor dents",
      "rootCause": "Improper packaging during shipment",
      "correctiveAction": "Requested supplier to improve packaging",
      "disposition": "rework",
      "status": "in_progress",
      "closedDate": null,
      "closedBy": null,
      "notes": null,
      "createdAt": "2024-12-26T15:30:00.000Z",
      "updatedAt": "2024-12-26T16:00:00.000Z",
      "createdBy": 5,
      "updatedBy": 5
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

---

### 5. Create NCR

**POST** `/api/quality/ncr`

Create a Non-Conformance Report for failed inspection.

**Required Permission**: `QC.CREATE_NCR`

**Request Body**:
```json
{
  "inspectionId": 1,
  "ncrDate": "2024-12-26",
  "itemId": 20,
  "quantityAffected": 50,
  "defectDescription": "Surface scratches and minor dents",
  "rootCause": "Improper packaging during shipment",
  "correctiveAction": "Requested supplier to improve packaging",
  "notes": "Customer complaint reference: CC-2024-001"
}
```

**Field Descriptions**:
- `inspectionId` (required): Inspection record with failures
- `ncrDate` (required): Date of NCR
- `itemId` (required): Item with defects
- `quantityAffected` (required): Quantity affected (must be > 0)
- `defectDescription` (required): Description of defects
- `rootCause` (optional): Root cause analysis
- `correctiveAction` (optional): Corrective action taken
- `notes` (optional): Additional notes

**Business Rules**:
- Inspection must have failures (result = fail or conditional_pass)
- Quantity affected cannot exceed failed quantity from inspection
- Defect description is mandatory
- NCR created in "open" status with "pending" disposition
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ncrNumber": "NCR-20241226-1530",
    "inspectionId": 1,
    "ncrDate": "2024-12-26",
    "itemId": 20,
    "quantityAffected": 50,
    "defectDescription": "Surface scratches and minor dents",
    "rootCause": "Improper packaging during shipment",
    "correctiveAction": "Requested supplier to improve packaging",
    "disposition": "pending",
    "status": "open",
    "createdAt": "2024-12-26T15:30:00.000Z",
    "updatedAt": "2024-12-26T15:30:00.000Z"
  },
  "message": "NCR created successfully"
}
```

---

### 6. Get NCR by ID

**GET** `/api/quality/ncr/:id`

Get single NCR.

**Required Permission**: `QC.VIEW_NCR`

**Response**: Same as single NCR object

---

### 7. Update NCR

**PUT** `/api/quality/ncr/:id`

Update NCR root cause and corrective action.

**Required Permission**: `QC.UPDATE_NCR`

**Request Body**:
```json
{
  "rootCause": "Updated root cause analysis",
  "correctiveAction": "Updated corrective action plan",
  "notes": "Additional investigation findings"
}
```

**Business Rules**:
- Cannot update closed NCRs
- Creates audit log entry

**Response**: Same as get NCR

---

### 8. Set NCR Disposition

**POST** `/api/quality/ncr/:id/disposition`

Set disposition decision for NCR (Rework, Scrap, Use As-Is, Return to Supplier).

**Required Permission**: `QC.MANAGE_NCR`

**Request Body**:
```json
{
  "disposition": "rework"
}
```

**Disposition Options**:
- `rework`: Send for rework, then re-inspect
- `scrap`: Dispose of defective material
- `use_as_is`: Accept despite defects (engineering approval)
- `return_to_supplier`: Return to supplier

**Business Rules**:
- Cannot change disposition of closed NCR
- **Inventory Updates (for incoming inspection)**:
  - **Rework**: Rejected → Under Inspection
  - **Scrap**: Rejected → (removed from inventory)
  - **Use As-Is**: Rejected → Available
  - **Return to Supplier**: No inventory change (handled separately)
- Changes NCR status to "in_progress"
- Creates inventory transactions
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ncrNumber": "NCR-20241226-1530",
    "disposition": "rework",
    "status": "in_progress",
    ...
  },
  "message": "NCR disposition set to rework"
}
```

---

### 9. Close NCR

**POST** `/api/quality/ncr/:id/close`

Close NCR after disposition is completed.

**Required Permission**: `QC.MANAGE_NCR`

**Request Body**: None

**Business Rules**:
- Cannot close NCR without disposition
- Cannot close already closed NCR
- Records closed date and user
- Changes status to "closed"
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ncrNumber": "NCR-20241226-1530",
    "status": "closed",
    "closedDate": "2024-12-27T10:00:00.000Z",
    "closedBy": 2,
    ...
  },
  "message": "NCR closed successfully"
}
```

---

## RBAC Permissions

| Permission | Description | Typical Roles |
|------------|-------------|---------------|
| `QC.VIEW_INSPECTIONS` | View inspection records | QC, Warehouse, Production, Management |
| `QC.CREATE_INSPECTION` | Create inspections | QC Inspector |
| `QC.VIEW_NCR` | View NCRs | QC, Warehouse, Production, Management |
| `QC.CREATE_NCR` | Create NCRs | QC Inspector |
| `QC.UPDATE_NCR` | Update NCR details | QC Supervisor |
| `QC.MANAGE_NCR` | Set disposition and close NCRs | QC Manager, Management |

---

## Workflow Examples

### Example 1: Incoming Inspection (Pass)

```bash
# 1. Login as QC Inspector
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"qc_inspector","password":"password"}'

# 2. Perform incoming inspection (all passed)
curl -X POST http://localhost:3000/api/quality/inspections \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectionType": "incoming",
    "goodsReceiptId": 10,
    "inspectionDate": "2024-12-26",
    "inspectorId": 5,
    "itemId": 20,
    "quantityInspected": 5000,
    "quantityPassed": 5000,
    "quantityFailed": 0
  }'

# Result: Under Inspection (5000) → Available (5000)
```

### Example 2: Incoming Inspection with Failures → NCR → Rework

```bash
# 1. Perform incoming inspection (some failed)
curl -X POST http://localhost:3000/api/quality/inspections \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectionType": "incoming",
    "goodsReceiptId": 10,
    "inspectionDate": "2024-12-26",
    "inspectorId": 5,
    "itemId": 20,
    "quantityInspected": 5000,
    "quantityPassed": 4950,
    "quantityFailed": 50
  }'

# Result: 
# - Under Inspection (4950) → Available (4950)
# - Under Inspection (50) → Rejected (50)

# 2. Create NCR for failures
curl -X POST http://localhost:3000/api/quality/ncr \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectionId": 1,
    "ncrDate": "2024-12-26",
    "itemId": 20,
    "quantityAffected": 50,
    "defectDescription": "Surface scratches",
    "rootCause": "Improper packaging"
  }'

# 3. Login as QC Manager
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"qc_manager","password":"password"}'

# 4. Set disposition to Rework
curl -X POST http://localhost:3000/api/quality/ncr/1/disposition \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"disposition": "rework"}'

# Result: Rejected (50) → Under Inspection (50)

# 5. After rework, re-inspect
curl -X POST http://localhost:3000/api/quality/inspections \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectionType": "incoming",
    "goodsReceiptId": 10,
    "inspectionDate": "2024-12-27",
    "inspectorId": 5,
    "itemId": 20,
    "quantityInspected": 50,
    "quantityPassed": 50,
    "quantityFailed": 0
  }'

# Result: Under Inspection (50) → Available (50)

# 6. Close NCR
curl -X POST http://localhost:3000/api/quality/ncr/1/close \
  -H "Authorization: Bearer TOKEN"
```

### Example 3: NCR with Scrap Disposition

```bash
# 1. Set disposition to Scrap
curl -X POST http://localhost:3000/api/quality/ncr/1/disposition \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"disposition": "scrap"}'

# Result: Rejected (50) → Removed from inventory

# 2. Close NCR
curl -X POST http://localhost:3000/api/quality/ncr/1/close \
  -H "Authorization: Bearer TOKEN"
```

### Example 4: In-Process Inspection

```bash
# 1. Perform in-process inspection
curl -X POST http://localhost:3000/api/quality/inspections \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectionType": "in_process",
    "productionOrderId": 5,
    "inspectionDate": "2024-12-26",
    "inspectorId": 5,
    "itemId": 30,
    "quantityInspected": 1000,
    "quantityPassed": 980,
    "quantityFailed": 20
  }'

# Note: In-process inspection does NOT update inventory
# (Production execution module will handle inventory)
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Passed + Failed must equal Inspected quantity"
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
  "error": "Permission denied: QC.CREATE_INSPECTION"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Inspection record not found"
}
```

---

## Audit Logging

All QC operations are automatically logged:

**Logged Actions**:
- CREATE_INCOMING_INSPECTION - Incoming inspection
- CREATE_IN_PROCESS_INSPECTION - In-process inspection
- CREATE_NCR - NCR creation
- UPDATE_NCR - NCR updates
- SET_NCR_DISPOSITION - Disposition decisions
- CLOSE_NCR - NCR closure

**Inventory Transactions**:
Every inventory status change creates a transaction record.

---

## Integration Points

**Current Module Integrations**:
- **Inventory**: Updates inventory status based on QC decisions
- **Goods Receipts**: References GR for incoming inspection
- **Production Orders**: References PO for in-process inspection
- **Master Data**: Validates items
- **Auth & RBAC**: Enforces permissions
- **Audit Logs**: Records all critical actions

**Future Module Integrations** (Not Yet Implemented):
- **Production Execution**: Will trigger final inspections
- **Accounting**: Will track scrap costs and rework expenses

---

## Business Rules Summary

### Inspections
1. **Quantity Validation**: Passed + Failed = Inspected
2. **Reference Validation**: GR must be completed (incoming), PO must exist (in-process)
3. **Result Determination**: Automatic based on pass/fail quantities
4. **Inventory Updates**: Only for incoming inspections
5. **Transaction Logging**: All status changes logged

### NCR
1. **Inspection Requirement**: Must reference failed inspection
2. **Quantity Validation**: Cannot exceed failed quantity
3. **Defect Description**: Mandatory
4. **Disposition Required**: Must set disposition before closing
5. **Inventory Updates**: Based on disposition decision
6. **Closed NCR**: Cannot be modified

### Dispositions
1. **Rework**: Moves to Under Inspection for re-work and re-inspection
2. **Scrap**: Removes from inventory
3. **Use As-Is**: Moves to Available (requires approval)
4. **Return to Supplier**: No inventory change (handled separately)

---

## Notes

- Incoming inspection automatically updates inventory status
- In-process inspection records results but doesn't update inventory (production execution handles that)
- All QC decisions are transactional (atomic)
- NCR workflow enforces proper disposition before closure
- Rework items must be re-inspected after rework
- No accounting entries created (future module)

---

**End of Quality Control Module API Documentation**
