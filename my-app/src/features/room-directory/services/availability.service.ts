import { parseAvailabilityMatrix, normalizeSchedule } from '../utils/parse';
import { getVietnamDateInfo } from '../utils/helpers';
import type { TimetableMatrix, ScheduleRecord } from '../../../types/room';

export async function fetchAvailabilityMatrix(
  queryStart: string,
  queryEnd: string,
  selectedSemester: string,
): Promise<TimetableMatrix> {
  // 1. Fetch the static rooms list
  const roomsRes = await fetch('/data/rooms.json', { cache: 'default' });
  if (!roomsRes.ok) {
    throw new Error('Failed to load rooms list');
  }
  const roomsPayload = await roomsRes.json();
  const rooms = roomsPayload.rooms || [];
  const generatedAt = roomsPayload.generatedAt;

  // 2. Fetch the schedules for the specific date of queryStart
  const dateInfo = getVietnamDateInfo(queryStart);
  const dateStr = dateInfo.dateString;

  let daySchedules: any[] = [];
  try {
    const dayRes = await fetch(`/data/schedules/by-day/${dateStr}.json`, { cache: 'default' });
    if (dayRes.ok) {
      const dayPayload = await dayRes.json();
      daySchedules = dayPayload.schedules || [];
    }
  } catch (err) {
    console.warn(`Could not load schedules for date ${dateStr}, defaulting to empty schedules:`, err);
  }

  // 3. Filter schedules by semester if applicable
  if (selectedSemester !== 'ALL') {
    daySchedules = daySchedules.filter((s: any) => s.semester === selectedSemester);
  }

  // 4. Map schedules by roomId for quick lookup
  const scheduleMap = new Map<string, any[]>();
  for (const s of daySchedules) {
    const bucket = scheduleMap.get(s.roomId) ?? [];
    bucket.push(s);
    scheduleMap.set(s.roomId, bucket);
  }

  // 5. Attach daily schedules to the rooms
  const roomsWithSchedules = rooms.map((room: any) => {
    const roomSchedules = scheduleMap.get(room.id) ?? [];
    return {
      ...room,
      schedules: roomSchedules,
    };
  });

  return parseAvailabilityMatrix({
    generatedAt,
    rooms: roomsWithSchedules,
  });
}

export async function fetchRoomSchedules(roomId: string): Promise<ScheduleRecord[]> {
  const response = await fetch(`/data/schedules/by-room/${roomId}.json`, {
    cache: 'default',
  });
  if (!response.ok) {
    if (response.status === 404) {
      // Room has no schedules at all for the semester
      return [];
    }
    throw new Error('Failed to load schedules for room');
  }
  const payload = await response.json();
  const rawSchedules = Array.isArray(payload.schedules) ? payload.schedules : [];
  return rawSchedules.map((s: any, idx: number) => normalizeSchedule(s, idx));
}
