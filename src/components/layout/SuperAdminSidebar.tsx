'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
          LayoutDashboard,
          Users,
          BookOpen,
          Receipt,
          BarChart3,
          Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
          { href: '/super-admin/dashboard', label: 'ห้องบัญชาการ', icon: LayoutDashboard },
          { href: '/super-admin/users', label: 'จัดการผู้ใช้', icon: Users },
          { href: '/super-admin/courses', label: 'คอร์สทั้งหมด', icon: BookOpen },
          { href: '/super-admin/payments', label: 'การชำระเงิน', icon: Receipt },
          { href: '/super-admin/analytics', label: 'สถิติ', icon: BarChart3 },
];

export function SuperAdminSidebar() {
          const pathname = usePathname();

          return (
                    <aside className="hidden lg:block w-64 border-r-4 border-golden bg-ink-black min-h-screen">
                              <nav className="p-4 space-y-2">
                                        {sidebarItems.map((item) => {
                                                  const Icon = item.icon;
                                                  const isActive = pathname.startsWith(item.href);

                                                  return (
                                                            <Link
                                                                      key={item.href}
                                                                      href={item.href}
                                                                      className={cn(
                                                                                'flex items-center gap-3 px-4 py-3 font-bold uppercase text-sm transition-all border-2 relative',
                                                                                isActive
                                                                                          ? 'bg-golden text-ink-black border-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.5)] -skew-x-3'
                                                                                          : 'bg-ink-black text-gray-300 border-transparent hover:border-golden hover:text-golden hover:-skew-x-3'
                                                                      )}
                                                            >
                                                                      <Icon className={cn(
                                                                                'w-5 h-5 transition-all',
                                                                                isActive ? 'text-ink-black' : 'text-golden'
                                                                      )} />
                                                                      <span style={{ transform: isActive ? 'skewX(3deg)' : 'none' }}>{item.label}</span>
                                                                      {isActive && (
                                                                                <Shield className="w-3 h-3 text-ink-black absolute top-2 right-2" />
                                                                      )}
                                                            </Link>
                                                  );
                                        })}
                              </nav>
                    </aside>
          );
}
