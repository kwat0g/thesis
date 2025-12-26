'use client';

import { useEffect, useState } from 'react';
import { getMaintenanceDashboard } from '@/services/api/dashboard';
import { DashboardCard } from '@/components/layout/DashboardCard';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ErrorMessage } from '@/components/layout/ErrorMessage';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { formatDate } from '@/utils/formatters';
import { WrenchScrewdriverIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface MaintenanceDashboard {
  openWorkOrders: number;
  workOrdersByStatus: {
    pending: number;
    approved: number;
    scheduled: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  machinesWithFrequentBreakdowns: Array<{
    machineId: number;
    machineCode: string;
    machineName: string;
    breakdownCount: number;
    lastBreakdownDate?: string;
  }>;
  overdueMaintenanceSchedules: number;
}

export default function MaintenanceDashboardPage() {
  const [dashboard, setDashboard] = useState<MaintenanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMaintenanceDashboard();
      setDashboard(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load maintenance dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading maintenance dashboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Work orders, machine breakdowns, and overdue schedules
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Open Work Orders"
          value={dashboard.openWorkOrders}
          icon={<WrenchScrewdriverIcon className="w-8 h-8" />}
        />
        <DashboardCard
          title="In Progress"
          value={dashboard.workOrdersByStatus.in_progress}
          icon={<ClockIcon className="w-8 h-8" />}
        />
        <DashboardCard
          title="Overdue Schedules"
          value={dashboard.overdueMaintenanceSchedules}
          alert={dashboard.overdueMaintenanceSchedules > 0}
          icon={<ExclamationTriangleIcon className="w-8 h-8" />}
        />
        <DashboardCard
          title="Frequent Breakdowns"
          value={dashboard.machinesWithFrequentBreakdowns.length}
          subtitle="Machines with 3+ breakdowns"
          alert={dashboard.machinesWithFrequentBreakdowns.length > 0}
        />
      </div>

      {dashboard.overdueMaintenanceSchedules > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Overdue Maintenance Alert</h3>
              <p className="mt-1 text-sm text-red-700">
                {dashboard.overdueMaintenanceSchedules} preventive maintenance schedule{dashboard.overdueMaintenanceSchedules > 1 ? 's are' : ' is'} overdue. Immediate action required to prevent equipment failure.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Work Orders by Status</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatusCard status="pending" count={dashboard.workOrdersByStatus.pending} label="Pending" />
            <StatusCard status="approved" count={dashboard.workOrdersByStatus.approved} label="Approved" />
            <StatusCard status="scheduled" count={dashboard.workOrdersByStatus.scheduled} label="Scheduled" />
            <StatusCard status="in_progress" count={dashboard.workOrdersByStatus.in_progress} label="In Progress" />
            <StatusCard status="completed" count={dashboard.workOrdersByStatus.completed} label="Completed" />
            <StatusCard status="cancelled" count={dashboard.workOrdersByStatus.cancelled} label="Cancelled" />
          </div>
        </div>
      </div>

      {dashboard.machinesWithFrequentBreakdowns.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Machines with Frequent Breakdowns</h2>
              <span className="text-sm text-gray-500">Last 90 days, 3+ breakdowns</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Machine Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Machine Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Breakdown Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Breakdown
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboard.machinesWithFrequentBreakdowns.map((machine) => (
                  <tr key={machine.machineId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {machine.machineCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {machine.machineName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        machine.breakdownCount >= 5
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {machine.breakdownCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(machine.lastBreakdownDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        machine.breakdownCount >= 5
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {machine.breakdownCount >= 5 ? 'Critical' : 'High Risk'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Total Open Work Orders</span>
            <span className="text-sm font-semibold text-gray-900">{dashboard.openWorkOrders}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Pending Approval</span>
            <span className="text-sm font-semibold text-gray-900">{dashboard.workOrdersByStatus.pending}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">In Progress</span>
            <span className="text-sm font-semibold text-blue-600">{dashboard.workOrdersByStatus.in_progress}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Completed Work Orders</span>
            <span className="text-sm font-semibold text-green-600">{dashboard.workOrdersByStatus.completed}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Overdue Preventive Maintenance</span>
            <span className={`text-sm font-semibold ${dashboard.overdueMaintenanceSchedules > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {dashboard.overdueMaintenanceSchedules}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">Machines Requiring Attention</span>
            <span className={`text-sm font-semibold ${dashboard.machinesWithFrequentBreakdowns.length > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
              {dashboard.machinesWithFrequentBreakdowns.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatusCardProps {
  status: string;
  count: number;
  label: string;
}

function StatusCard({ status, count, label }: StatusCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <StatusBadge status={status} className="mb-2" />
      <p className="text-2xl font-bold text-gray-900 mt-2">{count}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
