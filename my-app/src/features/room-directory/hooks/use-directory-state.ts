'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from 'react';
import { fetchRoomSchedulesForDates } from '../services/availability.service';
import { getVietnamDateInfo } from '../utils/helpers';
import { getRoomDetailRows } from '../utils/parse';
import {
  normalizeRoomCode,
  useUrlSync,
  writeCalendarViewToUrl,
  writeRoomCodeToUrl,
} from './use-url-sync';
import { useAvailability } from './use-availability';
import { useRoomFilter } from './use-room-filter';
import { useCalendar } from './use-calendar';
import type { RoomRecord, ScheduleRecord } from '../../../types/room';

function roomMatchesCode(room: RoomRecord, roomCode: string) {
  const normalized = normalizeRoomCode(roomCode);
  return (
    normalizeRoomCode(room.roomName) === normalized ||
    normalizeRoomCode(room.id) === normalized
  );
}

export function useDirectoryState() {
  const {
    urlRoomCode,
    setUrlRoomCode,
    calendarView,
    setCalendarViewState,
    setCalendarView,
  } = useUrlSync();

  const [selectedRoom, setSelectedRoom] = useState<RoomRecord | null>(null);
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [deepLinkError, setDeepLinkError] = useState<string | null>(null);

  const [selectedSemesterState, setSelectedSemesterState] = useState('ALL');
  const { queryStart, queryEnd, matrix, loading, error, nowTime } =
    useAvailability(selectedSemesterState);

  const {
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
  } = useRoomFilter(matrix.rooms, nowTime);

  // Sync semester filter between availability fetcher and filter hook
  useEffect(() => {
    setSelectedSemesterState(selectedSemester);
  }, [selectedSemester]);

  const {
    currentLocalDateStr,
    setCurrentLocalDateStr,
    currentWeekDays,
    calendarHeaderTitle,
    handleNavigateCalendar,
    handleJumpToToday,
  } = useCalendar(calendarView);

  // Reconcile Selected Room when Matrix or URL updates
  useEffect(() => {
    if (urlRoomCode) {
      const matched = matrix.rooms.find((room) => roomMatchesCode(room, urlRoomCode)) ?? null;
      if (matched) {
        setSelectedRoom(matched);
        expandHierarchyToRoom(matched.campus, matched.building, matched.floorLevel);
        setDeepLinkError(null);
        if (!currentLocalDateStr) {
          setCurrentLocalDateStr(getVietnamDateInfo(new Date().toISOString()).dateString);
        }
      } else if (!loading && matrix.rooms.length > 0) {
        setSelectedRoom(null);
        setDeepLinkError(`Room "${urlRoomCode}" was not found.`);
      }
      return;
    }

    setSelectedRoom((current) => {
      if (!current) return null;
      return matrix.rooms.find((r) => r.id === current.id) ?? null;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentLocalDateStr,
    loading,
    matrix,
    setCurrentLocalDateStr,
    urlRoomCode,
  ]);

  // Clear selected room on filter change unless URL is controlling selection
  useEffect(() => {
    if (urlRoomCode) return;
    setSelectedRoom(null);
  }, [queryStart, queryEnd, selectedSemester, searchText, urlRoomCode]);

  // Fetch Detailed Room Schedules when a room is selected
  useEffect(() => {
    if (!selectedRoom) {
      setSchedules([]);
      setLoadingSchedules(false);
      return;
    }

    const datesToFetch =
      calendarView === 'week' && currentWeekDays.length > 0
        ? currentWeekDays.map((d) => d.dateString)
        : currentLocalDateStr
          ? [currentLocalDateStr]
          : [];

    if (datesToFetch.length === 0) {
      setSchedules([]);
      setLoadingSchedules(false);
      return;
    }

    let active = true;
    setLoadingSchedules(true);

    fetchRoomSchedulesForDates(selectedRoom.id, datesToFetch)
      .then((data) => {
        if (!active) return;
        setSchedules(data);
        setLoadingSchedules(false);
      })
      .catch((err) => {
        console.error('Failed to fetch room schedules:', err);
        if (!active) return;
        setSchedules([]);
        setLoadingSchedules(false);
      });

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom?.id, calendarView, currentLocalDateStr, currentWeekDays]);

  const handleOpenRoomCode = (roomCode: string) => {
    const normalized = normalizeRoomCode(roomCode);
    if (!normalized) return;
    setUrlRoomCode(normalized);
    writeRoomCodeToUrl(normalized);
    setCalendarViewState('week');
    writeCalendarViewToUrl('week');
    setDeepLinkError(null);
    const todayInfo = getVietnamDateInfo(new Date().toISOString());
    setCurrentLocalDateStr(todayInfo.dateString);
  };

  const handleSelectRoom = (room: RoomRecord) => {
    const roomCode = room.roomName || room.id;
    setUrlRoomCode(normalizeRoomCode(roomCode));
    writeRoomCodeToUrl(roomCode);
    setSelectedRoom(room);
    setCalendarViewState('week');
    setDeepLinkError(null);
    const todayInfo = getVietnamDateInfo(new Date().toISOString());
    setCurrentLocalDateStr(todayInfo.dateString);
  };

  const handleCloseRoom = () => {
    setUrlRoomCode(null);
    writeRoomCodeToUrl(null);
    setSelectedRoom(null);
    setDeepLinkError(null);
  };

  const selectedRoomSchedules = useMemo(() => {
    if (!selectedRoom) return [];
    const roomWithSchedules = { ...selectedRoom, schedules };
    return getRoomDetailRows(roomWithSchedules);
  }, [selectedRoom, schedules]);

  return {
    selectedSemester,
    setSelectedSemester,
    searchText,
    setSearchText,
    loading,
    error,
    deepLinkError,
    nowTime,
    selectedRoom,
    setSelectedRoom,
    loadingSchedules,
    calendarView,
    setCalendarView,
    currentLocalDateStr,
    setCurrentLocalDateStr,
    expandedCampuses,
    toggleCampusCollapse,
    expandedBuildings,
    toggleBuildingCollapse,
    expandedFloors,
    toggleFloorCollapse,
    roomsByCampus,
    selectedRoomSchedules,
    currentWeekDays,
    calendarHeaderTitle,
    handleNavigateCalendar,
    handleJumpToToday,
    handleSelectRoom,
    handleOpenRoomCode,
    handleCloseRoom,
  };
}
