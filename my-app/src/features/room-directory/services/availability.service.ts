import { parseAvailabilityMatrix, normalizeSchedule, normalizeRoom } from '../utils/parse';
import { getVietnamDateInfo } from '../utils/helpers';
import type { TimetableMatrix, ScheduleRecord, RoomRecord } from '../../../types/room';

type RawSchedulePayload = Record<string, unknown>;

let cachedRooms: RoomRecord[] | null = null;
let cachedRoomsPromise: Promise<RoomRecord[]> | null = null;

let cachedGeneratedAt = '';

// In-memory cache for today's snapshot
let cachedTodayPromise: Promise<{ date: string; entries: unknown[][] }> | null = null;

// In-memory cache for individual room schedules: roomId -> schedule records
const cachedRoomShards = new Map<string, Promise<Array<[string, string, string, string]>>>();

// Fallback full schedules cache (only fetched if a non-today date or non-sharded route is requested)
let cachedFullSchedulesPromise: Promise<Record<string, unknown[][]>> | null = null;

export async function getCachedRooms(): Promise<RoomRecord[]> {
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

async function getCachedToday(): Promise<{ date: string; entries: unknown[][] }> {
  if (!cachedTodayPromise) {
    cachedTodayPromise = fetch('/data/today.json', { cache: 'default' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load today schedules snapshot');
        return res.json();
      })
      .catch(() => {
        // Fallback if today.json is not yet available: return empty entries
        return { date: '', entries: [] };
      });
  }
  return cachedTodayPromise;
}

async function getCachedRoomShard(
  roomIdentifier: string,
): Promise<Array<[string, string, string, string]>> {
  const normalizedKey = roomIdentifier.trim();
  const existing = cachedRoomShards.get(normalizedKey);
  if (existing) return existing;

  const promise = fetch(`/data/rooms/${encodeURIComponent(normalizedKey)}.json`, { cache: 'default' })
    .then((res) => {
      if (!res.ok) throw new Error(`Room shard not found: ${normalizedKey}`);
      return res.json();
    })
    .then((data) => {
      if (data && Array.isArray(data.schedules)) {
        return data.schedules as Array<[string, string, string, string]>;
      }
      return [];
    })
    .catch((err) => {
      console.warn(`Could not load room shard for ${normalizedKey}:`, err);
      return [];
    });

  cachedRoomShards.set(normalizedKey, promise);
  return promise;
}

async function getCachedFullSchedules(): Promise<Record<string, unknown[][]>> {
  if (!cachedFullSchedulesPromise) {
    cachedFullSchedulesPromise = fetch('/data/schedules.json', { cache: 'default' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load schedules');
        return res.json();
      })
      .then((data) => {
        return data && typeof data === 'object' ? data : {};
      })
      .catch((err) => {
        cachedFullSchedulesPromise = null;
        console.warn('Could not load schedules.json:', err);
        return {};
      });
  }
  return cachedFullSchedulesPromise;
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
  // 1. Fetch rooms list
  const rooms = await getCachedRooms();

  // 2. Determine target query date in Vietnam timezone
  const dateInfo = getVietnamDateInfo(queryStart);
  const dateStr = dateInfo.dateString;

  // 3. Try to use today's lightweight snapshot first (~13 KB vs ~2.4 MB)
  let rawEntries: unknown[][] = [];
  const todaySnapshot = await getCachedToday();
  if (todaySnapshot.date === dateStr && todaySnapshot.entries.length > 0) {
    rawEntries = todaySnapshot.entries;
  } else {
    // Fallback to full schedules only if query date doesn't match today's pre-computed snapshot
    const schedulesMap = await getCachedFullSchedules();
    rawEntries = schedulesMap[dateStr] || [];
  }

  let daySchedules: RawSchedulePayload[] = rawEntries
    .map((entry, idx) => unpackDaySchedule(entry, dateStr, idx, rooms))
    .filter((s): s is RawSchedulePayload => s !== null);

  // 4. Filter schedules by semester if applicable
  if (selectedSemester !== 'ALL') {
    daySchedules = daySchedules.filter((s) => s.semester === selectedSemester);
  }

  // 5. Map schedules by roomId for quick lookup
  const scheduleMap = new Map<string, RawSchedulePayload[]>();
  for (const s of daySchedules) {
    const roomId = typeof s.roomId === 'string' ? s.roomId : String(s.roomId ?? '');
    if (!roomId) continue;
    const bucket = scheduleMap.get(roomId) ?? [];
    bucket.push(s);
    scheduleMap.set(roomId, bucket);
  }

  // 6. Attach daily schedules to the rooms
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
    const rooms = await getCachedRooms();
    const todaySnapshot = await getCachedToday();
    let rawEntries: unknown[][] = [];
    if (todaySnapshot.date === dateStr && todaySnapshot.entries.length > 0) {
      rawEntries = todaySnapshot.entries;
    } else {
      const schedulesMap = await getCachedFullSchedules();
      rawEntries = schedulesMap[dateStr] || [];
    }
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

  const rooms = await getCachedRooms();
  const room = rooms.find((r) => r.id === roomId || r.roomName === roomId);
  const roomIdentifier = room?.roomName || roomId;

  // Fast path: load only this room's tiny sharded JSON (~3 - 15 KB)
  const roomSchedules = await getCachedRoomShard(roomIdentifier);
  if (roomSchedules.length > 0) {
    const targetDates = new Set(dates);
    const matchingSchedules: ScheduleRecord[] = [];

    for (let i = 0; i < roomSchedules.length; i++) {
      const [stShort, etShort, courseName, dayKey] = roomSchedules[i];
      if (targetDates.has(dayKey)) {
        const rawItem: RawSchedulePayload = {
          id: `sched-${dayKey}-${roomId}-${i}`,
          startTime: `${dayKey}T${stShort}:00+00:00`,
          endTime: `${dayKey}T${etShort}:00+00:00`,
          courseName,
          roomId: room ? room.id : roomId,
        };
        matchingSchedules.push(normalizeSchedule(rawItem, matchingSchedules.length));
      }
    }
    return matchingSchedules;
  }

  // Graceful fallback: inspect full schedules.json if room shard was empty or failed
  const schedulesMap = await getCachedFullSchedules();
  const matchingSchedules: ScheduleRecord[] = [];

  for (const dateStr of dates) {
    const rawEntries = schedulesMap[dateStr] || [];
    for (let i = 0; i < rawEntries.length; i++) {
      const entry = rawEntries[i];
      if (Array.isArray(entry)) {
        const roomIdx = entry[3];
        const r = typeof roomIdx === 'number' ? rooms[roomIdx] : null;
        const sRoomId = r ? String(r.id) : String(roomIdx ?? '');
        if (sRoomId === roomId || (r && r.roomName === roomId)) {
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
