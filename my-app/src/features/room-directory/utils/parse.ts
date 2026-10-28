import { getVietnamDateInfo, formatClock, formatScheduleDate } from './helpers';
import { getCampusAccessHoursInfo } from './campus';
import type { ScheduleRecord, RoomRecord, TimetableMatrix } from '../../../types/room';

export function normalizeSchedule(input: Record<string, unknown>, index: number): ScheduleRecord {
  return {
    id: String(input.id ?? `schedule-${index}`),
    semester: String(input.semester ?? ''),
    activityType: String(input.activityType ?? 'Booking'),
    startTime: String(input.startTime ?? ''),
    endTime: String(input.endTime ?? ''),
    courseName: typeof input.courseName === 'string' ? input.courseName : undefined,
    instructorName: typeof input.instructorName === 'string' ? input.instructorName : undefined,
    department: typeof input.department === 'string' ? input.department : undefined,
  };
}

const ROOM_DESC_REGEX = /^(SGS|HN)\/([0-9A-Za-z]+)\.([0-9A-Za-z]+)\.([0-9A-Za-z]+)(?:\s*\((.*)\))?$/;

export function normalizeRoom(input: unknown, index: number): RoomRecord {
  // Handle Option B compact tuple format: [roomName, description]
  if (Array.isArray(input)) {
    const [roomNameRaw, descRaw] = input;
    const roomName = String(roomNameRaw ?? `Room ${index + 1}`);
    const description = String(descRaw ?? '');

    let campus = roomName.startsWith('VH') ? 'HN' : 'SGS';
    let building = 'Unknown';
    let floorLevel = 0;
    let roomType: string | undefined = undefined;

    const match = ROOM_DESC_REGEX.exec(description.trim());
    if (match) {
      campus = match[1].toUpperCase();
      building = match[2];
      const parsedFloor = Number.parseInt(match[3], 10);
      floorLevel = Number.isFinite(parsedFloor) ? parsedFloor : 0;
      roomType = match[5]?.trim() || undefined;
    }

    return {
      id: roomName,
      roomName,
      description,
      campus,
      building,
      floorLevel,
      roomType,
      schedules: [],
    };
  }

  const obj = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const schedulesRaw = Array.isArray(obj.schedules) ? obj.schedules : [];

  const schedules = schedulesRaw
    .map((schedule, scheduleIndex) => {
      if (typeof schedule !== 'object' || schedule === null) return null;
      return normalizeSchedule(schedule as Record<string, unknown>, scheduleIndex);
    })
    .filter((s): s is ScheduleRecord => s !== null);

  const roomName = String(obj.roomName ?? `Room ${index + 1}`);
  const description = String(obj.description ?? '');

  let campus = String(obj.campus ?? (roomName.startsWith('VH') ? 'HN' : 'SGS')).toUpperCase();
  let building = String(obj.building ?? 'Unknown');
  let floorLevel = Number(obj.floorLevel ?? 0);
  let roomType = typeof obj.roomType === 'string' ? obj.roomType : undefined;

  const match = ROOM_DESC_REGEX.exec(description.trim());
  if (match) {
    if (!obj.campus) campus = match[1].toUpperCase();
    if (!obj.building) building = match[2];
    if (obj.floorLevel === undefined) {
      const parsedFloor = Number.parseInt(match[3], 10);
      floorLevel = Number.isFinite(parsedFloor) ? parsedFloor : 0;
    }
    if (!roomType && match[5]) {
      roomType = match[5].trim();
    }
  }

  return {
    id: String(obj.id ?? roomName),
    roomName,
    description,
    campus,
    building,
    floorLevel,
    capacity: typeof obj.capacity === 'number' ? obj.capacity : undefined,
    roomType,
    schedules,
  };
}

export function parseAvailabilityMatrix(payload: unknown): TimetableMatrix {
  if (typeof payload !== 'object' || payload === null) {
    return { rooms: [] };
  }

  const casted = payload as Record<string, unknown>;
  const roomsRaw = Array.isArray(casted.rooms) ? casted.rooms : [];

  return {
    generatedAt: typeof casted.generatedAt === 'string' ? casted.generatedAt : undefined,
    rooms: roomsRaw
      .map((room, index) => {
        if (typeof room !== 'object' || room === null) return null;
        return normalizeRoom(room as Record<string, unknown>, index);
      })
      .filter((r): r is RoomRecord => r !== null),
  };
}

export function getRoomStatusDetailed(room: RoomRecord, nowTime: string) {
  const refIso = nowTime || new Date().toISOString();
  const refTimeMs = new Date(refIso).getTime();

  // Check if campus is closed first!
  const accessInfo = getCampusAccessHoursInfo(refIso, room.campus);
  const info = getVietnamDateInfo(refIso);

  if (info.hours >= 21 || accessInfo.isClosed) {
    return {
      status: 'CLOSED' as const,
      activeClass: undefined,
      nextClass: undefined,
      timeRemainingStr: undefined,
      minutesToNextClass: undefined,
    };
  }

  const todaySchedules = (room.schedules || []).filter((s) => {
    const sInfo = getVietnamDateInfo(s.startTime);
    return sInfo.dateString === info.dateString;
  });

  const sortedTodaySchedules = [...todaySchedules].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  const activeClass = sortedTodaySchedules.find((s) => {
    const startMs = new Date(s.startTime).getTime();
    const endMs = new Date(s.endTime).getTime();
    return startMs <= refTimeMs && refTimeMs <= endMs;
  });

  const nextClass = sortedTodaySchedules.find((s) => {
    const startMs = new Date(s.startTime).getTime();
    return startMs > refTimeMs;
  });

  if (activeClass) {
    return {
      status: 'BUSY' as const,
      activeClass,
      nextClass,
      timeRemainingStr: undefined,
      minutesToNextClass: undefined,
    };
  }

  let timeRemainingStr = '';
  let minutesToNextClass = undefined;

  if (nextClass) {
    const diffMs = new Date(nextClass.startTime).getTime() - refTimeMs;
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    minutesToNextClass = diffMins;

    if (diffMins < 60) {
      timeRemainingStr = `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    } else {
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;
      timeRemainingStr = m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
  }

  return {
    status: 'AVAILABLE' as const,
    activeClass: undefined,
    nextClass,
    timeRemainingStr,
    minutesToNextClass,
  };
}

export function getRoomDetailRows(room: RoomRecord) {
  return room.schedules
    .slice()
    .sort((l, r) => new Date(l.startTime).getTime() - new Date(r.startTime).getTime())
    .map((schedule) => ({
      ...schedule,
      courseLabel: schedule.courseName ?? 'Unknown course',
      instructorLabel: schedule.instructorName ?? 'TBA',
      departmentLabel: schedule.department ?? 'Unknown',
      windowLabel: `${formatScheduleDate(schedule.startTime)} • ${formatClock(schedule.startTime)} - ${formatClock(schedule.endTime)}`,
    }));
}
