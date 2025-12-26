# Production Execution Module - API Documentation

## Overview

The Production Execution Module manages the actual production process through Work Orders derived from released Production Orders. It tracks operations (start, pause, complete), machine usage, operator assignments, production output recording (good vs reject), and downtime logging.

**Base URLs**: 
- `/api/production/work-orders` - Work Orders
- `/api/production/output` - Production Output
- `/api/production/downtime` - Downtime Logging

**Authentication**: All requests require `Authorization: Bearer <token>` header

---

## Key Concepts

### Work Order Lifecycle
```
PENDING → RELEASED → IN_PROGRESS → COMPLETED
   ↓          ↓            ↓
CANCELLED ← CANCELLED ← CANCELLED
```

**Status Definitions**:
- **Pending**: Created but not yet released for production
- **Released**: Released to production floor, ready to start
- **In-Progress**: Currently being executed
- **Completed**: Finished production
- **Cancelled**: Cancelled at any stage

### Production Output Types
- **Good**: Passed quality, sent to Under Inspection inventory
- **Scrap**: Defective, cannot be reworked
- **Rework**: Needs rework before re-inspection

### Downtime Categories
- **Breakdown**: Machine or equipment failure
- **Changeover**: Setup or changeover time
- **Material Shortage**: Waiting for materials
- **Quality Issue**: Quality-related stoppage
- **Other**: Other reasons

---

## Work Order API

### 1. Get Work Orders (List)

**GET** `/api/production/work-orders`

Get paginated list of work orders.

**Required Permission**: `PROD.VIEW_WORK_ORDERS`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (pending, released, in_progress, completed, cancelled)
- `machineId` (optional): Filter by machine
- `supervisorId` (optional): Filter by supervisor
- `fromDate` (optional): Filter by start date from (YYYY-MM-DD)
- `toDate` (optional): Filter by start date to (YYYY-MM-DD)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "woNumber": "WO-20241226-1500",
      "productionOrderId": 5,
      "productionScheduleId": 10,
      "itemId": 30,
      "quantityPlanned": 1000,
      "quantityProduced": 980,
      "quantityScrap": 15,
      "quantityRework": 5,
      "machineId": 3,
      "moldId": 2,
      "supervisorId": 8,
      "startDate": "2024-12-26T08:00:00.000Z",
      "endDate": "2024-12-26T16:00:00.000Z",
      "status": "completed",
      "notes": null,
      "createdAt": "2024-12-26T07:00:00.000Z",
      "updatedAt": "2024-12-26T16:00:00.000Z",
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

### 2. Create Work Order

**POST** `/api/production/work-orders`

Create a new work order from a released Production Order.

**Required Permission**: `PROD.CREATE_WORK_ORDER`

**Request Body**:
```json
{
  "productionOrderId": 5,
  "productionScheduleId": 10,
  "quantityPlanned": 1000,
  "machineId": 3,
  "moldId": 2,
  "supervisorId": 8,
  "notes": "First batch of production"
}
```

**Field Descriptions**:
- `productionOrderId` (required): Production Order to execute (must be released)
- `productionScheduleId` (optional): Associated production schedule
- `quantityPlanned` (required): Quantity to produce in this work order (must be > 0)
- `machineId` (optional): Machine to use
- `moldId` (optional): Mold to use
- `supervisorId` (optional): Production supervisor
- `notes` (optional): Work order notes

**Business Rules**:
- Production Order must be in "released" status
- Quantity planned must be > 0
- Quantity planned cannot exceed remaining quantity on Production Order
- Work order created in "pending" status
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "woNumber": "WO-20241226-1500",
    "productionOrderId": 5,
    "productionScheduleId": 10,
    "itemId": 30,
    "quantityPlanned": 1000,
    "quantityProduced": 0,
    "quantityScrap": 0,
    "quantityRework": 0,
    "machineId": 3,
    "moldId": 2,
    "supervisorId": 8,
    "status": "pending",
    "createdAt": "2024-12-26T07:00:00.000Z",
    "updatedAt": "2024-12-26T07:00:00.000Z"
  },
  "message": "Work order created successfully"
}
```

---

### 3. Get Work Order by ID

**GET** `/api/production/work-orders/:id`

Get single work order.

**Required Permission**: `PROD.VIEW_WORK_ORDERS`

**Response**: Same as single work order object

---

### 4. Release Work Order

**POST** `/api/production/work-orders/:id/release`

Release a pending work order to production floor.

**Required Permission**: `PROD.MANAGE_WORK_ORDER`

**Request Body**: None

**Business Rules**:
- Only pending work orders can be released
- Changes status from pending → released
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "woNumber": "WO-20241226-1500",
    "status": "released",
    ...
  },
  "message": "Work order released"
}
```

---

### 5. Start Work Order

**POST** `/api/production/work-orders/:id/start`

Start production on a released work order.

**Required Permission**: `PROD.EXECUTE_WORK_ORDER`

**Request Body**: None

**Business Rules**:
- Only released work orders can be started
- Changes status from released → in_progress
- Records start date/time
- Updates Production Order status to in_progress
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "woNumber": "WO-20241226-1500",
    "status": "in_progress",
    "startDate": "2024-12-26T08:00:00.000Z",
    ...
  },
  "message": "Work order started"
}
```

---

### 6. Pause Work Order

**POST** `/api/production/work-orders/:id/pause`

Pause an in-progress work order.

**Required Permission**: `PROD.EXECUTE_WORK_ORDER`

**Request Body**: None

**Business Rules**:
- Only in-progress work orders can be paused
- Changes status from in_progress → released
- Creates audit log entry
- **Note**: Use downtime logging to record reason for pause

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "woNumber": "WO-20241226-1500",
    "status": "released",
    ...
  },
  "message": "Work order paused"
}
```

---

### 7. Complete Work Order

**POST** `/api/production/work-orders/:id/complete`

Complete an in-progress work order.

**Required Permission**: `PROD.EXECUTE_WORK_ORDER`

**Request Body**: None

**Business Rules**:
- Only in-progress work orders can be completed
- Changes status from in_progress → completed
- Records end date/time
- If Production Order quantity is fully produced, updates PO status to completed
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "woNumber": "WO-20241226-1500",
    "status": "completed",
    "endDate": "2024-12-26T16:00:00.000Z",
    ...
  },
  "message": "Work order completed"
}
```

---

### 8. Delete Work Order

**DELETE** `/api/production/work-orders/:id`

Delete a pending work order.

**Required Permission**: `PROD.DELETE_WORK_ORDER`

**Request Body**: None

**Business Rules**:
- Only pending work orders can be deleted
- Permanent deletion
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": null,
  "message": "Work order deleted successfully"
}
```

---

## Production Output API

### 9. Record Production Output

**POST** `/api/production/output`

Record production output (good, scrap, rework).

**Required Permission**: `PROD.RECORD_OUTPUT`

**Request Body**:
```json
{
  "workOrderId": 1,
  "operatorId": 12,
  "outputDate": "2024-12-26",
  "quantityGood": 480,
  "quantityScrap": 15,
  "quantityRework": 5,
  "warehouseId": 1,
  "shiftId": 1,
  "notes": "Morning shift production"
}
```

**Field Descriptions**:
- `workOrderId` (required): Work order being executed
- `operatorId` (required): Operator recording output
- `outputDate` (required): Date of output
- `quantityGood` (required): Good quantity produced (>= 0)
- `quantityScrap` (required): Scrap quantity (>= 0)
- `quantityRework` (required): Rework quantity (>= 0)
- `warehouseId` (required): Warehouse to receive finished goods
- `shiftId` (optional): Shift identifier
- `notes` (optional): Output notes

**Business Rules**:
- Work order must be in "in_progress" status
- All quantities must be >= 0
- Total output (good + scrap + rework) must be > 0
- Total output cannot exceed work order planned quantity
- **Inventory Updates**:
  - Good quantity → Under Inspection inventory
  - Creates inventory transaction
- **Work Order Updates**:
  - Updates quantityProduced, quantityScrap, quantityRework
- **Production Order Updates**:
  - Updates quantityProduced
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "workOrderId": 1,
    "operatorId": 12,
    "outputDate": "2024-12-26",
    "quantityGood": 480,
    "quantityScrap": 15,
    "quantityRework": 5,
    "shiftId": 1,
    "notes": "Morning shift production",
    "createdAt": "2024-12-26T12:00:00.000Z",
    "createdBy": 5
  },
  "message": "Production output recorded successfully"
}
```

---

## Downtime Logging API

### 10. Log Downtime

**POST** `/api/production/downtime`

Log production downtime with reason and category.

**Required Permission**: `PROD.LOG_DOWNTIME`

**Request Body**:
```json
{
  "workOrderId": 1,
  "machineId": 3,
  "downtimeStart": "2024-12-26T10:30:00.000Z",
  "downtimeEnd": "2024-12-26T11:15:00.000Z",
  "reason": "Hydraulic system failure",
  "category": "breakdown",
  "notes": "Required emergency maintenance"
}
```

**Field Descriptions**:
- `workOrderId` (required): Work order affected by downtime
- `machineId` (optional): Machine that had downtime
- `downtimeStart` (required): Start of downtime
- `downtimeEnd` (optional): End of downtime (can be set later)
- `reason` (required): Reason for downtime
- `category` (required): Category (breakdown, changeover, material_shortage, quality_issue, other)
- `notes` (optional): Additional notes

**Business Rules**:
- Work order must exist
- Reason is mandatory
- Category must be valid
- If downtimeEnd provided, must be after downtimeStart
- Duration calculated automatically if both start and end provided
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "workOrderId": 1,
    "machineId": 3,
    "downtimeStart": "2024-12-26T10:30:00.000Z",
    "downtimeEnd": "2024-12-26T11:15:00.000Z",
    "durationMinutes": 45,
    "reason": "Hydraulic system failure",
    "category": "breakdown",
    "notes": "Required emergency maintenance",
    "createdAt": "2024-12-26T11:20:00.000Z",
    "createdBy": 5
  },
  "message": "Downtime logged successfully"
}
```

---

## RBAC Permissions

| Permission | Description | Typical Roles |
|------------|-------------|---------------|
| `PROD.VIEW_WORK_ORDERS` | View work orders | Production, Supervisor, Management |
| `PROD.CREATE_WORK_ORDER` | Create work orders | Production Planner, Supervisor |
| `PROD.MANAGE_WORK_ORDER` | Release work orders | Production Supervisor |
| `PROD.EXECUTE_WORK_ORDER` | Start, pause, complete work orders | Production Operator, Supervisor |
| `PROD.DELETE_WORK_ORDER` | Delete pending work orders | Production Planner |
| `PROD.RECORD_OUTPUT` | Record production output | Production Operator, Supervisor |
| `PROD.LOG_DOWNTIME` | Log downtime | Production Operator, Supervisor |

---

## Workflow Examples

### Example 1: Complete Work Order Execution

```bash
# 1. Login as Production Planner
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"prod_planner","password":"password"}'

# 2. Create Work Order from Released Production Order
curl -X POST http://localhost:3000/api/production/work-orders \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productionOrderId": 5,
    "quantityPlanned": 1000,
    "machineId": 3,
    "moldId": 2,
    "supervisorId": 8
  }'

# 3. Login as Production Supervisor
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"supervisor","password":"password"}'

# 4. Release Work Order
curl -X POST http://localhost:3000/api/production/work-orders/1/release \
  -H "Authorization: Bearer TOKEN"

# 5. Login as Production Operator
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"operator","password":"password"}'

# 6. Start Work Order
curl -X POST http://localhost:3000/api/production/work-orders/1/start \
  -H "Authorization: Bearer TOKEN"

# 7. Record Production Output (Morning Shift)
curl -X POST http://localhost:3000/api/production/output \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workOrderId": 1,
    "operatorId": 12,
    "outputDate": "2024-12-26",
    "quantityGood": 480,
    "quantityScrap": 15,
    "quantityRework": 5,
    "warehouseId": 1,
    "shiftId": 1
  }'

# 8. Log Downtime (Machine Breakdown)
curl -X POST http://localhost:3000/api/production/downtime \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workOrderId": 1,
    "machineId": 3,
    "downtimeStart": "2024-12-26T10:30:00.000Z",
    "downtimeEnd": "2024-12-26T11:15:00.000Z",
    "reason": "Hydraulic system failure",
    "category": "breakdown"
  }'

# 9. Record Production Output (Afternoon Shift)
curl -X POST http://localhost:3000/api/production/output \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workOrderId": 1,
    "operatorId": 13,
    "outputDate": "2024-12-26",
    "quantityGood": 500,
    "quantityScrap": 0,
    "quantityRework": 0,
    "warehouseId": 1,
    "shiftId": 2
  }'

# 10. Complete Work Order
curl -X POST http://localhost:3000/api/production/work-orders/1/complete \
  -H "Authorization: Bearer TOKEN"
```

### Example 2: Pause and Resume Work Order

```bash
# 1. Start Work Order
curl -X POST http://localhost:3000/api/production/work-orders/1/start \
  -H "Authorization: Bearer TOKEN"

# 2. Log Downtime (Material Shortage)
curl -X POST http://localhost:3000/api/production/downtime \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workOrderId": 1,
    "downtimeStart": "2024-12-26T14:00:00.000Z",
    "reason": "Waiting for raw material delivery",
    "category": "material_shortage"
  }'

# 3. Pause Work Order
curl -X POST http://localhost:3000/api/production/work-orders/1/pause \
  -H "Authorization: Bearer TOKEN"

# 4. Resume Work Order (after material arrives)
curl -X POST http://localhost:3000/api/production/work-orders/1/start \
  -H "Authorization: Bearer TOKEN"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Total output (1050) exceeds planned quantity (1000)"
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
  "error": "Permission denied: PROD.EXECUTE_WORK_ORDER"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Work order not found"
}
```

---

## Audit Logging

All production execution operations are automatically logged:

**Logged Actions**:
- CREATE_WORK_ORDER - Work order creation
- RELEASE_WORK_ORDER - Work order release
- START_WORK_ORDER - Work order start
- PAUSE_WORK_ORDER - Work order pause
- COMPLETE_WORK_ORDER - Work order completion
- CANCEL_WORK_ORDER - Work order cancellation
- DELETE_WORK_ORDER - Work order deletion
- RECORD_PRODUCTION_OUTPUT - Output recording
- LOG_DOWNTIME - Downtime logging
- END_DOWNTIME - Downtime end

---

## Integration Points

**Current Module Integrations**:
- **Production Orders**: Creates work orders from released POs
- **Production Schedules**: Links to schedules
- **Inventory**: Updates finished goods to Under Inspection
- **Master Data**: Validates machines, molds, items
- **Auth & RBAC**: Enforces permissions
- **Audit Logs**: Records all critical actions

**Future Module Integrations** (Not Yet Implemented):
- **Quality Control**: Will inspect finished goods
- **Accounting**: Will track production costs
- **Maintenance**: Will track machine maintenance

---

## Business Rules Summary

### Work Orders
1. **Production Order Validation**: Must be released
2. **Quantity Validation**: Cannot exceed remaining PO quantity
3. **Status Workflow**: Enforced state transitions
4. **Deletion**: Only pending work orders can be deleted

### Production Output
1. **Work Order Status**: Must be in-progress
2. **Quantity Validation**: Total cannot exceed planned quantity
3. **Inventory Update**: Good quantity → Under Inspection
4. **Production Order Update**: Updates quantity produced
5. **Transaction Logging**: All movements logged

### Downtime
1. **Reason Required**: Mandatory for all downtime
2. **Category Validation**: Must be valid category
3. **Duration Calculation**: Automatic if both start and end provided
4. **End Time Validation**: Must be after start time

---

## Notes

- Work orders are derived from released Production Orders
- Production output automatically updates inventory (finished goods → Under Inspection)
- Good quantity goes to QC for inspection
- Scrap and rework quantities tracked but don't update inventory (handled by QC)
- Downtime logging helps track production efficiency
- All operations are transactional (atomic)
- No accounting entries created (future module)
- No maintenance logic (future module)

---

**End of Production Execution Module API Documentation**
