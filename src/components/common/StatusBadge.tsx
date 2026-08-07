import React from 'react';
import { IncidentStatus } from '../../types';

interface StatusBadgeProps {
  status: IncidentStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let badgeStyle = 'bg-gray-100 text-gray-700 border-gray-300';

  switch (status) {
    case 'Pending':
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200/80 font-semibold';
      break;
    case 'Under Review':
      badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200/80 font-semibold';
      break;
    case 'Resolved':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-semibold';
      break;
    case 'Rejected':
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200/80 font-semibold';
      break;
  }

  const sizeStyle =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm'
      : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeStyle} ${badgeStyle} transition-all shadow-xs`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'Pending'
            ? 'bg-amber-500 animate-pulse'
            : status === 'Under Review'
            ? 'bg-sky-500'
            : status === 'Resolved'
            ? 'bg-emerald-500'
            : 'bg-rose-500'
        }`}
      />
      {status}
    </span>
  );
};
