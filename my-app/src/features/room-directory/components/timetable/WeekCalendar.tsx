'use client';

import React from 'react';
import {
  getVietnamDateInfo,
  formatShortClock,
  getActivityColor,
  getCalendarPlacement,
  resolveDaySchedules,
} from '../../utils/helpers';
import type { ScheduleRecord } from '../../../../types/room';

interface WeekDayInfo {
  dateString: string;
  dayLabel: string;
  dateLabel: string;
}

interface WeekCalendarProps {
  schedules: ScheduleRecord[];
  currentWeekDays: WeekDayInfo[];
  currentLocalDateStr: string;
  nowTime: string;
}

const START_HOUR = 8;
const END_HOUR = 23;
const ROW_HEIGHT = 56;

export function WeekCalendar({
  schedules,
  currentWeekDays,
  currentLocalDateStr,
  nowTime,
}: WeekCalendarProps) {
  const nowInfo = getVietnamDateInfo(nowTime || new Date().toISOString());
  const nowDecimal = nowInfo.hours + nowInfo.minutes / 60;
  const totalGridHeight = (END_HOUR - START_HOUR) * ROW_HEIGHT;
  const totalContainerHeight = totalGridHeight + 44;

  const showTimeLine =
    nowDecimal >= START_HOUR &&
    nowDecimal <= END_HOUR;
  const timeLineTop = showTimeLine ? (nowDecimal - START_HOUR) * ROW_HEIGHT : 0;

  return (
    <div className="overflow-auto bg-white flex flex-1 min-h-0 scrollbar-thin">
      {/* Pinned Left Time Column: Freezes horizontally, header freezes vertically */}
      <div
        className="w-[58px] shrink-0 flex flex-col border-r border-black sticky left-0 z-30 bg-white"
        style={{ height: `${totalContainerHeight}px` }}
      >
        {/* Top-Left Corner Cell: Freezes on BOTH X and Y axes */}
        <div className="h-[44px] shrink-0 border-b border-black bg-slate-50 flex items-center justify-center font-semibold text-xs text-slate-700 sticky top-0 z-40">
          Time
        </div>

        {/* Timeline Hour Labels */}
        <div className="flex flex-col shrink-0" style={{ height: `${totalGridHeight}px` }}>
          {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
            const hour = START_HOUR + i;
            const label = `${String(hour).padStart(2, '0')}:00`;
            return (
              <div
                key={hour}
                className="flex items-start justify-center border-b border-slate-200 font-medium text-xs text-slate-700 pt-1.5 tabular-nums bg-white"
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Days Area: Scrolls horizontally on mobile/small screens */}
      <div
        className="flex-1 min-w-[580px] lg:min-w-0 flex flex-col bg-white"
        style={{ height: `${totalContainerHeight}px` }}
      >
        {/* Day Header Row: Freezes vertically at top: 0, scrolls horizontally with days */}
        <div className="h-[44px] shrink-0 border-b border-black bg-slate-50 sticky top-0 z-20 grid grid-cols-7">
          {currentWeekDays.map((dayCol) => {
            const isToday = dayCol.dateString === nowInfo.dateString;
            const isSelectedDay = dayCol.dateString === currentLocalDateStr;
            return (
              <div
                key={dayCol.dateString}
                className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 border-r border-slate-200 last:border-r-0 h-full px-1 ${
                  isToday
                    ? 'bg-[#000054] text-white'
                    : isSelectedDay
                      ? 'bg-slate-200 text-slate-900'
                      : 'text-slate-800'
                }`}
              >
                <span className="text-[11px] sm:text-xs font-bold">{dayCol.dayLabel}</span>
                <span className="text-[10px] sm:text-[11px] font-bold tabular-nums">{dayCol.dateLabel}</span>
              </div>
            );
          })}
        </div>

        {/* Grid Body: 7 Day Columns with full-width current time line */}
        <div
          className="shrink-0 grid grid-cols-7 relative bg-white"
          style={{ height: `${totalGridHeight}px` }}
        >
          {/* Horizontal Gridlines Background */}
          <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
              <div
                key={i}
                className="border-b border-slate-200 w-full"
                style={{ height: `${ROW_HEIGHT}px` }}
              />
            ))}
          </div>

          {/* Current Time Indicator Line spanning across the whole calendar week */}
          {showTimeLine && (
            <div
              className="absolute inset-x-0 flex items-center pointer-events-none z-30"
              style={{ top: `${timeLineTop}px` }}
            >
              <div className="w-2 h-2 rounded-full bg-[#E60028] relative -left-1 shrink-0" />
              <div className="flex-1 border-t-2 border-[#E60028]" />
            </div>
          )}

          {/* Day Columns */}
          {currentWeekDays.map((dayCol) => {
            const isToday = dayCol.dateString === nowInfo.dateString;
            const rawDaySchedules = schedules.filter((s) => {
              const sInfo = getVietnamDateInfo(s.startTime);
              return sInfo.dateString === dayCol.dateString;
            });

            const resolvedSchedules = resolveDaySchedules(rawDaySchedules);

            return (
              <div
                key={dayCol.dateString}
                className={`border-r border-slate-200 last:border-r-0 relative h-full z-10 ${
                  isToday ? 'bg-[#000054]/[0.06]' : ''
                }`}
              >
                {resolvedSchedules.map(({ schedule, colIndex, totalCols }) => {
                  const placement = getCalendarPlacement(
                    schedule.startTime,
                    schedule.endTime,
                    START_HOUR,
                    END_HOUR,
                    ROW_HEIGHT,
                  );
                  if (!placement) return null;

                  const colorClasses = getActivityColor(
                    schedule.courseName,
                  );
                  const titleText = schedule.courseName ?? 'Reserved';
                  const timeRange = `${formatShortClock(schedule.startTime)}–${formatShortClock(schedule.endTime)}`;
                  const widthPct = 100 / totalCols;
                  const leftPct = colIndex * widthPct;
                  const isShort = placement.blockHeight < 38;

                  return (
                    <div
                      key={schedule.id}
                      className={`absolute rounded-xs px-1.5 py-1 overflow-hidden flex flex-col transition-colors hover:z-20 ${colorClasses}`}
                      style={{
                        top: `${placement.topOffset + 1}px`,
                        height: `${Math.max(placement.blockHeight - 2, 18)}px`,
                        left: `calc(${leftPct}% + 1px)`,
                        width: `calc(${widthPct}% - 2px)`,
                      }}
                      title={`${titleText} (${timeRange})`}
                    >
                      <p
                        className={`font-semibold text-[11px] xl:text-xs leading-snug tracking-tight ${
                          isShort ? 'truncate' : 'line-clamp-3'
                        }`}
                      >
                        {titleText}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
