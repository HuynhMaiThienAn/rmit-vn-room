'use client';

import React from 'react';
import { getVietnamDateInfo, formatShortClock, getActivityColor, shortenActivityType, getCalendarPlacement } from '../../utils/helpers';
import type { ScheduleRecord } from '../../../../types/room';

interface WeekDayInfo {
  dateString: string;
  dayLabel: string;
  dateLabel: number;
}

interface WeekCalendarProps {
  schedules: ScheduleRecord[];
  currentWeekDays: WeekDayInfo[];
  currentLocalDateStr: string;
  nowTime: string;
}

const START_HOUR = 8;
const END_HOUR = 23;
const ROW_HEIGHT = 60;

export function WeekCalendar({
  schedules,
  currentWeekDays,
  currentLocalDateStr,
  nowTime,
}: WeekCalendarProps) {
  const nowInfo = getVietnamDateInfo(nowTime || new Date().toISOString());
  const nowDecimal = nowInfo.hours + nowInfo.minutes / 60;

  return (
    <div className="border border-black rounded-xl overflow-hidden bg-white shadow-xs flex flex-col flex-1 min-h-0">
      <div className="overflow-x-auto scrollbar-thin">
        <div
          className="min-w-[600px] lg:min-w-0 lg:w-full flex flex-col relative"
          style={{ height: `${(END_HOUR - START_HOUR) * ROW_HEIGHT + 45}px` }}
        >
          {/* Header Row */}
          <div className="flex border-b border-black bg-gray-50 sticky top-0 z-20 h-[45px] items-center">
            <div className="w-[60px] shrink-0 border-r border-black bg-gray-100 flex items-center justify-center font-bold text-[10px] text-slate-500 uppercase sticky left-0 z-30 h-full">
              Time
            </div>
            <div className="flex-1 grid grid-cols-7 h-full">
              {currentWeekDays.map((dayCol) => {
                const isSelectedDay = dayCol.dateString === currentLocalDateStr;
                return (
                  <div
                    key={dayCol.dateString}
                    className={`flex flex-col items-center justify-center text-center border-r border-black last:border-r-0 h-full py-0.5 ${
                      isSelectedDay ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <span
                      className={`text-[10px] sm:text-[11px] lg:text-[12px] font-bold uppercase tracking-wider ${
                        isSelectedDay ? 'text-[#0055A5]' : 'text-slate-500'
                      }`}
                    >
                      {dayCol.dayLabel}
                    </span>
                    <span
                      className={`text-[11px] sm:text-xs lg:text-sm font-black mt-0.5 rounded-full w-4.5 h-4.5 lg:w-6 lg:h-6 flex items-center justify-center ${
                        isSelectedDay ? 'bg-[#0055A5] text-white' : 'text-slate-800'
                      }`}
                    >
                      {dayCol.dateLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Body */}
          <div className="flex flex-1 relative">
            {/* Left Hour Column Timeline */}
            <div className="w-[60px] shrink-0 border-r border-black bg-gray-50 flex flex-col sticky left-0 z-20">
              {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
                const hour = START_HOUR + i;
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 === 0 ? 12 : hour % 12;
                return (
                  <div
                    key={hour}
                    className="flex items-start justify-center border-b border-black/20 font-bold text-[11px] text-slate-500 pt-1"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {hour12} {ampm}
                  </div>
                );
              })}
            </div>

            {/* Grid Cells & Overlay Gridlines */}
            <div className="flex-1 grid grid-cols-7 relative h-full">
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

              {/* Day Columns */}
              {currentWeekDays.map((dayCol) => {
                const daySchedules = schedules.filter((s) => {
                  const sInfo = getVietnamDateInfo(s.startTime);
                  return sInfo.dateString === dayCol.dateString;
                });

                return (
                  <div
                    key={dayCol.dateString}
                    className="border-r border-black last:border-r-0 relative h-full z-10"
                  >
                    {daySchedules.map((schedule) => {
                      const placement = getCalendarPlacement(
                        schedule.startTime,
                        schedule.endTime,
                        START_HOUR,
                        END_HOUR,
                        ROW_HEIGHT
                      );
                      if (!placement) return null;

                      const colorClasses = getActivityColor(schedule.activityType);
                      const titleText = schedule.courseName ?? 'Reserved';

                      return (
                        <div
                          key={schedule.id}
                          className={`absolute inset-x-0.5 rounded border p-1 lg:p-1.5 shadow-2xs overflow-hidden flex flex-col transition-all duration-200 hover:shadow-sm hover:z-20 hover:scale-[1.03] cursor-pointer ${colorClasses}`}
                          style={{
                            top: `${placement.topOffset + 2}px`,
                            height: `${placement.blockHeight - 4}px`,
                          }}
                          title={`${titleText} (${schedule.activityType})`}
                        >
                          <p className="font-bold text-[9px] sm:text-[10px] lg:text-[10.5px] xl:text-xs leading-tight truncate">
                            {titleText.split(' ')[0]}
                          </p>
                          <span className="text-[7.5px] sm:text-[8px] lg:text-[8.5px] xl:text-[9px] font-semibold uppercase opacity-95 tracking-wider mt-auto block truncate">
                            {shortenActivityType(schedule.activityType)} •{' '}
                            {formatShortClock(schedule.startTime)}
                          </span>
                        </div>
                      );
                    })}

                    {/* Current Time Indicator Line for Week View (Only on the matching day column) */}
                    {dayCol.dateString === nowInfo.dateString &&
                      nowDecimal >= START_HOUR &&
                      nowDecimal <= END_HOUR && (
                        <div
                          className="absolute inset-x-0 flex items-center pointer-events-none z-30"
                          style={{ top: `${(nowDecimal - START_HOUR) * ROW_HEIGHT}px` }}
                        >
                          <div className="w-2 h-2 rounded-full bg-red-600 shadow-xs relative -left-1 shrink-0 animate-pulse" />
                          <div className="flex-1 border-t-2 border-red-600" />
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
