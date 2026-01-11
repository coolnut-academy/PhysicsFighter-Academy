'use client';

import { AdminGuard } from '@/components/guards/RoleGuard';
import { AdminNavbar } from '@/components/layout/AdminNavbar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

export default function AdminLayout({
          children,
}: {
          children: React.ReactNode;
}) {
          return (
                    <AdminGuard>
                              <div className="min-h-screen flex flex-col">
                                        <AdminNavbar />
                                        <div className="flex-1 flex">
                                                  <AdminSidebar />
                                                  <main className="flex-1 p-8 overflow-auto custom-scrollbar">
                                                            {children}
                                                  </main>
                                        </div>
                              </div>
                    </AdminGuard>
          );
}
