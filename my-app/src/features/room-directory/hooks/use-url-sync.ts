'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CalendarView } from '../../../types/room';

export function normalizeRoomCode(value: string | null | undefined) {
  return value?.trim().toUpperCase() || null;
}

function getRoomCodeFromLocation() {
  if (typeof window === 'undefined') return null;
  return normalizeRoomCode(new URLSearchParams(window.location.search).get('room'));
}

function getCalendarViewFromLocation(): CalendarView | null {
  if (typeof window === 'undefined') return null;
  const view = new URLSearchParams(window.location.search).get('view');
  return view === 'week' || view === 'day' ? view : null;
}

export function writeRoomCodeToUrl(roomCode: string | null) {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  if (roomCode) {
    url.searchParams.set('room', roomCode);
  } else {
    url.searchParams.delete('room');
  }

  window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function writeCalendarViewToUrl(view: CalendarView) {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.set('view', view);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function useUrlSync() {
  const [urlRoomCode, setUrlRoomCode] = useState<string | null>(null);
  const [calendarView, setCalendarViewState] = useState<CalendarView>('week');

  useEffect(() => {
    const syncFromUrl = () => {
      setUrlRoomCode(getRoomCodeFromLocation());
      const nextView = getCalendarViewFromLocation();
      if (nextView) setCalendarViewState(nextView);
    };

    queueMicrotask(syncFromUrl);
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const setCalendarView = useCallback((view: CalendarView) => {
    setCalendarViewState(view);
    writeCalendarViewToUrl(view);
  }, []);

  return {
    urlRoomCode,
    setUrlRoomCode,
    calendarView,
    setCalendarViewState,
    setCalendarView,
  };
}
