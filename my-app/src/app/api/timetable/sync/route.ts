import { NextRequest, NextResponse } from 'next/server';
import { buildShardedTimetable } from '../../../../server/timetable/sharding-etl';
import {
  loadExistingRoomIds,
  publishTimetableShards,
} from '../../../../server/timetable/github-publisher';

export type RawRoomMap = Record<string, Record<string, unknown>>;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Private-Network': 'true',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function isRawRoomMap(val: unknown): val is RawRoomMap {
  return Boolean(val && typeof val === 'object' && !Array.isArray(val));
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sgs?: unknown;
      hn?: unknown;
    };

    if (!isRawRoomMap(body.sgs) || !isRawRoomMap(body.hn)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide both SGS and HN JSON datasets from the 1-Click Bookmarklet.',
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const sgs = body.sgs;
    const hn = body.hn;

    if (Object.keys(sgs).length === 0 || Object.keys(hn).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Provided SGS or HN dataset is empty.',
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const existingIds = await loadExistingRoomIds();
    const sharded = buildShardedTimetable(sgs, hn, existingIds);
    const publishResult = await publishTimetableShards(sharded);

    return NextResponse.json(
      {
        success: true,
        generatedAt: sharded.generatedAt,
        totalRooms: sharded.totalRooms,
        sgsCount: sharded.sgsCount,
        hnCount: sharded.hnCount,
        totalDays: sharded.totalDays,
        totalSchedules: sharded.totalSchedules,
        publishMode: publishResult.mode,
        commitSha: publishResult.commitSha,
        message: publishResult.message,
      },
      { headers: CORS_HEADERS },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown internal sync error';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
