'use client';

import React from 'react';
import { ChevronDownIcon } from '../../../components/ui/icons';
import { RoomRow } from './RoomRow';
import type { RoomRecord } from '../../../types/room';

interface FloorSectionProps {
  floor: number;
  branchIndex?: number;
  rooms: RoomRecord[];
  isLast?: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  selectedRoom: RoomRecord | null;
  onSelectRoom: (room: RoomRecord) => void;
  nowTime: string;
}

const FLOOR_BRANCH_COLORS = [
  'bg-sky-50/70 hover:bg-sky-100/60 text-slate-800 border-l-2 border-l-sky-400',
  'bg-teal-50/70 hover:bg-teal-100/60 text-slate-800 border-l-2 border-l-teal-400',
  'bg-indigo-50/70 hover:bg-indigo-100/60 text-slate-800 border-l-2 border-l-indigo-400',
  'bg-amber-50/70 hover:bg-amber-100/60 text-slate-800 border-l-2 border-l-amber-400',
  'bg-rose-50/70 hover:bg-rose-100/60 text-slate-800 border-l-2 border-l-rose-400',
  'bg-violet-50/70 hover:bg-violet-100/60 text-slate-800 border-l-2 border-l-violet-400',
  'bg-emerald-50/70 hover:bg-emerald-100/60 text-slate-800 border-l-2 border-l-emerald-400',
  'bg-orange-50/70 hover:bg-orange-100/60 text-slate-800 border-l-2 border-l-orange-400',
];

export function FloorSection({
  floor,
  branchIndex = 0,
  rooms,
  isLast = false,
  isCollapsed,
  onToggle,
  selectedRoom,
  onSelectRoom,
  nowTime,
}: FloorSectionProps) {
  const floorColorClass = FLOOR_BRANCH_COLORS[branchIndex % FLOOR_BRANCH_COLORS.length];

  return (
    <div className="flex flex-col">
      {/* Level 2: Nested Floor Branch (Distinct Color per Floor) */}
      <div
        onClick={onToggle}
        className={`py-2.5 px-3.5 flex items-center justify-between cursor-pointer select-none transition-colors ${floorColorClass}`}
      >
        <div className="flex items-center gap-2.5">
          {/* Tree connector indicator */}
          <span className="opacity-60 font-mono text-xs select-none">
            {isLast ? '└─' : '├─'}
          </span>
          <h3 className="text-sm font-bold tracking-tight">
            Floor {floor}
          </h3>
        </div>
        <div className="flex items-center opacity-80 pr-0.5">
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform duration-200 ${
              isCollapsed ? 'rotate-0' : 'rotate-180'
            }`}
          />
        </div>
      </div>

      {/* Level 3: Indented Room List inside Floor (White Background) */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-150 ease-out will-change-[grid-template-rows,opacity] ${
          isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pl-6 pr-3 py-1 border-t border-slate-300 bg-white">
            <div className="border-l-2 border-slate-300 pl-2">
              <table className="w-full text-left text-sm lg:text-xs xl:text-sm text-black border-collapse">
                <tbody className="divide-y divide-slate-200">
                  {rooms.map((room) => (
                    <RoomRow
                      key={room.id}
                      room={room}
                      isSelected={selectedRoom?.id === room.id}
                      nowTime={nowTime}
                      onSelect={() => onSelectRoom(room)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
