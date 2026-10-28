'use client';

import React, { memo } from 'react';
import { ChevronRightIcon } from '../../../components/ui/icons';
import { cleanDescriptionText } from '../utils/helpers';
import { getRoomStatusDetailed } from '../utils/parse';
import type { RoomRecord } from '../../../types/room';

function renderRoomDescription(desc: string) {
  const cleaned = cleanDescriptionText(desc);
  const parenIndex = cleaned.indexOf('(');
  if (parenIndex === -1) {
    return <span className="font-semibold text-slate-900 whitespace-nowrap">{cleaned}</span>;
  }

  const roomName = cleaned.slice(0, parenIndex).trim();
  const roomType = cleaned.slice(parenIndex).trim();

  return (
    <span className="inline-flex flex-nowrap items-baseline gap-1.5 text-left whitespace-nowrap">
      <span className="font-semibold text-slate-900 shrink-0">{roomName}</span>
      <span className="text-slate-600 font-normal text-xs shrink-0">{roomType}</span>
    </span>
  );
}

interface RoomRowProps {
  room: RoomRecord;
  isSelected: boolean;
  nowTime: string;
  onSelect: () => void;
}

export const RoomRow = memo(function RoomRow({ room, isSelected, nowTime, onSelect }: RoomRowProps) {
  const statusDetails = getRoomStatusDetailed(room, nowTime);
  const isAvailable = statusDetails.status === 'AVAILABLE';
  const isBusy = statusDetails.status === 'BUSY';

  return (
    <tr
      onClick={onSelect}
      className={`cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors duration-150 text-slate-800 ${
        isSelected ? 'bg-blue-50/60 font-semibold border-l-4 border-l-[#000054]' : ''
      }`}
    >
      <td className="py-2.5 px-2.5 align-middle">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Status indicator pill / dot */}
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isAvailable
                  ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                  : isBusy
                    ? 'bg-rose-500'
                    : 'bg-slate-300'
              }`}
              title={
                isAvailable
                  ? 'Currently free'
                  : isBusy
                    ? 'Occupied'
                    : 'Closed'
              }
            />
            <span className="text-slate-900 text-sm lg:text-xs xl:text-sm tracking-tight overflow-hidden text-ellipsis whitespace-nowrap">
              {renderRoomDescription(room.description)}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAvailable && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-xs">
                Free
              </span>
            )}
            <ChevronRightIcon className="w-4 h-4 text-slate-400 shrink-0 select-none" />
          </div>
        </div>
      </td>
    </tr>
  );
});
