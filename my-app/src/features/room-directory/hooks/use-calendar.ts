'use client';

import { useMemo, useState } from 'react';
import { getVietnamDateInfo, VIETNAM_DAY_LABELS, VIETNAM_DAY_SHORT_LABELS } from '../utils/date';
import type { CalendarView } from '../../../types/room';

export function useCalendar() {
  const [calendarView, setCalendarView] = useState<CalendarView>('day');
  const [currentLocalDateStr, setCurrentLocalDateStr] = useState('');
  const [expandedFloors, setExpandedFloors] = useState<Record<number, boolean>>({});

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

  const toggleFloorCollapse = (floor: number) => {
    setExpandedFloors((prev) => {
      const currentVal = prev[floor] !== false;
      return { ...prev, [floor]: !currentVal };
    });
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
      return {
        dateString: info.dateString,
        dayLabel: VIETNAM_DAY_SHORT_LABELS[info.day],
        dateLabel: info.date,
        monthLabel: info.month + 1,
        fullLabel: `${VIETNAM_DAY_SHORT_LABELS[info.day]} ${info.date}/${info.month + 1}`,
      };
    });
  }, [currentLocalDateStr]);

  const calendarHeaderTitle = useMemo(() => {
    if (!currentLocalDateStr) return '';
    if (calendarView === 'week') {
      if (currentWeekDays.length === 0) return 'All weeks';
      const first = currentWeekDays[0];
      const last = currentWeekDays[6];
      return `${first.dateLabel}/${first.monthLabel} - ${last.dateLabel}/${last.monthLabel}`;
    } else {
      const parsed = new Date(currentLocalDateStr + 'T00:00:00Z');
      const info = getVietnamDateInfo(parsed.toISOString());
      return `${VIETNAM_DAY_LABELS[info.day]}, ${info.date}/${info.month + 1}/${info.year}`;
    }
  }, [calendarView, currentLocalDateStr, currentWeekDays]);

  return {
    calendarView, setCalendarView,
    currentLocalDateStr, setCurrentLocalDateStr,
    expandedFloors,
    handleNavigateCalendar,
    handleJumpToToday,
    toggleFloorCollapse,
    currentWeekDays,
    calendarHeaderTitle,
  };
}
