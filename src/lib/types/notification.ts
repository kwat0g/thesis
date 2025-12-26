import { BaseEntity } from './common';

export type NotificationType =
  | 'APPROVAL_REQUIRED'
  | 'LOW_STOCK_ALERT'
  | 'OVERDUE_INVOICE'
  | 'PRODUCTION_DELAY'
  | 'OVERDUE_MAINTENANCE';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type ReferenceType =
  | 'purchase_request'
  | 'purchase_order'
  | 'production_order'
  | 'payroll_period'
  | 'inventory_item'
  | 'ap_invoice'
  | 'maintenance_schedule';

export interface Notification extends BaseEntity {
  notificationType: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  referenceType?: ReferenceType;
  referenceId?: number;
}

export interface NotificationRecipient extends BaseEntity {
  notificationId: number;
  userId: number;
  isRead: boolean;
  readAt?: Date;
}

export interface UserNotification extends Notification {
  recipientId: number;
  isRead: boolean;
  readAt?: Date;
}

export interface NotificationSummary {
  totalNotifications: number;
  unreadCount: number;
  byType: {
    [key in NotificationType]: number;
  };
  byPriority: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
  };
}

export interface CreateNotificationData {
  notificationType: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  referenceType?: ReferenceType;
  referenceId?: number;
  recipientUserIds: number[];
}
