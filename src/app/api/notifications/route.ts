import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as notificationService from '@/lib/services/notification/notificationService';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    const notificationType = searchParams.get('notificationType');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await notificationService.getUserNotifications(user.id, {
      isRead: isRead !== null ? isRead === 'true' : undefined,
      notificationType: notificationType as any,
      priority: priority as any,
      page,
      pageSize,
    });

    return NextResponse.json({
      success: true,
      data: result.notifications,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / result.pageSize),
      },
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

