'use client';

import { useEffect, useMemo } from 'react';
import { groupBy, formatBuildingLabel, formatRoomDescription } from '../utils/format';
import { getCampusAccessHoursInfo } from '../utils/campus';
import { getVietnamDateInfo } from '../utils/date';
import { cleanDescriptionText } from '../utils/format';
import type { RoomRecord, TimetableMatrix } from '../../../types/room';

const DASHBOARD_WINDOW_MS = 60 * 60 * 1000;

interface UseRoomFilterProps {
  matrix: TimetableMatrix;
  nowTime: string;
  activeCampus: string | null;
  activeBuilding: string | null;
  setActiveBuilding: (building: string | null) => void;
  searchText: string;
  selectedSemester: string;
  queryStart: string;
}

export function useRoomFilter({
  matrix,
  nowTime,
  activeCampus,
  activeBuilding,
  setActiveBuilding,
  searchText,
  selectedSemester,
  queryStart,
}: UseRoomFilterProps) {
  // Reset scroll position when building or campus changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      const el = document.getElementById('room-list-container');
      if (el) el.scrollTop = 0;
    }
  }, [activeBuilding, activeCampus]);

  // Rooms filtered by campus + semester + search (used for building tab options)
  const baseCampusRooms = useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    return matrix.rooms.filter((room) => {
      const semesterMatch =
        selectedSemester === 'ALL' || room.schedules.some((s) => s.semester === selectedSemester);
      const campusMatch = !activeCampus || room.campus === activeCampus;
      const textMatch =
        needle.length === 0 ||
        room.roomName.toLowerCase().includes(needle) ||
        room.locationCode.toLowerCase().includes(needle) ||
        room.building.toLowerCase().includes(needle) ||
        String(room.floorLevel).includes(needle) ||
        formatRoomDescription(room.description).toLowerCase().includes(needle);
      return semesterMatch && campusMatch && textMatch;
    });
  }, [activeCampus, matrix.rooms, searchText, selectedSemester]);

  // Apply building filter
  const scopedRooms = useMemo(
    () => baseCampusRooms.filter((r) => r.building === activeBuilding),
    [baseCampusRooms, activeBuilding],
  );

  // Building tab options (derived from base, not scoped, so tabs don't disappear)
  const buildingOptions = useMemo(() => {
    const buildings = new Set<string>();
    for (const room of baseCampusRooms) {
      if (room.building) buildings.add(room.building);
    }
    return Array.from(buildings).sort((a, b) =>
      formatBuildingLabel(a).localeCompare(formatBuildingLabel(b)),
    );
  }, [baseCampusRooms]);

  // Auto-select first valid building
  useEffect(() => {
    if (buildingOptions.length > 0) {
      if (!activeBuilding || !buildingOptions.includes(activeBuilding)) {
        setActiveBuilding(buildingOptions[0]);
      }
    } else {
      setActiveBuilding(null);
    }
  }, [buildingOptions, activeBuilding, setActiveBuilding]);

  // Floor-grouped + sorted rooms
  const roomsByFloor = useMemo(() => {
    const groups = groupBy(scopedRooms, (r) => r.floorLevel);
    const sortedFloors = Array.from(groups.keys()).sort((a, b) => {
      if (a === 1) return -1;
      if (b === 1) return 1;
      return a - b;
    });

    const refIso = nowTime || new Date().toISOString();
    const targetMs = new Date(queryStart || refIso).getTime();
    const targetEndMs = targetMs + DASHBOARD_WINDOW_MS;

    return sortedFloors.map((floor) => {
      const floorRooms = groups.get(floor) ?? [];

      const getSortScore = (room: RoomRecord) => {
        const access = getCampusAccessHoursInfo(refIso, room.campus);
        const info = getVietnamDateInfo(refIso);
        if (info.hours >= 21 || access.isClosed) return 0;
        const refTimeMs = new Date(refIso).getTime();
        const todaySchedules = room.schedules.filter((s) => {
          const sInfo = getVietnamDateInfo(s.startTime);
          return sInfo.dateString === info.dateString;
        });
        const activeClass = todaySchedules.find((s) => {
          const startMs = new Date(s.startTime).getTime();
          const endMs = new Date(s.endTime).getTime();
          return startMs <= refTimeMs && refTimeMs <= endMs;
        });
        if (activeClass) return 1;
        const nextClass = todaySchedules.find((s) => new Date(s.startTime).getTime() > refTimeMs);
        if (nextClass) return 2;
        return 3;
      };

      const sortedFloorRooms = [...floorRooms].sort((a, b) => {
        const diff = getSortScore(b) - getSortScore(a);
        if (diff !== 0) return diff;
        return cleanDescriptionText(a.description).localeCompare(cleanDescriptionText(b.description));
      });

      const availableCount = floorRooms.filter((room) => {
        const overlapping = room.schedules.find((s) => {
          const sStart = new Date(s.startTime).getTime();
          const sEnd = new Date(s.endTime).getTime();
          return sStart < targetEndMs && sEnd > targetMs;
        });
        return !overlapping;
      }).length;

      return { floor, rooms: sortedFloorRooms, availableCount, totalCount: floorRooms.length };
    });
  }, [scopedRooms, queryStart, nowTime]);

  return {
    buildingOptions,
    roomsByFloor,
  };
}
