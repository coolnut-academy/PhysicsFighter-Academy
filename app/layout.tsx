import type { Metadata } from "next";
import { Inter, Anton, Teko, Kanit } from "next/font/google";
import "./globals.css";
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { Toaster } from "@/components/ui/toaster";

// Thai font - Kanit as primary font
const kanit = Kanit({
          weight: ["300", "400", "500", "600", "700", "800", "900"],
          subsets: ["latin", "thai"],
          variable: "--font-kanit"
});

// Body font - clean and readable (fallback)
const inter = Inter({
          subsets: ["latin"],
          variable: "--font-inter"
});

// Heading font - Bold, impactful, arcade style
const anton = Anton({
          weight: "400",
          subsets: ["latin"],
          variable: "--font-anton"
});

// Alternative heading font
const teko = Teko({
          weight: ["300", "400", "500", "600", "700"],
          subsets: ["latin"],
          variable: "--font-teko"
});



export const metadata: Metadata = {
          title: "Physics Fighter Academy - Train Your Mind",
          description: "Master physics through battle-tested courses and expert training",
          icons: {
                    icon: "/logo/Physics Fighter ไม่มีพื้นหลัง.png",
                    shortcut: "/logo/Physics Fighter ไม่มีพื้นหลัง.png",
                    apple: "/logo/Physics Fighter ไม่มีพื้นหลัง.png",
          },
};

export default function RootLayout({
          children,
}: Readonly<{
          children: React.ReactNode;
}>) {
          return (
                    <html lang="th">
                              <head>
                                        <link rel="icon" type="image/png" href="/logo/Physics Fighter ไม่มีพื้นหลัง.png" />
                                        <link rel="apple-touch-icon" href="/logo/Physics Fighter ไม่มีพื้นหลัง.png" />
                              </head>
                              <body className={`${kanit.variable} ${inter.variable} ${anton.variable} ${teko.variable} font-sans antialiased`}>
                                        <AuthInitializer />
                                        <div className="min-h-screen bg-paper-white text-ink-black">
                                                  {children}
                                        </div>
                                        <Toaster />
                              </body>
                    </html>
          );
}
