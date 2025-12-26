import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as dashboardService from '@/lib/services/dashboard/dashboardService';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!user.permissions.includes('REPORT.VIEW_DASHBOARD')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const dashboard = await dashboardService.getMaintenanceDashboard();

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    console.error('Error fetching maintenance dashboard:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch maintenance dashboard' },
      { status: 500 }
    );
  }
}

