'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProductionOrderById, submitProductionOrderForApproval } from '@/services/api/production';
import { usePermissions } from '@/hooks/usePermissions';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ErrorMessage } from '@/components/layout/ErrorMessage';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ProductionOrder {
  id: number;
  orderNumber: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  status: string;
  priority: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  notes?: string;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProductionOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { isOpen, config, confirm, handleConfirm, handleCancel } = useConfirmDialog();

  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const orderId = parseInt(params.id as string);
  const canSubmit = hasPermission('PROD.CREATE_ORDER') && order?.status === 'draft';

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getProductionOrderById(orderId);
      setOrder(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load production order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleSubmitForApproval = () => {
    confirm({
      title: 'Submit for Approval',
      message: 'Are you sure you want to submit this production order for approval? Once submitted, you will not be able to edit it.',
      confirmText: 'Submit',
      onConfirm: async () => {
        try {
          setSubmitting(true);
          await submitProductionOrderForApproval(orderId);
          await fetchOrder();
        } catch (err: any) {
          setError(err.message || 'Failed to submit production order');
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading production order..." />;
  }

  if (error && !order) {
    return <ErrorMessage message={error} onRetry={fetchOrder} />;
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/production" className="text-gray-600 hover:text-gray-900">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="mt-1 text-sm text-gray-500">Production Order Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <StatusBadge status={order.status} />
          {canSubmit && (
            <button
              onClick={handleSubmitForApproval}
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              {submitting ? 'Submitting...' : 'Submit for Approval'}
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
              <h2 className="text-lg font-semibold text-gray-900">Order Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Order Number</label>
                  <p className="mt-1 text-sm text-gray-900">{order.orderNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <StatusBadge status={order.status} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Item Code</label>
                  <p className="mt-1 text-sm text-gray-900">{order.itemCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Item Name</label>
                  <p className="mt-1 text-sm text-gray-900">{order.itemName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Quantity</label>
                  <p className="mt-1 text-sm text-gray-900 font-semibold">{order.quantity.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Priority</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      order.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      order.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Planned Start Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(order.plannedStartDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Planned End Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(order.plannedEndDate)}</p>
                </div>
                {order.actualStartDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Actual Start Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(order.actualStartDate)}</p>
                  </div>
                )}
                {order.actualEndDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Actual End Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(order.actualEndDate)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Audit Information</h2>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">Created By</label>
                <p className="mt-1 text-sm text-gray-900">{order.createdByName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created At</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(order.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(order.updatedAt)}</p>
              </div>
            </div>
          </div>

          {order.status === 'draft' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Next Steps</h3>
              <p className="text-sm text-blue-700">
                This production order is in draft status. Review the details and submit for approval when ready.
              </p>
            </div>
          )}

          {order.status === 'scheduled' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800 mb-2">Status</h3>
              <p className="text-sm text-green-700">
                This production order has been scheduled and is ready for execution.
              </p>
            </div>
          )}
        </div>
      </div>

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
