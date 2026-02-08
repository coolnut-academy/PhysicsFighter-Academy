import type { Metadata, Viewport } from "next";
import { Inter, Anton, Teko, Kanit } from "next/font/google";
import "./globals.css";
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { Toaster } from "@/components/ui/toaster";
import { ClientLayout } from "@/components/layout/ClientLayout";

// Thai font - Kanit as primary font
const kanit = Kanit({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "thai"],
  variable: "--font-kanit",
  display: 'swap',
});

// Body font - clean and readable (fallback)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

// Heading font - Bold, impactful, arcade style
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: 'swap',
});

// Alternative heading font
const teko = Teko({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-teko",
  display: 'swap',
});

// Viewport configuration for PWA and responsive design
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#E31E24',
  colorScheme: 'light',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://physicsfighter.academy'),
  title: "Physics Fighter Academy - Train Your Mind",
  description: "Master physics through battle-tested courses and expert training",
  keywords: ["physics", "education", "learning", "courses", "thailand", "ฟิสิกส์", "เรียน", "คอร์ส"],
  authors: [{ name: "Physics Fighter Academy" }],
  creator: "Physics Fighter Academy",
  publisher: "Physics Fighter Academy",
  robots: "index, follow",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/icon-192x192.png",
    apple: [
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Physics Fighter',
    startupImage: [
      {
        url: '/icons/icon-192x192.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: 'https://physicsfighter.academy',
    siteName: 'Physics Fighter Academy',
    title: 'Physics Fighter Academy - Train Your Mind',
    description: 'Master physics through battle-tested courses and expert training',
    images: [
      {
        url: '/cover-fb.jpg',
        width: 1200,
        height: 630,
        alt: 'Physics Fighter Academy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Physics Fighter Academy - Train Your Mind',
    description: 'Master physics through battle-tested courses and expert training',
    images: ['/cover-fb.jpg'],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Physics Fighter',
    'application-name': 'Physics Fighter Academy',
    'msapplication-TileColor': '#E31E24',
    'msapplication-TileImage': '/icons/icon-144x144.png',
    'msapplication-config': '/browserconfig.xml',
    'format-detection': 'telephone=no',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="scroll-smooth">
      <head>
        {/* PWA Configuration */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        
        {/* iOS PWA Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-72x72.png" sizes="72x72" />
        <link rel="apple-touch-icon" href="/icons/icon-96x96.png" sizes="96x96" />
        <link rel="apple-touch-icon" href="/icons/icon-128x128.png" sizes="128x128" />
        <link rel="apple-touch-icon" href="/icons/icon-144x144.png" sizes="144x144" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" sizes="152x152" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" sizes="192x192" />
        
        {/* iOS Splash Screen (optional - can be generated) */}
        <link rel="apple-touch-startup-image" href="/icons/icon-192x192.png" />
        
        {/* Windows Tiles */}
        <meta name="msapplication-TileColor" content="#E31E24" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
      <body 
        className={`${kanit.variable} ${inter.variable} ${anton.variable} ${teko.variable} font-sans antialiased`}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <AuthInitializer />
        <ClientLayout>
          <div className="min-h-screen bg-paper-white text-ink-black">
            {children}
          </div>
        </ClientLayout>
        <Toaster />
      </body>
    </html>
  );
}
