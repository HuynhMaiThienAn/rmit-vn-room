'use client';

import React from 'react';
import type { AnalyticsSummary } from '../hooks/use-analytics';

interface AnalyticsBoardProps {
  analyticsSummary: AnalyticsSummary | null;
  analyticsError: string | null;
  isAnalyticsLoading: boolean;
}

export function AnalyticsBoard({
  analyticsSummary,
  analyticsError,
  isAnalyticsLoading,
}: AnalyticsBoardProps) {
  return (
    <section className="bg-white border border-black rounded-lg p-6 md:p-8 shadow-xs">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-500">
            Traffic analytics
          </p>
          <h2 className="mt-3 text-2xl font-normal tracking-tight text-[#000054]">
            Front-end usage overview
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          {isAnalyticsLoading ? 'Refreshing dashboard data...' : 'Live summary from traffic_analytics'}
        </p>
      </div>

      {analyticsError ? (
        <p className="mt-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {analyticsError}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          {
            label: 'Lifetime Visits',
            value: analyticsSummary?.lifetimeVisits ?? 0,
          },
          {
            label: '24-Hour Traffic',
            value: analyticsSummary?.last24Hours ?? 0,
          },
          {
            label: 'Top Pages',
            value: analyticsSummary?.topPages.length ?? 0,
          },
        ].map((stat) => (
          <article key={stat.label} className="rounded-lg border border-black bg-slate-50 p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-normal tracking-tight text-[#000054]">
              {stat.value}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-black bg-white p-5 shadow-xs">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
          Highest traffic pages
        </p>
        <div className="mt-4 space-y-3">
          {(analyticsSummary?.topPages ?? []).length ? (
            analyticsSummary?.topPages.map((page) => (
              <div
                key={page.pagePath}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center sm:text-left"
              >
                <span className="font-semibold text-slate-800">{page.pagePath}</span>
                <span className="text-sm text-slate-500">{page.viewCount} views</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No tracked pageviews are available yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
