'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchAvailabilityMatrix, fetchRoomSchedules } from '../services/availability.service';
import {
  getVietnamDateInfo,
  VIETNAM_DAY_LABELS,
  VIETNAM_DAY_SHORT_LABELS,
  toDatetimeLocalValue,
  groupBy,
  formatBuildingLabel,
  formatRoomDescription,
  cleanDescriptionText,
} from '../utils/helpers';
import { getRoomStatusDetailed, getRoomDetailRows } from '../utils/parse';
import type { RoomRecord, ScheduleRecord, TimetableMatrix, CalendarView } from '../../../types/room';

const DASHBOARD_WINDOW_MS = 60 * 60 * 1000;

export function useDirectoryState() {
  // --- States ---
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [activeCampus, setActiveCampus] = useState<string | null>('SGS');
  const [activeBuilding, setActiveBuilding] = useState<string | null>(null);

  // Time bounds for availability checking
  const [queryStart, setQueryStart] = useState('');
  const [queryEnd, setQueryEnd] = useState('');

  // Availability matrix states
  const [matrix, setMatrix] = useState<TimetableMatrix>({ rooms: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowTime, setNowTime] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Room selection and detailed schedules
  const [selectedRoom, setSelectedRoom] = useState<RoomRecord | null>(null);
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Calendar and View States
  const [calendarView, setCalendarView] = useState<CalendarView>('day');
  const [currentLocalDateStr, setCurrentLocalDateStr] = useState('');
  const [expandedFloors, setExpandedFloors] = useState<Record<number, boolean>>({});

  const prevDepsRef = useRef({ queryStart, queryEnd, selectedSemester });

  // --- Initialise bounds ---
  useEffect(() => {
    const now = new Date();
    const initial = toDatetimeLocalValue(now);
    setQueryStart(initial);
    setQueryEnd(toDatetimeLocalValue(new Date(now.getTime() + DASHBOARD_WINDOW_MS)));
  }, []);

  // --- Clock Ticker (15s) & Background re-fetch trigger (60s) ---
  useEffect(() => {
    setNowTime(new Date().toISOString());
    const id = setInterval(() => setNowTime(new Date().toISOString()), 15_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setRefreshTrigger((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // --- Fetch Availability Matrix ---
  useEffect(() => {
    let mounted = true;
    async function load(isSilent: boolean) {
      if (!queryStart || !queryEnd) return;
      try {
        if (!isSilent) setLoading(true);
        const nextMatrix = await fetchAvailabilityMatrix(queryStart, queryEnd, selectedSemester);
        if (mounted) {
          setMatrix(nextMatrix);
          setError(null);
        }
      } catch (err) {
        if (mounted && !isSilent) {
          setError(err instanceof Error ? err.message : 'Failed to load schedule matrix');
        }
      } finally {
        if (mounted && !isSilent) setLoading(false);
      }
    }

    const prev = prevDepsRef.current;
    const depsChanged =
      prev.queryStart !== queryStart ||
      prev.queryEnd !== queryEnd ||
      prev.selectedSemester !== selectedSemester;
    prevDepsRef.current = { queryStart, queryEnd, selectedSemester };

    const isSilent = !depsChanged && matrix.rooms.length > 0;
    void load(isSilent);

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryStart, queryEnd, selectedSemester, refreshTrigger]);

  // --- Reconcile Selected Room when Matrix updates ---
  useEffect(() => {
    if (!selectedRoom) return;
    const updated = matrix.rooms.find((r) => r.id === selectedRoom.id) ?? null;
    setSelectedRoom(updated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matrix]);

  // --- Clear selected room on filter change ---
  useEffect(() => {
    setSelectedRoom(null);
  }, [activeCampus, activeBuilding, queryStart, queryEnd, selectedSemester, searchText]);

  // --- Fetch Detailed Room Schedules ---
  useEffect(() => {
    if (!selectedRoom) {
      setSchedules([]);
      setLoadingSchedules(false);
      return;
    }

    let active = true;
    setLoadingSchedules(true);

    fetchRoomSchedules(selectedRoom.id)
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
  }, [selectedRoom?.id]);

  // --- Calendar operations ---
  const handleNavigateCalendar = (direction: 'prev' | 'next') => {
    if (!currentLocalDateStr) return;
    const daysToShift = calendarView === 'week' ? 7 : 1;
    const currentMs = new Date(currentLocalDateStr + 'T00:00:00Z').getTime();
    const offset = direction === 'next' ? daysToShift : -daysToShift;
    const newDate = new Date(currentMs + offset * 24 * 60 * 60 * 1000);
    setCurrentLocalDateStr(getVietnamDateInfo(newDate.toISOString()).dateString);
  };

  const handleJumpToToday = () => {
    const todayInfo = getVietnamDateInfo(new Date().toISOString());
    setCurrentLocalDateStr(todayInfo.dateString);
  };

  const toggleFloorCollapse = (floor: number) => {
    setExpandedFloors((prev) => {
      const currentVal = prev[floor] !== false;
      return { ...prev, [floor]: !currentVal };
    });
  };

  const handleSelectRoom = (room: RoomRecord) => {
    setSelectedRoom(room);
    setCalendarView('day');
    const todayInfo = getVietnamDateInfo(new Date().toISOString());
    setCurrentLocalDateStr(todayInfo.dateString);
  };

  // --- Memos: Filtering & Sorting Rooms ---
  const baseCampusRooms = useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    return matrix.rooms.filter((room) => {
      const semesterMatch =
        selectedSemester === 'ALL' || room.schedules.some((s) => s.semester === selectedSemester);
      const campusMatch = !activeCampus || room.campus === activeCampus;
      const textMatch =
        needle.length === 0 ||
        room.roomName.toLowerCase().includes(needle) ||
        room.building.toLowerCase().includes(needle) ||
        String(room.floorLevel).includes(needle) ||
        formatRoomDescription(room.description).toLowerCase().includes(needle);
      return semesterMatch && campusMatch && textMatch;
    });
  }, [activeCampus, matrix.rooms, searchText, selectedSemester]);

  const scopedRooms = useMemo(
    () => baseCampusRooms.filter((r) => r.building === activeBuilding),
    [baseCampusRooms, activeBuilding],
  );

  const buildingOptions = useMemo(() => {
    const buildings = new Set<string>();
    for (const room of baseCampusRooms) {
      if (room.building) buildings.add(room.building);
    }
    return Array.from(buildings).sort((a, b) =>
      formatBuildingLabel(a).localeCompare(formatBuildingLabel(b)),
    );
  }, [baseCampusRooms]);

  // Auto-select first valid building when building options change
  useEffect(() => {
    if (buildingOptions.length > 0) {
      if (!activeBuilding || !buildingOptions.includes(activeBuilding)) {
        setActiveBuilding(buildingOptions[0]);
      }
    } else {
      setActiveBuilding(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingOptions]);

  // Floor groups
  const roomsByFloor = useMemo(() => {
    const groups = groupBy(scopedRooms, (r) => r.floorLevel);
    const sortedFloors = Array.from(groups.keys()).sort((a, b) => {
      if (a === 1) return -1;
      if (b === 1) return 1;
      return a - b;
    });

    const refIso = nowTime || new Date().toISOString();

    return sortedFloors.map((floor) => {
      const floorRooms = groups.get(floor) ?? [];
      const getSortScore = (room: RoomRecord) => {
        const details = getRoomStatusDetailed(room, refIso);
        if (details.status === 'CLOSED') return 0;
        if (details.status === 'BUSY') return 1;
        if (details.nextClass) return 2;
        return 3;
      };

      const sortedFloorRooms = [...floorRooms].sort((a, b) => {
        const diff = getSortScore(b) - getSortScore(a);
        if (diff !== 0) return diff;
        return cleanDescriptionText(a.description).localeCompare(cleanDescriptionText(b.description));
      });

      const availableCount = floorRooms.filter(
        (room) => getRoomStatusDetailed(room, refIso).status === 'AVAILABLE',
      ).length;

      return { floor, rooms: sortedFloorRooms, availableCount, totalCount: floorRooms.length };
    });
  }, [scopedRooms, nowTime]);

  const selectedRoomSchedules = useMemo(() => {
    if (!selectedRoom) return [];
    const roomWithSchedules = { ...selectedRoom, schedules };
    return getRoomDetailRows(roomWithSchedules);
  }, [selectedRoom, schedules]);

  const currentWeekDays = useMemo(() => {
    if (!currentLocalDateStr) return [];
    const parsed = new Date(currentLocalDateStr + 'T00:00:00Z');
    const day = parsed.getUTCDay();
    const offsetToMonday = day === 0 ? -6 : -(day - 1);
    const mondayMs = parsed.getTime() + offsetToMonday * 24 * 60 * 60 * 1000;

    return Array.from({ length: 7 }).map((_, i) => {
      const dayMs = mondayMs + i * 24 * 60 * 60 * 1000;
      const info = getVietnamDateInfo(new Date(dayMs).toISOString());
      return {
        dateString: info.dateString,
        dayLabel: VIETNAM_DAY_SHORT_LABELS[info.day],
        dateLabel: info.date,
        monthLabel: info.month + 1,
        fullLabel: `${VIETNAM_DAY_SHORT_LABELS[info.day]} ${info.date}/${info.month + 1}`,
      };
    });
  }, [currentLocalDateStr]);

  const calendarHeaderTitle = useMemo(() => {
    if (!currentLocalDateStr) return '';
    if (calendarView === 'week') {
      if (currentWeekDays.length === 0) return 'All weeks';
      const first = currentWeekDays[0];
      const last = currentWeekDays[6];
      return `${first.dateLabel}/${first.monthLabel} - ${last.dateLabel}/${last.monthLabel}`;
    } else {
      const parsed = new Date(currentLocalDateStr + 'T00:00:00Z');
      const info = getVietnamDateInfo(parsed.toISOString());
      return `${VIETNAM_DAY_LABELS[info.day]}, ${info.date}/${info.month + 1}/${info.year}`;
    }
  }, [calendarView, currentLocalDateStr, currentWeekDays]);

  return {
    // states
    selectedSemester, setSelectedSemester,
    searchText, setSearchText,
    activeCampus, setActiveCampus,
    activeBuilding, setActiveBuilding,
    loading, error, nowTime,
    selectedRoom, setSelectedRoom,
    loadingSchedules,
    calendarView, setCalendarView,
    currentLocalDateStr, setCurrentLocalDateStr,
    expandedFloors,

    // derived
    buildingOptions,
    roomsByFloor,
    selectedRoomSchedules,
    currentWeekDays,
    calendarHeaderTitle,

    // methods
    handleNavigateCalendar,
    handleJumpToToday,
    toggleFloorCollapse,
    handleSelectRoom,
  };
}
