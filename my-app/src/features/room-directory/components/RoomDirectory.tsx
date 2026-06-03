'use client';

import React, { useState, useEffect } from 'react';
import { useAvailability } from '../hooks/use-availability';
import { useRoomFilter } from '../hooks/use-room-filter';
import { useRoomSelection } from '../hooks/use-room-selection';
import { useCalendar } from '../hooks/use-calendar';
import { DirectoryHeader } from './DirectoryHeader';
import { RoomList } from './RoomList';
import { TimetablePanel } from './timetable/TimetablePanel';
import Footer from '../../../components/public/footer';
import { toDatetimeLocalValue, getVietnamDateInfo } from '../utils/date';
import { cleanDescriptionText } from '../utils/format';
import type { RoomRecord } from '../../../types/room';

const DASHBOARD_WINDOW_MS = 60 * 60 * 1000;

export function RoomDirectory() {
  // 1. Lift state up: Core Filter & Query States
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [activeCampus, setActiveCampus] = useState<string | null>('SGS');
  const [activeBuilding, setActiveBuilding] = useState<string | null>(null);

  // Time bounds matching the 1-hour availability slot
  const [queryStart, setQueryStart] = useState('');
  const [queryEnd, setQueryEnd] = useState('');

  // Initialise availability time window on mount
  useEffect(() => {
    const now = new Date();
    const initial = toDatetimeLocalValue(now);
    setQueryStart(initial);
    setQueryEnd(toDatetimeLocalValue(new Date(now.getTime() + DASHBOARD_WINDOW_MS)));
  }, []);

  // 2. Fetch room availability matrix via custom hook
  const { matrix, loading, error, nowTime, syncSelectedRoom } = useAvailability(
    queryStart,
    queryEnd,
    selectedSemester
  );

  // 3. Filter & sort rooms by floor using custom hook
  const { buildingOptions, roomsByFloor } = useRoomFilter({
    matrix,
    nowTime,
    activeCampus,
    activeBuilding,
    setActiveBuilding,
    searchText,
    selectedSemester,
    queryStart,
  });

  // 4. Handle Room Selection and Persistence
  const { selectedRoom, setSelectedRoom, selectedRoomSchedules } = useRoomSelection(
    activeCampus,
    activeBuilding,
    queryStart,
    queryEnd,
    selectedSemester,
    searchText
  );

  // Reconcile selected room updates from background polling
  useEffect(() => {
    syncSelectedRoom(selectedRoom, setSelectedRoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matrix]);

  // 5. Calendar dates, navigation and floor collapse states
  const {
    calendarView,
    setCalendarView,
    currentLocalDateStr,
    setCurrentLocalDateStr,
    expandedFloors,
    handleNavigateCalendar,
    handleJumpToToday,
    toggleFloorCollapse,
    currentWeekDays,
    calendarHeaderTitle,
  } = useCalendar();

  // Set the default calendar view and selection states on room select
  const handleSelectRoom = (room: RoomRecord) => {
    setSelectedRoom(room);
    setCalendarView('day');
    const todayInfo = getVietnamDateInfo(new Date().toISOString());
    setCurrentLocalDateStr(todayInfo.dateString);
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased font-sans flex flex-col lg:h-screen lg:overflow-hidden">
      {/* Search Header Selector */}
      <DirectoryHeader
        activeCampus={activeCampus}
        setActiveCampus={setActiveCampus}
        searchText={searchText}
        setSearchText={setSearchText}
        buildingOptions={buildingOptions}
        activeBuilding={activeBuilding}
        setActiveBuilding={setActiveBuilding}
      />

      {/* Main content grid split */}
      <section className="px-3 pt-6 pb-6 max-w-7xl w-full mx-auto flex-1 lg:overflow-hidden">
        <div className="h-full flex flex-col lg:flex-row gap-6 lg:overflow-hidden">
          {/* Room Directory List */}
          <div
            id="room-list-container"
            className="flex-1 space-y-4 h-full overflow-y-auto pr-1 scrollbar-thin lg:w-1/3"
          >
            <RoomList
              loading={loading}
              error={error}
              roomsByFloor={roomsByFloor}
              expandedFloors={expandedFloors}
              toggleFloorCollapse={toggleFloorCollapse}
              selectedRoom={selectedRoom}
              onSelectRoom={handleSelectRoom}
              nowTime={nowTime}
              activeCampus={activeCampus}
              activeBuilding={activeBuilding}
            />
          </div>

          {/* Right column: Timetable Schedule Grid (Desktop only) */}
          {!loading && (
            <div className="hidden lg:flex lg:w-2/3 h-full flex-col border-l border-slate-200 pl-6 lg:overflow-hidden">
              {selectedRoom ? (
                <TimetablePanel
                  selectedRoom={selectedRoom}
                  selectedRoomSchedules={selectedRoomSchedules}
                  calendarView={calendarView}
                  setCalendarView={setCalendarView}
                  currentLocalDateStr={currentLocalDateStr}
                  nowTime={nowTime}
                  currentWeekDays={currentWeekDays}
                  calendarHeaderTitle={calendarHeaderTitle}
                  handleNavigateCalendar={handleNavigateCalendar}
                  handleJumpToToday={handleJumpToToday}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-black rounded-xl p-8 text-center text-black">
                  <svg
                    className="w-12 h-12 mb-3 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm font-semibold">
                    Select a room from the directory to view its timetable
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Mobile Drawer Slide Timetable Overlay */}
      {selectedRoom && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-white">
          <div className="bg-[#000054] text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0">
            <button
              onClick={() => setSelectedRoom(null)}
              className="bg-white text-[#000054] hover:bg-slate-100 px-3 py-1.5 rounded-lg shadow-sm font-bold text-xs flex items-center gap-1 transition-all active:scale-95 duration-200"
            >
              ← Back
            </button>
            <span className="font-semibold text-sm max-w-[60%] truncate">
              {(() => {
                const cleaned = cleanDescriptionText(selectedRoom.description);
                const parenIndex = cleaned.indexOf('(');
                return parenIndex === -1 ? cleaned : cleaned.slice(0, parenIndex).trim();
              })()}{' '}
              Timetable
            </span>
            <div className="w-[50px]"></div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <TimetablePanel
              selectedRoom={selectedRoom}
              selectedRoomSchedules={selectedRoomSchedules}
              calendarView={calendarView}
              setCalendarView={setCalendarView}
              currentLocalDateStr={currentLocalDateStr}
              nowTime={nowTime}
              currentWeekDays={currentWeekDays}
              calendarHeaderTitle={calendarHeaderTitle}
              handleNavigateCalendar={handleNavigateCalendar}
              handleJumpToToday={handleJumpToToday}
            />
          </div>
        </div>
      )}

      {!loading && <Footer />}
    </main>
  );
}

export default RoomDirectory;
