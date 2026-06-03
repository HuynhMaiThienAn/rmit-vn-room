'use client';

import { useEffect, useState } from 'react';

export type AnalyticsSummary = {
  lifetimeVisits: number;
  last24Hours: number;
  topPages: Array<{
    pagePath: string;
    viewCount: number;
  }>;
};

export function useAnalytics(isValidated: boolean) {
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (!isValidated) return;

    const controller = new AbortController();

    async function loadAnalyticsSummary() {
      setIsAnalyticsLoading(true);
      setAnalyticsError(null);

      try {
        const response = await fetch('/api/analytics/summary', {
          method: 'GET',
          headers: {
            'x-admin-passcode': process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY ?? '',
          },
          cache: 'no-store',
          signal: controller.signal,
        });

        const payload = (await response.json()) as {
          success: boolean;
          data?: AnalyticsSummary;
          error?: string;
        };

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error ?? 'Failed to load analytics summary');
        }

        setAnalyticsSummary(payload.data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setAnalyticsError(
          error instanceof Error ? error.message : 'Failed to load analytics summary',
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsAnalyticsLoading(false);
        }
      }
    }

    void loadAnalyticsSummary();

    return () => {
      controller.abort();
    };
  }, [isValidated]);

  return { analyticsSummary, analyticsError, isAnalyticsLoading };
}
