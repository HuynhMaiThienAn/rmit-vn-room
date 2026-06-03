"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '../../../components/public/footer';

export default function AdminLoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const expectedKey = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY?.trim();
    const storedKey = sessionStorage.getItem('admin_passcode')?.trim();

    if (expectedKey && storedKey === expectedKey) {
      router.push('/admin/dashboard');
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedKey = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY?.trim();

    if (!expectedKey) {
      setErrorMsg('Admin key is not configured on the server.');
      return;
    }

    if (passcode.trim() === expectedKey) {
      sessionStorage.setItem('admin_passcode', passcode.trim());
      router.push('/admin/dashboard');
    } else {
      const errorOptions = [
        'sus', 'nuh uh', 'nah bro', 'nice try', 'try "password"', ':D', ':b', '>:)', ':0', ':)', '=))', 'haiya', 'really?'
      ];
      const randomIndex = Math.floor(Math.random() * errorOptions.length);
      setErrorMsg(errorOptions[randomIndex]);
    }
  };

  if (isChecking) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-slate-500 text-sm font-medium animate-pulse">Checking authentication...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans flex flex-col justify-between">
      {/* Top navigation header */}
      <header className="bg-[#000054] border-b border-[#000033]/30 px-6 py-4 shadow-md">
        <div className="flex items-center justify-between mx-auto w-full max-w-5xl">
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => router.push('/')}>
            <svg className="w-11 h-11 text-[#E60028] shrink-0 fill-current" viewBox="0 0 40 40">
              <path d="M 20 6 A 14 14 0 0 1 20 34 L 18 34 L 18 31 L 12 31 L 12 25 L 7 25 L 7 15 L 12 15 L 12 9 L 18 9 L 18 6 Z" />
            </svg>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">RMIT Rooms</h1>
              <p className="text-xs text-slate-300">Admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="bg-[#E60028] text-white hover:bg-[#c40020] font-medium text-xs py-2 px-4 rounded-lg shadow-sm transition active:scale-95 duration-200"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* Passcode Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div className="flex flex-col gap-3">
              <input
                id="passcode"
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="enter your AI api key here :D"
                className="w-full bg-white border border-slate-300 text-slate-800 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#000054] focus:ring-1 focus:ring-[#000054] transition duration-200"
                required
                autoFocus
              />
              <button
                type="submit"
                className="w-full bg-[#E60028] text-white hover:bg-[#c40020] font-bold text-sm py-2.5 rounded-xl transition duration-200 shadow-sm active:scale-98"
              >
                Verify
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs text-[#E60028] font-semibold text-left pl-1 pt-1">
                {errorMsg}
              </p>
            )}
          </form>
        </div>
      </div>

      <Footer />
    </main>
  );
}
