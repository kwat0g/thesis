# Notifications & Alerts Module - API Documentation

## Overview

The Notifications & Alerts Module provides system-wide notifications triggered by business events across all ERP modules. It tracks read/unread status, supports filtering by type and priority, and ensures users only see relevant notifications based on their roles and permissions.

**Base URL**: `/api/notifications`

**Authentication**: All requests require `Authorization: Bearer <token>` header

---

## Notification Types

The system supports the following notification types:

1. **APPROVAL_REQUIRED** - Pending approvals for PRs, POs, production orders, payroll
2. **LOW_STOCK_ALERT** - Items at or below minimum stock level
3. **OVERDUE_INVOICE** - AP invoices past their due date
4. **PRODUCTION_DELAY** - Production orders past planned end date
5. **OVERDUE_MAINTENANCE** - Maintenance schedules past due date

---

## Notification Priority Levels

- **low** - Informational notifications
- **normal** - Standard notifications (default)
- **high** - Important notifications requiring attention
- **urgent** - Critical notifications requiring immediate action

---

## API Endpoints

### 1. Get User Notifications (List)

**GET** `/api/notifications`

Get paginated list of notifications for the authenticated user.

**Required Permission**: `NOTIF.VIEW`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `isRead` (optional): Filter by read status (true/false)
- `notificationType` (optional): Filter by type (APPROVAL_REQUIRED, LOW_STOCK_ALERT, etc.)
- `priority` (optional): Filter by priority (low, normal, high, urgent)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "notificationType": "APPROVAL_REQUIRED",
      "title": "Purchase Request Approval Required",
      "message": "Purchase Request PR-20241226-1430 is pending your approval.",
      "priority": "normal",
      "referenceType": "purchase_request",
      "referenceId": 25,
      "createdAt": "2024-12-26T14:30:00.000Z",
      "updatedAt": "2024-12-26T14:30:00.000Z",
      "recipientId": 5,
      "isRead": false,
      "readAt": null
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### 2. Get Unread Count

**GET** `/api/notifications/unread-count`

Get count of unread notifications for the authenticated user.

**Required Permission**: `NOTIF.VIEW`

**Response**:
```json
{
  "success": true,
  "data": {
    "unreadCount": 12
  }
}
```

**Use Case**: Display notification badge count in UI.

### 3. Get Notification Summary

**GET** `/api/notifications/summary`

Get comprehensive notification summary with breakdown by type and priority.

**Required Permission**: `NOTIF.VIEW`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalNotifications": 45,
    "unreadCount": 12,
    "byType": {
      "APPROVAL_REQUIRED": 8,
      "LOW_STOCK_ALERT": 15,
      "OVERDUE_INVOICE": 5,
      "PRODUCTION_DELAY": 3,
      "OVERDUE_MAINTENANCE": 2
    },
    "byPriority": {
      "low": 5,
      "normal": 20,
      "high": 15,
      "urgent": 5
    }
  }
}
```

### 4. Mark Notification as Read

**POST** `/api/notifications/:id/read`

Mark a specific notification as read for the authenticated user.

**Required Permission**: `NOTIF.MARK_READ`

**Response**:
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

**Business Rules**:
- Only marks as read for the authenticated user
- Already read notifications return 404
- Sets `readAt` timestamp

### 5. Mark All Notifications as Read

**POST** `/api/notifications/mark-all-read`

Mark all unread notifications as read for the authenticated user.

**Required Permission**: `NOTIF.MARK_READ`

**Response**:
```json
{
  "success": true,
  "data": {
    "markedCount": 12
  },
  "message": "12 notification(s) marked as read"
}
```

### 6. Check and Trigger Alerts

**POST** `/api/notifications/check-alerts`

Manually trigger alert checks for low stock, overdue invoices, production delays, and overdue maintenance.

**Required Permission**: `NOTIF.TRIGGER_ALERTS`

**Response**:
```json
{
  "success": true,
  "data": {
    "lowStockAlerts": 5,
    "overdueInvoiceAlerts": 3,
    "productionDelayAlerts": 2,
    "overdueMaintenanceAlerts": 1,
    "totalAlerts": 11
  },
  "message": "Alert check completed"
}
```

**Use Case**: 
- Scheduled cron job to check for alerts
- Manual trigger by system administrators
- Batch processing of system-wide alerts

**Note**: This endpoint prevents duplicate notifications within 24 hours for the same reference.

---

## Notification Triggers

Notifications are automatically created by service-level triggers when specific business events occur:

### 1. Pending Approval Notifications

**Trigger**: When a record is submitted for approval

**Purchase Request Approval**:
- **Event**: PR status changes to `pending_approval`
- **Recipients**: Users with `PURCH.APPROVE_PR` permission
- **Priority**: Normal
- **Reference**: `purchase_request` + PR ID

**Purchase Order Approval**:
- **Event**: PO status changes to `pending_approval`
- **Recipients**: Users with `PURCH.APPROVE_PO` permission
- **Priority**: Normal
- **Reference**: `purchase_order` + PO ID

**Production Order Approval**:
- **Event**: Production order created or submitted
- **Recipients**: Users with `PROD.APPROVE_ORDER` permission
- **Priority**: Normal
- **Reference**: `production_order` + Order ID

**Payroll Approval**:
- **Event**: Payroll period status changes to `calculated`
- **Recipients**: Users with `HR.APPROVE_PAYROLL` permission
- **Priority**: High
- **Reference**: `payroll_period` + Period ID

### 2. Low Stock Alerts

**Trigger**: Inventory balance at or below minimum stock level

**Event**: `quantity_on_hand <= min_stock`
- **Recipients**: Users with `INV.VIEW_STOCK` or `PURCH.CREATE_PR` permission
- **Priority**: High
- **Reference**: `inventory_item` + Item ID
- **Deduplication**: No duplicate alerts within 24 hours for same item

### 3. Overdue Invoice Alerts

**Trigger**: AP invoice past due date

**Event**: `due_date < CURDATE()` and status is `approved`, `partially_paid`, or `overdue`
- **Recipients**: Users with `AP.VIEW_INVOICES` or `AP.CREATE_PAYMENT` permission
- **Priority**: Urgent
- **Reference**: `ap_invoice` + Invoice ID
- **Deduplication**: No duplicate alerts within 24 hours for same invoice

### 4. Production Delay Alerts

**Trigger**: Production order past planned end date

**Event**: `planned_end_date < NOW()` and status is `scheduled` or `in_progress`
- **Recipients**: Users with `PROD.VIEW_ORDERS` or `PROD.UPDATE_ORDER` permission
- **Priority**: High
- **Reference**: `production_order` + Order ID
- **Deduplication**: No duplicate alerts within 24 hours for same order

### 5. Overdue Maintenance Alerts

**Trigger**: Maintenance schedule past due date

**Event**: `next_maintenance_date < CURDATE()` and `is_active = 1`
- **Recipients**: Users with `MAINT.VIEW_SCHEDULES` or `MAINT.CREATE_WORK_ORDER` permission
- **Priority**: Urgent
- **Reference**: `maintenance_schedule` + Schedule ID
- **Deduplication**: No duplicate alerts within 24 hours for same schedule

---

## Integration with Business Modules

### How to Trigger Notifications from Services

Import the notification triggers in your service files:

```typescript
import * as notificationTriggers from '@/lib/services/notification/notificationTriggers';
```

**Example: Trigger PR Approval Notification**
```typescript
// In purchaseRequestService.ts
export const submitForApproval = async (prId: number, userId: number) => {
  // Update PR status to pending_approval
  await prRepo.updateStatus(prId, 'pending_approval');
  
  // Trigger notification
  await notificationTriggers.notifyPendingPRApproval(prId, userId);
  
  return true;
};
```

**Example: Trigger Low Stock Alert**
```typescript
// In inventoryService.ts
export const recordTransaction = async (data: any) => {
  // Process transaction
  const transactionId = await invRepo.createTransaction(data);
  
  // Check if stock is low after transaction
  const balance = await invRepo.getBalance(data.itemId, data.warehouseId);
  const item = await itemRepo.findById(data.itemId);
  
  if (balance.quantityOnHand <= item.minStock) {
    await notificationTriggers.notifyLowStockAlert(data.itemId, data.warehouseId);
  }
  
  return transactionId;
};
```

---

## Business Rules

1. **User-Specific Notifications**:
   - Users only see notifications sent to them
   - Recipients determined by role permissions
   - No cross-user notification access

2. **Read Tracking**:
   - Each user tracks their own read status
   - Same notification can be unread for some, read for others
   - `readAt` timestamp recorded when marked as read

3. **Deduplication**:
   - Alert-type notifications (low stock, overdue, delays) prevent duplicates within 24 hours
   - Approval notifications can have duplicates (different approval stages)
   - Based on `referenceType` + `referenceId` combination

4. **Automatic Recipients**:
   - Recipients auto-selected based on required permissions
   - Excludes the user who triggered the action (e.g., PR creator excluded from PR approval notification)
   - Active users only

5. **No Retroactive Notifications**:
   - Dashboard queries do NOT create notifications
   - Only explicit business actions trigger notifications
   - Prevents notification spam

6. **Audit Logging**:
   - Notification creation logged
   - Mark as read actions logged
   - Bulk mark as read logged

---

## RBAC Permissions

- `NOTIF.VIEW` - View own notifications
- `NOTIF.MARK_READ` - Mark notifications as read
- `NOTIF.TRIGGER_ALERTS` - Manually trigger alert checks (admin only)

**Recommended Role Assignment**:
- **All Users**: `NOTIF.VIEW`, `NOTIF.MARK_READ`
- **System Administrator**: `NOTIF.TRIGGER_ALERTS`

---

## Reference Types

Notifications can reference the following entity types:

- `purchase_request` - Links to PR record
- `purchase_order` - Links to PO record
- `production_order` - Links to production order record
- `payroll_period` - Links to payroll period record
- `inventory_item` - Links to item record
- `ap_invoice` - Links to AP invoice record
- `maintenance_schedule` - Links to maintenance schedule record

**Use Case**: Frontend can use `referenceType` and `referenceId` to create deep links to the relevant record.

---

## Scheduled Alert Checks

For production deployment, set up a scheduled job (cron) to periodically check for alerts:

**Recommended Schedule**:
```bash
# Check alerts every hour
0 * * * * curl -X POST https://your-api.com/api/notifications/check-alerts \
  -H "Authorization: Bearer <admin-token>"
```

**Alternative**: Use a task scheduler like node-cron within the application:
```typescript
import cron from 'node-cron';
import * as notificationTriggers from '@/lib/services/notification/notificationTriggers';

// Run every hour
cron.schedule('0 * * * *', async () => {
  await notificationTriggers.checkAndNotifyLowStock();
  await notificationTriggers.checkAndNotifyOverdueInvoices();
  await notificationTriggers.checkAndNotifyProductionDelays();
  await notificationTriggers.checkAndNotifyOverdueMaintenance();
});
```

---

## Use Cases

**1. User Notification Center**
```
GET /api/notifications?isRead=false&page=1&pageSize=10
```
Display unread notifications in user's notification center.

**2. Notification Badge**
```
GET /api/notifications/unread-count
```
Show unread count in navigation bar badge.

**3. Approval Workflow**
```
GET /api/notifications?notificationType=APPROVAL_REQUIRED&isRead=false
```
List all pending approvals for the user.

**4. Critical Alerts Dashboard**
```
GET /api/notifications?priority=urgent&isRead=false
```
Display urgent notifications requiring immediate attention.

**5. Mark Notification as Read on Click**
```
POST /api/notifications/123/read
```
Mark notification as read when user clicks to view details.

**6. Clear All Notifications**
```
POST /api/notifications/mark-all-read
```
Mark all notifications as read (inbox zero).

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
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (notification not found or already read)
- `500`: Internal Server Error

---

## Performance Considerations

1. **Pagination**: Always use pagination for notification lists
2. **Indexing**: Database indexes on `user_id`, `is_read`, `notification_type`, `created_at`
3. **Deduplication**: 24-hour window prevents notification spam
4. **Batch Processing**: Alert checks process multiple records efficiently
5. **Async Operations**: Notification creation doesn't block main business logic

---

## Security Considerations

1. **User Isolation**: Users can only access their own notifications
2. **Permission-Based Recipients**: Recipients auto-selected based on RBAC
3. **No Data Leakage**: Notifications only contain summary information
4. **Audit Trail**: All notification actions logged
5. **Reference Validation**: Reference IDs validated before notification creation

---

## Future Enhancements (Not Implemented)

- Email notifications
- SMS notifications
- Push notifications (mobile/web)
- Notification preferences per user
- Notification templates
- Scheduled digest emails
- Notification history archive
- Custom notification rules

---

## Database Schema

**notifications table**:
- `id` - Primary key
- `notification_type` - Type of notification
- `title` - Notification title
- `message` - Notification message
- `priority` - Priority level
- `reference_type` - Type of referenced entity
- `reference_id` - ID of referenced entity
- `created_at` - Creation timestamp

**notification_recipients table**:
- `id` - Primary key
- `notification_id` - Foreign key to notifications
- `user_id` - Foreign key to users
- `is_read` - Read status flag
- `read_at` - Read timestamp
- `created_at` - Creation timestamp

**Cascade Delete**: Deleting a notification deletes all recipient records.

---

## Sample Workflow

**Purchase Request Approval Workflow**:

1. User creates PR → Status: `draft`
2. User submits PR for approval → Status: `pending_approval`
3. **Trigger**: `notifyPendingPRApproval(prId, userId)` called
4. System finds all users with `PURCH.APPROVE_PR` permission
5. Notification created with reference to PR
6. Notification recipients created for each approver
7. Approvers see notification in their notification center
8. Approver clicks notification → Marked as read
9. Approver approves PR → Notification remains (historical record)

**Low Stock Alert Workflow**:

1. Inventory transaction reduces stock below minimum
2. **Trigger**: `notifyLowStockAlert(itemId, warehouseId)` called
3. System checks for existing notification within 24 hours (deduplication)
4. If no recent notification, creates new alert
5. System finds all users with `INV.VIEW_STOCK` or `PURCH.CREATE_PR` permission
6. Notification created with reference to item
7. Notification recipients created for each relevant user
8. Users see urgent notification
9. User creates PR to reorder → Stock replenished
10. Notification remains as historical record
