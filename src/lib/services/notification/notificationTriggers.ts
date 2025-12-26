import * as notificationRepo from '../../repositories/notification/notificationRepository';
import { getConnection } from '../../database/connection';

export const notifyPendingPRApproval = async (
  prId: number,
  requestorId: number
): Promise<void> => {
  const connection = await getConnection();

  const [approvers] = await connection.query<any[]>(
    `SELECT DISTINCT u.id
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE p.permission_code = 'PURCH.APPROVE_PR'
    AND u.is_active = 1
    AND u.id != ?`,
    [requestorId]
  );

  if (approvers.length === 0) return;

  const [prData] = await connection.query<any[]>(
    `SELECT pr_number FROM purchase_requests WHERE id = ?`,
    [prId]
  );

  if (prData.length === 0) return;

  const notificationId = await notificationRepo.create({
    notificationType: 'APPROVAL_REQUIRED',
    title: 'Purchase Request Approval Required',
    message: `Purchase Request ${prData[0].pr_number} is pending your approval.`,
    priority: 'normal',
    referenceType: 'purchase_request',
    referenceId: prId,
  });

  const approverIds = approvers.map((a: any) => a.id);
  await notificationRepo.addRecipients(notificationId, approverIds);
};

export const notifyPendingPOApproval = async (
  poId: number,
  createdBy: number
): Promise<void> => {
  const connection = await getConnection();

  const [approvers] = await connection.query<any[]>(
    `SELECT DISTINCT u.id
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE p.permission_code = 'PURCH.APPROVE_PO'
    AND u.is_active = 1
    AND u.id != ?`,
    [createdBy]
  );

  if (approvers.length === 0) return;

  const [poData] = await connection.query<any[]>(
    `SELECT po_number FROM purchase_orders WHERE id = ?`,
    [poId]
  );

  if (poData.length === 0) return;

  const notificationId = await notificationRepo.create({
    notificationType: 'APPROVAL_REQUIRED',
    title: 'Purchase Order Approval Required',
    message: `Purchase Order ${poData[0].po_number} is pending your approval.`,
    priority: 'normal',
    referenceType: 'purchase_order',
    referenceId: poId,
  });

  const approverIds = approvers.map((a: any) => a.id);
  await notificationRepo.addRecipients(notificationId, approverIds);
};

export const notifyPendingProductionOrderApproval = async (
  orderId: number,
  createdBy: number
): Promise<void> => {
  const connection = await getConnection();

  const [approvers] = await connection.query<any[]>(
    `SELECT DISTINCT u.id
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE p.permission_code IN ('PROD.APPROVE_ORDER', 'PROD.UPDATE_ORDER')
    AND u.is_active = 1
    AND u.id != ?`,
    [createdBy]
  );

  if (approvers.length === 0) return;

  const [orderData] = await connection.query<any[]>(
    `SELECT order_number FROM production_orders WHERE id = ?`,
    [orderId]
  );

  if (orderData.length === 0) return;

  const notificationId = await notificationRepo.create({
    notificationType: 'APPROVAL_REQUIRED',
    title: 'Production Order Approval Required',
    message: `Production Order ${orderData[0].order_number} is pending approval.`,
    priority: 'normal',
    referenceType: 'production_order',
    referenceId: orderId,
  });

  const approverIds = approvers.map((a: any) => a.id);
  await notificationRepo.addRecipients(notificationId, approverIds);
};

export const notifyPendingPayrollApproval = async (
  periodId: number,
  preparedBy: number
): Promise<void> => {
  const connection = await getConnection();

  const [approvers] = await connection.query<any[]>(
    `SELECT DISTINCT u.id
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE p.permission_code = 'HR.APPROVE_PAYROLL'
    AND u.is_active = 1
    AND u.id != ?`,
    [preparedBy]
  );

  if (approvers.length === 0) return;

  const [periodData] = await connection.query<any[]>(
    `SELECT period_code FROM payroll_periods WHERE id = ?`,
    [periodId]
  );

  if (periodData.length === 0) return;

  const notificationId = await notificationRepo.create({
    notificationType: 'APPROVAL_REQUIRED',
    title: 'Payroll Approval Required',
    message: `Payroll period ${periodData[0].period_code} is ready for review and approval.`,
    priority: 'high',
    referenceType: 'payroll_period',
    referenceId: periodId,
  });

  const approverIds = approvers.map((a: any) => a.id);
  await notificationRepo.addRecipients(notificationId, approverIds);
};

export const notifyLowStockAlert = async (
  itemId: number,
  warehouseId: number
): Promise<void> => {
  const connection = await getConnection();

  const [recipients] = await connection.query<any[]>(
    `SELECT DISTINCT u.id
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE p.permission_code IN ('INV.VIEW_STOCK', 'PURCH.CREATE_PR')
    AND u.is_active = 1`
  );

  if (recipients.length === 0) return;

  const [itemData] = await connection.query<any[]>(
    `SELECT 
      i.item_code,
      i.item_name,
      ib.quantity_on_hand,
      i.min_stock
    FROM items i
    JOIN inventory_balances ib ON i.id = ib.item_id
    WHERE i.id = ? AND ib.warehouse_id = ?`,
    [itemId, warehouseId]
  );

  if (itemData.length === 0) return;

  const item = itemData[0];

  const existingNotifications = await notificationRepo.findByReference(
    'inventory_item',
    itemId
  );

  const recentNotification = existingNotifications.find((n) => {
    const hoursSinceCreated = (Date.now() - n.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreated < 24;
  });

  if (recentNotification) return;

  const notificationId = await notificationRepo.create({
    notificationType: 'LOW_STOCK_ALERT',
    title: 'Low Stock Alert',
    message: `Item ${item.item_code} - ${item.item_name} is low on stock. Current: ${item.quantity_on_hand}, Minimum: ${item.min_stock}`,
    priority: 'high',
    referenceType: 'inventory_item',
    referenceId: itemId,
  });

  const recipientIds = recipients.map((r: any) => r.id);
  await notificationRepo.addRecipients(notificationId, recipientIds);
};

export const notifyOverdueAPInvoice = async (invoiceId: number): Promise<void> => {
  const connection = await getConnection();

  const [recipients] = await connection.query<any[]>(
    `SELECT DISTINCT u.id
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE p.permission_code IN ('AP.VIEW_INVOICES', 'AP.CREATE_PAYMENT')
    AND u.is_active = 1`
  );

  if (recipients.length === 0) return;

  const [invoiceData] = await connection.query<any[]>(
    `SELECT 
      invoice_number,
      balance,
      due_date,
      DATEDIFF(CURDATE(), due_date) as days_overdue
    FROM ap_invoices
    WHERE id = ?`,
    [invoiceId]
  );

  if (invoiceData.length === 0) return;

  const invoice = invoiceData[0];

  const existingNotifications = await notificationRepo.findByReference(
    'ap_invoice',
    invoiceId
  );

  const recentNotification = existingNotifications.find((n) => {
    const hoursSinceCreated = (Date.now() - n.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreated < 24;
  });

  if (recentNotification) return;

  const notificationId = await notificationRepo.create({
    notificationType: 'OVERDUE_INVOICE',
    title: 'Overdue AP Invoice',
    message: `Invoice ${invoice.invoice_number} is ${invoice.days_overdue} days overdue. Outstanding balance: ${invoice.balance}`,
    priority: 'urgent',
    referenceType: 'ap_invoice',
    referenceId: invoiceId,
  });

  const recipientIds = recipients.map((r: any) => r.id);
  await notificationRepo.addRecipients(notificationId, recipientIds);
};

export const notifyProductionDelay = async (orderId: number): Promise<void> => {
  const connection = await getConnection();

  const [recipients] = await connection.query<any[]>(
    `SELECT DISTINCT u.id
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE p.permission_code IN ('PROD.VIEW_ORDERS', 'PROD.UPDATE_ORDER')
    AND u.is_active = 1`
  );

  if (recipients.length === 0) return;

  const [orderData] = await connection.query<any[]>(
    `SELECT 
      order_number,
      planned_end_date,
      DATEDIFF(NOW(), planned_end_date) as days_delayed
    FROM production_orders
    WHERE id = ?`,
    [orderId]
  );

  if (orderData.length === 0) return;

  const order = orderData[0];

  const existingNotifications = await notificationRepo.findByReference(
    'production_order',
    orderId
  );

  const recentNotification = existingNotifications.find((n) => {
    const hoursSinceCreated = (Date.now() - n.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreated < 24 && n.notificationType === 'PRODUCTION_DELAY';
  });

  if (recentNotification) return;

  const notificationId = await notificationRepo.create({
    notificationType: 'PRODUCTION_DELAY',
    title: 'Production Order Delayed',
    message: `Production Order ${order.order_number} is ${order.days_delayed} days past planned end date.`,
    priority: 'high',
    referenceType: 'production_order',
    referenceId: orderId,
  });

  const recipientIds = recipients.map((r: any) => r.id);
  await notificationRepo.addRecipients(notificationId, recipientIds);
};

export const notifyOverdueMaintenance = async (scheduleId: number): Promise<void> => {
  const connection = await getConnection();

  const [recipients] = await connection.query<any[]>(
    `SELECT DISTINCT u.id
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE p.permission_code IN ('MAINT.VIEW_SCHEDULES', 'MAINT.CREATE_WORK_ORDER')
    AND u.is_active = 1`
  );

  if (recipients.length === 0) return;

  const [scheduleData] = await connection.query<any[]>(
    `SELECT 
      ms.schedule_code,
      m.machine_code,
      m.machine_name,
      ms.next_maintenance_date,
      DATEDIFF(CURDATE(), ms.next_maintenance_date) as days_overdue
    FROM maintenance_schedules ms
    JOIN machines m ON ms.machine_id = m.id
    WHERE ms.id = ?`,
    [scheduleId]
  );

  if (scheduleData.length === 0) return;

  const schedule = scheduleData[0];

  const existingNotifications = await notificationRepo.findByReference(
    'maintenance_schedule',
    scheduleId
  );

  const recentNotification = existingNotifications.find((n) => {
    const hoursSinceCreated = (Date.now() - n.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreated < 24;
  });

  if (recentNotification) return;

  const notificationId = await notificationRepo.create({
    notificationType: 'OVERDUE_MAINTENANCE',
    title: 'Overdue Maintenance Schedule',
    message: `Maintenance for ${schedule.machine_code} - ${schedule.machine_name} is ${schedule.days_overdue} days overdue.`,
    priority: 'urgent',
    referenceType: 'maintenance_schedule',
    referenceId: scheduleId,
  });

  const recipientIds = recipients.map((r: any) => r.id);
  await notificationRepo.addRecipients(notificationId, recipientIds);
};

export const checkAndNotifyLowStock = async (): Promise<number> => {
  const connection = await getConnection();

  const [lowStockItems] = await connection.query<any[]>(
    `SELECT 
      i.id as item_id,
      ib.warehouse_id
    FROM inventory_balances ib
    JOIN items i ON ib.item_id = i.id
    WHERE ib.quantity_on_hand <= i.min_stock
    AND ib.quantity_on_hand > 0`
  );

  let notificationCount = 0;

  for (const item of lowStockItems) {
    try {
      await notifyLowStockAlert(item.item_id, item.warehouse_id);
      notificationCount++;
    } catch (error) {
      console.error(`Failed to notify low stock for item ${item.item_id}:`, error);
    }
  }

  return notificationCount;
};

export const checkAndNotifyOverdueInvoices = async (): Promise<number> => {
  const connection = await getConnection();

  const [overdueInvoices] = await connection.query<any[]>(
    `SELECT id
    FROM ap_invoices
    WHERE due_date < CURDATE()
    AND status IN ('approved', 'partially_paid', 'overdue')`
  );

  let notificationCount = 0;

  for (const invoice of overdueInvoices) {
    try {
      await notifyOverdueAPInvoice(invoice.id);
      notificationCount++;
    } catch (error) {
      console.error(`Failed to notify overdue invoice ${invoice.id}:`, error);
    }
  }

  return notificationCount;
};

export const checkAndNotifyProductionDelays = async (): Promise<number> => {
  const connection = await getConnection();

  const [delayedOrders] = await connection.query<any[]>(
    `SELECT id
    FROM production_orders
    WHERE status IN ('scheduled', 'in_progress')
    AND planned_end_date < NOW()`
  );

  let notificationCount = 0;

  for (const order of delayedOrders) {
    try {
      await notifyProductionDelay(order.id);
      notificationCount++;
    } catch (error) {
      console.error(`Failed to notify production delay ${order.id}:`, error);
    }
  }

  return notificationCount;
};

export const checkAndNotifyOverdueMaintenance = async (): Promise<number> => {
  const connection = await getConnection();

  const [overdueSchedules] = await connection.query<any[]>(
    `SELECT id
    FROM maintenance_schedules
    WHERE is_active = 1
    AND next_maintenance_date < CURDATE()`
  );

  let notificationCount = 0;

  for (const schedule of overdueSchedules) {
    try {
      await notifyOverdueMaintenance(schedule.id);
      notificationCount++;
    } catch (error) {
      console.error(`Failed to notify overdue maintenance ${schedule.id}:`, error);
    }
  }

  return notificationCount;
};
