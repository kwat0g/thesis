import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as notificationService from '@/lib/services/notification/notificationService';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const count = await notificationService.markAllAsRead(user.id);

    return NextResponse.json({
      success: true,
      data: { markedCount: count },
      message: `${count} notification(s) marked as read`,
    });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}

