# Production Planning & MRP Module - API Documentation

## Overview

The Production Planning & MRP Module provides automated material requirements planning based on released production orders. It includes production scheduling, BOM explosion, material shortage identification, and automatic purchase request generation.

**Base URLs**: 
- `/api/production/schedules` - Production Planning
- `/api/mrp/runs` - MRP Execution

**Authentication**: All requests require `Authorization: Bearer <token>` header

---

## Key Concepts

### Production Planning
- Creates production schedules from **RELEASED** production orders only
- Supports daily and weekly scheduling strategies
- Tracks scheduled vs. actual quantities
- Assigns machines and shifts to schedules

### MRP (Material Requirements Planning)
- Analyzes released production orders within planning horizon
- Explodes BOMs to calculate component requirements
- Identifies material shortages
- Auto-generates Purchase Requests for shortages
- Deterministic and reproducible calculations

### BOM Explosion
- Multi-level BOM explosion (recursive)
- Accounts for scrap percentage
- Aggregates requirements across all production orders
- Calculates net requirements

---

## Production Planning API

### 1. Get Production Schedules (List)

**GET** `/api/production/schedules`

Get paginated list of production schedules.

**Required Permission**: `PROD.VIEW_SCHEDULES`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (scheduled, in_progress, completed, cancelled)
- `fromDate` (optional): Filter by scheduled date from (YYYY-MM-DD)
- `toDate` (optional): Filter by scheduled date to (YYYY-MM-DD)
- `machineId` (optional): Filter by machine ID

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "productionOrderId": 5,
      "scheduledDate": "2024-12-28",
      "scheduledQuantity": 1000,
      "machineId": 3,
      "shiftId": 1,
      "status": "scheduled",
      "createdAt": "2024-12-26T10:00:00.000Z",
      "updatedAt": "2024-12-26T10:00:00.000Z",
      "createdBy": 1,
      "updatedBy": 1
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

### 2. Create Production Schedule

**POST** `/api/production/schedules`

Create a production schedule for a released production order.

**Required Permission**: `PROD.MANAGE_SCHEDULES`

**Request Body**:
```json
{
  "productionOrderId": 5,
  "scheduledDate": "2024-12-28",
  "scheduledQuantity": 1000,
  "machineId": 3,
  "shiftId": 1
}
```

**Business Rules**:
- Production order must be in RELEASED status
- Scheduled quantity cannot exceed remaining quantity
- Scheduled date cannot be in the past
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "productionOrderId": 5,
    "scheduledDate": "2024-12-28",
    "scheduledQuantity": 1000,
    "machineId": 3,
    "shiftId": 1,
    "status": "scheduled",
    "createdAt": "2024-12-26T10:00:00.000Z",
    "updatedAt": "2024-12-26T10:00:00.000Z"
  },
  "message": "Production schedule created successfully"
}
```

---

### 3. Get Production Schedule by ID

**GET** `/api/production/schedules/:id`

Get single production schedule details.

**Required Permission**: `PROD.VIEW_SCHEDULES`

**Response**: Same as single schedule object

---

### 4. Update Production Schedule

**PUT** `/api/production/schedules/:id`

Update an existing production schedule.

**Required Permission**: `PROD.MANAGE_SCHEDULES`

**Request Body**:
```json
{
  "scheduledDate": "2024-12-29",
  "scheduledQuantity": 1200,
  "machineId": 4,
  "shiftId": 2
}
```

**Business Rules**:
- Only SCHEDULED schedules can be updated
- Same validation as create
- Creates audit log entry

**Response**: Same as get schedule

---

### 5. Delete Production Schedule

**DELETE** `/api/production/schedules/:id`

Delete a production schedule.

**Required Permission**: `PROD.MANAGE_SCHEDULES`

**Business Rules**:
- Only SCHEDULED schedules can be deleted
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": null,
  "message": "Production schedule deleted successfully"
}
```

---

### 6. Auto-Schedule Production Order

**POST** `/api/production/orders/:id/auto-schedule`

Automatically create production schedules for a released production order.

**Required Permission**: `PROD.MANAGE_SCHEDULES`

**Request Body**:
```json
{
  "strategy": "daily"
}
```

**Strategies**:
- `daily`: Distributes quantity evenly across days until required date
- `weekly`: Distributes quantity evenly across weeks until required date

**Business Rules**:
- Production order must be RELEASED
- No existing schedules allowed
- Remaining quantity must be > 0
- Required date must be in the future
- Creates multiple schedule entries

**Response**:
```json
{
  "success": true,
  "data": {
    "scheduleIds": [1, 2, 3, 4, 5],
    "count": 5
  },
  "message": "Created 5 production schedules"
}
```

---

## MRP API

### 7. Get MRP Runs (List)

**GET** `/api/mrp/runs`

Get paginated list of MRP runs.

**Required Permission**: `MRP.VIEW_RUNS`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (running, completed, failed)
- `fromDate` (optional): Filter by run date from (YYYY-MM-DD)
- `toDate` (optional): Filter by run date to (YYYY-MM-DD)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "runNumber": "MRP-20241226-1430",
      "runDate": "2024-12-26T14:30:00.000Z",
      "planningHorizonDays": 30,
      "status": "completed",
      "totalRequirements": 45,
      "totalShortages": 12,
      "notes": null,
      "createdAt": "2024-12-26T14:30:00.000Z",
      "createdBy": 1
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

---

### 8. Execute MRP

**POST** `/api/mrp/runs`

Execute a new MRP run to calculate material requirements.

**Required Permission**: `MRP.EXECUTE_MRP`

**Request Body**:
```json
{
  "planningHorizonDays": 30
}
```

**MRP Process**:
1. Retrieves all RELEASED production orders within planning horizon
2. For each production order:
   - Explodes BOM to get component requirements
   - Accounts for scrap percentage
   - Aggregates requirements by item
3. Calculates shortages (currently assumes 0 available inventory)
4. Creates MRP requirement records
5. Returns summary statistics

**Business Rules**:
- Only processes RELEASED production orders
- Uses active BOMs only
- Multi-level BOM explosion (recursive)
- Deterministic calculation (same inputs = same outputs)
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "runNumber": "MRP-20241226-1430",
    "runDate": "2024-12-26T14:30:00.000Z",
    "planningHorizonDays": 30,
    "status": "completed",
    "totalRequirements": 45,
    "totalShortages": 12,
    "notes": null,
    "createdAt": "2024-12-26T14:30:00.000Z",
    "createdBy": 1
  },
  "message": "MRP executed successfully"
}
```

---

### 9. Get MRP Run by ID

**GET** `/api/mrp/runs/:id`

Get single MRP run details.

**Required Permission**: `MRP.VIEW_RUNS`

**Response**: Same as single MRP run object

---

### 10. Get MRP Requirements

**GET** `/api/mrp/runs/:id/requirements`

Get all material requirements for an MRP run.

**Required Permission**: `MRP.VIEW_REQUIREMENTS`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "mrpRunId": 1,
      "productionOrderId": 5,
      "itemId": 20,
      "requiredQuantity": 5000,
      "availableQuantity": 0,
      "shortageQuantity": 5000,
      "requiredDate": "2024-12-31",
      "status": "shortage",
      "prId": null,
      "createdAt": "2024-12-26T14:30:05.000Z"
    }
  ]
}
```

**Requirement Status**:
- `sufficient`: Available quantity meets requirement
- `shortage`: Shortage exists, PR not yet created
- `pr_created`: Purchase request created for this shortage

---

### 11. Get MRP Shortages

**GET** `/api/mrp/runs/:id/shortages`

Get only material shortages for an MRP run.

**Required Permission**: `MRP.VIEW_REQUIREMENTS`

**Response**: Same format as requirements, but filtered to shortage and pr_created status only

---

### 12. Generate Purchase Requests from MRP

**POST** `/api/mrp/runs/:id/generate-prs`

Auto-generate purchase requests from MRP shortages.

**Required Permission**: `MRP.EXECUTE_MRP`

**Request Body**: None

**PR Generation Process**:
1. Retrieves all shortages from MRP run
2. Groups shortages by item
3. For each item:
   - Aggregates total shortage quantity
   - Determines earliest required date
   - Creates draft Purchase Request
   - Creates PR line with item and quantity
   - Links MRP requirements to PR
   - Updates requirement status to 'pr_created'
4. Creates audit log entries

**Business Rules**:
- Only processes shortages not yet converted to PRs
- One PR per item (aggregates multiple requirements)
- PRs created in DRAFT status
- Uses earliest required date from all requirements
- Creates audit trail

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "prId": 10,
      "prNumber": "PR-MRP-20241226-1435",
      "itemCount": 1,
      "totalQuantity": 5000,
      "requirementIds": [1, 2, 3]
    },
    {
      "prId": 11,
      "prNumber": "PR-MRP-20241226-1436",
      "itemCount": 1,
      "totalQuantity": 2500,
      "requirementIds": [4, 5]
    }
  ],
  "message": "Generated 2 purchase requests from MRP shortages"
}
```

---

### 13. Delete MRP Run

**DELETE** `/api/mrp/runs/:id`

Delete an MRP run and all its requirements.

**Required Permission**: `MRP.EXECUTE_MRP`

**Business Rules**:
- Cannot delete running MRP
- Deletes all associated requirements
- Creates audit log entry

**Response**:
```json
{
  "success": true,
  "data": null,
  "message": "MRP run deleted successfully"
}
```

---

## RBAC Permissions

| Permission | Description | Typical Roles |
|------------|-------------|---------------|
| `PROD.VIEW_SCHEDULES` | View production schedules | Production Planner, Supervisor, Management |
| `PROD.MANAGE_SCHEDULES` | Create/update/delete schedules | Production Planner |
| `MRP.VIEW_RUNS` | View MRP runs | Production Planner, Purchasing, Management |
| `MRP.VIEW_REQUIREMENTS` | View MRP requirements | Production Planner, Purchasing |
| `MRP.EXECUTE_MRP` | Execute MRP and generate PRs | Production Planner |

---

## Workflow Examples

### Example 1: Execute MRP and Generate PRs

```bash
# 1. Login as Production Planner
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"planner","password":"password"}'

# 2. Execute MRP
curl -X POST http://localhost:3000/api/mrp/runs \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planningHorizonDays": 30}'

# 3. View MRP shortages
curl -X GET http://localhost:3000/api/mrp/runs/1/shortages \
  -H "Authorization: Bearer TOKEN"

# 4. Generate Purchase Requests
curl -X POST http://localhost:3000/api/mrp/runs/1/generate-prs \
  -H "Authorization: Bearer TOKEN"

# 5. View all requirements (including PR links)
curl -X GET http://localhost:3000/api/mrp/runs/1/requirements \
  -H "Authorization: Bearer TOKEN"
```

### Example 2: Create Production Schedules

```bash
# 1. Auto-schedule a production order (daily strategy)
curl -X POST http://localhost:3000/api/production/orders/5/auto-schedule \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"strategy": "daily"}'

# 2. View created schedules
curl -X GET "http://localhost:3000/api/production/schedules?fromDate=2024-12-26&toDate=2024-12-31" \
  -H "Authorization: Bearer TOKEN"

# 3. Update a specific schedule
curl -X PUT http://localhost:3000/api/production/schedules/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "machineId": 4,
    "shiftId": 2
  }'
```

---

## BOM Explosion Logic

### Multi-Level BOM Explosion

The MRP system performs recursive BOM explosion:

```
Finished Good (1000 units)
├── Component A (2 per unit) = 2000 units
│   ├── Raw Material X (3 per unit) = 6000 units
│   └── Raw Material Y (1 per unit) = 2000 units
└── Component B (1 per unit) = 1000 units
    └── Raw Material Z (5 per unit) = 5000 units

Total Requirements:
- Component A: 2000
- Component B: 1000
- Raw Material X: 6000
- Raw Material Y: 2000
- Raw Material Z: 5000
```

### Scrap Percentage

Scrap is accounted for in calculations:

```
Required Quantity = Base Quantity × (1 + Scrap %)

Example:
- Base: 1000 units
- Scrap: 5%
- Required: 1000 × 1.05 = 1050 units
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Only released production orders can be scheduled"
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
  "error": "Permission denied: MRP.EXECUTE_MRP"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Production schedule not found"
}
```

---

## Audit Logging

All MRP and planning actions are logged:

**Logged Actions**:
- CREATE - Schedule creation
- UPDATE - Schedule modification
- DELETE - Schedule deletion
- AUTO_SCHEDULE - Auto-schedule execution
- EXECUTE_MRP - MRP run execution
- EXECUTE_MRP_FAILED - MRP run failure
- AUTO_GENERATE_PR - PR auto-generation
- GENERATE_PRS_FROM_MRP - Batch PR generation

---

## Integration Points

**Current Module Integrations**:
- **Production Orders**: Uses RELEASED orders as input
- **Master Data**: Validates items, machines, shifts
- **BOM**: Explodes BOMs for material requirements
- **Purchasing**: Auto-generates Purchase Requests
- **Auth & RBAC**: Enforces permissions
- **Audit Logs**: Records all actions

**Future Module Integrations** (Not Yet Implemented):
- **Inventory**: Will check actual stock levels for availability
- **Work Orders**: Will create work orders from schedules
- **Production Execution**: Will update schedule status

---

## Business Rules Summary

### Production Planning
1. **Released Orders Only**: Only released production orders can be scheduled
2. **Quantity Validation**: Cannot exceed remaining quantity
3. **Date Validation**: Scheduled date cannot be in the past
4. **Status Restrictions**: Only scheduled schedules can be edited/deleted
5. **Auto-Scheduling**: Distributes quantity evenly based on strategy

### MRP
1. **Planning Horizon**: Only processes orders within horizon
2. **BOM Explosion**: Multi-level recursive explosion
3. **Scrap Accounting**: Includes scrap percentage in calculations
4. **Deterministic**: Same inputs always produce same outputs
5. **Shortage Identification**: Assumes 0 available inventory (for now)
6. **PR Generation**: One PR per item, aggregates all requirements

---

## Notes

- MRP currently assumes 0 available inventory (will integrate with Inventory module later)
- Production schedules do not create work orders yet (future module)
- BOM must exist for finished goods to calculate requirements
- If no BOM exists, MRP will not generate requirements for that item
- PR generation creates PRs in DRAFT status for review
- All calculations are deterministic and reproducible

---

**End of Production Planning & MRP API Documentation**
