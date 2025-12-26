'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { ClipboardDocumentListIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function PurchasingPage() {
  const { hasPermission } = usePermissions();

  const canViewPR = hasPermission('PURCH.VIEW_PR');
  const canViewPO = hasPermission('PURCH.VIEW_PO');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Purchasing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage purchase requests and purchase orders
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {canViewPR && (
          <Link href="/purchasing/requests">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentListIcon className="h-12 w-12 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Purchase Requests</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Create and manage purchase requisitions
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {canViewPO && (
          <Link href="/purchasing/orders">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCartIcon className="h-12 w-12 text-green-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Purchase Orders</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Create and manage purchase orders
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
