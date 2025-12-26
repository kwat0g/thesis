import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as notificationService from '@/lib/services/notification/notificationService';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const summary = await notificationService.getSummary(user.id);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Error fetching notification summary:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch notification summary' },
      { status: 500 }
    );
  }
}

