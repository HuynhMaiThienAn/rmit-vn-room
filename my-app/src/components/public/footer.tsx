"use client";

import React from 'react';
import Link from 'next/link';
import { GithubIcon } from '../ui/icons';

export function Footer() {
  return (
    <footer className="shrink-0 mt-0 border-t border-white/10 bg-[#000054] text-slate-300 font-sans py-2.5 md:py-3.5 px-6">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center md:items-center justify-between gap-3 text-xs">
        
        {/* Column 1: Brand & Disclaimer */}
        <div className="text-center md:text-left space-y-0.5">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <h4 className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-white">RMIT Rooms</h4>
            <span className="text-slate-500">•</span>
            <span className="text-[11px] md:text-xs text-slate-300">
              A smol website to find empty rooms 🥀
            </span>
          </div>
          <p className="text-[10px] md:text-[11px] text-slate-400">
            All timetable data is publicly referenced from{' '}
            <a
              href="https://mytimetable.rmit.edu.vn/even/timetable/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-[#E60028] transition underline font-medium"
            >
              RMIT MyTimetable
            </a>.
          </p>
        </div>

        {/* Column 2: Quick Links, GitHub & Support */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 md:gap-4 text-[11px] md:text-xs text-slate-400">
          <Link
            href="/admin"
            className="hover:text-white transition font-semibold text-slate-300 underline"
          >
            How to Update
          </Link>

          <a
            href="mailto:s3998345@rmit.edu.vn"
            className="text-[#E60028] hover:text-white font-semibold transition underline"
          >
            s3998345@rmit.edu.vn
          </a>

          <a
            href="https://github.com/HuynhMaiThienAn/rmit-vn-room"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md font-medium"
            title="View source code on GitHub"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
