import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { env } from '../../../../lib/env';

const supabasePublic = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

type TrackPayload = {
  page_path?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as TrackPayload;
    const pagePath = typeof payload.page_path === 'string' ? payload.page_path.trim() : '';

    if (pagePath) {
      const { error } = await supabasePublic.from('traffic_analytics').insert({
        page_path: pagePath,
      });

      if (error) {
        console.error('Failed to record pageview', error.message);
      }
    }
  } catch {
    // Keep analytics best-effort and never block navigation.
  }

  return NextResponse.json({ success: true }, { status: 200 });
}