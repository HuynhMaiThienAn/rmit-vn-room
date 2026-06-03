'use client';

import { useEffect, useMemo, useState } from 'react';
import { getRoomDetailRows } from '../utils/parse';
import type { RoomRecord } from '../../../types/room';

export function useRoomSelection(
  activeCampus: string | null,
  activeBuilding: string | null,
  queryStart: string,
  queryEnd: string,
  selectedSemester: string,
  searchText: string,
) {
  const [selectedRoom, setSelectedRoom] = useState<RoomRecord | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Persist favorites to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('rmit-room-favorites');
    if (saved) {
      try { setFavorites(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  // Clear selected room when any filter changes
  useEffect(() => {
    setSelectedRoom(null);
  }, [activeCampus, activeBuilding, queryStart, queryEnd, selectedSemester, searchText]);

  const toggleFavorite = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId];
      if (typeof window !== 'undefined') {
        localStorage.setItem('rmit-room-favorites', JSON.stringify(next));
      }
      return next;
    });
  };

  const selectedRoomSchedules = useMemo(
    () => (selectedRoom ? getRoomDetailRows(selectedRoom) : []),
    [selectedRoom],
  );

  return {
    selectedRoom, setSelectedRoom,
    favorites,
    toggleFavorite,
    selectedRoomSchedules,
  };
}
