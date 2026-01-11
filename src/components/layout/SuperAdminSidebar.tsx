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
          { href: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/super-admin/users', label: 'User Management', icon: Users },
          { href: '/super-admin/courses', label: 'All Courses', icon: BookOpen },
          { href: '/super-admin/payments', label: 'All Payments', icon: Receipt },
          { href: '/super-admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export function SuperAdminSidebar() {
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
                                                                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all group relative',
                                                                                isActive
                                                                                          ? 'bg-gradient-to-r from-neon-purple/20 to-neon-cyan/20 text-neon-purple border border-neon-purple/30 shadow-[0_0_20px_rgba(157,0,255,0.3)]'
                                                                                          : 'text-dark-text-secondary hover:text-neon-purple hover:bg-neon-purple/10 hover:border hover:border-neon-purple/20'
                                                                      )}
                                                            >
                                                                      <Icon className={cn(
                                                                                'w-5 h-5 transition-all',
                                                                                isActive ? 'text-neon-purple' : 'group-hover:text-neon-purple'
                                                                      )} />
                                                                      <span className="font-medium">{item.label}</span>
                                                                      {isActive && (
                                                                                <Shield className="w-3 h-3 text-neon-cyan absolute top-2 right-2" />
                                                                      )}
                                                            </Link>
                                                  );
                                        })}
                              </nav>
                    </aside>
          );
}
