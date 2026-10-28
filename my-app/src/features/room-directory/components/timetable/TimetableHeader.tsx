'use client';

import React from 'react';
import { cleanDescriptionText } from '../../utils/helpers';
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
  const cleanedName = cleanDescriptionText(selectedRoom.description);

  return (
    <div className="bg-[#000054] border-b border-black py-2.5 px-3.5 flex items-center justify-between text-white shrink-0">
      <h3 className="text-sm xl:text-base font-semibold text-white tracking-tight truncate max-w-[75%]">
        {cleanedName}
      </h3>

      {/* Week / Day toggle */}
      <div className="inline-flex rounded border border-white/25 p-0.5 bg-white/10 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setCalendarView('week')}
          className={`px-2.5 py-0.5 rounded-xs transition-colors cursor-pointer ${
            calendarView === 'week'
              ? 'bg-white text-[#000054]'
              : 'text-white/80 hover:text-white'
          }`}
        >
          Week
        </button>
        <button
          type="button"
          onClick={() => setCalendarView('day')}
          className={`px-2.5 py-0.5 rounded-xs transition-colors cursor-pointer ${
            calendarView === 'day'
              ? 'bg-white text-[#000054]'
              : 'text-white/80 hover:text-white'
          }`}
        >
          Day
        </button>
      </div>
    </div>
  );
}
