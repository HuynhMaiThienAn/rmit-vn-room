"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const controller = new AbortController();

    void fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_path: pathname }),
      keepalive: true,
      signal: controller.signal,
    }).catch(() => {});

    return () => {
      controller.abort();
    };
  }, [pathname, searchParams.toString()]);

  return null;
}