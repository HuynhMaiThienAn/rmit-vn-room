'use client';

import React, { useEffect, useRef, useState } from 'react';

function buildBookmarkletCode(origin: string): string {
  const syncEndpoint = `${origin}/api/timetable/sync`;
  const adminUrl = `${origin}/admin`;
  const script = `(async()=>{if(location.hostname!=='mytimetable.rmit.edu.vn'){alert('Open mytimetable.rmit.edu.vn and sign in first, then click this bookmark on that tab.');return;}if(window.__rmitSyncing)return;window.__rmitSyncing=true;const b=document.createElement('div');b.style='position:fixed;top:16px;right:16px;z-index:999999;background:#000054;color:#fff;padding:12px 16px;border-radius:8px;font-family:sans-serif;font-size:13px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.15);';b.textContent='Syncing rooms (1/2)...';document.body.appendChild(b);try{const slim=(raw)=>{const out={};for(const[k,r]of Object.entries(raw||{})){const acts={};for(const[ak,av]of Object.entries(r.activities||{})){acts[ak]={subject_description:av.subject_description,activity_type:av.activity_type,start_time:av.start_time,duration:av.duration,activitiesDays:av.activitiesDays};}out[k]={floor_level:r.floor_level,building:r.building,campus:r.campus,description:r.description,activities:acts};}return out;};const post=async(c,t)=>{const p=new URLSearchParams({'search-term':t,campus:c,type:'ALL','start-time':'00:00','end-time':'23:00'});['1','2','3','4','5','6','0'].forEach(d=>p.append('days',d));const r=await fetch('/even/rest/timetable/locations'+location.search,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest'},body:p.toString(),credentials:'include'});if(!r.ok)throw new Error('RMIT API HTTP '+r.status);return slim(await r.json());};const sgs={},hn={};for(const t of ['SGS/1.','SGS/2.','SGS/3.','SGS/8.','SGS/9.','SGS/10.',''])Object.assign(sgs,await post('SGS',t));for(const t of ['HN/',''])Object.assign(hn,await post('HN',t));const sgsLen=Object.keys(sgs).length,hnLen=Object.keys(hn).length;if(!sgsLen||!hnLen)throw new Error('Please sign in to RMIT MyTimetable first.');b.textContent='Saving '+sgsLen+' SGS + '+hnLen+' HN rooms (2/2)...';const payload={sgs,hn};try{const res=await fetch('${syncEndpoint}',{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(payload)});const out=await res.json();if(!res.ok||!out.success)throw new Error(out.error||'Upload failed');b.style.background='#00875A';b.textContent=out.publishMode==='no-op'?'Already up to date ('+out.totalRooms+' rooms).':'Updated '+out.totalRooms+' rooms!';setTimeout(()=>b.remove(),4000);return;}catch(_){const target=window.opener||window.open('${adminUrl}','_blank');if(!target)throw new Error('Allow popups or open MyTimetable from the How to Update page.');const send=()=>target.postMessage({type:'RMIT_TIMETABLE_SYNC_PAYLOAD',payload},'${origin}');send();setTimeout(send,1200);setTimeout(send,2500);b.style.background='#00875A';b.textContent='Sent '+sgsLen+' SGS + '+hnLen+' HN rooms to RMIT Rooms tab!';setTimeout(()=>b.remove(),4000);}}catch(e){b.style.background='#E60028';b.textContent='Error: '+(e.message||e);setTimeout(()=>b.remove(),6000);}finally{window.__rmitSyncing=false;}})();`;
  return `javascript:${encodeURIComponent(script)}`;
}

export function OneClickSyncCard() {
  const bookmarkRef = useRef<HTMLAnchorElement>(null);
  const [syncStatus, setSyncStatus] = useState<{
    state: 'idle' | 'saving' | 'done' | 'error';
    text: string;
  }>({ state: 'idle', text: '' });

  useEffect(() => {
    if (bookmarkRef.current && typeof window !== 'undefined') {
      bookmarkRef.current.setAttribute('href', buildBookmarkletCode(window.location.origin));
    }

    let processing = false;
    const handleMessage = async (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'RMIT_TIMETABLE_SYNC_PAYLOAD' || processing) {
        return;
      }
      processing = true;
      setSyncStatus({ state: 'saving', text: 'Saving synced rooms to database...' });
      try {
        const res = await fetch('/api/timetable/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event.data.payload),
        });
        const out = await res.json();
        if (!res.ok || !out.success) {
          throw new Error(out.error || 'Failed to save rooms');
        }
        setSyncStatus({
          state: 'done',
          text:
            out.publishMode === 'no-op'
              ? `Already up to date (${out.totalRooms} rooms — no changes).`
              : `Updated ${out.totalRooms} rooms (${out.sgsCount} SGS, ${out.hnCount} HN).`,
        });
      } catch (err) {
        setSyncStatus({
          state: 'error',
          text: err instanceof Error ? err.message : 'Sync failed',
        });
      } finally {
        setTimeout(() => {
          processing = false;
        }, 3000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="divide-y divide-black text-sm text-black">
      {/* Step 1 */}
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-[#000054] text-xs font-bold text-white mt-0.5">
            1
          </span>
          <div>
            <p className="font-semibold text-black">Drag button to your bookmarks bar</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Press Ctrl+Shift+B to show the bookmarks bar
            </p>
          </div>
        </div>

        <a
          ref={bookmarkRef}
          onClick={(e) => {
            e.preventDefault();
            alert('Drag this button to your bookmarks bar instead of clicking it here.');
          }}
          className="shrink-0 rounded-lg bg-[#E60028] hover:bg-[#c40020] px-3.5 py-2 text-xs font-semibold text-white shadow-sm cursor-grab active:cursor-grabbing transition select-none"
          title="Drag to bookmarks bar"
        >
          Sync RMIT Rooms
        </a>
      </div>

      {/* Step 2 */}
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-[#000054] text-xs font-bold text-white mt-0.5">
            2
          </span>
          <div>
            <p className="font-semibold text-black">Sign in to RMIT MyTimetable</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Use your RMIT student account
            </p>
          </div>
        </div>

        <a
          href="https://mytimetable.rmit.edu.vn/even/timetable/"
          target="_blank"
          className="shrink-0 rounded-lg bg-[#000054] hover:bg-[#000054]/90 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition active:scale-95"
        >
          Open MyTimetable ↗
        </a>
      </div>

      {/* Step 3 */}
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-[#000054] text-xs font-bold text-white mt-0.5">
            3
          </span>
          <div>
            <p className="font-semibold text-black">
              Click &ldquo;Sync RMIT Rooms&rdquo; on your bookmarks bar
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Click the bookmark while on the MyTimetable tab to update the schedule.
            </p>
          </div>
        </div>

        {syncStatus.state !== 'idle' && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded shrink-0 ${
              syncStatus.state === 'done'
                ? 'bg-emerald-100 text-emerald-900'
                : syncStatus.state === 'error'
                  ? 'bg-rose-100 text-rose-900'
                  : 'bg-blue-100 text-[#000054]'
            }`}
          >
            {syncStatus.text}
          </span>
        )}
      </div>
    </div>
  );
}
