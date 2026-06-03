'use client';

import React from 'react';
import { getVietnamDateInfo } from '../utils/date';
import { getCampusAccessHoursInfo } from '../utils/campus';
import { formatClock } from '../utils/format';
import type { RoomRecord } from '../../../types/room';

interface RoomStatusCellProps {
  room: RoomRecord;
  nowTime: string;
}

export function RoomStatusCell({ room, nowTime }: RoomStatusCellProps) {
  const refIso = nowTime || new Date().toISOString();
  const accessInfo = getCampusAccessHoursInfo(refIso, room.campus);
  const refTimeMs = new Date(refIso).getTime();
  const info = getVietnamDateInfo(refIso);

  const todaySchedules = room.schedules.filter((s) => {
    const sInfo = getVietnamDateInfo(s.startTime);
    return sInfo.dateString === info.dateString;
  });

  const sortedTodaySchedules = [...todaySchedules].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  const activeClass = sortedTodaySchedules.find((s) => {
    const startMs = new Date(s.startTime).getTime();
    const endMs = new Date(s.endTime).getTime();
    return startMs <= refTimeMs && refTimeMs <= endMs;
  });

  const nextClass = sortedTodaySchedules.find((s) => {
    const startMs = new Date(s.startTime).getTime();
    return startMs > refTimeMs;
  });

  if (info.hours >= 21 || accessInfo.isClosed) {
    return <span className="text-slate-500 font-semibold">Closed</span>;
  }

  if (activeClass) {
    const endTimeStr = formatClock(activeClass.endTime);
    return (
      <div className="flex flex-col items-end text-right leading-tight text-[#DE350B] font-semibold">
        <span className="whitespace-nowrap">Occupied</span>
        <span className="whitespace-nowrap mt-0.5">Free at {endTimeStr}</span>
      </div>
    );
  }

  if (nextClass) {
    const nextTimeStr = formatClock(nextClass.startTime);
    const diffMs = new Date(nextClass.startTime).getTime() - refTimeMs;
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));

    let timeRemaining = '';
    if (diffMins < 60) {
      timeRemaining = `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    } else {
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;
      timeRemaining = m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return (
      <div className="flex flex-col items-end text-right leading-tight text-[#00875A] font-semibold">
        <span className="whitespace-nowrap">Free till {nextTimeStr}</span>
        <span className="whitespace-nowrap mt-0.5">(Class in {timeRemaining})</span>
      </div>
    );
  }

  return <span className="text-[#00875A] font-semibold">Free all day</span>;
}

export function getStatusSquareColor(room: RoomRecord, nowTime: string): string {
  const refIso = nowTime || new Date().toISOString();
  const accessInfo = getCampusAccessHoursInfo(refIso, room.campus);
  const refTimeMs = new Date(refIso).getTime();
  const info = getVietnamDateInfo(refIso);

  if (info.hours >= 21 || accessInfo.isClosed) {
    return 'bg-slate-300';
  }

  const todaySchedules = room.schedules.filter((s) => {
    const sInfo = getVietnamDateInfo(s.startTime);
    return sInfo.dateString === info.dateString;
  });

  const activeClass = todaySchedules.find((s) => {
    const startMs = new Date(s.startTime).getTime();
    const endMs = new Date(s.endTime).getTime();
    return startMs <= refTimeMs && refTimeMs <= endMs;
  });

  if (activeClass) {
    return 'bg-[#DE350B]';
  }

  return 'bg-[#00875A]';
}
