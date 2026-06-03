'use client';

import React from 'react';
import { formatClock, getActivityColor } from '../../utils/format';
import type { ScheduleRecord } from '../../../../types/room';

interface ScheduleCardProps {
  schedule: ScheduleRecord;
  topOffset: number;
  blockHeight: number;
}

export function ScheduleCard({ schedule, topOffset, blockHeight }: ScheduleCardProps) {
  const colorClasses = getActivityColor(schedule.activityType);
  const titleText = schedule.courseName ?? schedule.course?.subjectDescription ?? 'Reserved';

  return (
    <div
      className={`absolute inset-x-2 rounded-lg border p-2.5 shadow-2xs overflow-hidden flex flex-col transition-all duration-200 hover:shadow-xs hover:z-20 hover:scale-[1.01] cursor-pointer ${colorClasses}`}
      style={{
        top: `${topOffset + 3}px`,
        height: `${blockHeight - 6}px`,
      }}
      title={`${titleText} (${schedule.activityType})`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="font-bold text-xs md:text-sm tracking-tight text-black leading-tight truncate flex-1">
          {titleText}
        </p>
        <span className="rounded bg-white/70 border border-black/10 px-1.5 py-0.2 font-bold uppercase tracking-wider text-[9px] md:text-[10px] opacity-90 shrink-0">
          {schedule.activityType}
        </span>
      </div>
      <span className="text-[10px] md:text-xs font-semibold uppercase opacity-90 tracking-wider mt-auto block shrink-0">
        {formatClock(schedule.startTime)} - {formatClock(schedule.endTime)}
      </span>
    </div>
  );
}
