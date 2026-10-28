// Campus-specific operating hours and access logic. Zero React dependencies.

export function getHNClassroomHours(date: Date) {
  // Shift to Vietnam Time (UTC+7)
  const shifted = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const day = shifted.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const month = shifted.getUTCMonth(); // 0 = Jan, 5 = June

  if (day === 0) {
    // Sunday is always CLOSED for classrooms
    return { openHour: 0, openMinute: 0, closeHour: 0, closeMinute: 0, closeStr: 'Closed' };
  }

  if (day >= 1 && day <= 5) {
    // Monday - Friday: 7:30 AM - 8:30 PM (20:30)
    return { openHour: 7, openMinute: 30, closeHour: 20, closeMinute: 30, closeStr: '8:30 PM' };
  }

  // Saturday (day === 6):
  // May (4) or June (5) are typical exam peak period blocks
  const isPeakExamPeriod = month === 4 || month === 5;
  if (isPeakExamPeriod) {
    // Saturday peak: 9:00 AM - 3:00 PM (15:00)
    return { openHour: 9, openMinute: 0, closeHour: 15, closeMinute: 0, closeStr: '3:00 PM' };
  } else {
    // Saturday standard: 8:00 AM - 6:00 PM (18:00)
    return { openHour: 8, openMinute: 0, closeHour: 18, closeMinute: 0, closeStr: '6:00 PM' };
  }
}

export function getCampusAccessHoursInfo(isoString: string, campus: string) {
  const d = new Date(isoString);

  // Compute Vietnam local time components
  const shifted = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const currentHour = shifted.getUTCHours();
  const currentMinute = shifted.getUTCMinutes();
  const day = shifted.getUTCDay();

  let openHour = 7;
  let openMinute = 0;
  let closeHour = 21;
  let closeMinute = 0;
  let closeStr = '9:00 PM';

  const normalizedCampus = campus.trim().toUpperCase();

  if (normalizedCampus === 'HN' || normalizedCampus === 'HANOI') {
    const hnHours = getHNClassroomHours(d);
    openHour = hnHours.openHour;
    openMinute = hnHours.openMinute;
    closeHour = hnHours.closeHour;
    closeMinute = hnHours.closeMinute;
    closeStr = hnHours.closeStr;
  } else {
    // SGS Campus Classrooms standard access hours:
    // Monday - Friday: 7:00 AM - 9:00 PM
    // Saturday - Sunday: 8:00 AM - 6:00 PM
    const isWeekend = day === 0 || day === 6;
    openHour = isWeekend ? 8 : 7;
    openMinute = 0;
    closeHour = isWeekend ? 18 : 21;
    closeMinute = 0;
    closeStr = isWeekend ? '6:00 PM' : '9:00 PM';
  }

  // Check if closed
  let isClosed = false;
  if (closeStr === 'Closed') {
    isClosed = true;
  } else {
    const currentVal = currentHour * 60 + currentMinute;
    const openVal = openHour * 60 + openMinute;
    const closeVal = closeHour * 60 + closeMinute;
    isClosed = currentVal < openVal || currentVal >= closeVal;
  }

  return {
    isClosed,
    openHour,
    openMinute,
    closeHour,
    closeMinute,
    closeStr,
  };
}
