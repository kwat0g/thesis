'use client';

import { PRIORITY_COLORS } from '@/utils/constants';
import { capitalizeFirst } from '@/utils/formatters';

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export const PriorityBadge = ({ priority, className = '' }: PriorityBadgeProps) => {
  const colorClass = PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || 'bg-gray-100 text-gray-800';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}
    >
      {capitalizeFirst(priority)}
    </span>
  );
};
