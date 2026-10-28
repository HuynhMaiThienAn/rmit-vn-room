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
  dateLabel: string;
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
    <div className="flex flex-col h-full bg-white border border-black rounded-lg overflow-hidden shadow-xs">
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

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {loadingSchedules ? (
          <div className="flex-1 flex items-center justify-center p-8 bg-white">
            <p className="text-xs font-medium text-slate-500">Loading timetable...</p>
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
