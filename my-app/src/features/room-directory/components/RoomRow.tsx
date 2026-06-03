'use client';

import React from 'react';
import { ChevronRightIcon } from '../../../components/ui/icons';
import { cleanDescriptionText } from '../utils/format';
import { RoomStatusCell, getStatusSquareColor } from './RoomStatusCell';
import type { RoomRecord } from '../../../types/room';

function renderRoomDescription(desc: string, isTitle = false) {
  const cleaned = cleanDescriptionText(desc);
  const parenIndex = cleaned.indexOf('(');
  if (parenIndex === -1) {
    return <span>{cleaned}</span>;
  }

  const roomName = cleaned.slice(0, parenIndex).trim();
  const className = cleaned.slice(parenIndex).trim();

  return (
    <span className="block text-left">
      <span className="block font-semibold">{roomName}</span>
      <span className={`block text-black font-normal leading-normal ${isTitle ? 'text-sm md:text-base mt-1 text-black' : 'text-xs md:text-sm lg:text-[10px] xl:text-xs mt-0.5'}`}>
        {className}
      </span>
    </span>
  );
}


interface RoomRowProps {
  room: RoomRecord;
  isSelected: boolean;
  nowTime: string;
  onSelect: () => void;
}

export function RoomRow({ room, isSelected, nowTime, onSelect }: RoomRowProps) {
  const squareColor = getStatusSquareColor(room, nowTime);

  return (
    <tr
      onClick={onSelect}
      className={`cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors duration-150 text-slate-800 ${
        isSelected ? 'bg-blue-50/40 font-semibold border-l-4 border-l-[#000054]' : ''
      }`}
    >
      {/* Room Name & Colored Indicator Column */}
      <td className="py-2.5 px-2.5 align-middle w-[55%] lg:w-[50%]">
        <div className="flex items-start gap-2 pt-0.5">
          <span className={`w-3.5 h-3.5 rounded-xs shrink-0 mt-1.5 ${squareColor}`} />
          <span className="text-slate-900 font-semibold text-base md:text-lg lg:text-xs xl:text-sm tracking-tight transition-all">
            {renderRoomDescription(room.description)}
          </span>
        </div>
      </td>

      {/* Status Column */}
      <td className="py-2.5 px-2.5 align-middle w-[45%] lg:w-[50%] text-xs md:text-sm lg:text-[11px] xl:text-xs">
        <div className="flex items-center justify-end gap-2">
          <RoomStatusCell room={room} nowTime={nowTime} />
          <ChevronRightIcon className="w-5 h-5 text-slate-400 shrink-0 select-none" />
        </div>
      </td>
    </tr>
  );
}
