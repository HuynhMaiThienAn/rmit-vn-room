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
        {calendarView === 'week' ? (
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
