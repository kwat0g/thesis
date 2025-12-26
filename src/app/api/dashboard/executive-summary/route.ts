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

    const summary = await dashboardService.getExecutiveSummary();

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Error fetching executive summary:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch executive summary' },
      { status: 500 }
    );
  }
}

