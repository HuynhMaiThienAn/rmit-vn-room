'use client';

import React from 'react';
import { QrCodeIcon, SearchIcon } from '../../../components/ui/icons';

interface DirectoryHeaderProps {
  searchText: string;
  setSearchText: (text: string) => void;
  onScanQr: () => void;
}

export function DirectoryHeader({
  searchText,
  setSearchText,
  onScanQr,
}: DirectoryHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#000054] border-b border-[#000033]/30 px-4 py-2.5 shadow-md lg:shrink-0">
      <div className="max-w-7xl w-full mx-auto flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Brand Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div>
            <h1 className="text-lg md:text-xl font-semibold text-white tracking-tight leading-tight">
              RMIT Rooms
            </h1>
            <p className="text-xs text-slate-300 font-normal leading-tight">
              Saigon South &amp; Hanoi Campuses
            </p>
          </div>
        </div>

        {/* Search Bar & Mobile QR Scanner */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto sm:max-w-xs flex-1 justify-end">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-300">
              <SearchIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </span>
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search rooms or buildings..."
              className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs md:text-sm focus:outline-none focus:bg-white focus:text-[#000054] focus:placeholder-slate-400 focus:border-white transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={onScanQr}
            className="bg-white text-[#000054] hover:bg-slate-100 font-semibold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors whitespace-nowrap flex items-center gap-1.5 lg:hidden cursor-pointer shrink-0"
            title="Scan room QR"
          >
            <QrCodeIcon className="w-3.5 h-3.5" />
            <span>Scan</span>
          </button>
        </div>
      </div>
    </header>
  );
}
