'use client';

import React from 'react';
import { cleanDescriptionText, formatCampusName } from '../../utils/helpers';
import type { RoomRecord, CalendarView } from '../../../../types/room';

interface TimetableHeaderProps {
  selectedRoom: RoomRecord;
  calendarView: CalendarView;
  setCalendarView: (view: CalendarView) => void;
}


export function TimetableHeader({
  selectedRoom,
  calendarView,
  setCalendarView,
}: TimetableHeaderProps) {
  const cleanedName = (() => {
    const cleaned = cleanDescriptionText(selectedRoom.description);
    const parenIndex = cleaned.indexOf('(');
    return parenIndex === -1 ? cleaned : cleaned.slice(0, parenIndex).trim();
  })();

  return (
    <div className="bg-[#000054] border border-black rounded-lg py-2.5 px-3 flex flex-col gap-1 text-white shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs md:text-sm font-bold text-white tracking-tight truncate max-w-[75%] flex items-baseline gap-1.5">
          <span>{cleanedName}</span>
          <span className="text-[10px] md:text-xs font-normal text-slate-300 shrink-0">
            • {formatCampusName(selectedRoom.campus)}
          </span>
        </h3>
        {/* Day / Week toggle */}
        <div className="inline-flex rounded-lg border border-white/10 p-0.5 bg-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setCalendarView('day')}
            className={`px-3 py-1 rounded-md transition-all duration-200 ${
              calendarView === 'day' ? 'bg-white text-[#000054] shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => setCalendarView('week')}
            className={`px-3 py-1 rounded-md transition-all duration-200 ${
              calendarView === 'week' ? 'bg-white text-[#000054] shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            Week
          </button>
        </div>
      </div>
    </div>
  );
}
