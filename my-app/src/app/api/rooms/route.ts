import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabaseServer } from '../../../lib/supabase/server';

const ROOM_DATA_PATH = path.join(process.cwd(), 'public/data/room_data.json');

export async function GET() {
  try {
    // 1. Try reading from the cached JSON file first (fastest)
    if (fs.existsSync(ROOM_DATA_PATH)) {
      try {
        const fileContent = await fs.promises.readFile(ROOM_DATA_PATH, 'utf-8');
        const rawData = JSON.parse(fileContent);
        if (rawData && Array.isArray(rawData.rooms)) {
          return NextResponse.json({ success: true, data: rawData.rooms });
        }
      } catch (fileErr) {
        console.error('Failed to read cached rooms, falling back to Supabase:', fileErr);
      }
    }

    // 2. Fallback to querying Supabase directly
    const { data: dbRooms, error: dbError } = await supabaseServer
      .from('rooms')
      .select('*')
      .order('room_name');

    if (dbError) {
      throw dbError;
    }

    // Normalize property names if they match database column naming schema
    const rooms = (dbRooms ?? []).map((r: any) => ({
      id: r.id,
      roomName: r.room_name ?? r.roomName,
      locationCode: r.location_code ?? r.locationCode,
      description: r.description,
      campus: r.campus,
      building: r.building,
      floorLevel: r.floor_level ?? r.floorLevel,
      capacity: r.capacity,
      roomType: r.room_type ?? r.roomType,
    }));

    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load rooms';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}