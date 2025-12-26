# Management Dashboards Module - API Documentation

## Overview

The Management Dashboards Module provides read-only aggregated summaries and KPIs across all ERP modules for executive decision-making. Designed for GM, VP, and President roles, these dashboards offer real-time insights into production, inventory, purchasing, accounting, and maintenance operations.

**Base URL**: `/api/dashboard`

**Authentication**: All requests require `Authorization: Bearer <token>` header

**Access Level**: Read-only (no create/update/delete operations)

---

## Dashboard Endpoints

### 1. Production Dashboard

**GET** `/api/dashboard/production`

Get production performance metrics and order status summary.

**Required Permission**: `DASHBOARD.VIEW_PRODUCTION`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "ordersByStatus": {
      "draft": 5,
      "scheduled": 20,
      "in_progress": 15,
      "completed": 100,
      "cancelled": 10
    },
    "inProgressOrders": 15,
    "delayedOrders": 3,
    "completionRate": 92.5
  }
}
```

**Metrics Explained**:
- **totalOrders**: Total production orders in the system
- **ordersByStatus**: Breakdown by order status
- **inProgressOrders**: Currently active production orders
- **delayedOrders**: Orders past their planned end date
- **completionRate**: Percentage of orders completed on time (%)

---

### 2. Inventory Dashboard

**GET** `/api/dashboard/inventory`

Get inventory stock levels, low stock alerts, and stock value summary.

**Required Permission**: `DASHBOARD.VIEW_INVENTORY`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalItems": 250,
    "stockByStatus": {
      "in_stock": 200,
      "low_stock": 30,
      "out_of_stock": 15,
      "reserved": 45
    },
    "lowStockItems": [
      {
        "itemId": 10,
        "itemCode": "RM-001",
        "itemName": "Polypropylene Resin",
        "currentStock": 50.0,
        "minStock": 100.0,
        "warehouseId": 1
      }
    ],
    "totalStockValue": 5000000.00
  }
}
```

**Metrics Explained**:
- **totalItems**: Total unique items in inventory
- **stockByStatus**: Items categorized by stock level
  - **in_stock**: Above minimum stock level
  - **low_stock**: At or below minimum stock (but not zero)
  - **out_of_stock**: Zero quantity on hand
  - **reserved**: Items with reservations
- **lowStockItems**: Top 20 items requiring reorder (sorted by urgency)
- **totalStockValue**: Total value of inventory on hand

---

### 3. Purchasing Dashboard

**GET** `/api/dashboard/purchasing`

Get purchasing activity summary, open PRs/POs, and pending approvals.

**Required Permission**: `DASHBOARD.VIEW_PURCHASING`

**Response**:
```json
{
  "success": true,
  "data": {
    "openPRs": 25,
    "openPOs": 18,
    "pendingPRApprovals": 8,
    "pendingPOApprovals": 5,
    "prsByStatus": {
      "draft": 3,
      "pending_approval": 8,
      "approved": 12,
      "rejected": 2,
      "converted_to_po": 45,
      "cancelled": 5
    },
    "posByStatus": {
      "draft": 2,
      "pending_approval": 5,
      "approved": 8,
      "sent": 10,
      "partially_received": 3,
      "received": 50,
      "closed": 40,
      "cancelled": 7
    }
  }
}
```

**Metrics Explained**:
- **openPRs**: Purchase Requests not yet converted to PO
- **openPOs**: Purchase Orders not yet closed
- **pendingPRApprovals**: PRs awaiting management approval
- **pendingPOApprovals**: POs awaiting management approval
- **prsByStatus**: Complete PR status breakdown
- **posByStatus**: Complete PO status breakdown

---

### 4. Accounting Dashboard

**GET** `/api/dashboard/accounting`

Get accounts payable summary, aging report, and overdue invoices.

**Required Permission**: `DASHBOARD.VIEW_ACCOUNTING`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalOutstandingAP": 2500000.00,
    "totalOverdueAP": 350000.00,
    "overdueInvoiceCount": 12,
    "apAgingSummary": {
      "current": 1800000.00,
      "days30": 400000.00,
      "days60": 200000.00,
      "days90Plus": 100000.00
    },
    "invoicesByStatus": {
      "pending": 5,
      "approved": 20,
      "partially_paid": 8,
      "paid": 150,
      "overdue": 12
    }
  }
}
```

**Metrics Explained**:
- **totalOutstandingAP**: Total unpaid invoice balance
- **totalOverdueAP**: Total balance of overdue invoices
- **overdueInvoiceCount**: Number of invoices past due date
- **apAgingSummary**: Outstanding AP by aging bucket
  - **current**: Due date >= today
  - **days30**: 1-30 days overdue
  - **days60**: 31-60 days overdue
  - **days90Plus**: 61+ days overdue
- **invoicesByStatus**: Invoice status breakdown

---

### 5. Maintenance Dashboard

**GET** `/api/dashboard/maintenance`

Get maintenance work order summary and machine breakdown analysis.

**Required Permission**: `DASHBOARD.VIEW_MAINTENANCE`

**Response**:
```json
{
  "success": true,
  "data": {
    "openWorkOrders": 15,
    "workOrdersByStatus": {
      "pending": 5,
      "approved": 3,
      "scheduled": 4,
      "in_progress": 3,
      "completed": 80,
      "cancelled": 10
    },
    "machinesWithFrequentBreakdowns": [
      {
        "machineId": 5,
        "machineCode": "INJ-001",
        "machineName": "Injection Molding Machine #1",
        "breakdownCount": 8,
        "lastBreakdownDate": "2024-12-20T10:00:00.000Z"
      }
    ],
    "overdueMaintenanceSchedules": 3
  }
}
```

**Metrics Explained**:
- **openWorkOrders**: Active maintenance work orders
- **workOrdersByStatus**: Work order status breakdown
- **machinesWithFrequentBreakdowns**: Top 10 machines with 3+ breakdowns in last 90 days
- **overdueMaintenanceSchedules**: Preventive maintenance schedules past due

---

### 6. Executive Summary

**GET** `/api/dashboard/executive-summary`

Get comprehensive summary across all modules in a single request.

**Required Permission**: `DASHBOARD.VIEW_EXECUTIVE_SUMMARY`

**Response**:
```json
{
  "success": true,
  "data": {
    "production": { /* Production Dashboard data */ },
    "inventory": { /* Inventory Dashboard data */ },
    "purchasing": { /* Purchasing Dashboard data */ },
    "accounting": { /* Accounting Dashboard data */ },
    "maintenance": { /* Maintenance Dashboard data */ },
    "generatedAt": "2024-12-26T20:00:00.000Z"
  }
}
```

**Use Case**: Single API call for executive overview across all operations.

---

## Business Rules

1. **Read-Only Access**:
   - All endpoints are GET requests only
   - No create, update, or delete operations
   - No approval or workflow actions

2. **Real-Time Data**:
   - All metrics calculated from current database state
   - No caching (always fresh data)
   - Aggregations performed at query time

3. **RBAC Enforcement**:
   - Each dashboard requires specific permission
   - Executive summary requires highest-level permission
   - Designed for management roles (GM, VP, President)

4. **Performance Considerations**:
   - Optimized queries with aggregations
   - Limited result sets (e.g., top 20 low stock items)
   - Parallel execution for executive summary

---

## RBAC Permissions

Dashboard permissions should be assigned to executive roles:

- `DASHBOARD.VIEW_PRODUCTION` - View production dashboard
- `DASHBOARD.VIEW_INVENTORY` - View inventory dashboard
- `DASHBOARD.VIEW_PURCHASING` - View purchasing dashboard
- `DASHBOARD.VIEW_ACCOUNTING` - View accounting dashboard
- `DASHBOARD.VIEW_MAINTENANCE` - View maintenance dashboard
- `DASHBOARD.VIEW_EXECUTIVE_SUMMARY` - View complete executive summary

**Recommended Role Assignment**:
- **President/CEO**: All dashboard permissions
- **VP Operations**: Production, Inventory, Maintenance
- **VP Finance**: Accounting, Purchasing
- **General Manager**: All dashboard permissions

---

## Data Sources

### Production Dashboard
- **Tables**: `production_orders`
- **Metrics**: Order counts, status distribution, delays, completion rate

### Inventory Dashboard
- **Tables**: `inventory_balances`, `items`
- **Metrics**: Stock levels, low stock alerts, stock value

### Purchasing Dashboard
- **Tables**: `purchase_requests`, `purchase_orders`
- **Metrics**: Open PRs/POs, pending approvals, status distribution

### Accounting Dashboard
- **Tables**: `ap_invoices`, `ap_payments`
- **Metrics**: Outstanding AP, aging buckets, overdue invoices

### Maintenance Dashboard
- **Tables**: `maintenance_work_orders`, `maintenance_schedules`, `machines`
- **Metrics**: Open work orders, frequent breakdowns, overdue schedules

---

## Use Cases

**1. Daily Executive Briefing**
```
GET /api/dashboard/executive-summary
```
Complete snapshot of all operations for morning briefing.

**2. Production Performance Review**
```
GET /api/dashboard/production
```
Monitor production efficiency and identify delays.

**3. Cash Flow Management**
```
GET /api/dashboard/accounting
```
Track AP obligations and aging for cash planning.

**4. Inventory Optimization**
```
GET /api/dashboard/inventory
```
Identify reorder needs and prevent stockouts.

**5. Maintenance Planning**
```
GET /api/dashboard/maintenance
```
Prioritize maintenance and identify problem machines.

---

## Error Responses

Standard error format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP Status Codes:
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `500`: Internal Server Error

---

## Integration Notes

1. **No Database Modifications**:
   - All queries are SELECT-only
   - No INSERT, UPDATE, or DELETE operations
   - Safe for concurrent access

2. **Module Dependencies**:
   - Requires all module tables to exist
   - Gracefully handles empty tables (returns zeros)
   - No cross-module data modifications

3. **Audit Logging**:
   - Dashboard access not logged (read-only)
   - No sensitive data modifications
   - Suitable for frequent polling

4. **Future Enhancements** (Not Implemented):
   - Date range filters
   - Export to PDF/Excel
   - Scheduled email reports
   - Real-time notifications
   - Trend analysis over time

---

## Sample Workflow

**Executive Morning Routine**:
1. Login to system
2. Call `/api/dashboard/executive-summary`
3. Review all KPIs in single view
4. Drill down to specific dashboards as needed
5. Identify areas requiring attention

**Department Manager Review**:
1. Login to system
2. Call specific dashboard (e.g., `/api/dashboard/production`)
3. Review department-specific metrics
4. Take action on identified issues via respective module APIs

---

## Performance Characteristics

- **Response Time**: < 2 seconds for individual dashboards
- **Executive Summary**: < 5 seconds (parallel execution)
- **Concurrent Users**: Supports multiple simultaneous requests
- **Data Freshness**: Real-time (no caching)

---

## Security Considerations

1. **Permission-Based Access**: Each dashboard requires explicit permission
2. **No Data Leakage**: Only aggregated summaries, no detailed records
3. **Read-Only**: Cannot modify any data through dashboard APIs
4. **Audit Trail**: Access logged via standard authentication logs
