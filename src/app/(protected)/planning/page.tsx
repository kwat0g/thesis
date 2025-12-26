'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { getMRPRuns, executeMRP } from '@/services/api/planning';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ErrorMessage } from '@/components/layout/ErrorMessage';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { formatDateTime } from '@/utils/formatters';
import { PlayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface MRPRun {
  id: number;
  runDate: string;
  cutoffDate: string;
  leadTimeDays: number;
  status: string;
  totalShortages: number;
  totalPRsGenerated: number;
  executedBy: number;
  executedByName: string;
  createdAt: string;
}

export default function PlanningPage() {
  const [runs, setRuns] = useState<MRPRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [executing, setExecuting] = useState(false);
  const [showMRPDialog, setShowMRPDialog] = useState(false);
  const [mrpCutoffDate, setMrpCutoffDate] = useState('');
  const [mrpLeadTime, setMrpLeadTime] = useState('7');

  const { hasPermission } = usePermissions();
  const { isOpen, config, confirm, handleConfirm, handleCancel } = useConfirmDialog();

  const canExecuteMRP = hasPermission('MRP.EXECUTE_MRP');

  const fetchRuns = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getMRPRuns();
      setRuns(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load MRP runs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleExecuteMRP = () => {
    if (!mrpCutoffDate) {
      setError('Please select a cutoff date');
      return;
    }

    confirm({
      title: 'Execute MRP',
      message: `Are you sure you want to execute MRP with cutoff date ${mrpCutoffDate}? This will analyze production requirements and identify material shortages.`,
      confirmText: 'Execute MRP',
      onConfirm: async () => {
        try {
          setExecuting(true);
          setShowMRPDialog(false);
          await executeMRP({
            cutoffDate: mrpCutoffDate,
            leadTimeDays: parseInt(mrpLeadTime),
          });
          await fetchRuns();
          setMrpCutoffDate('');
          setMrpLeadTime('7');
        } catch (err: any) {
          setError(err.message || 'Failed to execute MRP');
        } finally {
          setExecuting(false);
        }
      },
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading MRP runs..." />;
  }

  if (error && runs.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchRuns} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Planning & MRP</h1>
          <p className="mt-1 text-sm text-gray-500">
            Material Requirements Planning and production scheduling
          </p>
        </div>
        {canExecuteMRP && (
          <button
            onClick={() => setShowMRPDialog(true)}
            disabled={executing}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayIcon className="w-5 h-5 mr-2" />
            {executing ? 'Executing MRP...' : 'Execute MRP'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">MRP Run History</h2>
        </div>

        {runs.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No MRP runs found</p>
            {canExecuteMRP && (
              <button
                onClick={() => setShowMRPDialog(true)}
                className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <PlayIcon className="w-4 h-4 mr-1" />
                Execute your first MRP run
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Run Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cutoff Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Time (Days)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shortages Found
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PRs Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Executed By
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
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(run.runDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(run.cutoffDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {run.leadTimeDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        run.totalShortages > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {run.totalShortages}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {run.totalPRsGenerated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {run.executedByName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/planning/mrp/${run.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showMRPDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowMRPDialog(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <PlayIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Execute MRP</h3>
                  <div className="mt-4 space-y-4">
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cutoff Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={mrpCutoffDate}
                        onChange={(e) => setMrpCutoffDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Production orders up to this date will be considered</p>
                    </div>
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lead Time (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={mrpLeadTime}
                        onChange={(e) => setMrpLeadTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Default procurement lead time</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleExecuteMRP}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                >
                  Execute
                </button>
                <button
                  type="button"
                  onClick={() => setShowMRPDialog(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isOpen}
        title={config?.title || ''}
        message={config?.message || ''}
        confirmText={config?.confirmText}
        cancelText={config?.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isDangerous={config?.isDangerous}
      />
    </div>
  );
}
