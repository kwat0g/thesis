import * as notificationRepo from '../../repositories/notification/notificationRepository';
import * as auditLogRepo from '../../repositories/auth/auditLogRepository';
import {
  CreateNotificationData,
  UserNotification,
  NotificationSummary,
  NotificationType,
  NotificationPriority,
  ReferenceType,
} from '../../types/notification';

export const createNotification = async (
  data: CreateNotificationData,
  createdBy?: number
): Promise<number> => {
  if (!data.recipientUserIds || data.recipientUserIds.length === 0) {
    throw new Error('At least one recipient is required');
  }

  const notificationId = await notificationRepo.create({
    notificationType: data.notificationType,
    title: data.title,
    message: data.message,
    priority: data.priority || 'normal',
    referenceType: data.referenceType,
    referenceId: data.referenceId,
  });

  await notificationRepo.addRecipients(notificationId, data.recipientUserIds);

  if (createdBy) {
    await auditLogRepo.create({
      userId: createdBy,
      action: 'CREATE',
      module: 'NOTIFICATION',
      recordType: 'notification',
      recordId: notificationId,
      newValues: {
        type: data.notificationType,
        recipients: data.recipientUserIds.length,
      },
    });
  }

  return notificationId;
};

export const getUserNotifications = async (
  userId: number,
  filters?: {
    isRead?: boolean;
    notificationType?: NotificationType;
    priority?: NotificationPriority;
    page?: number;
    pageSize?: number;
  }
): Promise<{ notifications: UserNotification[]; total: number; page: number; pageSize: number }> => {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  const result = await notificationRepo.findByUserId(userId, {
    isRead: filters?.isRead,
    notificationType: filters?.notificationType,
    priority: filters?.priority,
    limit: pageSize,
    offset,
  });

  return {
    notifications: result.notifications,
    total: result.total,
    page,
    pageSize,
  };
};

export const markAsRead = async (
  notificationId: number,
  userId: number
): Promise<boolean> => {
  const updated = await notificationRepo.markAsRead(notificationId, userId);

  if (updated) {
    await auditLogRepo.create({
      userId,
      action: 'UPDATE',
      module: 'NOTIFICATION',
      recordType: 'notification_recipient',
      recordId: notificationId,
      newValues: { is_read: true },
    });
  }

  return updated;
};

export const markAllAsRead = async (userId: number): Promise<number> => {
  const count = await notificationRepo.markAllAsRead(userId);

  if (count > 0) {
    await auditLogRepo.create({
      userId,
      action: 'UPDATE',
      module: 'NOTIFICATION',
      recordType: 'notification_recipient',
      recordId: 0,
      newValues: { marked_all_read: count },
    });
  }

  return count;
};

export const getUnreadCount = async (userId: number): Promise<number> => {
  return await notificationRepo.getUnreadCount(userId);
};

export const getSummary = async (userId: number): Promise<NotificationSummary> => {
  return await notificationRepo.getSummary(userId);
};

export const deleteNotification = async (
  notificationId: number,
  deletedBy: number
): Promise<boolean> => {
  const deleted = await notificationRepo.deleteById(notificationId);

  if (deleted) {
    await auditLogRepo.create({
      userId: deletedBy,
      action: 'DELETE',
      module: 'NOTIFICATION',
      recordType: 'notification',
      recordId: notificationId,
    });
  }

  return deleted;
};
