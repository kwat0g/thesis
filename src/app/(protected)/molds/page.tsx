'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { getMolds } from '@/services/api/mold';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ErrorMessage } from '@/components/layout/ErrorMessage';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { formatNumber } from '@/utils/formatters';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface Mold {
  id: number;
  moldCode: string;
  moldName: string;
  cavities: number;
  status: string;
  totalShots: number;
  maxShots: number;
  currentWorkOrderId?: number;
  currentWorkOrderNumber?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceShots?: number;
}

export default function MoldsPage() {
  const [molds, setMolds] = useState<Mold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission('MOLD.CREATE');

  const fetchMolds = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getMolds({
        status: statusFilter || undefined,
      });
      setMolds(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load molds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMolds();
  }, [statusFilter]);

  if (loading) {
    return <LoadingSpinner message="Loading molds..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchMolds} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mold Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage injection molds, usage tracking, and maintenance
          </p>
        </div>
        {canCreate && (
          <Link
            href="/molds/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Mold
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="repair">Repair</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <button
              onClick={fetchMolds}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        {molds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No molds found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mold Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mold Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cavities
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Shots
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max Shots
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current WO
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
                {molds.map((mold) => {
                  const usagePercentage = mold.maxShots > 0 
                    ? ((mold.totalShots / mold.maxShots) * 100).toFixed(1)
                    : '0.0';
                  const isNearLimit = parseFloat(usagePercentage) > 80;

                  return (
                    <tr key={mold.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <Link href={`/molds/${mold.id}`} className="hover:text-blue-800">
                          {mold.moldCode}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {mold.moldName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {mold.cavities}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatNumber(mold.totalShots, 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatNumber(mold.maxShots, 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isNearLimit ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {usagePercentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {mold.currentWorkOrderNumber ? (
                          <Link href={`/production/work-orders/${mold.currentWorkOrderId}`} className="text-blue-600 hover:text-blue-800">
                            {mold.currentWorkOrderNumber}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <StatusBadge status={mold.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/molds/${mold.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
