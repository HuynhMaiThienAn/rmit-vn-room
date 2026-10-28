'use client';

import { useMemo, useState } from 'react';
import {
  cleanDescriptionText,
  formatBuildingLabel,
  formatCampusName,
  groupBy,
} from '../utils/helpers';
import { getRoomStatusDetailed } from '../utils/parse';
import type { RoomRecord } from '../../../types/room';

export interface FloorGroup {
  floor: number;
  floorKey: string;
  rooms: RoomRecord[];
  availableCount: number;
  totalCount: number;
}

export interface BuildingGroup {
  building: string;
  buildingKey: string;
  formattedBuilding: string;
  availableCount: number;
  totalCount: number;
  floors: FloorGroup[];
}

export interface CampusGroup {
  campus: string;
  formattedCampus: string;
  buildings: BuildingGroup[];
}

function formatFullBuildingName(building: string) {
  const formatted = formatBuildingLabel(building);
  if (formatted.startsWith('Bldg ')) {
    return `Building ${formatted.substring(5)}`;
  }
  if (formatted.startsWith('BLDG ')) {
    return `Building ${formatted.substring(5)}`;
  }
  return formatted;
}

export function useRoomFilter(rooms: RoomRecord[], nowTime: string) {
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [expandedCampuses, setExpandedCampuses] = useState<Record<string, boolean>>({});
  const [expandedBuildings, setExpandedBuildings] = useState<Record<string, boolean>>({});
  const [expandedFloors, setExpandedFloors] = useState<Record<string, boolean>>({});

  const filteredRooms = useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    return rooms.filter((room) => {
      const semesterMatch =
        selectedSemester === 'ALL' || room.schedules.some((s) => s.semester === selectedSemester);
      const textMatch =
        needle.length === 0 ||
        room.campus.toLowerCase().includes(needle) ||
        room.roomName.toLowerCase().includes(needle) ||
        room.building.toLowerCase().includes(needle) ||
        String(room.floorLevel).includes(needle) ||
        cleanDescriptionText(room.description).toLowerCase().includes(needle);
      return semesterMatch && textMatch;
    });
  }, [rooms, searchText, selectedSemester]);

  const roomsByCampus = useMemo<CampusGroup[]>(() => {
    const campusMap = groupBy(filteredRooms, (r) => r.campus || 'SGS');
    const campusOrder = ['SGS', 'HN'];
    const sortedCampuses = Array.from(campusMap.keys()).sort((a, b) => {
      const idxA = campusOrder.indexOf(a);
      const idxB = campusOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const refIso = nowTime || new Date().toISOString();

    return sortedCampuses.map((campus) => {
      const cRooms = campusMap.get(campus) ?? [];
      const buildingMap = groupBy(cRooms, (r) => r.building || 'Unknown');
      const sortedBuildings = Array.from(buildingMap.keys()).sort((a, b) =>
        formatBuildingLabel(a).localeCompare(formatBuildingLabel(b), undefined, { numeric: true }),
      );

      const buildings: BuildingGroup[] = sortedBuildings.map((building) => {
        const bRooms = buildingMap.get(building) ?? [];
        const buildingKey = `${campus}-${building}`;
        const floorMap = groupBy(bRooms, (r) => r.floorLevel);
        const sortedFloors = Array.from(floorMap.keys()).sort((a, b) => a - b);

        const floors: FloorGroup[] = sortedFloors.map((floor) => {
          const floorRooms = floorMap.get(floor) ?? [];
          const sortedFloorRooms = [...floorRooms].sort((a, b) =>
            cleanDescriptionText(a.description).localeCompare(
              cleanDescriptionText(b.description),
              undefined,
              { numeric: true },
            ),
          );

          const availableCount = floorRooms.filter(
            (room) => getRoomStatusDetailed(room, refIso).status === 'AVAILABLE',
          ).length;

          return {
            floor,
            floorKey: `${buildingKey}-${floor}`,
            rooms: sortedFloorRooms,
            availableCount,
            totalCount: floorRooms.length,
          };
        });

        const availableCount = floors.reduce((sum, f) => sum + f.availableCount, 0);
        const totalCount = floors.reduce((sum, f) => sum + f.totalCount, 0);

        return {
          building,
          buildingKey,
          formattedBuilding: formatFullBuildingName(building),
          availableCount,
          totalCount,
          floors,
        };
      });

      return {
        campus,
        formattedCampus: formatCampusName(campus),
        buildings,
      };
    });
  }, [filteredRooms, nowTime]);

  const toggleCampusCollapse = (campus: string) => {
    setExpandedCampuses((prev) => ({
      ...prev,
      [campus]: !prev[campus],
    }));
  };

  const toggleBuildingCollapse = (buildingKey: string) => {
    setExpandedBuildings((prev) => ({
      ...prev,
      [buildingKey]: !prev[buildingKey],
    }));
  };

  const toggleFloorCollapse = (floorKey: string) => {
    setExpandedFloors((prev) => ({
      ...prev,
      [floorKey]: !prev[floorKey],
    }));
  };

  const expandHierarchyToRoom = (campus: string, building: string, floor: number) => {
    const buildingKey = `${campus}-${building}`;
    const floorKey = `${buildingKey}-${floor}`;
    setExpandedCampuses((prev) => ({ ...prev, [campus]: true }));
    setExpandedBuildings((prev) => ({ ...prev, [buildingKey]: true }));
    setExpandedFloors((prev) => ({ ...prev, [floorKey]: true }));
  };

  return {
    selectedSemester,
    setSelectedSemester,
    searchText,
    setSearchText,
    expandedCampuses,
    toggleCampusCollapse,
    expandedBuildings,
    toggleBuildingCollapse,
    expandedFloors,
    toggleFloorCollapse,
    expandHierarchyToRoom,
    roomsByCampus,
  };
}
