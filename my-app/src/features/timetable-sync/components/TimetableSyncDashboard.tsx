'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Footer from '../../../components/public/footer';
import { useTimetableSync } from '../hooks/use-timetable-sync';
import { DatasetStatusCard } from './DatasetStatusCard';
import { OneClickSyncCard } from './OneClickSyncCard';

export function TimetableSyncDashboard() {
  const router = useRouter();
  const { stats, loadingStats } = useTimetableSync();

  return (
    <main className="h-screen overflow-hidden bg-white text-black antialiased font-sans flex flex-col justify-between">
      {/* Top navigation header */}
      <header className="shrink-0 bg-[#000054] border-b border-[#000033]/30 px-4 py-2.5 shadow-md">
        <div className="flex items-center justify-between mx-auto w-full max-w-7xl">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => router.push('/rooms')}
          >
            <img
              src="/logo.png"
              alt="RMIT Logo"
              className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-white object-cover shrink-0"
            />
            <div>
              <h1 className="text-lg md:text-xl font-normal text-white tracking-tight leading-tight">
                RMIT Space
              </h1>
              <p className="text-xs text-slate-300 font-normal leading-tight">How to Update</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/rooms')}
            className="bg-[#E60028] text-white hover:bg-[#c40020] font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95 duration-200"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* Non-scrolling centered RMIT-style card */}
      <div className="flex-1 overflow-hidden flex flex-col items-center justify-center px-4 gap-3">
        <div className="w-full max-w-lg bg-white border border-black rounded-lg overflow-hidden shadow-xs">
          <DatasetStatusCard stats={stats} loading={loadingStats} />
          <OneClickSyncCard />
        </div>
        <p className="text-xs text-slate-500 text-center max-w-lg">
          All timetable data is publicly referenced from{' '}
          <a
            href="https://mytimetable.rmit.edu.vn/even/timetable/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#000054] hover:text-[#E60028] transition underline font-medium"
          >
            RMIT MyTimetable
          </a>
          .
        </p>
      </div>

      <Footer />
    </main>
  );
}

export default TimetableSyncDashboard;
