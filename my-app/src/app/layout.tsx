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

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rmitspace.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'RMIT Space - Find Free Empty Rooms at RMIT Vietnam',
    template: '%s | RMIT Space',
  },
  description:
    'Find empty study spaces and live classroom schedules across RMIT University Vietnam (Saigon South & Hanoi campuses). Free, real-time timetable updates on rmitspace.app.',
  keywords: [
    'RMIT',
    'RMIT Space',
    'rmitspace',
    'rmitspace.app',
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
    canonical: '/',
  },
  openGraph: {
    title: 'RMIT Space - Find Free Empty Rooms at RMIT Vietnam',
    description:
      'Check live room availability, empty classrooms, and study spaces across RMIT Vietnam SGS and Hanoi campuses.',
    url: `${baseUrl}`,
    siteName: 'RMIT Space',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'RMIT Space Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'RMIT Space - RMIT Vietnam Empty Room Finder',
    description:
      'Find empty study rooms and live classroom schedules across RMIT Vietnam SGS & Hanoi campuses on rmitspace.app.',
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
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
      url: baseUrl,
      name: 'RMIT Space',
      description:
        'Find free empty study spaces and live classroom schedules across RMIT University Vietnam.',
      publisher: {
        '@type': 'Person',
        name: 'Huynh Mai Thien An',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/rooms?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebApplication',
      '@id': `${baseUrl}/#webapp`,
      name: 'RMIT Space',
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
    },
    {
      '@type': 'ItemList',
      '@id': `${baseUrl}/#sitelinks`,
      name: 'RMIT Space Navigation',
      itemListElement: [
        {
          '@type': 'SiteNavigationElement',
          position: 1,
          name: 'Room Directory & Schedules',
          description:
            'Explore full room directory and hourly timetable grid for SGS and Hanoi campuses.',
          url: `${baseUrl}/rooms`,
        },
        {
          '@type': 'SiteNavigationElement',
          position: 2,
          name: 'How to Update',
          description:
            '1-click sync guide to synchronize the latest semester timetable data from RMIT MyTimetable.',
          url: `${baseUrl}/admin`,
        },
      ],
    },
  ],
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
