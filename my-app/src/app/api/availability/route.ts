// Availability API — reads compiled room schedule cache from public/data/room_data.json
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

import { supabaseServer } from '../../../lib/supabase/server';

const ROOM_DATA_PATH = path.join(process.cwd(), 'public/data/room_data.json');
const EMPTY_FALLBACK = { rooms: [], generatedAt: new Date().toISOString() };

const responseHeaders = {
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=240',
};

let cachedRoomData: any = null;
let lastFileReadTime: number = 0;

type RoomRow = {
  id: string;
  room_name: string;
  location_code: string;
  description: string | null;
  campus: string;
  building: string;
  floor_level: number;
  capacity: number;
  room_type: string;
};

type ScheduleRow = {
  id: string;
  room_id: string;
  semester: string;
  activity_type: string;
  start_time: string;
  end_time: string;
  course: {
    id: string;
    course_code: string;
    subject_code: string;
    subject_description: string;
    instructor_name: string;
    department: string;
  } | null;
};

type RoomAvailabilityRow = {
  id: string;
  roomName: string;
  locationCode: string;
  description: string;
  campus: string;
  building: string;
  floorLevel: number;
  capacity: number;
  roomType: string;
  status: 'AVAILABLE' | 'BUSY';
  activeCourseName?: string;
  minutesLeft?: number | null;
  schedules: Array<{
    id: string;
    semester: string;
    activityType: string;
    startTime: string;
    endTime: string;
    courseName?: string;
    instructorName?: string;
    department?: string;
  }>;
};

type AvailabilityMatrix = {
  generatedAt: string;
  rooms: RoomAvailabilityRow[];
};

function isValidIsoDateTime(value: string | null) {
  if (!value) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
}

function getLocalDateString(dateInput: Date | string) {
  const d = new Date(dateInput);
  // Shift by +7 hours to get the local day in Vietnam (UTC+7)
  const shifted = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return shifted.toISOString().split('T')[0];
}

function toAvailabilityMatrix(rooms: RoomRow[], schedules: ScheduleRow[], queryStart?: string, queryEnd?: string): AvailabilityMatrix {
  const scheduleMap = new Map<string, ScheduleRow[]>();

  for (const schedule of schedules) {
    const bucket = scheduleMap.get(schedule.room_id) ?? [];
    bucket.push(schedule);
    scheduleMap.set(schedule.room_id, bucket);
  }

  const startBoundary = queryStart ? new Date(queryStart).getTime() : Date.now();
  const endBoundary = queryEnd ? new Date(queryEnd).getTime() : Date.now();

  return {
    generatedAt: new Date().toISOString(),
    rooms: rooms.map((room) => {
      const roomSchedules = scheduleMap.get(room.id) ?? [];
      const mappedSchedules = roomSchedules.map((schedule) => ({
        id: schedule.id,
        semester: schedule.semester,
        activityType: schedule.activity_type,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        courseName: schedule.course?.subject_description ?? undefined,
        instructorName: schedule.course?.instructor_name ?? undefined,
        department: schedule.course?.department ?? undefined,
      }));

      const overlappingSchedule = roomSchedules.find((schedule) => {
        const scheduleStart = new Date(schedule.start_time).getTime();
        const scheduleEnd = new Date(schedule.end_time).getTime();
        return scheduleStart < endBoundary && scheduleEnd > startBoundary;
      });

      const nowMs = Date.now();
      const sortedSchedules = roomSchedules
        .slice()
        .sort((left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime());
      
      const todayVietnamStr = getLocalDateString(new Date(nowMs));
      const nextEvent = sortedSchedules.find((schedule) => {
        const scheduleStartMs = new Date(schedule.start_time).getTime();
        if (scheduleStartMs <= nowMs) return false;
        
        // Verify it starts TODAY in Vietnam time to avoid showing massive hour counters
        const eventVietnamStr = getLocalDateString(new Date(schedule.start_time));
        return eventVietnamStr === todayVietnamStr;
      });

      const nextStartMs = nextEvent ? new Date(nextEvent.start_time).getTime() : null;
      const minutesLeft = nextStartMs ? Math.round((nextStartMs - nowMs) / 60000) : null;

      return {
        id: room.id,
        roomName: room.room_name,
        locationCode: room.location_code,
        description: room.description ?? '',
        campus: room.campus,
        building: room.building,
        floorLevel: room.floor_level,
        capacity: room.capacity,
        roomType: room.room_type,
        status: overlappingSchedule ? 'BUSY' : 'AVAILABLE',
        activeCourseName: overlappingSchedule?.course?.subject_description,
        minutesLeft: minutesLeft,
        schedules: mappedSchedules,
      };
    }),
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryStart = searchParams.get('start');
  const queryEnd = searchParams.get('end');
  const semester = searchParams.get('semester');

  if ((queryStart || queryEnd) && (!isValidIsoDateTime(queryStart) || !isValidIsoDateTime(queryEnd))) {
    return NextResponse.json({ success: false, error: 'start and end must be valid ISO timestamps' }, { status: 400, headers: responseHeaders });
  }

  try {
    const now = Date.now();
    const cacheAge = now - lastFileReadTime;
    const fiveMinutesInMs = 5 * 60 * 1000;

    let rawData: any;

    if (cachedRoomData && cacheAge < fiveMinutesInMs) {
      rawData = cachedRoomData;
    } else {
      try {
        if (fs.existsSync(ROOM_DATA_PATH)) {
          const fileContent = await fs.promises.readFile(ROOM_DATA_PATH, 'utf-8');
          cachedRoomData = JSON.parse(fileContent);
          lastFileReadTime = Date.now();
          rawData = cachedRoomData;
        } else {
          rawData = EMPTY_FALLBACK;
        }
      } catch (fileErr) {
        console.error('Failed to read static cache file asynchronously, using fallback:', fileErr);
        rawData = EMPTY_FALLBACK;
      }
    }

    const nowMs = Date.now();
    const effectiveStart = queryStart || new Date(nowMs).toISOString();
    const effectiveEnd = queryEnd || new Date(nowMs + 60 * 60 * 1000).toISOString();

    const startBoundary = new Date(effectiveStart).getTime();
    const endBoundary = new Date(effectiveEnd).getTime();

    let targetRooms = rawData.rooms || [];

    // 1. In-memory semester filtering
    if (semester && semester !== 'ALL') {
      targetRooms = targetRooms.map((room: any) => {
        const filteredSchedules = (room.schedules || []).filter((s: any) => s.semester === semester);
        return {
          ...room,
          schedules: filteredSchedules,
        };
      });
    }

    // 2. In-memory live occupancy status calculations
    targetRooms = targetRooms.map((room: any) => {
      const roomSchedules = room.schedules || [];
      
      const overlappingSchedule = roomSchedules.find((s: any) => {
        const sStart = new Date(s.startTime || s.start_time).getTime();
        const sEnd = new Date(s.endTime || s.end_time).getTime();
        return sStart < endBoundary && sEnd > startBoundary;
      });

      const todayVietnamStr = getLocalDateString(new Date(nowMs));
      const nextEvent = roomSchedules
        .slice()
        .sort((left: any, right: any) => new Date(left.startTime || left.start_time).getTime() - new Date(right.startTime || right.start_time).getTime())
        .find((s: any) => {
          const sStartMs = new Date(s.startTime || s.start_time).getTime();
          if (sStartMs <= nowMs) return false;
          
          const eventVietnamStr = getLocalDateString(new Date(s.startTime || s.start_time));
          return eventVietnamStr === todayVietnamStr;
        });

      const nextStartMs = nextEvent ? new Date(nextEvent.startTime || nextEvent.start_time).getTime() : null;
      const minutesLeft = nextStartMs ? Math.round((nextStartMs - nowMs) / 60000) : null;

      return {
        ...room,
        status: overlappingSchedule ? 'BUSY' : 'AVAILABLE',
        activeCourseName: overlappingSchedule?.courseName || overlappingSchedule?.course?.subject_description,
        minutesLeft: minutesLeft,
      };
    });

    const payload = {
      generatedAt: rawData.generatedAt || new Date().toISOString(),
      rooms: targetRooms,
    };

    return NextResponse.json({ success: true, data: payload, source: 'STATIC_WEEKLY_CACHE' }, { status: 200, headers: responseHeaders });
  } catch (err: any) {
    console.error("Availability cache load failure, falling back:", err);
    return NextResponse.json({ success: true, data: EMPTY_FALLBACK, source: 'fallback' }, { status: 200, headers: responseHeaders });
  }
}
