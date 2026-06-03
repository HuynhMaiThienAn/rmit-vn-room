'use client';

import React from 'react';
import { useDirectoryState } from '../hooks/use-directory-state';
import { DirectoryHeader } from './DirectoryHeader';
import { RoomList } from './RoomList';
import { TimetablePanel } from './timetable/TimetablePanel';
import Footer from '../../../components/public/footer';
import { cleanDescriptionText } from '../utils/helpers';

export function RoomDirectory() {
  const {
    selectedSemester,
    setSelectedSemester,
    searchText,
    setSearchText,
    activeCampus,
    setActiveCampus,
    activeBuilding,
    setActiveBuilding,
    loading,
    error,
    nowTime,
    selectedRoom,
    setSelectedRoom,
    loadingSchedules,
    calendarView,
    setCalendarView,
    currentLocalDateStr,
    expandedFloors,
    buildingOptions,
    roomsByFloor,
    selectedRoomSchedules,
    currentWeekDays,
    calendarHeaderTitle,
    handleNavigateCalendar,
    handleJumpToToday,
    toggleFloorCollapse,
    handleSelectRoom,
  } = useDirectoryState();

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
                  loadingSchedules={loadingSchedules}
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
              loadingSchedules={loadingSchedules}
            />
          </div>
        </div>
      )}

      {!loading && <Footer />}
    </main>
  );
}

export default RoomDirectory;
