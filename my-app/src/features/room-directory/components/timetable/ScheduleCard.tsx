'use client';

import React from 'react';
import { formatShortClock, getActivityColor } from '../../utils/helpers';
import type { ScheduleRecord } from '../../../../types/room';

interface ScheduleCardProps {
  schedule: ScheduleRecord;
  topOffset: number;
  blockHeight: number;
  colIndex?: number;
  totalCols?: number;
}

export function ScheduleCard({
  schedule,
  topOffset,
  blockHeight,
  colIndex = 0,
  totalCols = 1,
}: ScheduleCardProps) {
  const colorClasses = getActivityColor(schedule.courseName);
  const titleText = schedule.courseName ?? 'Reserved';
  const timeRange = `${formatShortClock(schedule.startTime)}–${formatShortClock(schedule.endTime)}`;

  const widthPct = 100 / totalCols;
  const leftPct = colIndex * widthPct;

  return (
    <div
      className={`absolute rounded-xs px-2.5 py-1.5 overflow-hidden flex flex-col transition-colors hover:z-20 ${colorClasses}`}
      style={{
        top: `${topOffset + 1}px`,
        height: `${Math.max(blockHeight - 2, 20)}px`,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
      }}
      title={`${titleText} (${timeRange})`}
    >
      <p className="font-semibold text-xs md:text-sm leading-snug tracking-tight truncate">
        {titleText}
      </p>
    </div>
  );
}
