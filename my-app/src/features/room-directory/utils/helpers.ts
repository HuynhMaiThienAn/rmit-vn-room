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

const COURSE_COLOR_PALETTE = [
  'bg-blue-100 border border-blue-300 border-l-[3px] border-l-[#000054] text-[#000054]',
  'bg-emerald-100 border border-emerald-300 border-l-[3px] border-l-emerald-700 text-emerald-950',
  'bg-amber-100 border border-amber-300 border-l-[3px] border-l-amber-600 text-amber-950',
  'bg-purple-100 border border-purple-300 border-l-[3px] border-l-purple-700 text-purple-950',
  'bg-rose-100 border border-rose-300 border-l-[3px] border-l-[#E60028] text-rose-950',
  'bg-teal-100 border border-teal-300 border-l-[3px] border-l-teal-700 text-teal-950',
  'bg-orange-100 border border-orange-300 border-l-[3px] border-l-orange-600 text-orange-950',
  'bg-sky-100 border border-sky-300 border-l-[3px] border-l-sky-700 text-sky-950',
];

export function getActivityColor(courseName?: string) {
  const name = (courseName ?? '').trim().toLowerCase();
  if (
    !name ||
    name.startsWith('adhoc room booking') ||
    name.includes('booking') ||
    name.includes('reservation')
  ) {
    return 'bg-slate-200 border border-slate-400 border-l-[3px] border-l-slate-700 text-slate-900';
  }

  const key = name.toUpperCase();
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 33) ^ key.charCodeAt(i);
  }
  const index = Math.abs(hash) % COURSE_COLOR_PALETTE.length;
  return COURSE_COLOR_PALETTE[index];
}

export interface PositionedSchedule<T> {
  schedule: T;
  colIndex: number;
  totalCols: number;
}

function isGenericBooking(item: { activityType?: string; courseName?: string }) {
  const type = (item.activityType ?? '').trim().toLowerCase();
  const name = (item.courseName ?? '').trim().toLowerCase();
  return (
    type.includes('booking') ||
    type.includes('reservation') ||
    !name ||
    name.startsWith('adhoc room booking')
  );
}

/**
 * Resolves overlapping schedules within a single day:
 * 1. Filters out 'Online' activities that do not occupy physical rooms (if any remain).
 * 2. Deduplicates identical slots and merges overlapping generic 'Adhoc Room Bookings'.
 * 3. Suppresses generic 'Adhoc Room Bookings' when a specific class occupies the same slot.
 * 4. Assigns non-overlapping side-by-side column indices (colIndex, totalCols) for any remaining concurrent classes.
 */
export function resolveDaySchedules<
  T extends { id: string; activityType?: string; startTime: string; endTime: string; courseName?: string },
>(rawDaySchedules: T[]): PositionedSchedule<T>[] {
  // 1. Filter out purely Online sessions
  const physical = rawDaySchedules.filter(
    (s) => !(s.activityType ?? '').trim().toLowerCase().includes('online'),
  );

  // 2. Sort by start time ascending, then longer duration first
  const sorted = [...physical].sort((a, b) => {
    const startDiff = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    if (startDiff !== 0) return startDiff;
    return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
  });

  // 3. Separate specific classes from generic room bookings
  const classes: T[] = [];
  const bookings: T[] = [];

  for (const item of sorted) {
    if (isGenericBooking(item)) {
      bookings.push(item);
    } else {
      // Deduplicate identical class entries
      const isDup = classes.some(
        (c) =>
          c.startTime === item.startTime &&
          c.endTime === item.endTime &&
          (c.courseName ?? '') === (item.courseName ?? ''),
      );
      if (!isDup) classes.push(item);
    }
  }

  // Merge overlapping generic bookings into clean non-overlapping intervals
  const mergedBookings: T[] = [];
  for (const b of bookings) {
    const bStart = new Date(b.startTime).getTime();
    const bEnd = new Date(b.endTime).getTime();
    const prev = mergedBookings[mergedBookings.length - 1];
    if (prev) {
      const prevEnd = new Date(prev.endTime).getTime();
      if (bStart <= prevEnd) {
        if (bEnd > prevEnd) {
          mergedBookings[mergedBookings.length - 1] = { ...prev, endTime: b.endTime };
        }
        continue;
      }
    }
    mergedBookings.push(b);
  }

  // Keep a generic booking only if it doesn't collide with an actual scheduled class
  const keptBookings = mergedBookings.filter((b) => {
    const bStart = new Date(b.startTime).getTime();
    const bEnd = new Date(b.endTime).getTime();
    return !classes.some((c) => {
      const cStart = new Date(c.startTime).getTime();
      const cEnd = new Date(c.endTime).getTime();
      return cStart < bEnd && cEnd > bStart;
    });
  });

  // If multiple classes still overlap (e.g. multi-room cross-listed courses), deduplicate same time-window or lay out side-by-side
  const combined = [...classes, ...keptBookings].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  // 4. Group into connected overlap clusters and assign side-by-side columns
  const result: PositionedSchedule<T>[] = [];
  let cluster: T[] = [];
  let clusterMaxEnd = 0;

  const flushCluster = (items: T[]) => {
    if (items.length === 0) return;
    const columnsEndMs: number[] = [];
    const assignedCols: number[] = [];

    for (const item of items) {
      const sMs = new Date(item.startTime).getTime();
      const eMs = new Date(item.endTime).getTime();
      let placedCol = -1;
      for (let col = 0; col < columnsEndMs.length; col++) {
        if (columnsEndMs[col] <= sMs) {
          placedCol = col;
          columnsEndMs[col] = eMs;
          break;
        }
      }
      if (placedCol === -1) {
        placedCol = columnsEndMs.length;
        columnsEndMs.push(eMs);
      }
      assignedCols.push(placedCol);
    }

    const totalCols = columnsEndMs.length;
    for (let i = 0; i < items.length; i++) {
      result.push({
        schedule: items[i],
        colIndex: assignedCols[i],
        totalCols,
      });
    }
  };

  for (const item of combined) {
    const sMs = new Date(item.startTime).getTime();
    const eMs = new Date(item.endTime).getTime();
    if (cluster.length > 0 && sMs >= clusterMaxEnd) {
      flushCluster(cluster);
      cluster = [];
      clusterMaxEnd = 0;
    }
    cluster.push(item);
    if (eMs > clusterMaxEnd) {
      clusterMaxEnd = eMs;
    }
  }
  flushCluster(cluster);

  return result;
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
