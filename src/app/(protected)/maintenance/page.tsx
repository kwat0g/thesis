'use client';

import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  WrenchScrewdriverIcon, 
  CalendarDaysIcon,
  ClipboardDocumentListIcon 
} from '@heroicons/react/24/outline';

export default function MaintenancePage() {
  const { hasPermission } = usePermissions();

  const canViewSchedules = hasPermission('MAINT.VIEW_SCHEDULES');
  const canViewWorkOrders = hasPermission('MAINT.VIEW_WORK_ORDERS');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage preventive maintenance schedules and work orders
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {canViewSchedules && (
          <Link href="/maintenance/schedules">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarDaysIcon className="h-12 w-12 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Maintenance Schedules</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Preventive maintenance scheduling
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {canViewWorkOrders && (
          <Link href="/maintenance/work-orders">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <WrenchScrewdriverIcon className="h-12 w-12 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Maintenance Work Orders</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Corrective and preventive maintenance
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
