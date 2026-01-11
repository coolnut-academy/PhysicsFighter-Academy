import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
          title: "Physics Fighter Academy - Educational Platform",
          description: "Learn physics through interactive courses and expert instructors",
};

export default function RootLayout({
          children,
}: Readonly<{
          children: React.ReactNode;
}>) {
          return (
                    <html lang="en" className="dark">
                              <body className={inter.className}>
                                        <AuthInitializer />
                                        <div className="min-h-screen bg-dark-bg-primary cyber-grid-bg">
                                                  {children}
                                        </div>
                                        <Toaster />
                              </body>
                    </html>
          );
}
