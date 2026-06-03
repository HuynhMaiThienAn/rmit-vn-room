import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generate() {
  console.log("Generating room_data.json from Supabase...");
  try {
    const PAGE_SIZE = 1000;
    let allSchedules: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('schedules')
        .select('id, room_id, semester, activity_type, start_time, end_time, course:courses(id, course_code, subject_code, subject_description, instructor_name, department)')
        .order('start_time', { ascending: true })
        .range(from, to);

      if (error) {
        throw new Error(error.message);
      }

      const rows = data ?? [];
      allSchedules = allSchedules.concat(rows);
      hasMore = rows.length === PAGE_SIZE;
      page++;
      console.log(`Fetched page ${page}... total schedules: ${allSchedules.length}`);
    }

    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, room_name, location_code, description, campus, building, floor_level, capacity, room_type')
      .order('room_name', { ascending: true });

    if (roomsError) {
      throw new Error(roomsError.message);
    }

    console.log(`Fetched ${rooms?.length} rooms.`);

    const nowMs = Date.now();
    const defaultStart = new Date(nowMs).toISOString();
    const defaultEnd = new Date(nowMs + 60 * 60 * 1000).toISOString();

    const scheduleMap = new Map<string, any[]>();
    for (const s of allSchedules) {
      const bucket = scheduleMap.get(s.room_id) ?? [];
      bucket.push(s);
      scheduleMap.set(s.room_id, bucket);
    }

    const startBoundary = new Date(defaultStart).getTime();
    const endBoundary = new Date(defaultEnd).getTime();

    const getVNDateStr = (dInput: Date | string) => {
      const d = new Date(dInput);
      const shifted = new Date(d.getTime() + 7 * 60 * 60 * 1000);
      return shifted.toISOString().split('T')[0];
    };

    const compiledRooms = (rooms ?? []).map((room) => {
      const roomSchedules = scheduleMap.get(room.id) ?? [];
      const mappedSchedules = roomSchedules.map((s) => ({
        id: s.id,
        semester: s.semester,
        activityType: s.activity_type,
        startTime: s.start_time,
        endTime: s.end_time,
        courseName: s.course?.subject_description ?? undefined,
        instructorName: s.course?.instructor_name ?? undefined,
        department: s.course?.department ?? undefined,
      }));

      const overlappingSchedule = roomSchedules.find((s) => {
        const sStart = new Date(s.start_time).getTime();
        const sEnd = new Date(s.end_time).getTime();
        return sStart < endBoundary && sEnd > startBoundary;
      });

      const todayVietnamStr = getVNDateStr(new Date(nowMs));
      const nextEvent = roomSchedules
        .slice()
        .sort((left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime())
        .find((s) => {
          const sStartMs = new Date(s.start_time).getTime();
          if (sStartMs <= nowMs) return false;
          return getVNDateStr(new Date(s.start_time)) === todayVietnamStr;
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
    });

    const finalizedPayload = {
      generatedAt: new Date().toISOString(),
      rooms: compiledRooms,
    };

    const targetPath = path.join(process.cwd(), "public/data/room_data.json");
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, JSON.stringify(finalizedPayload, null, 2), "utf-8");
    console.log("SUCCESS: Real room_data.json cache generated successfully!");
  } catch (err) {
    console.error("Failed to generate cache:", err);
  }
}

generate();
