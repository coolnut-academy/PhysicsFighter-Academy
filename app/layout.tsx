import type { Metadata } from "next";
import { Inter, Anton, Teko } from "next/font/google";
import "./globals.css";
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { Toaster } from "@/components/ui/toaster";

// Body font - clean and readable
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
};

export default function RootLayout({
          children,
}: Readonly<{
          children: React.ReactNode;
}>) {
          return (
                    <html lang="en">
                              <body className={`${inter.variable} ${anton.variable} ${teko.variable} font-sans antialiased`}>
                                        <AuthInitializer />
                                        <div className="min-h-screen bg-paper-white text-ink-black">
                                                  {children}
                                        </div>
                                        <Toaster />
                              </body>
                    </html>
          );
}
