'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
          LayoutDashboard,
          BookOpen,
          Receipt,
          DollarSign,
          Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
          { href: '/admin/dashboard', label: 'ห้องบัญชาการ', icon: LayoutDashboard },
          { href: '/admin/courses', label: 'คอร์สของฉัน', icon: BookOpen },
          { href: '/admin/payments', label: 'สลิปชำระเงิน', icon: Receipt },
          { href: '/admin/revenue', label: 'รายได้', icon: DollarSign },
          { href: '/admin/settings', label: 'ตั้งค่า', icon: Settings },
];

export function AdminSidebar() {
          const pathname = usePathname();

          return (
                    <aside className="hidden lg:block w-64 border-r-4 border-ink-black bg-white min-h-screen">
                              <nav className="p-4 space-y-2">
                                        {sidebarItems.map((item) => {
                                                  const Icon = item.icon;
                                                  const isActive = pathname.startsWith(item.href);

                                                  return (
                                                            <Link
                                                                      key={item.href}
                                                                      href={item.href}
                                                                      className={cn(
                                                                                'flex items-center gap-3 px-4 py-3 font-bold uppercase text-sm transition-all border-2',
                                                                                isActive
                                                                                          ? 'bg-fighter-red text-white border-ink-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -skew-x-3'
                                                                                          : 'bg-white text-ink-black border-transparent hover:border-ink-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-skew-x-3'
                                                                      )}
                                                            >
                                                                      <Icon className={cn(
                                                                                'w-5 h-5 transition-all',
                                                                                isActive ? 'text-white' : 'text-fighter-red'
                                                                      )} />
                                                                      <span style={{ transform: isActive ? 'skewX(3deg)' : 'none' }}>{item.label}</span>
                                                            </Link>
                                                  );
                                        })}
                              </nav>
                    </aside>
          );
}
