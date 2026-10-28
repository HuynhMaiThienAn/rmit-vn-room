import { parseAvailabilityMatrix, normalizeSchedule, normalizeRoom } from '../utils/parse';
import { getVietnamDateInfo } from '../utils/helpers';
import type { TimetableMatrix, ScheduleRecord, RoomRecord } from '../../../types/room';

type RawSchedulePayload = Record<string, unknown>;

let cachedRooms: RoomRecord[] | null = null;
let cachedRoomsPromise: Promise<RoomRecord[]> | null = null;

let cachedGeneratedAt = '';

let cachedSchedulesMap: Record<string, unknown[][]> | null = null;
let cachedSchedulesPromise: Promise<Record<string, unknown[][]>> | null = null;

async function getCachedRooms(): Promise<RoomRecord[]> {
  if (cachedRooms) return cachedRooms;
  if (!cachedRoomsPromise) {
    cachedRoomsPromise = fetch('/data/rooms.json', { cache: 'default' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load rooms list');
        return res.json();
      })
      .then((payload) => {
        if (Array.isArray(payload)) {
          // Option B format: [[roomName, description], ...]
          cachedRooms = payload.map((item, idx) => normalizeRoom(item, idx));
        } else if (payload && Array.isArray(payload.rooms)) {
          cachedGeneratedAt = typeof payload.generatedAt === 'string' ? payload.generatedAt : '';
          cachedRooms = payload.rooms.map((item: unknown, idx: number) => normalizeRoom(item, idx));
        } else {
          cachedRooms = [];
        }
        return cachedRooms!;
      })
      .catch((err) => {
        cachedRoomsPromise = null;
        throw err;
      });
  }
  return cachedRoomsPromise;
}

async function getCachedSchedules(): Promise<Record<string, unknown[][]>> {
  if (cachedSchedulesMap) return cachedSchedulesMap;
  if (!cachedSchedulesPromise) {
    cachedSchedulesPromise = fetch('/data/schedules.json', { cache: 'default' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load schedules');
        return res.json();
      })
      .then((data) => {
        cachedSchedulesMap = data && typeof data === 'object' ? data : {};
        return cachedSchedulesMap!;
      })
      .catch((err) => {
        cachedSchedulesPromise = null;
        console.warn('Could not load schedules.json:', err);
        return {};
      });
  }
  return cachedSchedulesPromise;
}

/**
 * Normalizes day schedules from compact tuple format:
 * Compact tuple: [startTimeShort, endTimeShort, courseName, roomIndex]
 */
function unpackDaySchedule(
  entry: unknown,
  dateStr: string,
  index: number,
  roomsList: RoomRecord[],
): RawSchedulePayload | null {
  if (Array.isArray(entry)) {
    const [stShort, etShort, courseName, roomIdx] = entry;
    const room = typeof roomIdx === 'number' ? roomsList[roomIdx] : null;
    const roomId = room ? room.id : String(roomIdx ?? '');
    const startTimeUtc = `${dateStr}T${stShort}:00+00:00`;
    const endTimeUtc = `${dateStr}T${etShort}:00+00:00`;
    return {
      id: `sched-${dateStr}-${index}`,
      startTime: startTimeUtc,
      endTime: endTimeUtc,
      courseName: String(courseName ?? ''),
      roomId,
    };
  }

  if (entry && typeof entry === 'object') {
    return entry as RawSchedulePayload;
  }

  return null;
}

export async function fetchAvailabilityMatrix(
  queryStart: string,
  queryEnd: string,
  selectedSemester: string,
): Promise<TimetableMatrix> {
  // 1. Fetch the static rooms list and all schedules
  const [rooms, schedulesMap] = await Promise.all([getCachedRooms(), getCachedSchedules()]);

  // 2. Fetch the schedules for the specific date of queryStart
  const dateInfo = getVietnamDateInfo(queryStart);
  const dateStr = dateInfo.dateString;

  const rawEntries = schedulesMap[dateStr] || [];
  let daySchedules: RawSchedulePayload[] = rawEntries
    .map((entry, idx) => unpackDaySchedule(entry, dateStr, idx, rooms))
    .filter((s): s is RawSchedulePayload => s !== null);

  // 3. Filter schedules by semester if applicable
  if (selectedSemester !== 'ALL') {
    daySchedules = daySchedules.filter((s) => s.semester === selectedSemester);
  }

  // 4. Map schedules by roomId for quick lookup
  const scheduleMap = new Map<string, RawSchedulePayload[]>();
  for (const s of daySchedules) {
    const roomId = typeof s.roomId === 'string' ? s.roomId : String(s.roomId ?? '');
    if (!roomId) continue;
    const bucket = scheduleMap.get(roomId) ?? [];
    bucket.push(s);
    scheduleMap.set(roomId, bucket);
  }

  // 5. Attach daily schedules to the rooms
  const roomsWithSchedules = rooms.map((room) => {
    const roomSchedules = scheduleMap.get(room.id) ?? [];
    return {
      ...room,
      schedules: roomSchedules,
    };
  });

  return parseAvailabilityMatrix({
    generatedAt: cachedGeneratedAt,
    rooms: roomsWithSchedules,
  });
}

export async function fetchDaySchedules(dateStr: string): Promise<RawSchedulePayload[]> {
  try {
    const [rooms, schedulesMap] = await Promise.all([getCachedRooms(), getCachedSchedules()]);
    const rawEntries = schedulesMap[dateStr] || [];
    return rawEntries
      .map((entry, idx) => unpackDaySchedule(entry, dateStr, idx, rooms))
      .filter((s): s is RawSchedulePayload => s !== null);
  } catch {
    return [];
  }
}

export async function fetchRoomSchedulesForDates(
  roomId: string,
  dates: string[],
): Promise<ScheduleRecord[]> {
  if (!roomId || dates.length === 0) return [];

  const [rooms, schedulesMap] = await Promise.all([getCachedRooms(), getCachedSchedules()]);
  const matchingSchedules: ScheduleRecord[] = [];

  for (const dateStr of dates) {
    const rawEntries = schedulesMap[dateStr] || [];
    for (let i = 0; i < rawEntries.length; i++) {
      const entry = rawEntries[i];
      if (Array.isArray(entry)) {
        const roomIdx = entry[3];
        const room = typeof roomIdx === 'number' ? rooms[roomIdx] : null;
        const sRoomId = room ? String(room.id) : String(roomIdx ?? '');
        if (sRoomId === roomId) {
          const unpacked = unpackDaySchedule(entry, dateStr, i, rooms);
          if (unpacked) {
            matchingSchedules.push(normalizeSchedule(unpacked, matchingSchedules.length));
          }
        }
      }
    }
  }

  return matchingSchedules;
}
