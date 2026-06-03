'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGate } from '../hooks/use-auth-gate';
import { useAnalytics } from '../hooks/use-analytics';
import { useFileUpload } from '../hooks/use-file-upload';
import { CampusCounters } from './CampusCounters';
import { FileUploader } from './FileUploader';
import { AnalyticsBoard } from './AnalyticsBoard';
import Footer from '../../../components/public/footer';

export function AdminDashboard() {
  const router = useRouter();
  const { isValidated, isChecking } = useAuthGate();

  // SGS & HN Campus Rooms Counters
  const [sgsRoomCount, setSgsRoomCount] = useState<number | null>(null);
  const [hnRoomCount, setHnRoomCount] = useState<number | null>(null);

  const fetchRoomCounts = async () => {
    try {
      const response = await fetch('/api/rooms');
      const payload = await response.json();
      if (response.ok && payload.success && Array.isArray(payload.data)) {
        const rooms = payload.data;
        const sgsCount = rooms.filter((r: any) => r.campus === 'SGS').length;
        const hnCount = rooms.filter((r: any) => r.campus === 'HN').length;
        setSgsRoomCount(sgsCount);
        setHnRoomCount(hnCount);
      }
    } catch (error) {
      console.error('Failed to fetch room counts:', error);
    }
  };

  useEffect(() => {
    if (isValidated) {
      void fetchRoomCounts();
    }
  }, [isValidated]);

  const { analyticsSummary, analyticsError, isAnalyticsLoading } = useAnalytics(isValidated);
  const { isDragging, setIsDragging, isUploading, fileStatuses, submitFiles, totalResult } =
    useFileUpload(fetchRoomCounts);

  if (isChecking || !isValidated) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-slate-500 text-sm font-medium animate-pulse">
          Checking authentication...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased font-sans flex flex-col justify-between">
      <div>
        {/* Sticky top navigation header */}
        <header className="sticky top-0 z-40 bg-[#000054] border-b border-[#000033]/30 px-4 py-4 shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mx-auto w-full max-w-5xl">
            <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => router.push('/')}>
              <svg
                className="w-11 h-11 md:w-13 md:h-13 text-[#E60028] shrink-0 fill-current"
                viewBox="0 0 40 40"
              >
                <path d="M 20 6 A 14 14 0 0 1 20 34 L 18 34 L 18 31 L 12 31 L 12 25 L 7 25 L 7 15 L 12 15 L 12 9 L 18 9 L 18 6 Z" />
              </svg>
              <div>
                <h1 className="text-lg md:text-xl lg:text-2xl font-normal text-white tracking-tight">
                  RMIT Rooms
                </h1>
                <p className="text-xs md:text-sm text-slate-300 font-normal">Admin</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push('/')}
              className="bg-[#E60028] text-white hover:bg-[#c40020] font-normal text-xs md:text-sm py-2.5 px-4 rounded-lg shadow-sm border border-transparent transition active:scale-95 duration-200"
            >
              ← Back
            </button>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 w-full flex-1">
          {/* Uploader Section */}
          <section className="bg-white border border-black rounded-lg p-6 md:p-8 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-500">
              Admin maintenance
            </p>
            <h2 className="mt-3 text-2xl font-normal tracking-tight text-slate-900">
              Campus timetable dataset upload
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Drop or choose one or more .txt / .json export files. You can upload both SGS and HN
              campus files at once — each file&apos;s schedules are scoped to its own rooms and will
              not overwrite the other campus.
            </p>

            <CampusCounters sgsRoomCount={sgsRoomCount} hnRoomCount={hnRoomCount} />

            <FileUploader
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              isUploading={isUploading}
              fileStatuses={fileStatuses}
              submitFiles={submitFiles}
              totalResult={totalResult}
            />
          </section>

          {/* Traffic Analytics Section */}
          <AnalyticsBoard
            analyticsSummary={analyticsSummary}
            analyticsError={analyticsError}
            isAnalyticsLoading={isAnalyticsLoading}
          />
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default AdminDashboard;
