import type { Metadata } from 'next';
import { RoomDirectory } from '../../features/room-directory/components/RoomDirectory';

export const metadata: Metadata = {
  title: 'RMIT Space - Campus Room Directory & Live Schedules',
  description:
    'Browse all classrooms, labs, and study spaces across RMIT Vietnam Saigon South and Hanoi campuses on rmitspace.app. Live availability and full daily timetable.',
  alternates: {
    canonical: '/rooms',
  },
};

export default function RoomsPage() {
  return <RoomDirectory />;
}
