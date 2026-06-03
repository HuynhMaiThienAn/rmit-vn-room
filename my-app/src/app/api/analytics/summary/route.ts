import { NextRequest, NextResponse } from 'next/server';

import { env } from '../../../../lib/env';
import { supabaseServer } from '../../../../lib/supabase/server';

type TrafficAnalyticsRow = {
  page_path: string;
  viewed_at: string;
};

function isAdminAuthorized(request: NextRequest) {
  const adminPasscode = request.headers.get('x-admin-passcode');

  return Boolean(adminPasscode && adminPasscode === env.ADMIN_SECRET_KEY);
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseServer
    .from('traffic_analytics')
    .select('page_path, viewed_at')
    .order('viewed_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as TrafficAnalyticsRow[];
  const now = Date.now();
  const lastDayThreshold = now - 24 * 60 * 60 * 1000;
  const pageViewCounts = new Map<string, number>();
  let last24Hours = 0;

  for (const row of rows) {
    pageViewCounts.set(row.page_path, (pageViewCounts.get(row.page_path) ?? 0) + 1);

    if (Number.isFinite(Date.parse(row.viewed_at)) && Date.parse(row.viewed_at) >= lastDayThreshold) {
      last24Hours += 1;
    }
  }

  const topPages = [...pageViewCounts.entries()]
    .map(([pagePath, viewCount]) => ({ pagePath, viewCount }))
    .sort((left, right) => right.viewCount - left.viewCount || left.pagePath.localeCompare(right.pagePath))
    .slice(0, 3);

  return NextResponse.json(
    {
      success: true,
      data: {
        lifetimeVisits: rows.length,
        last24Hours,
        topPages,
      },
    },
    { status: 200 },
  );
}