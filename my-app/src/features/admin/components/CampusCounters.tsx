'use client';

import React from 'react';

interface CampusCountersProps {
  sgsRoomCount: number | null;
  hnRoomCount: number | null;
}

export function CampusCounters({ sgsRoomCount, hnRoomCount }: CampusCountersProps) {
  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="rounded-lg border border-black bg-slate-50 p-4 flex items-center justify-between shadow-xs">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">SGS Rooms</p>
          <p className="mt-1 text-2xl font-normal text-[#000054]">
            {sgsRoomCount !== null ? sgsRoomCount.toLocaleString() : '...'}
          </p>
        </div>
        <div className="bg-[#000054] text-white rounded-md px-2.5 py-1 text-xs font-normal">
          Saigon South
        </div>
      </div>
      <div className="rounded-lg border border-black bg-slate-50 p-4 flex items-center justify-between shadow-xs">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">HN Rooms</p>
          <p className="mt-1 text-2xl font-normal text-[#E60028]">
            {hnRoomCount !== null ? hnRoomCount.toLocaleString() : '...'}
          </p>
        </div>
        <div className="bg-[#E60028] text-white rounded-md px-2.5 py-1 text-xs font-normal">
          Hanoi Campus
        </div>
      </div>
    </div>
  );
}
