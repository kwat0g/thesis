'use client';

import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  ArchiveBoxIcon, 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon,
  ClipboardDocumentListIcon 
} from '@heroicons/react/24/outline';

export default function InventoryPage() {
  const { hasPermission } = usePermissions();

  const canViewStock = hasPermission('INV.VIEW_STOCK');
  const canReceive = hasPermission('INV.RECEIVE_GOODS');
  const canIssue = hasPermission('INV.ISSUE_GOODS');
  const canViewTransactions = hasPermission('INV.VIEW_TRANSACTIONS');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage stock levels, receipts, and issues
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {canViewStock && (
          <Link href="/inventory/balances">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArchiveBoxIcon className="h-12 w-12 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Inventory Balances</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    View stock levels by item and warehouse
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {canReceive && (
          <Link href="/inventory/receipts">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowDownTrayIcon className="h-12 w-12 text-green-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Goods Receipt</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Receive goods from purchase orders
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {canIssue && (
          <Link href="/inventory/issues">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowUpTrayIcon className="h-12 w-12 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Goods Issue</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Issue materials to production work orders
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {canViewTransactions && (
          <Link href="/inventory/transactions">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentListIcon className="h-12 w-12 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    View all inventory movements
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
