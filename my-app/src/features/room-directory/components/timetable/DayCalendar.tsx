'use client';

import {
  getVietnamDateInfo,
  getCalendarPlacement,
  resolveDaySchedules,
} from '../../utils/helpers';
import { ScheduleCard } from './ScheduleCard';
import type { ScheduleRecord } from '../../../../types/room';

interface DayCalendarProps {
  schedules: ScheduleRecord[];
  currentLocalDateStr: string;
  nowTime: string;
}

const START_HOUR = 8;
const END_HOUR = 23;
const ROW_HEIGHT = 56;

export function DayCalendar({
  schedules,
  currentLocalDateStr,
  nowTime,
}: DayCalendarProps) {
  const refIso = nowTime || new Date().toISOString();
  const info = getVietnamDateInfo(refIso);

  const isToday = currentLocalDateStr === info.dateString;
  const nowDecimal = info.hours + info.minutes / 60;
  const showTimeLine =
    isToday &&
    nowDecimal >= START_HOUR &&
    nowDecimal <= END_HOUR;
  const timeLineTop = showTimeLine ? (nowDecimal - START_HOUR) * ROW_HEIGHT : 0;
  const totalGridHeight = (END_HOUR - START_HOUR) * ROW_HEIGHT;
  const totalContainerHeight = totalGridHeight + 44;

  const rawDaySchedules = schedules.filter((s) => {
    const sInfo = getVietnamDateInfo(s.startTime);
    return sInfo.dateString === currentLocalDateStr;
  });

  const resolvedSchedules = resolveDaySchedules(rawDaySchedules);

  return (
    <div className="overflow-y-auto bg-white flex flex-1 min-h-0 scrollbar-thin">
      {/* Pinned Left Time Column */}
      <div
        className="w-[58px] shrink-0 flex flex-col border-r border-black sticky left-0 z-30 bg-white"
        style={{ height: `${totalContainerHeight}px` }}
      >
        {/* Top-Left Corner Cell: Freezes on both axes */}
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

      {/* Day Schedule Area */}
      <div
        className="flex-1 flex flex-col bg-white"
        style={{ height: `${totalContainerHeight}px` }}
      >
        {/* Schedule Header: Freezes vertically at top: 0 */}
        <div className="h-[44px] shrink-0 border-b border-black bg-slate-50 sticky top-0 z-20 flex items-center pl-3.5 font-bold text-xs text-slate-800">
          Schedule
        </div>

        {/* Grid Cells & Overlay Gridlines */}
        <div
          className="shrink-0 relative bg-white"
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

          {/* Single Day Column */}
          <div className="relative h-full z-10">
            {resolvedSchedules.map(({ schedule, colIndex, totalCols }) => {
              const placement = getCalendarPlacement(
                schedule.startTime,
                schedule.endTime,
                START_HOUR,
                END_HOUR,
                ROW_HEIGHT,
              );
              if (!placement) return null;

              return (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  topOffset={placement.topOffset}
                  blockHeight={placement.blockHeight}
                  colIndex={colIndex}
                  totalCols={totalCols}
                />
              );
            })}

            {/* Current Time Indicator Line */}
            {showTimeLine && (
              <div
                className="absolute inset-x-0 flex items-center pointer-events-none z-30"
                style={{ top: `${timeLineTop}px` }}
              >
                <div className="w-2 h-2 rounded-full bg-[#E60028] relative -left-1 shrink-0" />
                <div className="flex-1 border-t border-[#E60028]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
