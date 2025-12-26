'use client';

import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  UsersIcon, 
  ClockIcon,
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline';

export default function HRPage() {
  const { hasPermission } = usePermissions();

  const canViewEmployees = hasPermission('HR.VIEW_EMPLOYEES');
  const canViewAttendance = hasPermission('HR.VIEW_ATTENDANCE');
  const canViewPayroll = hasPermission('HR.VIEW_PAYROLL');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Human Resources</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage employees, attendance, and payroll
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {canViewEmployees && (
          <Link href="/hr/employees">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-12 w-12 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Employees</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Employee records
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {canViewAttendance && (
          <Link href="/hr/attendance">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-12 w-12 text-green-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Attendance</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Time tracking
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {canViewPayroll && (
          <Link href="/hr/payroll">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-12 w-12 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Payroll</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Payroll processing
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
