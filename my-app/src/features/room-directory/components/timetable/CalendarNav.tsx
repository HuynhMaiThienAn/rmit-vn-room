'use client';

import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '../../../../components/ui/icons';

interface CalendarNavProps {
  calendarHeaderTitle: string;
  onNavigate: (direction: 'prev' | 'next') => void;
  onJumpToToday: () => void;
}

export function CalendarNav({
  calendarHeaderTitle,
  onNavigate,
  onJumpToToday,
}: CalendarNavProps) {
  return (
    <div className="flex items-center justify-between border-b border-black py-2 px-3.5 bg-white gap-3 shrink-0">
      <span className="font-semibold text-black text-xs md:text-sm tracking-tight truncate">
        {calendarHeaderTitle}
      </span>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onNavigate('prev')}
          className="p-1.5 rounded border border-slate-300 bg-white text-black hover:bg-slate-100 transition-colors cursor-pointer"
          title="Previous"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onJumpToToday}
          className="px-2.5 py-1 rounded border border-slate-300 bg-white text-xs font-semibold text-black hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => onNavigate('next')}
          className="p-1.5 rounded border border-slate-300 bg-white text-black hover:bg-slate-100 transition-colors cursor-pointer"
          title="Next"
        >
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
