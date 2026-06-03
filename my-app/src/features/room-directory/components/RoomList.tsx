'use client';

import React from 'react';
import { FloorSection } from './FloorSection';
import type { RoomRecord } from '../../../types/room';

interface RoomListProps {
  loading: boolean;
  error: string | null;
  roomsByFloor: Array<{
    floor: number;
    rooms: RoomRecord[];
    availableCount: number;
    totalCount: number;
  }>;
  expandedFloors: Record<number, boolean>;
  toggleFloorCollapse: (floor: number) => void;
  selectedRoom: RoomRecord | null;
  onSelectRoom: (room: RoomRecord) => void;
  nowTime: string;
  activeCampus: string | null;
  activeBuilding: string | null;
}

export function RoomList({
  loading,
  error,
  roomsByFloor,
  expandedFloors,
  toggleFloorCollapse,
  selectedRoom,
  onSelectRoom,
  nowTime,
  activeCampus,
  activeBuilding,
}: RoomListProps) {
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2 min-h-[60vh]">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded bg-gray-100 border border-gray-200"
          />
        ))}
      </div>
    );
  }

  if (roomsByFloor.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-xs">
        <p className="text-sm font-semibold text-slate-500">
          No rooms match your filter parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {roomsByFloor.map(({ floor, rooms }) => (
        <FloorSection
          key={floor}
          floor={floor}
          rooms={rooms}
          activeCampus={activeCampus}
          activeBuilding={activeBuilding}
          isCollapsed={expandedFloors[floor] === false}
          onToggle={() => toggleFloorCollapse(floor)}
          selectedRoom={selectedRoom}
          onSelectRoom={onSelectRoom}
          nowTime={nowTime}
        />
      ))}
    </div>
  );
}
