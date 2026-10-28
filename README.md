# RMIT Rooms (Vietnam Campuses)

> A modern, ultra-fast web application to find free, empty study spaces and check live room schedules across **RMIT University Vietnam** (Saigon South & Hanoi campuses).

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## ✨ Features

- 🏢 **Multi-Campus Hierarchy**: Browse rooms grouped seamlessly by Campus (Saigon South & Hanoi), Building, and Floor level.
- ⚡ **Real-Time Free/Busy Status**: Visual color-coded indicators instantly showing if a room is occupied or free, with countdown timers to the next upcoming class.
- 📅 **Interactive Day & Week Timetable**: View room schedules on an hourly calendar grid with non-overlapping course blocks, current time indicator line, and weekend toggle.
- 📷 **Instant QR Code Scanner**: Scan physical QR codes placed on classroom doors to jump straight to that room's schedule.
- 🚀 **Zero-Database Lightweight Architecture**: Schedules and room indexes are compressed into client-cached JSON shards, delivering instant search and sub-second page transitions without database cold starts.
- 🔄 **1-Click Bookmarklet Sync**: Allows any student to sync the latest semester schedule straight from RMIT MyTimetable with a single browser bookmark click.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **UI & Styling**: React 19, Tailwind CSS v4, Lucide/Heroicons
- **QR Code Engine**: HTML5-QRCode
- **Analytics**: Vercel Web Analytics
- **Data Source**: Public timetable information from [RMIT MyTimetable](https://mytimetable.rmit.edu.vn/even/timetable/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.18+ or 20+
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/HuynhMaiThienAn/rmit-vn-room.git
   cd rmit-vn-room/my-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 📖 How to Update Timetable Data

Whenever a new semester begins or classroom allocations change:
1. Navigate to `/admin` ("How to Update").
2. Drag the **Sync RMIT Rooms** bookmarklet button to your browser bookmarks bar.
3. Open [RMIT MyTimetable](https://mytimetable.rmit.edu.vn/even/timetable/) and sign in with your student account.
4. Click the bookmarklet on that tab — the script extracts the latest room allocations and automatically updates the repository.

---

## 🤝 Feedback & Support

Created by **Huynh Mai Thien An**  
- Email: [s3998345@rmit.edu.vn](mailto:s3998345@rmit.edu.vn)  
- GitHub: [@HuynhMaiThienAn](https://github.com/HuynhMaiThienAn)
