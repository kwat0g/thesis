import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as notificationService from '@/lib/services/notification/notificationService';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const count = await notificationService.getUnreadCount(user.id);

    return NextResponse.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}

