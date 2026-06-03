'use client';

import React from 'react';
import { TimetableHeader } from './TimetableHeader';
import { CalendarNav } from './CalendarNav';
import { DayCalendar } from './DayCalendar';
import { WeekCalendar } from './WeekCalendar';
import type { RoomRecord, ScheduleRecord, CalendarView } from '../../../../types/room';

interface WeekDayInfo {
  dateString: string;
  dayLabel: string;
  dateLabel: number;
}

interface TimetablePanelProps {
  selectedRoom: RoomRecord;
  selectedRoomSchedules: ScheduleRecord[];
  calendarView: CalendarView;
  setCalendarView: (view: CalendarView) => void;
  currentLocalDateStr: string;
  nowTime: string;
  currentWeekDays: WeekDayInfo[];
  calendarHeaderTitle: string;
  handleNavigateCalendar: (direction: 'prev' | 'next') => void;
  handleJumpToToday: () => void;
  loadingSchedules?: boolean;
}


export function TimetablePanel({
  selectedRoom,
  selectedRoomSchedules,
  calendarView,
  setCalendarView,
  currentLocalDateStr,
  nowTime,
  currentWeekDays,
  calendarHeaderTitle,
  handleNavigateCalendar,
  handleJumpToToday,
  loadingSchedules,
}: TimetablePanelProps) {
  return (
    <div className="flex flex-col h-full lg:overflow-hidden gap-3">
      {/* Timetable Header and Controls */}
      <div className="flex flex-col gap-3 shrink-0">
        <TimetableHeader
          selectedRoom={selectedRoom}
          calendarView={calendarView}
          setCalendarView={setCalendarView}
        />
        <CalendarNav
          calendarHeaderTitle={calendarHeaderTitle}
          onNavigate={handleNavigateCalendar}
          onJumpToToday={handleJumpToToday}
        />
      </div>

      {/* Timetable Calendar grid */}
      <div className="flex-1 min-h-0 lg:overflow-hidden flex flex-col">
        {loadingSchedules ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#000054] animate-spin mb-3"></div>
            <p className="text-sm font-medium text-slate-500 animate-pulse">Loading schedules...</p>
          </div>
        ) : calendarView === 'week' ? (
          <WeekCalendar
            schedules={selectedRoomSchedules}
            currentWeekDays={currentWeekDays}
            currentLocalDateStr={currentLocalDateStr}
            nowTime={nowTime}
          />
        ) : (
          <DayCalendar
            schedules={selectedRoomSchedules}
            currentLocalDateStr={currentLocalDateStr}
            nowTime={nowTime}
          />
        )}
      </div>
    </div>
  );
}
