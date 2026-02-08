'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
          GraduationCap,
          BookOpen,
          Trophy,
          User,
          LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';

const sidebarItems = [
          { href: '/learn/dashboard', label: 'หน้าแรก', icon: GraduationCap },
          { href: '/courses', label: 'คอร์สทั้งหมด', icon: BookOpen },
          { href: '/my-enrollments', label: 'คอร์สของฉัน', icon: Trophy },
          { href: '/profile', label: 'โปรไฟล์', icon: User },
];

export function StudentSidebar() {
          const pathname = usePathname();
          const { user, logout } = useAuthStore();

          if (!user) return null;

          return (
                    <aside className="hidden lg:flex flex-col w-64 border-r-2 border-ink-black bg-white h-screen sticky top-0 overflow-y-auto">
                              <div className="p-6 flex-1">
                                        <div className="mb-6 p-4 bg-fighter-red/5 border-2 border-ink-black rounded-lg">
                                                  <p className="text-sm text-gray-500 mb-1">ยินดีต้อนรับ,</p>
                                                  <p className="font-heading text-xl font-bold truncate text-fighter-red">{user.profile.firstName}</p>
                                        </div>

                                        <nav className="space-y-3">
                                                  {sidebarItems.map((item) => {
                                                            const Icon = item.icon;
                                                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                                                            return (
                                                                      <Link
                                                                                key={item.href}
                                                                                href={item.href}
                                                                                className={cn(
                                                                                          'flex items-center gap-3 px-4 py-3 font-bold uppercase text-sm transition-all border-2 rounded-xl group relative overflow-hidden',
                                                                                          isActive
                                                                                                    ? 'bg-fighter-red text-white border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                                                                                                    : 'bg-white text-ink-black border-transparent hover:border-ink-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1'
                                                                                )}
                                                                      >
                                                                                <Icon className={cn(
                                                                                          'w-5 h-5 transition-transform duration-300 group-hover:scale-110',
                                                                                          isActive ? 'text-white' : 'text-fighter-red'
                                                                                )} />
                                                                                <span className="relative z-10">{item.label}</span>
                                                                      </Link>
                                                            );
                                                  })}
                                        </nav>
                              </div>

                              <div className="p-6 border-t-2 border-ink-black bg-gray-50">
                                        <Button
                                                  variant="ghost"
                                                  className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                  onClick={() => logout()}
                                        >
                                                  <LogOut className="w-5 h-5" />
                                                  ออกจากระบบ
                                        </Button>
                              </div>
                    </aside>
          );
}
