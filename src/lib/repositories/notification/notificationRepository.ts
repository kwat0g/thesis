import { getConnection } from '../../database/connection';
import {
  Notification,
  NotificationRecipient,
  UserNotification,
  NotificationSummary,
  NotificationType,
  NotificationPriority,
  ReferenceType,
} from '../../types/notification';

const mapRowToNotification = (row: any): Notification => ({
  id: row.id,
  notificationType: row.notification_type as NotificationType,
  title: row.title,
  message: row.message,
  priority: row.priority as NotificationPriority,
  referenceType: row.reference_type as ReferenceType | undefined,
  referenceId: row.reference_id,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.created_at),
});

const mapRowToUserNotification = (row: any): UserNotification => ({
  id: row.id,
  notificationType: row.notification_type as NotificationType,
  title: row.title,
  message: row.message,
  priority: row.priority as NotificationPriority,
  referenceType: row.reference_type as ReferenceType | undefined,
  referenceId: row.reference_id,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.created_at),
  recipientId: row.recipient_id,
  isRead: Boolean(row.is_read),
  readAt: row.read_at ? new Date(row.read_at) : undefined,
});

export const create = async (data: {
  notificationType: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  referenceType?: ReferenceType;
  referenceId?: number;
}): Promise<number> => {
  const connection = await getConnection();
  const [result] = await connection.query<any>(
    `INSERT INTO notifications (
      notification_type, title, message, priority, reference_type, reference_id
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.notificationType,
      data.title,
      data.message,
      data.priority || 'normal',
      data.referenceType || null,
      data.referenceId || null,
    ]
  );
  return result.insertId;
};

export const addRecipient = async (
  notificationId: number,
  userId: number
): Promise<number> => {
  const connection = await getConnection();
  const [result] = await connection.query<any>(
    `INSERT INTO notification_recipients (notification_id, user_id)
    VALUES (?, ?)`,
    [notificationId, userId]
  );
  return result.insertId;
};

export const addRecipients = async (
  notificationId: number,
  userIds: number[]
): Promise<void> => {
  if (userIds.length === 0) return;

  const connection = await getConnection();
  const values = userIds.map((userId) => [notificationId, userId]);
  await connection.query(
    `INSERT INTO notification_recipients (notification_id, user_id)
    VALUES ?`,
    [values]
  );
};

export const findById = async (id: number): Promise<Notification | null> => {
  const connection = await getConnection();
  const [rows] = await connection.query<any[]>(
    `SELECT * FROM notifications WHERE id = ?`,
    [id]
  );
  return rows.length > 0 ? mapRowToNotification(rows[0]) : null;
};

export const findByUserId = async (
  userId: number,
  filters?: {
    isRead?: boolean;
    notificationType?: NotificationType;
    priority?: NotificationPriority;
    limit?: number;
    offset?: number;
  }
): Promise<{ notifications: UserNotification[]; total: number }> => {
  const connection = await getConnection();

  let whereConditions = ['nr.user_id = ?'];
  const params: any[] = [userId];

  if (filters?.isRead !== undefined) {
    whereConditions.push('nr.is_read = ?');
    params.push(filters.isRead);
  }

  if (filters?.notificationType) {
    whereConditions.push('n.notification_type = ?');
    params.push(filters.notificationType);
  }

  if (filters?.priority) {
    whereConditions.push('n.priority = ?');
    params.push(filters.priority);
  }

  const whereClause = whereConditions.join(' AND ');

  const [countRows] = await connection.query<any[]>(
    `SELECT COUNT(*) as total
    FROM notifications n
    JOIN notification_recipients nr ON n.id = nr.notification_id
    WHERE ${whereClause}`,
    params
  );

  const [rows] = await connection.query<any[]>(
    `SELECT 
      n.*,
      nr.id as recipient_id,
      nr.is_read,
      nr.read_at
    FROM notifications n
    JOIN notification_recipients nr ON n.id = nr.notification_id
    WHERE ${whereClause}
    ORDER BY n.created_at DESC
    LIMIT ? OFFSET ?`,
    [...params, filters?.limit || 50, filters?.offset || 0]
  );

  return {
    notifications: rows.map(mapRowToUserNotification),
    total: countRows[0].total,
  };
};

export const markAsRead = async (
  notificationId: number,
  userId: number
): Promise<boolean> => {
  const connection = await getConnection();
  const [result] = await connection.query<any>(
    `UPDATE notification_recipients
    SET is_read = TRUE, read_at = NOW()
    WHERE notification_id = ? AND user_id = ? AND is_read = FALSE`,
    [notificationId, userId]
  );
  return result.affectedRows > 0;
};

export const markAllAsRead = async (userId: number): Promise<number> => {
  const connection = await getConnection();
  const [result] = await connection.query<any>(
    `UPDATE notification_recipients
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = ? AND is_read = FALSE`,
    [userId]
  );
  return result.affectedRows;
};

export const getUnreadCount = async (userId: number): Promise<number> => {
  const connection = await getConnection();
  const [rows] = await connection.query<any[]>(
    `SELECT COUNT(*) as count
    FROM notification_recipients
    WHERE user_id = ? AND is_read = FALSE`,
    [userId]
  );
  return rows[0].count;
};

export const getSummary = async (userId: number): Promise<NotificationSummary> => {
  const connection = await getConnection();

  const [totalRows] = await connection.query<any[]>(
    `SELECT COUNT(*) as total
    FROM notification_recipients
    WHERE user_id = ?`,
    [userId]
  );

  const [unreadRows] = await connection.query<any[]>(
    `SELECT COUNT(*) as unread
    FROM notification_recipients
    WHERE user_id = ? AND is_read = FALSE`,
    [userId]
  );

  const [typeRows] = await connection.query<any[]>(
    `SELECT 
      n.notification_type,
      COUNT(*) as count
    FROM notifications n
    JOIN notification_recipients nr ON n.id = nr.notification_id
    WHERE nr.user_id = ?
    GROUP BY n.notification_type`,
    [userId]
  );

  const [priorityRows] = await connection.query<any[]>(
    `SELECT 
      n.priority,
      COUNT(*) as count
    FROM notifications n
    JOIN notification_recipients nr ON n.id = nr.notification_id
    WHERE nr.user_id = ?
    GROUP BY n.priority`,
    [userId]
  );

  const byType: any = {
    APPROVAL_REQUIRED: 0,
    LOW_STOCK_ALERT: 0,
    OVERDUE_INVOICE: 0,
    PRODUCTION_DELAY: 0,
    OVERDUE_MAINTENANCE: 0,
  };

  typeRows.forEach((row: any) => {
    byType[row.notification_type] = row.count;
  });

  const byPriority: any = {
    low: 0,
    normal: 0,
    high: 0,
    urgent: 0,
  };

  priorityRows.forEach((row: any) => {
    byPriority[row.priority] = row.count;
  });

  return {
    totalNotifications: totalRows[0].total,
    unreadCount: unreadRows[0].unread,
    byType,
    byPriority,
  };
};

export const deleteById = async (id: number): Promise<boolean> => {
  const connection = await getConnection();
  const [result] = await connection.query<any>(
    `DELETE FROM notifications WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
};

export const findByReference = async (
  referenceType: ReferenceType,
  referenceId: number
): Promise<Notification[]> => {
  const connection = await getConnection();
  const [rows] = await connection.query<any[]>(
    `SELECT * FROM notifications
    WHERE reference_type = ? AND reference_id = ?
    ORDER BY created_at DESC`,
    [referenceType, referenceId]
  );
  return rows.map(mapRowToNotification);
};
