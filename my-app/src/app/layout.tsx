import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rmit-rooms.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'RMIT Rooms - Find Free Empty Rooms at RMIT Vietnam',
    template: '%s | RMIT Rooms',
  },
  description:
    'Find empty study rooms and live classroom schedules across RMIT University Vietnam (Saigon South & Hanoi campuses). Free, real-time timetable updates.',
  keywords: [
    'RMIT',
    'RMIT Vietnam',
    'RMIT empty rooms',
    'RMIT room finder',
    'RMIT timetable',
    'RMIT room schedule',
    'Saigon South campus rooms',
    'Hanoi campus rooms',
    'RMIT study spaces',
  ],
  authors: [{ name: 'Huynh Mai Thien An' }],
  verification: {
    google: 'd0c8b34a4df7b0ff',
  },
  alternates: {
    canonical: '/rooms',
  },
  openGraph: {
    title: 'RMIT Rooms - Find Free Empty Rooms at RMIT Vietnam',
    description:
      'Check live room availability, empty classrooms, and study spaces across RMIT Vietnam SGS and Hanoi campuses.',
    url: `${baseUrl}/rooms`,
    siteName: 'RMIT Rooms',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'RMIT Rooms Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'RMIT Rooms - RMIT Vietnam Empty Room Finder',
    description:
      'Find empty study rooms and live classroom schedules across RMIT Vietnam SGS & Hanoi campuses.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/logo.png?v=2', type: 'image/png' },
      { url: '/favicon.ico?v=2' },
    ],
    shortcut: '/logo.png?v=2',
    apple: '/logo.png?v=2',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'RMIT Rooms',
  url: `${baseUrl}/rooms`,
  description:
    'Real-time empty study room finder and classroom timetable directory for RMIT University Vietnam.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'VND',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Analytics />
        {children}
      </body>
    </html>
  );
}
