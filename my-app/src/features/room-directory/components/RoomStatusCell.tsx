'use client';

import React from 'react';
import { formatClock } from '../utils/helpers';
import { getRoomStatusDetailed } from '../utils/parse';

interface RoomStatusCellProps {
  details: ReturnType<typeof getRoomStatusDetailed>;
}

export function RoomStatusCell({ details }: RoomStatusCellProps) {
  if (details.status === 'CLOSED') {
    return <span className="text-slate-500 font-semibold">Closed</span>;
  }

  if (details.status === 'BUSY' && details.activeClass) {
    const endTimeStr = formatClock(details.activeClass.endTime);
    return (
      <div className="flex flex-col items-end text-right leading-tight text-[#DE350B] font-semibold">
        <span className="whitespace-nowrap">Occupied</span>
        <span className="whitespace-nowrap mt-0.5">Free at {endTimeStr}</span>
      </div>
    );
  }

  if (details.status === 'AVAILABLE' && details.nextClass) {
    const nextTimeStr = formatClock(details.nextClass.startTime);
    return (
      <div className="flex flex-col items-end text-right leading-tight text-[#00875A] font-semibold">
        <span className="whitespace-nowrap">Free till {nextTimeStr}</span>
        <span className="whitespace-nowrap mt-0.5">(Class in {details.timeRemainingStr})</span>
      </div>
    );
  }

  return <span className="text-[#00875A] font-semibold">Free all day</span>;
}

export function getStatusSquareColor(status: 'AVAILABLE' | 'BUSY' | 'CLOSED'): string {
  if (status === 'CLOSED') {
    return 'bg-slate-300';
  }

  if (status === 'BUSY') {
    return 'bg-[#DE350B]';
  }

  return 'bg-[#00875A]';
}
