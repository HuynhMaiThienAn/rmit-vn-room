'use client';

import React from 'react';
import { ArrowsExchangeIcon, SearchIcon } from '../../../components/ui/icons';
import { cleanDescriptionText, formatBuildingLabel } from '../utils/helpers';

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
    <header className="sticky top-0 z-40 bg-[#000054] border-b border-[#000033]/30 px-4 py-2.5 shadow-md transition-all duration-300 lg:shrink-0">
      <div className="flex flex-col space-y-2.5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:space-y-0 lg:gap-4">
        {/* Brand Logo & Web Name */}
        <div className="flex items-center justify-between lg:justify-start lg:gap-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="RMIT Logo"
              className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-white object-cover shrink-0"
            />
            <div>
              <h1 className="text-lg md:text-xl lg:text-2xl font-normal text-white tracking-tight leading-tight">
                RMIT Rooms
              </h1>
              <p className="text-xs md:text-sm text-slate-300 font-normal leading-tight">
                {activeCampus === 'SGS' ? 'Saigon South Campus' : 'Hanoi Campus'}
              </p>
            </div>
          </div>

          {/* Switch Campus Button (Mobile Only) */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={handleToggleCampus}
              className="bg-[#E60028] text-white hover:bg-[#c40020] font-semibold text-xs md:text-sm px-3 py-1.5 rounded-lg shadow-md transition-all active:scale-95 duration-200 flex items-center gap-1.5"
            >
              <ArrowsExchangeIcon className="w-3.5 h-3.5 md:w-4 h-4" />
              <span>{activeCampus === 'SGS' ? 'Switch to HN' : 'Switch to SGS'}</span>
            </button>
          </div>
        </div>

        {/* Buildings List Selector */}
        <div className="flex py-0.5 min-w-0 flex-1 justify-start lg:px-4">
          <div className="inline-flex rounded-lg border border-white/10 p-0.5 bg-white/10 text-xs md:text-sm font-normal overflow-x-auto whitespace-nowrap scrollbar-none max-w-full">
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
                  className={`px-3 py-1.5 rounded-md transition-all duration-200 shrink-0 font-medium ${
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
        <div className="flex items-center gap-3 w-full lg:w-auto lg:max-w-xs lg:flex-1 lg:justify-end xl:max-w-sm flex-nowrap shrink-0">
          <div className="relative w-full min-w-[200px] lg:max-w-[220px]">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-300">
              <SearchIcon className="w-3.5 h-3.5 md:w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search rooms"
              className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs md:text-sm focus:outline-none focus:bg-white focus:text-[#000054] focus:placeholder-slate-400 focus:border-white shadow-inner transition-all duration-200"
            />
          </div>

          {/* Switch Campus Button (Desktop Only) */}
          <div className="hidden lg:block">
            <button
              type="button"
              onClick={handleToggleCampus}
              className="bg-[#E60028] text-white hover:bg-[#c40020] font-semibold text-xs md:text-sm px-3 py-1.5 rounded-lg shadow-md transition-all active:scale-95 duration-200 whitespace-nowrap flex items-center gap-1.5"
            >
              <ArrowsExchangeIcon className="w-3.5 h-3.5 md:w-4 h-4" />
              <span>{activeCampus === 'SGS' ? 'Switch to HN' : 'Switch to SGS'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
