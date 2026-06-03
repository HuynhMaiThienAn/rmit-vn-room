'use client';

import { getVietnamDateInfo, getCalendarPlacement } from '../../utils/helpers';
import { ScheduleCard } from './ScheduleCard';
import type { ScheduleRecord } from '../../../../types/room';

interface DayCalendarProps {
  schedules: ScheduleRecord[];
  currentLocalDateStr: string;
  nowTime: string;
}

const START_HOUR = 8;
const END_HOUR = 23;
const ROW_HEIGHT = 60;

export function DayCalendar({
  schedules,
  currentLocalDateStr,
  nowTime,
}: DayCalendarProps) {
  const refIso = nowTime || new Date().toISOString();
  const info = getVietnamDateInfo(refIso);

  const showTimeLine = currentLocalDateStr === info.dateString;
  const nowDecimal = info.hours + info.minutes / 60;
  const timeLineTop = showTimeLine ? (nowDecimal - START_HOUR) * ROW_HEIGHT : 0;

  const daySchedules = schedules.filter((s) => {
    const sInfo = getVietnamDateInfo(s.startTime);
    return sInfo.dateString === currentLocalDateStr;
  });

  return (
    <div className="border border-black rounded-xl overflow-y-auto bg-white shadow-xs flex flex-col flex-1 min-h-0 scrollbar-thin">
      <div
        className="flex flex-col relative shrink-0"
        style={{ height: `${(END_HOUR - START_HOUR) * ROW_HEIGHT + 45}px` }}
      >
        {/* Header Row */}
        <div className="flex border-b border-black bg-gray-50 sticky top-0 z-20 h-[45px] items-center">
          <div className="w-[60px] shrink-0 border-r border-black bg-gray-100 flex items-center justify-center font-bold text-[10px] text-black uppercase h-full">
            Time
          </div>
          <div className="flex-1 flex items-center pl-4 h-full font-bold text-black text-sm">
            Schedule
          </div>
        </div>

        {/* Grid Body */}
        <div className="flex flex-1 relative">
          {/* Left Hour Column Timeline */}
          <div className="w-[60px] shrink-0 border-r border-black bg-gray-50 flex flex-col">
            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
              const hour = START_HOUR + i;
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const hour12 = hour % 12 === 0 ? 12 : hour % 12;
              return (
                <div
                  key={hour}
                  className="flex items-start justify-center border-b border-black/20 font-bold text-[11px] text-black pt-1"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  {hour12} {ampm}
                </div>
              );
            })}
          </div>

          {/* Grid Cells & Overlay Gridlines */}
          <div className="flex-1 relative h-full">
            {/* Horizontal Gridlines background */}
            <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
              {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                <div
                  key={i}
                  className="border-b border-black/20 w-full"
                  style={{ height: `${ROW_HEIGHT}px` }}
                />
              ))}
            </div>

            {/* Single Day Column */}
            <div className="relative h-full z-10">
              {daySchedules.map((schedule) => {
                const placement = getCalendarPlacement(
                  schedule.startTime,
                  schedule.endTime,
                  START_HOUR,
                  END_HOUR,
                  ROW_HEIGHT
                );
                if (!placement) return null;

                return (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    topOffset={placement.topOffset}
                    blockHeight={placement.blockHeight}
                  />
                );
              })}

              {/* Current Time Indicator Line */}
              {showTimeLine && (
                <div
                  className="absolute inset-x-0 flex items-center pointer-events-none z-30"
                  style={{ top: `${timeLineTop}px` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-xs relative -left-1.5 shrink-0 animate-pulse" />
                  <div className="flex-1 border-t-2 border-red-600" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
