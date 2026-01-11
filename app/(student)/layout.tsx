'use client';

import { StudentGuard } from '@/components/guards/RoleGuard';
import { StudentNavbar } from '@/components/layout/StudentNavbar';

export default function StudentLayout({
          children,
}: {
          children: React.ReactNode;
}) {
          return (
                    <StudentGuard>
                              <div className="min-h-screen flex flex-col">
                                        <StudentNavbar />
                                        <main className="flex-1 container mx-auto px-4 py-8">
                                                  {children}
                                        </main>
                              </div>
                    </StudentGuard>
          );
}
