'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getWorkOrderById, recordWorkOrderOutput } from '@/services/api/production';
import { usePermissions } from '@/hooks/usePermissions';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ErrorMessage } from '@/components/layout/ErrorMessage';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

interface WorkOrder {
  id: number;
  woNumber: string;
  productionOrderId: number;
  productionOrderNumber: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  plannedQuantity: number;
  actualQuantity: number;
  scrapQuantity: number;
  reworkQuantity: number;
  status: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  assignedOperatorId?: number;
  assignedOperatorName?: string;
  createdAt: string;
  updatedAt: string;
}

export default function WorkOrderDetailPage() {
  const params = useParams();
  const { hasPermission } = usePermissions();
  const { isOpen, config, confirm, handleConfirm, handleCancel } = useConfirmDialog();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOutputDialog, setShowOutputDialog] = useState(false);
  const [outputData, setOutputData] = useState({
    goodQuantity: '',
    scrapQuantity: '',
    reworkQuantity: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const workOrderId = parseInt(params.id as string);
  const canRecordOutput = hasPermission('PROD.RECORD_OUTPUT');

  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getWorkOrderById(workOrderId);
      setWorkOrder(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load work order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrder();
  }, [workOrderId]);

  const handleRecordOutput = () => {
    if (!outputData.goodQuantity && !outputData.scrapQuantity && !outputData.reworkQuantity) {
      setError('Please enter at least one quantity');
      return;
    }

    confirm({
      title: 'Record Output',
      message: 'Are you sure you want to record this production output? This will update inventory balances.',
      confirmText: 'Record Output',
      onConfirm: async () => {
        try {
          setSubmitting(true);
          setShowOutputDialog(false);
          await recordWorkOrderOutput(workOrderId, {
            goodQuantity: parseFloat(outputData.goodQuantity) || 0,
            scrapQuantity: parseFloat(outputData.scrapQuantity) || 0,
            reworkQuantity: parseFloat(outputData.reworkQuantity) || 0,
            notes: outputData.notes || undefined,
          });
          await fetchWorkOrder();
          setOutputData({ goodQuantity: '', scrapQuantity: '', reworkQuantity: '', notes: '' });
        } catch (err: any) {
          setError(err.message || 'Failed to record output');
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading work order..." />;
  }

  if (error && !workOrder) {
    return <ErrorMessage message={error} onRetry={fetchWorkOrder} />;
  }

  if (!workOrder) return null;

  const completionPercentage = workOrder.plannedQuantity > 0
    ? ((workOrder.actualQuantity / workOrder.plannedQuantity) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/production/work-orders" className="text-gray-600 hover:text-gray-900">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workOrder.woNumber}</h1>
            <p className="mt-1 text-sm text-gray-500">Work Order Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <StatusBadge status={workOrder.status} />
          {canRecordOutput && workOrder.status === 'in_progress' && (
            <button
              onClick={() => setShowOutputDialog(true)}
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Record Output
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Work Order Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">WO Number</label>
                  <p className="mt-1 text-sm text-gray-900">{workOrder.woNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Production Order</label>
                  <p className="mt-1 text-sm text-blue-600">
                    <Link href={`/production/${workOrder.productionOrderId}`} className="hover:text-blue-800">
                      {workOrder.productionOrderNumber}
                    </Link>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Item Code</label>
                  <p className="mt-1 text-sm text-gray-900">{workOrder.itemCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Item Name</label>
                  <p className="mt-1 text-sm text-gray-900">{workOrder.itemName}</p>
                </div>
                {workOrder.assignedOperatorName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Assigned Operator</label>
                    <p className="mt-1 text-sm text-gray-900">{workOrder.assignedOperatorName}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Production Progress</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-blue-700">Planned Quantity</label>
                  <p className="mt-2 text-2xl font-bold text-blue-900">{workOrder.plannedQuantity.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-green-700">Good Quantity</label>
                  <p className="mt-2 text-2xl font-bold text-green-900">{workOrder.actualQuantity.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-red-700">Scrap Quantity</label>
                  <p className="mt-2 text-2xl font-bold text-red-900">{workOrder.scrapQuantity.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Completion</span>
                  <span className="text-sm font-semibold text-gray-900">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(parseFloat(completionPercentage), 100)}%` }}
                  ></div>
                </div>
              </div>

              {workOrder.reworkQuantity > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-yellow-700">Rework Quantity</label>
                  <p className="mt-1 text-xl font-bold text-yellow-900">{workOrder.reworkQuantity.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Planned Start</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(workOrder.plannedStartDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Planned End</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(workOrder.plannedEndDate)}</p>
                </div>
                {workOrder.actualStartDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Actual Start</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(workOrder.actualStartDate)}</p>
                  </div>
                )}
                {workOrder.actualEndDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Actual End</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(workOrder.actualEndDate)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Audit Information</h2>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">Created At</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(workOrder.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(workOrder.updatedAt)}</p>
              </div>
            </div>
          </div>

          {workOrder.status === 'in_progress' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Work Order Active</h3>
              <p className="text-sm text-blue-700">
                This work order is currently in progress. Record production output as items are completed.
              </p>
            </div>
          )}
        </div>
      </div>

      {showOutputDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowOutputDialog(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <PlusIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Record Production Output</h3>
                  <div className="mt-4 space-y-4">
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Good Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={outputData.goodQuantity}
                        onChange={(e) => setOutputData({ ...outputData, goodQuantity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scrap Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={outputData.scrapQuantity}
                        onChange={(e) => setOutputData({ ...outputData, scrapQuantity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rework Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={outputData.reworkQuantity}
                        onChange={(e) => setOutputData({ ...outputData, reworkQuantity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        rows={3}
                        value={outputData.notes}
                        onChange={(e) => setOutputData({ ...outputData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Optional notes..."
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleRecordOutput}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:col-start-2 sm:text-sm"
                >
                  Record
                </button>
                <button
                  type="button"
                  onClick={() => setShowOutputDialog(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:col-start-1 sm:text-sm"
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
