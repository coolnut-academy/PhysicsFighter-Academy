'use client';

import { SuperAdminGuard } from '@/components/guards/RoleGuard';
import { SuperAdminNavbar } from '@/components/layout/SuperAdminNavbar';
import { SuperAdminSidebar } from '@/components/layout/SuperAdminSidebar';

export default function SuperAdminLayout({
          children,
}: {
          children: React.ReactNode;
}) {
          return (
                    <SuperAdminGuard>
                              <div className="min-h-screen flex flex-col">
                                        <SuperAdminNavbar />
                                        <div className="flex-1 flex">
                                                  <SuperAdminSidebar />
                                                  <main className="flex-1 p-8 overflow-auto custom-scrollbar">
                                                            {children}
                                                  </main>
                                        </div>
                              </div>
                    </SuperAdminGuard>
          );
}
