import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function POST() {
  return new NextResponse(null, { status: 410 });
}