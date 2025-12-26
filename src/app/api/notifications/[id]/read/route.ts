import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as notificationService from '@/lib/services/notification/notificationService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    const notificationId = parseInt(params.id);

    if (isNaN(notificationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    const updated = await notificationService.markAsRead(notificationId, user.id);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Notification not found or already read' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
