'use client';

import { useMemo, useState } from 'react';
import {
  getVietnamDateInfo,
  VIETNAM_DAY_LABELS,
  VIETNAM_DAY_SHORT_LABELS,
} from '../utils/helpers';
import type { CalendarView } from '../../../types/room';

export function useCalendar(calendarView: CalendarView) {
  const [currentLocalDateStr, setCurrentLocalDateStr] = useState('');

  const handleNavigateCalendar = (direction: 'prev' | 'next') => {
    if (!currentLocalDateStr) return;
    const daysToShift = calendarView === 'week' ? 7 : 1;
    const currentMs = new Date(currentLocalDateStr + 'T00:00:00Z').getTime();
    const offset = direction === 'next' ? daysToShift : -daysToShift;
    const newDate = new Date(currentMs + offset * 24 * 60 * 60 * 1000);
    setCurrentLocalDateStr(getVietnamDateInfo(newDate.toISOString()).dateString);
  };

  const handleJumpToToday = () => {
    const todayInfo = getVietnamDateInfo(new Date().toISOString());
    setCurrentLocalDateStr(todayInfo.dateString);
  };

  const currentWeekDays = useMemo(() => {
    if (!currentLocalDateStr) return [];
    const parsed = new Date(currentLocalDateStr + 'T00:00:00Z');
    const day = parsed.getUTCDay();
    const offsetToMonday = day === 0 ? -6 : -(day - 1);
    const mondayMs = parsed.getTime() + offsetToMonday * 24 * 60 * 60 * 1000;

    return Array.from({ length: 7 }).map((_, i) => {
      const dayMs = mondayMs + i * 24 * 60 * 60 * 1000;
      const info = getVietnamDateInfo(new Date(dayMs).toISOString());
      const dd = String(info.date).padStart(2, '0');
      const mm = String(info.month + 1).padStart(2, '0');
      return {
        dateString: info.dateString,
        dayLabel: VIETNAM_DAY_SHORT_LABELS[info.day],
        dateLabel: `${dd}/${mm}`,
        monthLabel: info.month + 1,
        fullLabel: `${VIETNAM_DAY_SHORT_LABELS[info.day]} ${dd}/${mm}`,
      };
    });
  }, [currentLocalDateStr]);

  const calendarHeaderTitle = useMemo(() => {
    if (!currentLocalDateStr) return '';
    if (calendarView === 'week') {
      if (currentWeekDays.length === 0) return 'All weeks';
      const first = currentWeekDays[0];
      const last = currentWeekDays[6];
      return `${first.dateLabel} - ${last.dateLabel}`;
    } else {
      const parsed = new Date(currentLocalDateStr + 'T00:00:00Z');
      const info = getVietnamDateInfo(parsed.toISOString());
      const dd = String(info.date).padStart(2, '0');
      const mm = String(info.month + 1).padStart(2, '0');
      return `${VIETNAM_DAY_LABELS[info.day]}, ${dd}/${mm}/${info.year}`;
    }
  }, [calendarView, currentLocalDateStr, currentWeekDays]);

  return {
    currentLocalDateStr,
    setCurrentLocalDateStr,
    currentWeekDays,
    calendarHeaderTitle,
    handleNavigateCalendar,
    handleJumpToToday,
  };
}
