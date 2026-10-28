'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchDatasetStats,
  syncTimetableByJson,
  type DatasetStats,
  type SyncApiResponse,
} from '../services/sync.service';

export function useTimetableSync() {
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncApiResponse | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const next = await fetchDatasetStats();
      setStats(next);
    } catch {
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchDatasetStats()
      .then((next) => {
        if (active) setStats(next);
      })
      .catch(() => {
        if (active) setStats(null);
      })
      .finally(() => {
        if (active) setLoadingStats(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSyncWithJsonFiles = async (sgsFile: File, hnFile: File) => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const [sgsText, hnText] = await Promise.all([sgsFile.text(), hnFile.text()]);
      const sgs = JSON.parse(sgsText) as Record<string, unknown>;
      const hn = JSON.parse(hnText) as Record<string, unknown>;
      const result = await syncTimetableByJson(sgs, hn);
      setSyncResult(result);
      await refreshStats();
    } catch (err) {
      setSyncError(
        err instanceof Error ? err.message : 'Failed to parse or upload JSON files',
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    stats,
    loadingStats,
    isSyncing,
    syncError,
    syncResult,
    handleSyncWithJsonFiles,
  };
}
