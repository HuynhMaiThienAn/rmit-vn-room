'use client';

import React from 'react';
import { ArrowsExchangeIcon, SearchIcon } from '../../../components/ui/icons';
import { formatBuildingLabel } from '../utils/format';

interface DirectoryHeaderProps {
  activeCampus: string | null;
  setActiveCampus: (campus: string | null) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  buildingOptions: string[];
  activeBuilding: string | null;
  setActiveBuilding: (building: string | null) => void;
}

export function DirectoryHeader({
  activeCampus,
  setActiveCampus,
  searchText,
  setSearchText,
  buildingOptions,
  activeBuilding,
  setActiveBuilding,
}: DirectoryHeaderProps) {
  const handleToggleCampus = () => {
    const nextCampus = activeCampus === 'SGS' ? 'HN' : 'SGS';
    setActiveCampus(nextCampus);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#000054] border-b border-[#000033]/30 px-4 py-4 shadow-md transition-all duration-300 lg:shrink-0">
      <div className="flex flex-col space-y-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:space-y-0 lg:gap-4">
        {/* Brand Logo & Web Name */}
        <div className="flex items-center justify-between lg:justify-start lg:gap-6 shrink-0">
          <div className="flex items-center gap-3.5">
            <svg
              className="w-11 h-11 md:w-13 md:h-13 text-[#E60028] shrink-0 fill-current"
              viewBox="0 0 40 40"
            >
              <path d="M 20 6 A 14 14 0 0 1 20 34 L 18 34 L 18 31 L 12 31 L 12 25 L 7 25 L 7 15 L 12 15 L 12 9 L 18 9 L 18 6 Z" />
            </svg>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-normal text-white tracking-tight">
                RMIT Rooms
              </h1>
              <p className="text-sm md:text-base text-slate-300 font-normal">
                {activeCampus === 'SGS' ? 'Saigon South Campus' : 'Hanoi Campus'}
              </p>
            </div>
          </div>

          {/* Switch Campus Button (Mobile Only) */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={handleToggleCampus}
              className="bg-[#E60028] text-white hover:bg-[#c40020] font-semibold text-sm md:text-base px-4 py-2 rounded-lg shadow-md transition-all active:scale-95 duration-200 flex items-center gap-2"
            >
              <ArrowsExchangeIcon className="w-4 h-4 md:w-4.5 h-4.5" />
              <span>{activeCampus === 'SGS' ? 'Switch to HN' : 'Switch to SGS'}</span>
            </button>
          </div>
        </div>

        {/* Buildings List Selector */}
        <div className="flex py-0.5 min-w-0 flex-1 justify-start lg:px-4">
          <div className="inline-flex rounded-xl border border-white/10 p-0.5 bg-white/10 text-sm md:text-base font-normal overflow-x-auto whitespace-nowrap scrollbar-none max-w-full">
            {buildingOptions.map((building) => {
              const isActive = building === (activeBuilding ?? 'ALL');
              let label = building === 'ALL' ? 'All' : formatBuildingLabel(building);
              if (label.startsWith('Bldg ')) {
                label = `Building ${label.substring(5)}`;
              } else if (label.startsWith('BLDG ')) {
                label = `Building ${label.substring(5)}`;
              }
              return (
                <button
                  key={building}
                  type="button"
                  onClick={() => {
                    setActiveBuilding(building);
                  }}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 shrink-0 font-medium ${
                    isActive ? 'bg-white text-[#000054] shadow-xs' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar & Switch Campus Button (Desktop Only) */}
        <div className="flex items-center gap-3 w-full xl:w-auto xl:max-w-xs xl:flex-1 xl:justify-end xl:max-w-sm flex-nowrap shrink-0">
          <div className="relative w-full min-w-[200px] xl:max-w-[240px]">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-300">
              <SearchIcon className="w-4 h-4 md:w-5 h-5" />
            </span>
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search rooms"
              className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-base focus:outline-none focus:bg-white focus:text-[#000054] focus:placeholder-slate-400 focus:border-white shadow-inner transition-all duration-200"
            />
          </div>

          {/* Switch Campus Button (Desktop Only) */}
          <div className="hidden lg:block">
            <button
              type="button"
              onClick={handleToggleCampus}
              className="bg-[#E60028] text-white hover:bg-[#c40020] font-semibold text-sm md:text-base px-4 py-2 rounded-lg shadow-md transition-all active:scale-95 duration-200 whitespace-nowrap flex items-center gap-2"
            >
              <ArrowsExchangeIcon className="w-4 h-4 md:w-4.5 h-4.5" />
              <span>{activeCampus === 'SGS' ? 'Switch to HN' : 'Switch to SGS'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
