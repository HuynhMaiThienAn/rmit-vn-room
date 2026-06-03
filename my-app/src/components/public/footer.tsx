"use client";

import React from 'react';
import Link from 'next/link';

export function Footer() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Hydration placeholder: prevents the 1-frame visual layout jump on mobile
  if (!mounted) {
    return (
      <div className="shrink-0 h-[80px] md:h-[110px] bg-[#000054] border-t border-white/10 w-full" />
    );
  }

  return (
    <footer className="shrink-0 mt-0 border-t border-white/10 bg-[#000054] text-slate-300 font-sans py-4 md:py-8 px-6">
      <div className="mx-auto max-w-7xl flex flex-row items-start justify-between gap-4 text-xs md:text-sm">
        
        {/* Column 1: Brand & Description */}
        <div className="text-left space-y-0.5 max-w-[55%]">
          <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-white">RMIT Rooms</h4>
          <p className="text-slate-300 leading-relaxed text-[10px] md:text-xs">
            smol web to help you find an empty room in this economy 🥀
          </p>
        </div>

        {/* Column 2: Quick Links & Support */}
        <div className="flex flex-col items-end gap-1 md:gap-2 text-[10px] md:text-xs text-slate-400 text-right max-w-[45%]">
          <div>
            <a
              href="mailto:s3998345@rmit.edu.vn"
              className="text-[#E60028] hover:text-white font-semibold transition underline break-all md:break-normal"
            >
              s3998345@rmit.edu.vn
            </a>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <Link href="/admin/login" className="hover:text-white transition font-semibold text-slate-300">
              Admin Login
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
