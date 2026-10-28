import type { Metadata } from 'next';
import { RoomDirectory } from '../features/room-directory/components/RoomDirectory';

export const metadata: Metadata = {
  title: 'RMIT Rooms - Campus Room Directory & Live Schedules',
  description:
    'Find free empty study spaces and live classroom schedules across RMIT University Vietnam (Saigon South & Hanoi campuses). Live availability updates.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return <RoomDirectory />;
}
