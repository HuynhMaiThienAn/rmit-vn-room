'use client';

import React from 'react';
import { ChevronRightIcon } from '../../../components/ui/icons';
import { cleanDescriptionText } from '../utils/helpers';
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

export function RoomRow({ room, isSelected, onSelect }: RoomRowProps) {
  return (
    <tr
      onClick={onSelect}
      className={`cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors duration-150 text-slate-800 ${
        isSelected ? 'bg-blue-50/60 font-semibold border-l-4 border-l-[#000054]' : ''
      }`}
    >
      <td className="py-2.5 px-2.5 align-middle">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-900 text-sm lg:text-xs xl:text-sm tracking-tight overflow-hidden text-ellipsis whitespace-nowrap">
            {renderRoomDescription(room.description)}
          </span>
          <ChevronRightIcon className="w-4 h-4 text-slate-400 shrink-0 select-none" />
        </div>
      </td>
    </tr>
  );
}
