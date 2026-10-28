import type { RoomRecord } from '../../../types/room';

export interface DatasetStats {
  generatedAt: string | null;
  totalRooms: number;
  sgsRooms: number;
  hnRooms: number;
}

export interface SyncApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  stats?: {
    totalRooms: number;
    sgsCount: number;
    hnCount: number;
    totalDays: number;
    totalSchedules: number;
  };
}

export async function fetchDatasetStats(): Promise<DatasetStats> {
  let totalRooms = 0;
  let sgsRooms = 0;
  let hnRooms = 0;
  let generatedAt: string | null = null;

  try {
    const metaRes = await fetch('/data/meta.json', { cache: 'no-store' });
    if (metaRes.ok) {
      const meta = await metaRes.json();
      if (meta && typeof meta === 'object') {
        generatedAt = typeof meta.generatedAt === 'string' ? meta.generatedAt : null;
        if (typeof meta.totalRooms === 'number') totalRooms = meta.totalRooms;
        if (typeof meta.sgsRooms === 'number') sgsRooms = meta.sgsRooms;
        if (typeof meta.hnRooms === 'number') hnRooms = meta.hnRooms;
      }
    }
  } catch {
    // meta.json fallback
  }

  if (totalRooms === 0) {
    try {
      const res = await fetch('/data/rooms.json', { cache: 'no-store' });
      if (res.ok) {
        const payload = await res.json();
        if (Array.isArray(payload)) {
          totalRooms = payload.length;
          for (const item of payload) {
            const roomName = Array.isArray(item) ? String(item[0]) : '';
            if (roomName.startsWith('VH')) hnRooms++;
            else sgsRooms++;
          }
        } else if (payload && Array.isArray(payload.rooms)) {
          const rooms: RoomRecord[] = payload.rooms;
          totalRooms = rooms.length;
          sgsRooms = rooms.filter((r) => r.campus === 'SGS').length;
          hnRooms = rooms.filter((r) => r.campus === 'HN').length;
          if (!generatedAt) {
            generatedAt = typeof payload.generatedAt === 'string' ? payload.generatedAt : null;
          }
        }
      }
    } catch {
      // rooms fallback
    }
  }

  return {
    generatedAt,
    totalRooms,
    sgsRooms,
    hnRooms,
  };
}

export async function syncTimetableByJson(
  sgs: Record<string, unknown>,
  hn: Record<string, unknown>,
): Promise<SyncApiResponse> {
  const res = await fetch('/api/timetable/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sgs, hn }),
  });
  const data = (await res.json()) as SyncApiResponse;
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Sync failed (HTTP ${res.status})`);
  }
  return data;
}
