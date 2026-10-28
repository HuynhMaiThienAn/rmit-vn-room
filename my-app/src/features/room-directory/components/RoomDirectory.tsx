'use client';

import React from 'react';
import { useDirectoryState } from '../hooks/use-directory-state';
import { DirectoryHeader } from './DirectoryHeader';
import { RoomList } from './RoomList';
import { TimetablePanel } from './timetable/TimetablePanel';
import { QrScannerModal } from './QrScannerModal';
import Footer from '../../../components/public/footer';
import { cleanDescriptionText } from '../utils/helpers';

export function RoomDirectory() {
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const {
    searchText,
    setSearchText,
    loading,
    error,
    deepLinkError,
    nowTime,
    selectedRoom,
    loadingSchedules,
    calendarView,
    setCalendarView,
    currentLocalDateStr,
    expandedCampuses,
    toggleCampusCollapse,
    expandedBuildings,
    toggleBuildingCollapse,
    expandedFloors,
    toggleFloorCollapse,
    roomsByCampus,
    selectedRoomSchedules,
    currentWeekDays,
    calendarHeaderTitle,
    handleNavigateCalendar,
    handleJumpToToday,
    handleSelectRoom,
    handleOpenRoomCode,
    handleCloseRoom,
  } = useDirectoryState();

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased font-sans flex flex-col lg:h-screen lg:overflow-hidden">
      {/* Search Header Selector */}
      <DirectoryHeader
        searchText={searchText}
        setSearchText={setSearchText}
        onScanQr={() => setScannerOpen(true)}
      />

      {/* Main content grid split */}
      <section className="px-3 pt-6 pb-6 max-w-7xl w-full mx-auto flex-1 lg:overflow-hidden">
        <div className="h-full flex flex-col lg:flex-row gap-6 lg:overflow-hidden">
          {/* Room Directory Hierarchy Card */}
          <div
            id="room-list-container"
            className="flex-1 flex flex-col gap-3 h-full lg:overflow-hidden lg:w-1/3"
          >
            {deepLinkError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800 shrink-0">
                {deepLinkError}
              </div>
            )}
            <RoomList
              loading={loading}
              error={error}
              roomsByCampus={roomsByCampus}
              expandedCampuses={expandedCampuses}
              toggleCampusCollapse={toggleCampusCollapse}
              expandedBuildings={expandedBuildings}
              toggleBuildingCollapse={toggleBuildingCollapse}
              expandedFloors={expandedFloors}
              toggleFloorCollapse={toggleFloorCollapse}
              selectedRoom={selectedRoom}
              onSelectRoom={handleSelectRoom}
              nowTime={nowTime}
              isSearching={searchText.trim().length > 0}
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
                <div className="flex-1 flex flex-col items-center justify-center border border-black rounded-lg bg-slate-50/40 p-8 text-center">
                  <p className="text-xs font-medium text-slate-500">
                    Select a room from the directory to view its weekly timetable.
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
          <div className="bg-[#000054] text-white px-4 py-3 flex items-center justify-between border-b border-black shrink-0">
            <button
              onClick={handleCloseRoom}
              className="bg-white text-[#000054] hover:bg-slate-100 px-3 py-1 rounded font-medium text-xs transition-colors cursor-pointer"
            >
              Back
            </button>
            <span className="font-normal text-sm max-w-[65%] truncate">
              {cleanDescriptionText(selectedRoom.description)}
            </span>
            <div className="w-[46px]" />
          </div>

          <div className="flex-1 overflow-hidden p-3 flex flex-col">
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

      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onRoomCode={handleOpenRoomCode}
      />

      {!loading && <Footer />}
    </main>
  );
}

export default RoomDirectory;
