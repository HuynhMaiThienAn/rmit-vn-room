'use client';

import React from 'react';
import { ChevronDownIcon } from '../../../components/ui/icons';
import { FloorSection } from './FloorSection';
import type { CampusGroup } from '../hooks/use-room-filter';
import type { RoomRecord } from '../../../types/room';

interface RoomListProps {
  loading: boolean;
  error: string | null;
  roomsByCampus: CampusGroup[];
  expandedCampuses: Record<string, boolean>;
  toggleCampusCollapse: (campus: string) => void;
  expandedBuildings: Record<string, boolean>;
  toggleBuildingCollapse: (buildingKey: string) => void;
  expandedFloors: Record<string, boolean>;
  toggleFloorCollapse: (floorKey: string) => void;
  selectedRoom: RoomRecord | null;
  onSelectRoom: (room: RoomRecord) => void;
  nowTime: string;
  isSearching?: boolean;
}

const CAMPUS_BRANCH_STYLES: Record<
  string,
  {
    row: string;
    badge: string;
    line: string;
    gutter: string;
  }
> = {
  SGS: {
    row: 'bg-indigo-100/70 hover:bg-indigo-100 text-[#000054] border-l-4 border-l-[#000054]',
    badge: 'bg-[#000054] text-white',
    line: 'border-[#000054]/25',
    gutter: 'bg-indigo-50/30',
  },
  HN: {
    row: 'bg-rose-100/70 hover:bg-rose-100 text-rose-950 border-l-4 border-l-[#E60028]',
    badge: 'bg-[#E60028] text-white',
    line: 'border-[#E60028]/25',
    gutter: 'bg-rose-50/30',
  },
};

const BUILDING_BRANCH_STYLES = [
  {
    row: 'bg-blue-50/90 hover:bg-blue-100/70 text-[#000054] border-l-[3px] border-l-[#000054]',
    dot: 'bg-[#000054]',
    line: 'border-[#000054]/20',
    gutter: 'bg-blue-50/30',
  },
  {
    row: 'bg-emerald-50/90 hover:bg-emerald-100/70 text-emerald-950 border-l-[3px] border-l-emerald-600',
    dot: 'bg-emerald-600',
    line: 'border-emerald-600/20',
    gutter: 'bg-emerald-50/30',
  },
  {
    row: 'bg-amber-50/90 hover:bg-amber-100/70 text-amber-950 border-l-[3px] border-l-amber-500',
    dot: 'bg-amber-500',
    line: 'border-amber-500/20',
    gutter: 'bg-amber-50/30',
  },
  {
    row: 'bg-purple-50/90 hover:bg-purple-100/70 text-purple-950 border-l-[3px] border-l-purple-600',
    dot: 'bg-purple-600',
    line: 'border-purple-600/20',
    gutter: 'bg-purple-50/30',
  },
  {
    row: 'bg-rose-50/90 hover:bg-rose-100/70 text-rose-950 border-l-[3px] border-l-[#E60028]',
    dot: 'bg-[#E60028]',
    line: 'border-[#E60028]/20',
    gutter: 'bg-rose-50/30',
  },
  {
    row: 'bg-teal-50/90 hover:bg-teal-100/70 text-teal-950 border-l-[3px] border-l-teal-600',
    dot: 'bg-teal-600',
    line: 'border-teal-600/20',
    gutter: 'bg-teal-50/30',
  },
];

export function RoomList({
  loading,
  error,
  roomsByCampus,
  expandedCampuses,
  toggleCampusCollapse,
  expandedBuildings,
  toggleBuildingCollapse,
  expandedFloors,
  toggleFloorCollapse,
  selectedRoom,
  onSelectRoom,
  nowTime,
  isSearching = false,
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
            className="h-14 animate-pulse rounded bg-gray-100 border border-gray-200"
          />
        ))}
      </div>
    );
  }

  if (roomsByCampus.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-xs">
        <p className="text-sm font-semibold text-slate-500">
          No rooms match your filter parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border border-black rounded-lg overflow-hidden shadow-xs">
      {/* Top Card Header */}
      <div className="bg-[#000054] border-b border-black py-2.5 px-3.5 flex items-center justify-between text-white shrink-0">
        <h2 className="text-sm xl:text-base font-semibold text-white tracking-tight truncate">
          Room Directory
        </h2>
      </div>

      {/* Scrollable Hierarchy Tree: Campus -> Building -> Floor -> Room */}
      <div className="flex-1 overflow-y-auto divide-y divide-black/25 scrollbar-thin bg-white">
        {roomsByCampus.map((cGroup) => {
          const isCampusExpanded = isSearching || Boolean(expandedCampuses[cGroup.campus]);
          const cStyle = CAMPUS_BRANCH_STYLES[cGroup.campus] ?? CAMPUS_BRANCH_STYLES.SGS;

          return (
            <div key={cGroup.campus} className="flex flex-col">
              {/* Level 1: Campus Branch */}
              <div
                onClick={() => toggleCampusCollapse(cGroup.campus)}
                className={`py-2.5 px-3.5 flex items-center justify-between cursor-pointer select-none transition-colors ${cStyle.row} ${
                  isCampusExpanded ? 'border-b border-black/20' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs shrink-0 ${cStyle.badge}`}
                  >
                    {cGroup.campus}
                  </span>
                  <h3 className="text-sm font-bold tracking-tight truncate">
                    {cGroup.formattedCampus}
                  </h3>
                </div>
                <div className="flex items-center shrink-0">
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isCampusExpanded ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </div>
              </div>

              {/* Level 2: Building Branches inside Campus */}
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-150 ease-out will-change-[grid-template-rows,opacity] ${
                  isCampusExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className={`pl-3 ${cStyle.gutter}`}>
                    <div className={`border-l-2 ${cStyle.line} divide-y divide-black/15`}>
                      {cGroup.buildings.map((bGroup, bIdx) => {
                        const isBuildingExpanded =
                          isSearching || Boolean(expandedBuildings[bGroup.buildingKey]);
                        const bStyle =
                          BUILDING_BRANCH_STYLES[bIdx % BUILDING_BRANCH_STYLES.length];
                        const isLastBuilding = bIdx === cGroup.buildings.length - 1;

                        return (
                          <div key={bGroup.buildingKey} className="flex flex-col">
                            <div
                              onClick={() => toggleBuildingCollapse(bGroup.buildingKey)}
                              className={`py-2.5 px-3 flex items-center justify-between cursor-pointer select-none transition-colors ${bStyle.row} ${
                                isBuildingExpanded ? 'border-b border-black/15' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="opacity-60 font-mono text-xs select-none">
                                  {isLastBuilding ? '└─' : '├─'}
                                </span>
                                <span className={`w-2 h-2 rounded-xs shrink-0 ${bStyle.dot}`} />
                                <h4 className="text-sm font-bold tracking-tight truncate">
                                  {bGroup.formattedBuilding}
                                </h4>
                              </div>
                              <div className="flex items-center shrink-0">
                                <ChevronDownIcon
                                  className={`w-4 h-4 transition-transform duration-200 ${
                                    isBuildingExpanded ? 'rotate-180' : 'rotate-0'
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Level 3: Floor Branches inside Building */}
                            <div
                              className={`grid transition-[grid-template-rows,opacity] duration-150 ease-out will-change-[grid-template-rows,opacity] ${
                                isBuildingExpanded
                                  ? 'grid-rows-[1fr] opacity-100'
                                  : 'grid-rows-[0fr] opacity-0'
                              }`}
                            >
                              <div className="overflow-hidden">
                                <div className={`pl-3.5 ${bStyle.gutter}`}>
                                  <div
                                    className={`border-l-2 ${bStyle.line} divide-y divide-black/10`}
                                  >
                                    {bGroup.floors.map(
                                      (
                                        { floor, floorKey, rooms },
                                        idx,
                                      ) => (
                                        <FloorSection
                                          key={floorKey}
                                          floor={floor}
                                          branchIndex={idx}
                                          rooms={rooms}
                                          isLast={idx === bGroup.floors.length - 1}
                                          isCollapsed={!isSearching && !expandedFloors[floorKey]}
                                          onToggle={() => toggleFloorCollapse(floorKey)}
                                          selectedRoom={selectedRoom}
                                          onSelectRoom={onSelectRoom}
                                          nowTime={nowTime}
                                        />
                                      ),
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
