'use client';

import { useEffect, useState } from 'react';
import { getProductionDashboard } from '@/services/api/dashboard';
import { DashboardCard } from '@/components/layout/DashboardCard';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ErrorMessage } from '@/components/layout/ErrorMessage';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { formatPercent } from '@/utils/formatters';
import { CubeIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface ProductionDashboard {
  totalOrders: number;
  ordersByStatus: {
    draft: number;
    scheduled: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  inProgressOrders: number;
  delayedOrders: number;
  completionRate: number;
}

export default function ProductionDashboardPage() {
  const [dashboard, setDashboard] = useState<ProductionDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getProductionDashboard();
      setDashboard(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load production dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading production dashboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time production order metrics and performance
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
          title="Total Orders"
          value={dashboard.totalOrders}
          icon={<CubeIcon className="w-8 h-8" />}
        />
        <DashboardCard
          title="In Progress"
          value={dashboard.inProgressOrders}
          icon={<ClockIcon className="w-8 h-8" />}
        />
        <DashboardCard
          title="Delayed Orders"
          value={dashboard.delayedOrders}
          alert={dashboard.delayedOrders > 0}
          icon={<XCircleIcon className="w-8 h-8" />}
        />
        <DashboardCard
          title="Completion Rate"
          value={formatPercent(dashboard.completionRate)}
          icon={<CheckCircleIcon className="w-8 h-8" />}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Orders by Status</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatusCard
              status="draft"
              count={dashboard.ordersByStatus.draft}
              label="Draft"
            />
            <StatusCard
              status="scheduled"
              count={dashboard.ordersByStatus.scheduled}
              label="Scheduled"
            />
            <StatusCard
              status="in_progress"
              count={dashboard.ordersByStatus.in_progress}
              label="In Progress"
            />
            <StatusCard
              status="completed"
              count={dashboard.ordersByStatus.completed}
              label="Completed"
            />
            <StatusCard
              status="cancelled"
              count={dashboard.ordersByStatus.cancelled}
              label="Cancelled"
            />
          </div>
        </div>
      </div>

      {dashboard.delayedOrders > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <XCircleIcon className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Attention Required</h3>
              <p className="mt-1 text-sm text-yellow-700">
                {dashboard.delayedOrders} production order{dashboard.delayedOrders > 1 ? 's are' : ' is'} past the planned end date and require immediate attention.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Total Production Orders</span>
            <span className="text-sm font-semibold text-gray-900">{dashboard.totalOrders}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Active Orders (In Progress)</span>
            <span className="text-sm font-semibold text-gray-900">{dashboard.inProgressOrders}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Completed Orders</span>
            <span className="text-sm font-semibold text-gray-900">{dashboard.ordersByStatus.completed}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">On-Time Completion Rate</span>
            <span className="text-sm font-semibold text-green-600">{formatPercent(dashboard.completionRate)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">Delayed Orders</span>
            <span className={`text-sm font-semibold ${dashboard.delayedOrders > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {dashboard.delayedOrders}
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
