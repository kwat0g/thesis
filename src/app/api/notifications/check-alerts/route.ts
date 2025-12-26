import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as notificationTriggers from '@/lib/services/notification/notificationTriggers';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const [
      lowStockCount,
      overdueInvoiceCount,
      productionDelayCount,
      overdueMaintenanceCount,
    ] = await Promise.all([
      notificationTriggers.checkAndNotifyLowStock(),
      notificationTriggers.checkAndNotifyOverdueInvoices(),
      notificationTriggers.checkAndNotifyProductionDelays(),
      notificationTriggers.checkAndNotifyOverdueMaintenance(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        lowStockAlerts: lowStockCount,
        overdueInvoiceAlerts: overdueInvoiceCount,
        productionDelayAlerts: productionDelayCount,
        overdueMaintenanceAlerts: overdueMaintenanceCount,
        totalAlerts:
          lowStockCount +
          overdueInvoiceCount +
          productionDelayCount +
          overdueMaintenanceCount,
      },
      message: 'Alert check completed',
    });
  } catch (error: any) {
    console.error('Error checking alerts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check alerts' },
      { status: 500 }
    );
  }
}

