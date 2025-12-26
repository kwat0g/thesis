'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { getQualityInspections } from '@/services/api/quality';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ErrorMessage } from '@/components/layout/ErrorMessage';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { formatDate } from '@/utils/formatters';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface QualityInspection {
  id: number;
  inspectionNumber: string;
  inspectionType: string;
  referenceType: string;
  referenceId: number;
  referenceNumber: string;
  itemCode: string;
  itemName: string;
  inspectedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  status: string;
  inspectionDate: string;
  inspectorName?: string;
}

export default function QualityPage() {
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission('QC.CREATE_INSPECTION');

  const fetchInspections = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getQualityInspections({
        inspectionType: typeFilter || undefined,
        status: statusFilter || undefined,
      });
      setInspections(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load quality inspections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [typeFilter, statusFilter]);

  if (loading) {
    return <LoadingSpinner message="Loading quality inspections..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchInspections} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quality Control</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage quality inspections and non-conformance reports
          </p>
        </div>
        {canCreate && (
          <Link
            href="/quality/inspections/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Inspection
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
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Types</option>
                <option value="incoming">Incoming</option>
                <option value="in_process">In-Process</option>
                <option value="final">Final</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <button
              onClick={fetchInspections}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        {inspections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No quality inspections found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inspection #
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inspected
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accepted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rejected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
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
                {inspections.map((inspection) => (
                  <tr key={inspection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      <Link href={`/quality/inspections/${inspection.id}`} className="hover:text-blue-800">
                        {inspection.inspectionNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {inspection.inspectionType.replace('_', '-')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inspection.referenceNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{inspection.itemCode}</div>
                      <div className="text-gray-500 text-xs">{inspection.itemName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {inspection.inspectedQuantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                      {inspection.acceptedQuantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-600">
                      {inspection.rejectedQuantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(inspection.inspectionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <StatusBadge status={inspection.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/quality/inspections/${inspection.id}`}
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
