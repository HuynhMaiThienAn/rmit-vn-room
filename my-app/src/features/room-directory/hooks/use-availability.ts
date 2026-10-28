'use client';

import { useEffect, useState } from 'react';
import { fetchAvailabilityMatrix } from '../services/availability.service';
import { getVietnamDateInfo, toDatetimeLocalValue } from '../utils/helpers';
import type { TimetableMatrix } from '../../../types/room';

const DASHBOARD_WINDOW_MS = 60 * 60 * 1000;

export function useAvailability(selectedSemester: string) {
  const [queryStart, setQueryStart] = useState('');
  const [queryEnd, setQueryEnd] = useState('');
  const [matrix, setMatrix] = useState<TimetableMatrix>({ rooms: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowTime, setNowTime] = useState('');

  // Initialize query bounds and tick clock every 15s (rolling over queryStart only when the Vietnam date changes)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const iso = now.toISOString();
      setNowTime(iso);

      setQueryStart((prevStart) => {
        if (!prevStart) {
          setQueryEnd(toDatetimeLocalValue(new Date(now.getTime() + DASHBOARD_WINDOW_MS)));
          return toDatetimeLocalValue(now);
        }
        const prevDay = getVietnamDateInfo(new Date(prevStart).toISOString()).dateString;
        const currentDay = getVietnamDateInfo(iso).dateString;
        if (prevDay !== currentDay) {
          setQueryEnd(toDatetimeLocalValue(new Date(now.getTime() + DASHBOARD_WINDOW_MS)));
          return toDatetimeLocalValue(now);
        }
        return prevStart;
      });
    };

    updateClock();
    const interval = window.setInterval(updateClock, 15000);
    return () => window.clearInterval(interval);
  }, []);

  // Fetch occupancy matrix whenever query bounds change
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!queryStart || !queryEnd) return;
      try {
        setLoading(true);
        setError(null);
        const nextMatrix = await fetchAvailabilityMatrix(queryStart, queryEnd, selectedSemester);
        if (mounted) {
          setMatrix(nextMatrix);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load schedule matrix');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [queryStart, queryEnd, selectedSemester]);

  return {
    queryStart,
    queryEnd,
    matrix,
    loading,
    error,
    nowTime,
  };
}
