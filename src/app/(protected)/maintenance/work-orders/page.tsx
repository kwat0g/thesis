'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { getMaintenanceWorkOrders } from '@/services/api/maintenance';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ErrorMessage } from '@/components/layout/ErrorMessage';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { formatDate } from '@/utils/formatters';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface MaintenanceWorkOrder {
  id: number;
  woNumber: string;
  machineId: number;
  machineCode: string;
  machineName: string;
  maintenanceType: string;
  priority: string;
  status: string;
  requestedDate: string;
  scheduledDate?: string;
  completedDate?: string;
  description: string;
  requestedBy: number;
  requestedByName: string;
}

export default function MaintenanceWorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission('MAINT.CREATE_WORK_ORDER');

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getMaintenanceWorkOrders({
        status: statusFilter || undefined,
        maintenanceType: typeFilter || undefined,
      });
      setWorkOrders(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load maintenance work orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [statusFilter, typeFilter]);

  if (loading) {
    return <LoadingSpinner message="Loading maintenance work orders..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchWorkOrders} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Work Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage corrective and preventive maintenance activities
          </p>
        </div>
        {canCreate && (
          <Link
            href="/maintenance/work-orders/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Work Order
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 text-sm"
              >
                <option value="">All Types</option>
                <option value="preventive">Preventive</option>
                <option value="corrective">Corrective</option>
                <option value="predictive">Predictive</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button
              onClick={fetchWorkOrders}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        {workOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No maintenance work orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Machine
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      <Link href={`/maintenance/work-orders/${wo.id}`} className="hover:text-blue-800">
                        {wo.woNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{wo.machineCode}</div>
                      <div className="text-gray-500 text-xs">{wo.machineName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        wo.maintenanceType === 'preventive' ? 'bg-blue-100 text-blue-800' :
                        wo.maintenanceType === 'corrective' ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {wo.maintenanceType.charAt(0).toUpperCase() + wo.maintenanceType.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        wo.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        wo.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        wo.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {wo.priority.charAt(0).toUpperCase() + wo.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(wo.requestedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {wo.scheduledDate ? formatDate(wo.scheduledDate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {wo.requestedByName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <StatusBadge status={wo.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/maintenance/work-orders/${wo.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
