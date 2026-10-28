'use client';

import React from 'react';
import type { DatasetStats } from '../services/sync.service';

function formatVietnamTimestamp(isoString: string | null): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

interface DatasetStatusCardProps {
  stats: DatasetStats | null;
  loading: boolean;
}

export function DatasetStatusCard({ stats, loading }: DatasetStatusCardProps) {
  return (
    <div className="bg-[#000054] border-b border-black px-4 py-3 flex items-center justify-between gap-3 text-white">
      <h2 className="text-sm md:text-base font-semibold tracking-tight">
        How to Update
      </h2>
      <span className="text-xs text-slate-300">
        Last updated: <strong className="font-semibold text-white">{loading ? '...' : formatVietnamTimestamp(stats?.generatedAt ?? null)}</strong>
      </span>
    </div>
  );
}
