'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchAvailabilityMatrix } from '../services/availability.service';
import type { TimetableMatrix, RoomRecord } from '../../../types/room';

export function useAvailability(
  queryStart: string,
  queryEnd: string,
  selectedSemester: string,
) {
  const [matrix, setMatrix] = useState<TimetableMatrix>({ rooms: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowTime, setNowTime] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const prevDepsRef = useRef({ queryStart, queryEnd, selectedSemester });

  // Live countdown ticker (15 s)
  useEffect(() => {
    setNowTime(new Date().toISOString());
    const id = setInterval(() => setNowTime(new Date().toISOString()), 15_000);
    return () => clearInterval(id);
  }, []);

  // Background re-fetch trigger (60 s)
  useEffect(() => {
    const id = setInterval(() => setRefreshTrigger((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Data fetch
  useEffect(() => {
    let mounted = true;

    async function load(isSilent: boolean) {
      if (!queryStart || !queryEnd) return;
      try {
        if (!isSilent) setLoading(true);
        const nextMatrix = await fetchAvailabilityMatrix(queryStart, queryEnd, selectedSemester);
        if (mounted) {
          setMatrix(nextMatrix);
          setError(null);
        }
      } catch (err) {
        if (mounted && !isSilent) {
          setError(err instanceof Error ? err.message : 'Failed to load schedule matrix');
        }
      } finally {
        if (mounted && !isSilent) setLoading(false);
      }
    }

    const prev = prevDepsRef.current;
    const depsChanged =
      prev.queryStart !== queryStart ||
      prev.queryEnd !== queryEnd ||
      prev.selectedSemester !== selectedSemester;
    prevDepsRef.current = { queryStart, queryEnd, selectedSemester };

    const isSilent = !depsChanged && matrix.rooms.length > 0;
    void load(isSilent);

    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryStart, queryEnd, selectedSemester, refreshTrigger]);

  /**
   * Sync the selected room reference from the new matrix after a background refresh.
   * Pass in the current selectedRoom and its setter so the hook can handle reconciliation.
   */
  function syncSelectedRoom(
    current: RoomRecord | null,
    setSelectedRoom: (r: RoomRecord | null) => void,
  ) {
    if (!current) return;
    const updated = matrix.rooms.find((r) => r.id === current.id) ?? null;
    setSelectedRoom(updated);
  }

  return { matrix, loading, error, nowTime, syncSelectedRoom };
}
