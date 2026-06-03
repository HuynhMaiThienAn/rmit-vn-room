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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black py-2.5 px-3 bg-[#f8fafc] gap-3">
      {/* Date Header Display */}
      <div className="flex items-baseline min-w-0">
        <span className="font-bold text-slate-800 text-sm md:text-base tracking-tight truncate">
          {calendarHeaderTitle}
        </span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => onNavigate('prev')}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
          title="Previous"
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onJumpToToday}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs md:text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => onNavigate('next')}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
          title="Next"
        >
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
