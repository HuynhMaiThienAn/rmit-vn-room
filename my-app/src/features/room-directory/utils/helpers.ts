// Pure helper functions for formatting, timezone calculations, and calendar positioning.

export const VIETNAM_DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const VIETNAM_DAY_SHORT_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getVietnamDateInfo(isoString: string) {
  const d = new Date(isoString);
  // Shift by +7 hours to align with Vietnam local time (UTC+7)
  const shifted = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const date = shifted.getUTCDate();
  const day = shifted.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const hours = shifted.getUTCHours();
  const minutes = shifted.getUTCMinutes();

  return {
    year,
    month,
    date,
    day,
    hours,
    minutes,
    dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`,
  };
}

export function isSameVietnamDay(
  date1Input: Date | string | number,
  date2Input: Date | string | number,
) {
  const d1 = new Date(date1Input);
  const shifted1 = new Date(d1.getTime() + 7 * 60 * 60 * 1000);
  const str1 = shifted1.toISOString().split('T')[0];

  const d2 = new Date(date2Input);
  const shifted2 = new Date(d2.getTime() + 7 * 60 * 60 * 1000);
  const str2 = shifted2.toISOString().split('T')[0];

  return str1 === str2;
}

export function toDatetimeLocalValue(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return offsetDate.toISOString().slice(0, 16);
}

export function formatShortClock(isoString: string) {
  const info = getVietnamDateInfo(isoString);
  const hour = info.hours;
  const min = String(info.minutes).padStart(2, '0');
  return `${hour}:${min}`;
}

export function formatToday() {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

export function formatClock(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatScheduleDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDurationLeft(minutesLeft: number) {
  if (!Number.isFinite(minutesLeft) || minutesLeft <= 0) {
    return '0 mins left';
  }

  const totalMinutes = Math.ceil(minutesLeft);

  if (totalMinutes < 60) {
    return `${totalMinutes} mins left`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `${hours}h ${minutes}m left` : `${hours}h left`;
}

export function formatBuildingLabel(building: string) {
  if (!building) {
    return 'Unknown';
  }

  if (/^bldg\s+/i.test(building)) {
    return building;
  }

  if (/^\d+$/.test(building)) {
    return `Bldg ${building}`;
  }

  return building;
}

export function formatFloorLabel(floorLevel: number) {
  return `Floor ${floorLevel}`;
}

export function formatCampusName(campus: string) {
  if (campus === 'SGS') {
    return 'Saigon South Campus';
  }

  if (campus === 'HN') {
    return 'Hanoi Campus';
  }

  return campus;
}

export function formatRoomDescription(desc: string) {
  if (!desc) {
    return 'Unknown Location';
  }

  return desc.replace(/\//g, ' ');
}

export function cleanDescriptionText(desc: string) {
  if (!desc) {
    return 'Unknown Location';
  }

  // Remove SGS/HN prefix (case-insensitive, followed by spaces, underscores or hyphens)
  const stripped = desc.replace(/^(SGS|HN)[_\s-]*/i, '');

  const spaced = stripped.replace(/\//g, ' ');
  return spaced
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      if (word.startsWith('(')) {
        return '(' + word.charAt(1).toUpperCase() + word.slice(2).toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function shortenActivityType(type: string) {
  const upper = type.toUpperCase();
  if (upper.includes('TUT')) return 'Tut';
  if (upper.includes('LEC')) return 'Lec';
  if (upper.includes('PRAC')) return 'Prac';
  if (upper.includes('LAB')) return 'Lab';
  if (upper.includes('WORK')) return 'Wksp';
  if (upper.includes('SEM')) return 'Sem';
  return type;
}

export function getActivityColor(activityType: string) {
  const type = activityType.trim().toLowerCase();
  if (type.includes('lecture')) {
    return 'bg-amber-100 border border-amber-300 border-l-[6px] border-l-amber-600 text-amber-950 font-bold';
  }
  if (type.includes('tutorial')) {
    return 'bg-blue-100 border border-blue-300 border-l-[6px] border-l-blue-600 text-blue-950 font-bold';
  }
  if (type.includes('booking') || type.includes('reservation')) {
    return 'bg-teal-100 border border-teal-300 border-l-[6px] border-l-teal-600 text-teal-950 font-bold';
  }
  return 'bg-slate-100 border border-slate-300 border-l-[6px] border-l-slate-600 text-slate-950 font-bold';
}

export function groupBy<T, Key extends string | number>(items: T[], getKey: (item: T) => Key) {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    const current = groups.get(key) ?? [];
    current.push(item);
    groups.set(key, current);
    return groups;
  }, new Map<Key, T[]>());
}

export function parseFlexibleNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function normalizeCampusToken(value: string) {
  const normalized = value.trim().toUpperCase();

  if (normalized === 'SGS' || normalized === 'SAIGON SOUTH') {
    return 'SGS';
  }

  if (normalized === 'HN' || normalized === 'HANOI') {
    return 'HN';
  }

  return normalized || null;
}

// Unified Placement calculation logic for Day/Week timetable displays
export function getCalendarPlacement(
  startTime: string,
  endTime: string,
  startHour: number,
  endHour: number,
  rowHeight: number
) {
  const startInfo = getVietnamDateInfo(startTime);
  const endInfo = getVietnamDateInfo(endTime);

  const decimalStart = startInfo.hours + startInfo.minutes / 60;
  const decimalEnd = endInfo.hours + endInfo.minutes / 60;

  if (decimalEnd <= startHour || decimalStart >= endHour) return null;

  const displayStart = Math.max(startHour, decimalStart);
  const displayEnd = Math.min(endHour, decimalEnd);

  const topOffset = (displayStart - startHour) * rowHeight;
  const blockHeight = (displayEnd - displayStart) * rowHeight;

  return { topOffset, blockHeight };
}
