# Maintenance Module - API Documentation

## Overview

The Maintenance Module manages preventive and corrective maintenance for machines. It includes maintenance schedules, work orders with approval workflows, and maintenance history tracking. The module integrates with production downtime logs for corrective maintenance requests.

**Base URLs**: 
- `/api/maintenance/schedules` - Maintenance Schedules
- `/api/maintenance/work-orders` - Maintenance Work Orders
- `/api/maintenance/history` - Maintenance History

**Authentication**: All requests require `Authorization: Bearer <token>` header

---

## Status Lifecycles

### Maintenance Work Order (MWO) Lifecycle

```
PENDING → APPROVED → SCHEDULED → IN_PROGRESS → COMPLETED
   ↓          ↓           ↓            ↓
REJECTED  CANCELLED  CANCELLED   CANCELLED
```

**MWO Status Definitions**:
- **pending**: Initial state, awaiting approval
- **approved**: Approved by management, ready for scheduling
- **rejected**: Rejected by management
- **scheduled**: Scheduled for execution with date/time
- **in_progress**: Work has started
- **completed**: Work completed, history record created
- **cancelled**: Cancelled at any stage

---

## Maintenance Schedules API

### 1. Get Maintenance Schedules (List)

**GET** `/api/maintenance/schedules`

Get paginated list of maintenance schedules.

**Required Permission**: `MAINT.VIEW_SCHEDULES`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `machineId` (optional): Filter by machine
- `maintenanceType` (optional): Filter by type (preventive, predictive, routine)
- `isActive` (optional): Filter by active status (true/false)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "scheduleCode": "MS-2024-001",
      "machineId": 5,
      "maintenanceType": "preventive",
      "frequencyDays": 30,
      "lastMaintenanceDate": "2024-11-26",
      "nextMaintenanceDate": "2024-12-26",
      "description": "Monthly preventive maintenance",
      "estimatedDurationHours": 4.0,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-11-26T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

### 2. Create Maintenance Schedule

**POST** `/api/maintenance/schedules`

Create a new maintenance schedule.

**Required Permission**: `MAINT.CREATE_SCHEDULE`

**Request Body**:
```json
{
  "machineId": 5,
  "maintenanceType": "preventive",
  "frequencyDays": 30,
  "nextMaintenanceDate": "2024-12-26",
  "description": "Monthly preventive maintenance",
  "estimatedDurationHours": 4.0
}
```

**Response**: Returns created schedule object

### 3. Get Schedule by ID

**GET** `/api/maintenance/schedules/:id`

**Required Permission**: `MAINT.VIEW_SCHEDULES`

### 4. Update Schedule

**PUT** `/api/maintenance/schedules/:id`

**Required Permission**: `MAINT.UPDATE_SCHEDULE`

### 5. Delete Schedule

**DELETE** `/api/maintenance/schedules/:id`

**Required Permission**: `MAINT.DELETE_SCHEDULE`

### 6. Activate Schedule

**POST** `/api/maintenance/schedules/:id/activate`

**Required Permission**: `MAINT.ACTIVATE_SCHEDULE`

### 7. Deactivate Schedule

**POST** `/api/maintenance/schedules/:id/deactivate`

**Required Permission**: `MAINT.DEACTIVATE_SCHEDULE`

### 8. Get Overdue Schedules

**GET** `/api/maintenance/schedules/overdue`

Get all schedules that are past their next maintenance date.

**Required Permission**: `MAINT.VIEW_SCHEDULES`

---

## Maintenance Work Orders API

### 1. Get Work Orders (List)

**GET** `/api/maintenance/work-orders`

**Required Permission**: `MAINT.VIEW_WORK_ORDERS`

**Query Parameters**:
- `page`, `pageSize`: Pagination
- `machineId`: Filter by machine
- `maintenanceType`: Filter by type (preventive, corrective, predictive, inspection)
- `status`: Filter by status
- `priority`: Filter by priority (low, normal, high, urgent)
- `fromDate`, `toDate`: Filter by scheduled date range

### 2. Create Work Order

**POST** `/api/maintenance/work-orders`

**Required Permission**: `MAINT.CREATE_WORK_ORDER`

**Request Body**:
```json
{
  "machineId": 5,
  "maintenanceType": "corrective",
  "priority": "high",
  "requestedDate": "2024-12-26T08:00:00.000Z",
  "problemDescription": "Machine making unusual noise",
  "estimatedDurationHours": 2.0
}
```

### 3. Approve Work Order

**POST** `/api/maintenance/work-orders/:id/approve`

**Required Permission**: `MAINT.APPROVE_WORK_ORDER`

### 4. Reject Work Order

**POST** `/api/maintenance/work-orders/:id/reject`

**Required Permission**: `MAINT.REJECT_WORK_ORDER`

**Request Body**:
```json
{
  "rejectionReason": "Insufficient information provided"
}
```

### 5. Schedule Work Order

**POST** `/api/maintenance/work-orders/:id/schedule`

**Required Permission**: `MAINT.SCHEDULE_WORK_ORDER`

**Request Body**:
```json
{
  "scheduledDate": "2024-12-27T09:00:00.000Z",
  "assignedTechnicianId": 10
}
```

### 6. Start Work Order

**POST** `/api/maintenance/work-orders/:id/start`

**Required Permission**: `MAINT.START_WORK_ORDER`

### 7. Complete Work Order

**POST** `/api/maintenance/work-orders/:id/complete`

**Required Permission**: `MAINT.COMPLETE_WORK_ORDER`

**Request Body**:
```json
{
  "workPerformed": "Replaced worn bearing, lubricated moving parts",
  "rootCause": "Normal wear and tear",
  "correctiveAction": "Scheduled more frequent lubrication",
  "actualDurationHours": 2.5
}
```

### 8. Cancel Work Order

**POST** `/api/maintenance/work-orders/:id/cancel`

**Required Permission**: `MAINT.CANCEL_WORK_ORDER`

**Request Body**:
```json
{
  "cancellationReason": "Issue resolved without maintenance"
}
```

### 9. Create Work Order from Downtime

**POST** `/api/maintenance/work-orders/from-downtime`

Create a corrective maintenance work order from a production downtime event.

**Required Permission**: `MAINT.CREATE_WORK_ORDER`

**Request Body**:
```json
{
  "downtimeId": 15,
  "priority": "urgent"
}
```

---

## Maintenance History API

### 1. Get Maintenance History (List)

**GET** `/api/maintenance/history`

**Required Permission**: `MAINT.VIEW_HISTORY`

**Query Parameters**:
- `page`, `pageSize`: Pagination
- `machineId`: Filter by machine
- `maintenanceType`: Filter by type
- `fromDate`, `toDate`: Filter by maintenance date range

### 2. Get History by ID

**GET** `/api/maintenance/history/:id`

**Required Permission**: `MAINT.VIEW_HISTORY`

### 3. Get Machine Maintenance History

**GET** `/api/maintenance/history/machine/:machineId`

Get complete maintenance history for a specific machine.

**Required Permission**: `MAINT.VIEW_HISTORY`

---

## Business Rules

1. **Schedule Management**:
   - Cannot create duplicate schedules for same machine and type
   - Next maintenance date auto-updates after work order completion
   - Inactive schedules don't generate work orders

2. **Work Order Workflow**:
   - Must be approved before scheduling
   - Must be scheduled before starting
   - Must be started before completing
   - Completion creates maintenance history record
   - Cannot modify completed work orders

3. **Integration**:
   - Corrective maintenance can be created from downtime logs
   - Preventive maintenance linked to schedules
   - History records track all completed maintenance

4. **Permissions**:
   - Separate permissions for view, create, approve, execute
   - Audit logging on all critical actions
   - RBAC enforced on all endpoints

---

## Error Responses

All endpoints return standard error format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP Status Codes:
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error
