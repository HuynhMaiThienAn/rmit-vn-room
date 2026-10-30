import type { RawRoomMap } from '../../app/api/timetable/sync/route';

function getVietnamIsoNow(): string {
  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return vnTime.toISOString().replace('Z', '+07:00');
}

export interface GeneratedRoomObject {
  id: string;
  roomName: string;
  description: string;
  campus: string;
  building: string;
  floorLevel: number;
}

export interface ShardedTimetableOutput {
  generatedAt: string;
  totalRooms: number;
  sgsCount: number;
  hnCount: number;
  totalDays: number;
  totalSchedules: number;
  roomsPayload: Array<[string, string]>;
  schedulesPayload: Record<string, unknown[][]>;
  todayPayload: {
    date: string;
    generatedAt: string;
    entries: unknown[][];
  };
  byRoomShards: Record<string, { roomIndex: number; roomName: string; schedules: Array<[string, string, string, string]> }>;
  metaPayload: {
    generatedAt: string;
    totalRooms: number;
    sgsRooms: number;
    hnRooms: number;
    totalDays: number;
    totalSchedules: number;
  };
  byRoomFiles: Record<string, { roomId: string; schedules: Record<string, unknown>[] }>;
  byDayFiles: Record<string, { d: string; s: unknown[][] }>;
}

export function buildShardedTimetable(
  sgs: RawRoomMap,
  hn: RawRoomMap,
  existingRoomIdsByName: Record<string, string>,
): ShardedTimetableOutput {
  const combined: RawRoomMap = { ...sgs, ...hn };
  const updatedRoomsList: GeneratedRoomObject[] = [];
  const roomIdByName: Record<string, string> = {};

  for (const [roomName, rData] of Object.entries(combined)) {
    if (!rData || typeof rData !== 'object') continue;

    // Use unique roomName directly as roomId
    const roomId = roomName.trim();
    roomIdByName[roomName] = roomId;

    const floorParsed = Number.parseInt(String(rData.floor_level ?? '0'), 10);
    const floorLevel = Number.isFinite(floorParsed) ? floorParsed : 0;

    const description = String(rData.description ?? '');
    const campus = String(rData.campus ?? '');
    const building = String(rData.building ?? '');

    const roomObj: GeneratedRoomObject = {
      id: roomId,
      roomName,
      description,
      campus,
      building,
      floorLevel,
    };

    updatedRoomsList.push(roomObj);
  }

  updatedRoomsList.sort((a, b) => a.roomName.localeCompare(b.roomName));

  const roomIndexById = new Map<string, number>();
  updatedRoomsList.forEach((r, idx) => {
    roomIndexById.set(r.id, idx);
  });

  const CUTOFF_DATE = '2026-08-01';
  const schedulesByDay: Record<string, unknown[][]> = {};
  let totalSchedules = 0;

  for (const [roomName, rData] of Object.entries(combined)) {
    const rId = roomIdByName[roomName];
    if (!rId || !rData || typeof rData !== 'object') continue;
    const rIdx = roomIndexById.get(rId);
    if (rIdx === undefined) continue;

    const activities =
      rData.activities && typeof rData.activities === 'object' && !Array.isArray(rData.activities)
        ? (rData.activities as Record<string, Record<string, unknown>>)
        : {};

    for (const [actKey, actVal] of Object.entries(activities)) {
      if (!actVal || typeof actVal !== 'object') continue;

      const activityType = String(actVal.activity_type ?? 'Booking');
      if (activityType.toLowerCase().includes('online')) {
        continue;
      }

      const courseName = String(actVal.subject_description ?? '');
      const startTimeLocalStr = String(actVal.start_time ?? '08:00');
      const durationMins = Number.parseInt(String(actVal.duration ?? '0'), 10) || 0;
      const activitiesDays = Array.isArray(actVal.activitiesDays) ? actVal.activitiesDays : [];

      const timeParts = startTimeLocalStr.split(':').map((p) => Number.parseInt(p, 10));
      const sh = Number.isFinite(timeParts[0]) ? timeParts[0] : 8;
      const sm = Number.isFinite(timeParts[1]) ? timeParts[1] : 0;

      for (const dayItem of activitiesDays) {
        const dayStr = String(dayItem ?? '');
        const parts = dayStr.split('/').map((p) => Number.parseInt(p, 10));
        if (parts.length !== 3 || !parts.every((n) => Number.isFinite(n))) continue;
        const [d, m, y] = parts;

        const dayKey = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (dayKey < CUTOFF_DATE) {
          continue;
        }

        const localStartMs = Date.UTC(y, m - 1, d, sh, sm, 0);
        const utcStartMs = localStartMs - 7 * 60 * 60 * 1000;
        const utcEndMs = utcStartMs + durationMins * 60 * 1000;

        const startHhmm = new Date(utcStartMs).toISOString().substring(11, 16);
        const endHhmm = new Date(utcEndMs).toISOString().substring(11, 16);

        // Compact tuple: [startTimeShort, endTimeShort, courseName, roomIndex]
        const tupleRecord = [startHhmm, endHhmm, courseName, rIdx];

        if (!schedulesByDay[dayKey]) {
          schedulesByDay[dayKey] = [];
        }
        schedulesByDay[dayKey].push(tupleRecord);
        totalSchedules++;
      }
    }
  }

  const byRoomFiles: Record<string, { roomId: string; schedules: Record<string, unknown>[] }> = {};
  const byRoomShards: Record<string, { roomIndex: number; roomName: string; schedules: Array<[string, string, string, string]> }> = {};
  for (let i = 0; i < updatedRoomsList.length; i++) {
    byRoomShards[updatedRoomsList[i].id] = {
      roomIndex: i,
      roomName: updatedRoomsList[i].roomName,
      schedules: [],
    };
  }

  const byDayFiles: Record<string, { d: string; s: unknown[][] }> = {};
  const schedulesPayload: Record<string, unknown[][]> = {};
  for (const [dayKey, scheds] of Object.entries(schedulesByDay)) {
    scheds.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    byDayFiles[dayKey] = { d: dayKey, s: scheds };
    schedulesPayload[dayKey] = scheds;

    for (const item of scheds) {
      const roomIdx = typeof item[3] === 'number' ? item[3] : -1;
      const targetRoom = updatedRoomsList[roomIdx];
      if (targetRoom && byRoomShards[targetRoom.id]) {
        byRoomShards[targetRoom.id].schedules.push([
          String(item[0]),
          String(item[1]),
          String(item[2]),
          dayKey,
        ]);
      }
    }
  }

  const generatedAt = getVietnamIsoNow();
  const sgsCount = updatedRoomsList.filter((r) => r.campus === 'SGS').length;
  const hnCount = updatedRoomsList.filter((r) => r.campus === 'HN').length;

  // Option B: compact tuple array [roomName, description]
  const compactRoomsList: Array<[string, string]> = updatedRoomsList.map((r) => [
    r.roomName,
    r.description,
  ]);

  return {
    generatedAt,
    totalRooms: updatedRoomsList.length,
    sgsCount,
    hnCount,
    totalDays: Object.keys(byDayFiles).length,
    totalSchedules,
    roomsPayload: compactRoomsList,
    schedulesPayload,
    todayPayload: {
      date: generatedAt.slice(0, 10),
      generatedAt,
      entries: schedulesPayload[generatedAt.slice(0, 10)] || [],
    },
    byRoomShards,
    metaPayload: {
      generatedAt,
      totalRooms: updatedRoomsList.length,
      sgsRooms: sgsCount,
      hnRooms: hnCount,
      totalDays: Object.keys(byDayFiles).length,
      totalSchedules,
    },
    byRoomFiles,
    byDayFiles,
  };
}
