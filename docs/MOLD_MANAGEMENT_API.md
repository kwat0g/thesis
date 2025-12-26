# Mold Management Module - API Documentation

## Overview

The Mold Management Module tracks mold lifecycle, usage count, condition/status, and maintenance history. It integrates with Production Execution (work orders) and Maintenance modules to ensure mold availability and proper maintenance tracking.

**Base URLs**: 
- `/api/mold/lifecycle` - Mold Lifecycle & Status
- `/api/mold/usage` - Mold Usage Tracking
- `/api/mold/maintenance` - Mold Maintenance Records

**Authentication**: All requests require `Authorization: Bearer <token>` header

---

## Status Lifecycles

### Mold Status Lifecycle

```
AVAILABLE → IN_USE → AVAILABLE
    ↓          ↓
MAINTENANCE ← ─┘
    ↓
REPAIR
    ↓
AVAILABLE (or RETIRED)
```

**Mold Status Definitions**:
- **available**: Ready for use in production
- **in_use**: Currently assigned to a work order
- **maintenance**: Undergoing scheduled maintenance
- **repair**: Under repair due to damage
- **retired**: End of life, no longer usable

---

## Mold Lifecycle API

### 1. Get Mold Current Condition

**GET** `/api/mold/lifecycle/:id`

Get comprehensive condition information for a mold.

**Required Permission**: `MOLD.VIEW`

**Response**:
```json
{
  "success": true,
  "data": {
    "mold": {
      "id": 1,
      "moldCode": "M-001",
      "moldName": "Cap Mold 50ml",
      "cavityCount": 8,
      "status": "available",
      "totalShots": 45000,
      "maxShots": 100000,
      "isActive": true
    },
    "currentStatus": "available",
    "totalShots": 45000,
    "maxShots": 100000,
    "shotUtilization": 45.0,
    "isActive": true,
    "hasActiveUsage": false,
    "totalUsageRecords": 12,
    "latestStatusChange": {
      "id": 25,
      "previousStatus": "maintenance",
      "newStatus": "available",
      "changeDate": "2024-12-20T10:00:00.000Z",
      "reason": "Maintenance completed",
      "totalShotsAtChange": 45000
    }
  }
}
```

### 2. Check Mold Availability

**GET** `/api/mold/lifecycle/:id/availability`

Check if mold is available for use.

**Required Permission**: `MOLD.VIEW`

**Response**:
```json
{
  "success": true,
  "data": {
    "available": true,
    "reason": null
  }
}
```

Or if not available:
```json
{
  "success": true,
  "data": {
    "available": false,
    "reason": "Mold is currently in_use"
  }
}
```

### 3. Update Mold Status

**PUT** `/api/mold/lifecycle/:id/status`

Update mold status with reason tracking.

**Required Permission**: `MOLD.UPDATE_STATUS`

**Request Body**:
```json
{
  "status": "maintenance",
  "reason": "Scheduled preventive maintenance",
  "conditionNotes": "Minor wear observed on cavity 3"
}
```

**Valid Status Values**: `available`, `in_use`, `maintenance`, `repair`, `retired`

### 4. Retire Mold

**POST** `/api/mold/lifecycle/:id/retire`

Permanently retire a mold from service.

**Required Permission**: `MOLD.RETIRE`

**Request Body**:
```json
{
  "reason": "Exceeded maximum shot count, excessive wear"
}
```

### 5. Get Mold Condition History

**GET** `/api/mold/lifecycle/:id/history`

Get complete status change history for a mold.

**Required Permission**: `MOLD.VIEW`

**Response**: Array of condition history records

---

## Mold Usage API

### 1. Start Mold Usage

**POST** `/api/mold/usage`

Assign mold to a work order and mark as in-use.

**Required Permission**: `MOLD.START_USAGE`

**Request Body**:
```json
{
  "moldId": 1,
  "workOrderId": 150,
  "notes": "Production run for order #1234"
}
```

**Business Rules**:
- Mold must be available
- Work order must exist
- No duplicate assignment (one mold per work order)
- No active usage (mold can't be used by multiple work orders)

### 2. End Mold Usage

**POST** `/api/mold/usage/:id/end`

Complete mold usage and update shot count.

**Required Permission**: `MOLD.END_USAGE`

**Request Body**:
```json
{
  "shotsProduced": 5000,
  "notes": "Production completed successfully"
}
```

**Automatic Actions**:
- Updates mold total shot count
- Sets mold status back to `available`
- If max shots reached, sets status to `maintenance`

### 3. Get Mold Usage by ID

**GET** `/api/mold/usage/:id`

**Required Permission**: `MOLD.VIEW`

### 4. Get Usage Records by Mold

**GET** `/api/mold/usage/mold/:moldId`

Get all usage records for a specific mold.

**Required Permission**: `MOLD.VIEW`

### 5. Get Mold Usage Statistics

**GET** `/api/mold/usage/mold/:moldId/statistics`

Get usage statistics for a mold.

**Required Permission**: `MOLD.VIEW`

**Response**:
```json
{
  "success": true,
  "data": {
    "moldId": 1,
    "totalUsages": 12,
    "completedUsages": 11,
    "activeUsages": 1,
    "totalShots": 45000,
    "averageShotsPerUsage": 4091
  }
}
```

### 6. Get Usage by Work Order

**GET** `/api/mold/usage/work-order/:workOrderId`

Get mold usage for a specific work order.

**Required Permission**: `MOLD.VIEW`

---

## Mold Maintenance API

### 1. Get Maintenance Records (List)

**GET** `/api/mold/maintenance`

**Required Permission**: `MOLD.VIEW_MAINTENANCE`

**Query Parameters**:
- `page`, `pageSize`: Pagination
- `moldId`: Filter by mold
- `maintenanceType`: Filter by type (preventive, corrective, inspection, cleaning)
- `status`: Filter by status (scheduled, in_progress, completed, cancelled)
- `technicianId`: Filter by technician
- `fromDate`, `toDate`: Filter by maintenance date range

### 2. Create Maintenance Record

**POST** `/api/mold/maintenance`

**Required Permission**: `MOLD.CREATE_MAINTENANCE`

**Request Body**:
```json
{
  "moldId": 1,
  "maintenanceWorkOrderId": 25,
  "maintenanceType": "preventive",
  "maintenanceDate": "2024-12-26T09:00:00.000Z",
  "technicianId": 10,
  "durationHours": 3.0,
  "workPerformed": "Cleaned all cavities, replaced worn ejector pins",
  "partsReplaced": "8x ejector pins",
  "findings": "Normal wear, no major issues",
  "recommendations": "Continue monthly maintenance schedule",
  "nextMaintenanceShots": 50000,
  "status": "completed"
}
```

### 3. Get Maintenance Record by ID

**GET** `/api/mold/maintenance/:id`

**Required Permission**: `MOLD.VIEW_MAINTENANCE`

### 4. Update Maintenance Record

**PUT** `/api/mold/maintenance/:id`

**Required Permission**: `MOLD.UPDATE_MAINTENANCE`

### 5. Complete Maintenance Record

**POST** `/api/mold/maintenance/:id/complete`

**Required Permission**: `MOLD.COMPLETE_MAINTENANCE`

**Request Body**:
```json
{
  "durationHours": 3.5,
  "workPerformed": "Detailed maintenance work description",
  "partsReplaced": "List of replaced parts",
  "findings": "Inspection findings",
  "recommendations": "Future recommendations",
  "nextMaintenanceShots": 50000
}
```

**Automatic Actions**:
- Sets maintenance record status to `completed`
- If mold status is `maintenance`, sets it back to `available`

### 6. Get Maintenance Records by Mold

**GET** `/api/mold/maintenance/mold/:moldId`

**Required Permission**: `MOLD.VIEW_MAINTENANCE`

### 7. Get Mold Maintenance History

**GET** `/api/mold/maintenance/mold/:moldId/history`

Get comprehensive maintenance history with statistics.

**Required Permission**: `MOLD.VIEW_MAINTENANCE`

**Response**:
```json
{
  "success": true,
  "data": {
    "moldId": 1,
    "totalMaintenances": 8,
    "totalDurationHours": 24.5,
    "averageDurationHours": 3.06,
    "maintenanceByType": {
      "preventive": 6,
      "corrective": 1,
      "inspection": 1,
      "cleaning": 0
    },
    "latestMaintenance": {
      "id": 45,
      "maintenanceDate": "2024-12-20T09:00:00.000Z",
      "maintenanceType": "preventive",
      "status": "completed"
    },
    "allRecords": []
  }
}
```

---

## Business Rules

1. **Mold Availability**:
   - Must be `available` status to start usage
   - Must be active (not retired)
   - Cannot exceed max shot count
   - One mold per work order

2. **Usage Tracking**:
   - Shot count auto-updates on usage completion
   - Status auto-changes to `maintenance` when max shots reached
   - Cannot manually update/delete biometric-imported records

3. **Maintenance Integration**:
   - Can link to maintenance work orders
   - Maintenance completion returns mold to `available`
   - Tracks shots before maintenance for scheduling

4. **Status Transitions**:
   - All status changes logged in condition history
   - Cannot retire mold with active usage
   - Automatic status updates based on usage/maintenance

---

## RBAC Permissions

- `MOLD.VIEW` - View mold information
- `MOLD.UPDATE_STATUS` - Update mold status
- `MOLD.RETIRE` - Retire molds
- `MOLD.START_USAGE` - Start mold usage
- `MOLD.END_USAGE` - End mold usage
- `MOLD.VIEW_MAINTENANCE` - View maintenance records
- `MOLD.CREATE_MAINTENANCE` - Create maintenance records
- `MOLD.UPDATE_MAINTENANCE` - Update maintenance records
- `MOLD.COMPLETE_MAINTENANCE` - Complete maintenance

---

## Error Responses

Standard error format with HTTP status codes:
- `400`: Validation errors, business rule violations
- `401`: Authentication required
- `403`: Insufficient permissions
- `404`: Resource not found
- `500`: Server error
