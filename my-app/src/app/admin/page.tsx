import type { Metadata } from 'next';
import { TimetableSyncDashboard } from '../../features/timetable-sync/components/TimetableSyncDashboard';

export const metadata: Metadata = {
  title: 'How to Update Timetable Data',
  description:
    'Step-by-step guide and 1-click bookmarklet to synchronize the latest semester schedule from RMIT MyTimetable to RMIT Rooms.',
  alternates: {
    canonical: '/admin',
  },
};

export default function AdminPage() {
  return <TimetableSyncDashboard />;
}
