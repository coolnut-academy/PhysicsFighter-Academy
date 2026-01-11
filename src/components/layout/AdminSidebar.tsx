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
          { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/admin/courses', label: 'My Courses', icon: BookOpen },
          { href: '/admin/payments', label: 'Payment Slips', icon: Receipt },
          { href: '/admin/revenue', label: 'Revenue', icon: DollarSign },
          { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
          const pathname = usePathname();

          return (
                    <aside className="w-64 border-r border-white/10 bg-dark-bg-secondary/50 backdrop-blur-sm">
                              <nav className="p-4 space-y-2">
                                        {sidebarItems.map((item) => {
                                                  const Icon = item.icon;
                                                  const isActive = pathname.startsWith(item.href);

                                                  return (
                                                            <Link
                                                                      key={item.href}
                                                                      href={item.href}
                                                                      className={cn(
                                                                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all group',
                                                                                isActive
                                                                                          ? 'bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30 shadow-[0_0_15px_rgba(255,0,255,0.2)]'
                                                                                          : 'text-dark-text-secondary hover:text-neon-magenta hover:bg-neon-magenta/10 hover:border hover:border-neon-magenta/20'
                                                                      )}
                                                            >
                                                                      <Icon className={cn(
                                                                                'w-5 h-5 transition-all',
                                                                                isActive ? 'text-neon-magenta' : 'group-hover:text-neon-magenta'
                                                                      )} />
                                                                      <span className="font-medium">{item.label}</span>
                                                            </Link>
                                                  );
                                        })}
                              </nav>
                    </aside>
          );
}
