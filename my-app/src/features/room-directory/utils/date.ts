// Pure date/time utility functions for Vietnam timezone (UTC+7). Zero React dependencies.

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
