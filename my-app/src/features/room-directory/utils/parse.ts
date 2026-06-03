// Data normalization and business logic for room availability. Zero React dependencies.

import { isSameVietnamDay } from './date';
import { parseFlexibleNumber, formatClock, formatScheduleDate, formatDurationLeft } from './format';
import type { CourseRecord, ScheduleRecord, RoomRecord, TimetableMatrix } from '../../../types/room';

export function normalizeSchedule(input: Record<string, unknown>, index: number): ScheduleRecord {
  const courseValue = input.course;
  const courseName =
    typeof input.courseName === 'string'
      ? input.courseName
      : typeof courseValue === 'object' && courseValue !== null && typeof (courseValue as Record<string, unknown>).subjectDescription === 'string'
        ? String((courseValue as Record<string, unknown>).subjectDescription)
        : undefined;

  const instructorName =
    typeof input.instructorName === 'string'
      ? input.instructorName
      : typeof courseValue === 'object' && courseValue !== null && typeof (courseValue as Record<string, unknown>).instructorName === 'string'
        ? String((courseValue as Record<string, unknown>).instructorName)
        : undefined;

  const department =
    typeof input.department === 'string'
      ? input.department
      : typeof courseValue === 'object' && courseValue !== null && typeof (courseValue as Record<string, unknown>).department === 'string'
        ? String((courseValue as Record<string, unknown>).department)
        : undefined;

  return {
    id: String(input.id ?? `schedule-${index}`),
    semester: String(input.semester ?? ''),
    activityType: String(input.activityType ?? input.activity_type ?? 'Booking'),
    startTime: String(input.startTime ?? input.start_time ?? ''),
    endTime: String(input.endTime ?? input.end_time ?? ''),
    courseName,
    instructorName,
    department,
    course:
      typeof courseValue === 'object' && courseValue !== null
        ? {
            subjectDescription:
              typeof (courseValue as Record<string, unknown>).subjectDescription === 'string'
                ? String((courseValue as Record<string, unknown>).subjectDescription)
                : courseName ?? 'Unknown course',
            instructorName,
            department,
          }
        : undefined,
  };
}

export function deriveScheduleOverlap(schedule: ScheduleRecord, queryStart?: string, queryEnd?: string) {
  if (!queryStart || !queryEnd) {
    const now = Date.now();
    const start = new Date(schedule.startTime).getTime();
    const end = new Date(schedule.endTime).getTime();
    return start <= now && now <= end;
  }

  const queryStartTime = new Date(queryStart).getTime();
  const queryEndTime = new Date(queryEnd).getTime();
  const scheduleStart = new Date(schedule.startTime).getTime();
  const scheduleEnd = new Date(schedule.endTime).getTime();
  return scheduleStart < queryEndTime && scheduleEnd > queryStartTime;
}

export function normalizeRoom(input: Record<string, unknown>, index: number): RoomRecord {
  const schedulesRaw = Array.isArray(input.schedules) ? input.schedules : [];
  const busySlotsRaw = Array.isArray(input.busySlots) ? input.busySlots : [];

  const schedules = schedulesRaw
    .map((schedule, scheduleIndex) => {
      if (typeof schedule !== 'object' || schedule === null) return null;
      return normalizeSchedule(schedule as Record<string, unknown>, scheduleIndex);
    })
    .filter((s): s is ScheduleRecord => s !== null);

  const derivedBusySlots = busySlotsRaw
    .map((slot, slotIndex) => {
      if (typeof slot !== 'object' || slot === null) return null;
      const casted = slot as Record<string, unknown>;
      const startTime = casted.startTime;
      const endTime = casted.endTime;
      if (typeof startTime !== 'string' || typeof endTime !== 'string') return null;
      return normalizeSchedule(
        { id: casted.id ?? `legacy-schedule-${slotIndex}`, activityType: casted.activityType ?? 'Booking', startTime, endTime },
        slotIndex,
      );
    })
    .filter((s): s is ScheduleRecord => s !== null);

  const normalizedSchedules = schedules.length > 0 ? schedules : derivedBusySlots;
  const activeSchedule = normalizedSchedules.find((s) => deriveScheduleOverlap(s));

  const nowMs = Date.now();
  const nextSchedule = normalizedSchedules.find((s) => {
    const sStartMs = new Date(s.startTime).getTime();
    if (sStartMs <= nowMs) return false;
    return isSameVietnamDay(sStartMs, nowMs);
  });
  const fallbackMinutesLeft = nextSchedule
    ? Math.round((new Date(nextSchedule.startTime).getTime() - nowMs) / 60000)
    : null;

  return {
    id: String(input.id ?? `room-${index}`),
    roomName: String(input.roomName ?? input.name ?? `Room ${index + 1}`),
    locationCode: String(input.locationCode ?? input.location_code ?? ''),
    description: String(input.description ?? input.locationCode ?? input.location_code ?? ''),
    campus: String(input.campus ?? 'SGS').toUpperCase(),
    building: String(input.building ?? 'Unknown'),
    floorLevel: parseFlexibleNumber(input.floorLevel ?? input.floor_level) ?? 0,
    capacity: parseFlexibleNumber(input.capacity) ?? 0,
    roomType: String(input.roomType ?? input.room_type ?? ''),
    status:
      String(input.status ?? (normalizedSchedules.length > 0 ? 'BUSY' : 'AVAILABLE')).toUpperCase() === 'BUSY'
        ? 'BUSY'
        : 'AVAILABLE',
    activeCourseName:
      typeof input.activeCourseName === 'string'
        ? input.activeCourseName
        : activeSchedule?.courseName ?? activeSchedule?.course?.subjectDescription,
    minutesLeft:
      typeof input.minutesLeft === 'number' || input.minutesLeft === null
        ? (input.minutesLeft as number | null)
        : fallbackMinutesLeft,
    schedules: normalizedSchedules,
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

export function getActiveSchedule(room: RoomRecord, queryStart?: string, queryEnd?: string) {
  return room.schedules.find((s) => deriveScheduleOverlap(s, queryStart, queryEnd));
}

export function deriveRoomStatus(room: RoomRecord, queryStart?: string, queryEnd?: string) {
  const activeSchedule = getActiveSchedule(room, queryStart, queryEnd);
  if (activeSchedule) {
    return {
      status: 'BUSY' as const,
      courseName: activeSchedule.courseName ?? activeSchedule.course?.subjectDescription,
      activeSchedule,
    };
  }
  return { status: 'AVAILABLE' as const, courseName: undefined, activeSchedule: undefined };
}

export function getCurrentRoomState(room: RoomRecord) {
  const now = Date.now();
  const sorted = room.schedules.slice().sort(
    (l, r) => new Date(l.startTime).getTime() - new Date(r.startTime).getTime(),
  );

  const activeSchedule = sorted.find((s) => {
    const startTime = new Date(s.startTime).getTime();
    const endTime = new Date(s.endTime).getTime();
    return startTime <= now && now <= endTime;
  });

  const nextSchedule = sorted.find((s) => {
    const sStartMs = new Date(s.startTime).getTime();
    if (sStartMs <= now) return false;
    return isSameVietnamDay(sStartMs, now);
  });

  if (activeSchedule) {
    return {
      tone: 'BUSY' as const,
      className: 'border-l-4 border-l-slate-300 bg-slate-50 opacity-75',
      title: `🚫 Occupied • Free at ${formatClock(activeSchedule.endTime)}`,
      detail: activeSchedule.courseName ?? activeSchedule.course?.subjectDescription ?? 'Reserved now',
      nextEventStart: activeSchedule.endTime,
    };
  }

  if (!nextSchedule) {
    return {
      tone: 'SECURE' as const,
      className: 'border-l-4 border-l-green-500 bg-white',
      title: '🟢 Free for the rest of today',
      detail: 'No upcoming reservations found',
      nextEventStart: undefined,
    };
  }

  const minutesLeft = (new Date(nextSchedule.startTime).getTime() - now) / (1000 * 60);

  if (minutesLeft > 20) {
    return {
      tone: 'SECURE' as const,
      className: 'border-l-4 border-l-green-500 bg-white',
      title: `🟢 Free until ${formatClock(nextSchedule.startTime)} (${formatDurationLeft(minutesLeft)})`,
      detail: nextSchedule.courseName ?? nextSchedule.course?.subjectDescription ?? 'Upcoming reservation',
      nextEventStart: nextSchedule.startTime,
    };
  }

  return {
    tone: 'WARNING' as const,
    className: 'border-l-4 border-l-amber-500 bg-amber-50/40',
    title: `⚠️ Transitioning Soon • Only ${Math.ceil(minutesLeft)} mins left`,
    detail: nextSchedule.courseName ?? nextSchedule.course?.subjectDescription ?? 'Upcoming reservation',
    nextEventStart: nextSchedule.startTime,
  };
}

export function getRoomDetailRows(room: RoomRecord) {
  return room.schedules
    .slice()
    .sort((l, r) => new Date(l.startTime).getTime() - new Date(r.startTime).getTime())
    .map((schedule) => ({
      ...schedule,
      courseLabel: schedule.courseName ?? schedule.course?.subjectDescription ?? 'Unknown course',
      instructorLabel: schedule.instructorName ?? schedule.course?.instructorName ?? 'TBA',
      departmentLabel: schedule.department ?? schedule.course?.department ?? 'Unknown',
      windowLabel: `${formatScheduleDate(schedule.startTime)} • ${formatClock(schedule.startTime)} - ${formatClock(schedule.endTime)}`,
    }));
}
