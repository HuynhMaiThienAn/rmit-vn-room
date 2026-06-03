import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

import { env } from '../../../../lib/env';
import { supabaseServer } from '../../../../lib/supabase/server';

type RoomUpsertRow = {
  room_name: string;
  location_code: string;
  description: string | null;
  campus: string;
  building: string;
  floor_level: number;
  capacity: number;
  room_type: string;
};

type CourseUpsertRow = {
  course_code: string;
  subject_code: string;
  subject_description: string;
  instructor_name: string;
  department: string;
};

type ScheduleInsertRow = {
  room_id: string;
  course_id: string;
  semester: string;
  activity_type: string;
  start_time: string;
  end_time: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toRequiredText(value: unknown, fallback = '') {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function toRequiredInteger(value: unknown, fieldName: string) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  throw new Error(`${fieldName} must be a valid integer`);
}

function extractCourseCode(activityKey: string, activityValue: Record<string, unknown>) {
  const explicitCode = toRequiredText(activityValue.course_code ?? activityValue.courseCode ?? activityValue.code);

  if (explicitCode) {
    return explicitCode.split('|')[0].trim();
  }

  const [courseCode] = activityKey.split('|');
  return courseCode.trim();
}

function extractDayText(value: unknown) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (isRecord(value)) {
    return toRequiredText(
      value.day ?? value.date ?? value.dayText ?? value.label ?? value.value,
    );
  }

  return '';
}

function extractDays(activityValue: Record<string, unknown>) {
  const candidates = [
    activityValue.activitiesDays,
    activityValue.activities_days,
    activityValue.days,
    activityValue.sessions,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function extractActivityEntries(roomValue: Record<string, unknown>) {
  const activities = roomValue.activities;

  if (!isRecord(activities)) {
    return [] as Array<[string, Record<string, unknown>]>;
  }

  return Object.entries(activities).filter((entry): entry is [string, Record<string, unknown>] => isRecord(entry[1]));
}

function parseDateTime(dayText: string, clockText: string) {
  const dayParts = dayText.split('/').map((part) => part.trim());

  if (dayParts.length !== 3) {
    throw new Error(`Invalid day value: ${dayText}`);
  }

  const [day, month, year] = dayParts.map((part) => Number.parseInt(part, 10));
  const [hour, minute] = clockText.split(':').map((part) => Number.parseInt(part.trim(), 10));

  if (![day, month, year, hour, minute].every((value) => Number.isFinite(value))) {
    throw new Error(`Invalid date/time combination: ${dayText} ${clockText}`);
  }

  // Construct a standard ISO format string using local parameters
  const paddedMonth = String(month).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');
  const paddedHour = String(hour).padStart(2, '0');
  const paddedMinute = String(minute).padStart(2, '0');
  
  // Explicitly tag the ISO string with the +07:00 Vietnam timezone offset
  const localIsoString = `${year}-${paddedMonth}-${paddedDay}T${paddedHour}:${paddedMinute}:00+07:00`;
  const startDateTime = new Date(localIsoString);

  if (Number.isNaN(startDateTime.getTime())) {
    throw new Error(`Unable to parse timestamp: ${dayText} ${clockText}`);
  }

  return startDateTime.toISOString();
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function parseIncomingJson(rawText: string) {
  const parsed = JSON.parse(rawText) as unknown;

  if (!isRecord(parsed)) {
    throw new Error('Dataset must be a valid JSON object');
  }

  return parsed;
}

export async function POST(request: NextRequest) {
  const adminPasscode = request.headers.get('x-admin-passcode');

  if (!adminPasscode || adminPasscode !== env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rawText = (await request.text()).trim();

    if (!rawText) {
      return NextResponse.json({ success: false, error: 'rawText is required' }, { status: 400 });
    }

    const parsedJsonData = parseIncomingJson(rawText);
    const roomEntries = Object.entries(parsedJsonData);

    if (roomEntries.length === 0) {
      throw new Error('Dataset must contain at least one room entry');
    }

    const roomRows: RoomUpsertRow[] = [];
    const courseRowsByCode = new Map<string, CourseUpsertRow>();
    const scheduleBlueprints: Array<{
      roomName: string;
      courseCode: string;
      semester: string;
      activityType: string;
      startTime: string;
      endTime: string;
    }> = [];

    for (const [roomKey, roomValueCandidate] of roomEntries) {
      if (!isRecord(roomValueCandidate)) {
        continue;
      }

      const roomValue = roomValueCandidate;
      const roomName = toRequiredText(roomValue.room_name ?? roomValue.roomName, roomKey);
      const locationCode = toRequiredText(roomValue.location_code ?? roomValue.locationCode, 'UNKNOWN');
      const rawDescription = toRequiredText(roomValue.description, '');
      const cleanDescription = rawDescription.replace(/\\\//g, '/');
      const campus = toRequiredText(roomValue.campus, 'SGS').toUpperCase();
      const building = toRequiredText(roomValue.building, 'UNKNOWN');
      const roomType = toRequiredText(roomValue.type ?? roomValue.room_type ?? roomValue.roomType, 'Booking');

      roomRows.push({
        room_name: roomName,
        location_code: locationCode,
        description: cleanDescription || null,
        campus,
        building,
        floor_level: toRequiredInteger(roomValue.floor_level ?? roomValue.floorLevel, 'floor_level'),
        capacity: toRequiredInteger(roomValue.capacity, 'capacity'),
        room_type: roomType,
      });

      const activityEntries = extractActivityEntries(roomValue);

      for (const [activityKey, activityValue] of activityEntries) {
        const courseCode = extractCourseCode(activityKey, activityValue);

        if (!courseCode) {
          throw new Error(`Unable to determine course code for activity ${activityKey} in room ${roomName}`);
        }

        const subjectCode = toRequiredText(activityValue.subject_code ?? activityValue.subjectCode ?? courseCode);
        const subjectDescription = toRequiredText(
          activityValue.subject_description ?? activityValue.subjectDescription ?? activityValue.course_name ?? activityValue.courseName,
          subjectCode,
        );
        const instructorName = toRequiredText(activityValue.staff ?? activityValue.instructor_name ?? activityValue.instructorName, 'TBA');
        const department = toRequiredText(activityValue.department, 'Unknown');
        const semester = toRequiredText(activityValue.semester, '');
        const activityType = toRequiredText(activityValue.activity_type ?? activityValue.activityType ?? activityValue.type, 'Booking');
        const durationMinutes = toRequiredInteger(activityValue.duration ?? activityValue.duration_minutes ?? activityValue.durationMinutes, 'duration');
        const startClock = toRequiredText(activityValue.start_time ?? activityValue.startTime);

        courseRowsByCode.set(courseCode, {
          course_code: courseCode,
          subject_code: subjectCode,
          subject_description: subjectDescription,
          instructor_name: instructorName,
          department,
        });

        for (const dayItem of extractDays(activityValue)) {
          const dayText = extractDayText(dayItem);

          if (!dayText) {
            continue;
          }

          const dayStartTime = isRecord(dayItem)
            ? toRequiredText(dayItem.start_time ?? dayItem.startTime ?? startClock, startClock)
            : startClock;

          const durationFromDay = isRecord(dayItem)
            ? dayItem.duration ?? dayItem.duration_minutes ?? dayItem.durationMinutes
            : durationMinutes;

          const parsedStartTime = parseDateTime(dayText, dayStartTime);
          const parsedDuration = toRequiredInteger(durationFromDay, 'duration');
          const startDate = new Date(parsedStartTime);
          const endDate = new Date(startDate.getTime() + parsedDuration * 60_000);

          scheduleBlueprints.push({
            roomName,
            courseCode,
            semester,
            activityType,
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          });
        }
      }
    }

    if (roomRows.length === 0) {
      throw new Error('Dataset did not contain any valid room records');
    }

    if (courseRowsByCode.size === 0) {
      throw new Error('Dataset did not contain any valid course records');
    }

    if (scheduleBlueprints.length === 0) {
      throw new Error('Dataset did not produce any schedule records');
    }

    const { data: roomRowsInserted, error: roomError } = await supabaseServer
      .from('rooms')
      .upsert(roomRows, { onConflict: 'room_name' })
      .select('id, room_name');

    if (roomError) {
      throw new Error(roomError.message);
    }

    const courseRows = Array.from(courseRowsByCode.values());
    const { data: courseRowsInserted, error: courseError } = await supabaseServer
      .from('courses')
      .upsert(courseRows, { onConflict: 'course_code' })
      .select('id, course_code');

    if (courseError) {
      throw new Error(courseError.message);
    }

    const roomIdByName = new Map((roomRowsInserted ?? []).map((row) => [row.room_name, row.id]));
    const courseIdByCode = new Map((courseRowsInserted ?? []).map((row) => [row.course_code, row.id]));

    const scheduleRows: ScheduleInsertRow[] = [];

    for (const blueprint of scheduleBlueprints) {
      const roomId = roomIdByName.get(blueprint.roomName);
      const courseId = courseIdByCode.get(blueprint.courseCode);

      if (!roomId || !courseId) {
        continue;
      }

      const startDate = new Date(blueprint.startTime);
      if (Number.isNaN(startDate.getTime())) {
        continue;
      }

      scheduleRows.push({
        room_id: roomId,
        course_id: courseId,
        semester: blueprint.semester,
        activity_type: blueprint.activityType,
        start_time: startDate.toISOString(),
        end_time: blueprint.endTime,
      });
    }

    // Only delete schedules for rooms present in this upload (scoped deletion).
    // This preserves schedules from other campuses that were uploaded separately.
    const uploadedRoomIds = (roomRowsInserted ?? []).map((row) => row.id);

    for (const idChunk of chunkArray(uploadedRoomIds, 200)) {
      const { error: deleteError } = await supabaseServer
        .from('schedules')
        .delete()
        .in('room_id', idChunk);

      if (deleteError) {
        throw new Error(deleteError.message);
      }
    }

    for (const scheduleChunk of chunkArray(scheduleRows, 500)) {
      const { error: scheduleError } = await supabaseServer.from('schedules').insert(scheduleChunk);

      if (scheduleError) {
        throw new Error(scheduleError.message);
      }
    }

    // -------------------------------------------------------------
    // Compile and cache pre-aggregated view data to room_data.json
    // -------------------------------------------------------------
    try {
      const PAGE_SIZE = 1000;
      let allSchedules: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabaseServer
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
      }

      const roomsResult = await supabaseServer
        .from('rooms')
        .select('id, room_name, location_code, description, campus, building, floor_level, capacity, room_type')
        .order('room_name', { ascending: true });

      if (roomsResult.error) {
        throw new Error(roomsResult.error.message);
      }

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

      const compiledRooms = (roomsResult.data ?? []).map((room) => {
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
    } catch (e) {
      console.error("Failed to generate and write static JSON cache:", e);
    }

    revalidatePath('/');
    revalidatePath('/rooms');

    return NextResponse.json(
      {
        success: true,
        data: {
          roomsUpserted: roomRows.length,
          coursesUpserted: courseRows.length,
          schedulesInserted: scheduleRows.length,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update data';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}