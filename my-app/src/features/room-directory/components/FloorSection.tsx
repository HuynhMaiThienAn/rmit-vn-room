'use client';

import React from 'react';
import { ChevronDownIcon } from '../../../components/ui/icons';
import { formatBuildingLabel } from '../utils/format';
import { RoomRow } from './RoomRow';
import type { RoomRecord } from '../../../types/room';

interface FloorSectionProps {
  floor: number;
  rooms: RoomRecord[];
  activeCampus: string | null;
  activeBuilding: string | null;
  isCollapsed: boolean;
  onToggle: () => void;
  selectedRoom: RoomRecord | null;
  onSelectRoom: (room: RoomRecord) => void;
  nowTime: string;
}

export function FloorSection({
  floor,
  rooms,
  activeCampus,
  activeBuilding,
  isCollapsed,
  onToggle,
  selectedRoom,
  onSelectRoom,
  nowTime,
}: FloorSectionProps) {
  const buildingName = rooms[0]?.building || activeBuilding || '';
  let formattedBuilding = formatBuildingLabel(buildingName);
  if (formattedBuilding.startsWith('Bldg ')) {
    formattedBuilding = `Building ${formattedBuilding.substring(5)}`;
  } else if (formattedBuilding.startsWith('BLDG ')) {
    formattedBuilding = `Building ${formattedBuilding.substring(5)}`;
  }

  return (
    <div className="flex flex-col bg-white border border-black rounded-lg overflow-hidden mb-4 shadow-xs">
      {/* Flat Canvas-style Section Header - Premium Sticky Header */}
      <div
        onClick={onToggle}
        className="sticky top-0 z-10 bg-[#000054] border-b border-black py-2.5 px-3 flex items-center justify-between cursor-pointer select-none hover:bg-[#000054]/90 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-lg md:text-xl lg:text-sm xl:text-base font-normal text-white tracking-tight">
            {activeCampus} | {formattedBuilding} | Floor {floor}
          </h2>
        </div>
        <div className="flex items-center text-white pr-1">
          <ChevronDownIcon
            className={`w-6 h-6 lg:w-4 lg:h-4 xl:w-5 xl:h-5 transition-transform duration-300 ${
              isCollapsed ? 'rotate-0' : 'rotate-180'
            }`}
          />
        </div>
      </div>

      {/* Animated Collapsible List Feed of Floor Rooms in Canvas Table View */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
        }`}
      >
        <div className="overflow-hidden">
          <div className="w-full overflow-x-auto scrollbar-none px-3 py-1">
            <table className="w-full text-left text-sm md:text-base lg:text-xs xl:text-sm text-black border-collapse">
              <thead>
                <tr className="border-b border-black text-black font-normal">
                  <th className="py-2.5 px-2.5 font-normal w-[55%] lg:w-[50%]">Room</th>
                  <th className="py-2.5 px-2.5 font-normal text-right w-[45%] lg:w-[50%]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
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
  );
}
