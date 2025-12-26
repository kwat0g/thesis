'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { getAPInvoices } from '@/services/api/accounting';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ErrorMessage } from '@/components/layout/ErrorMessage';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface APInvoice {
  id: number;
  invoiceNumber: string;
  supplierId: number;
  supplierName: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  balance: number;
  status: string;
  purchaseOrderId?: number;
  purchaseOrderNumber?: string;
}

export default function APInvoicesPage() {
  const [invoices, setInvoices] = useState<APInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission('AP.CREATE_INVOICE');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAPInvoices({
        status: statusFilter || undefined,
      });
      setInvoices(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load AP invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  if (loading) {
    return <LoadingSpinner message="Loading AP invoices..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchInvoices} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts Payable Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage supplier invoices and payment obligations
          </p>
        </div>
        {canCreate && (
          <Link
            href="/accounting/invoices/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Invoice
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
                className="border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <button
              onClick={fetchInvoices}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No AP invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Reference
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
                {invoices.map((invoice) => {
                  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.balance > 0;
                  
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <Link href={`/accounting/invoices/${invoice.id}`} className="hover:text-blue-800">
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {invoice.supplierName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(invoice.invoiceDate)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                        invoice.balance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(invoice.balance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.purchaseOrderNumber ? (
                          <Link href={`/purchasing/orders/${invoice.purchaseOrderId}`} className="text-blue-600 hover:text-blue-800">
                            {invoice.purchaseOrderNumber}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/accounting/invoices/${invoice.id}`}
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
