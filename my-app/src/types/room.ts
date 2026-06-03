// Single source of truth for all shared runtime types used across the room-directory feature.

export type CourseRecord = {
  subjectDescription: string;
  instructorName?: string;
  department?: string;
};

export type ScheduleRecord = {
  id: string;
  semester: string;
  activityType: string;
  startTime: string;
  endTime: string;
  courseName?: string;
  instructorName?: string;
  department?: string;
  course?: CourseRecord | null;
};

export type RoomRecord = {
  id: string;
  roomName: string;
  locationCode: string;
  description: string;
  campus: 'SGS' | 'HN' | string;
  building: string;
  floorLevel: number;
  capacity: number;
  roomType: string;
  status: 'AVAILABLE' | 'BUSY';
  activeCourseName?: string;
  minutesLeft?: number | null;
  schedules: ScheduleRecord[];
};

export type TimetableMatrix = {
  generatedAt?: string;
  rooms: RoomRecord[];
};

export type AvailabilityResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export type ActiveTab = 'NOW' | 'LATER';

export type CalendarView = 'day' | 'week';

