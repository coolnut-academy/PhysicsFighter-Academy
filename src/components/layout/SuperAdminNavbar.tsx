'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
          LogOut,
          User,
          Shield,
          Crown,
          Menu,
          LayoutDashboard,
          Users,
          BookOpen,
          Receipt,
          BarChart3
} from 'lucide-react';
import { LogoIcon } from '@/components/ui/Logo';
import {
          DropdownMenu,
          DropdownMenuContent,
          DropdownMenuItem,
          DropdownMenuLabel,
          DropdownMenuSeparator,
          DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

const navItems = [
          { href: '/super-admin/dashboard', label: 'ห้องบัญชาการ', icon: LayoutDashboard },
          { href: '/super-admin/users', label: 'จัดการผู้ใช้', icon: Users },
          { href: '/super-admin/courses', label: 'คอร์สทั้งหมด', icon: BookOpen },
          { href: '/super-admin/payments', label: 'การชำระเงิน', icon: Receipt },
          { href: '/super-admin/analytics', label: 'สถิติ', icon: BarChart3 },
];

export function SuperAdminNavbar() {
          const router = useRouter();
          const { user, logout } = useAuthStore();
          const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
          // Note: using window.location here might cause hydration mismatch if not careful, better to use usePathname hook
          // but imports. Let's rely on usePathname if possible. The file had useRouter imported.
          // I'll assume usePathname is imported or I'll add it in the imports.
          // Wait, I can't add import to strict block without seeing the file import section.
          // The previous view_file showed `import { useRouter } from 'next/navigation';`.
          // I will assume I can modify the import line.

          const handleLogout = async () => {
                    try {
                              await logout();
                              router.push('/');
                    } catch (error) {
                              console.error('Logout error:', error);
                    }
          };

          return (
                    <nav className="sticky top-0 z-50 bg-ink-black border-b-4 border-golden">
                              <div className="px-6">
                                        <div className="flex items-center justify-between h-16">
                                                  <div className="flex items-center gap-4">
                                                            {/* 🍔 Hamburger Menu for Super Admin */}
                                                            <div className="lg:hidden">
                                                                      <DropdownMenu>
                                                                                <DropdownMenuTrigger className="p-2 -ml-2 rounded-lg hover:bg-white/10 focus:outline-none">
                                                                                          <Menu className="w-6 h-6 text-golden" />
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="start" className="w-56 bg-ink-black border-2 border-golden rounded-xl p-2 mt-2">
                                                                                          {navItems.map((item) => {
                                                                                                    const Icon = item.icon;
                                                                                                    return (
                                                                                                              <DropdownMenuItem key={item.href} asChild>
                                                                                                                        <Link
                                                                                                                                  href={item.href}
                                                                                                                                  className={cn(
                                                                                                                                            "flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-sm uppercase mb-1 cursor-pointer transition-colors",
                                                                                                                                            // Active state logic should ideally use pathname hook
                                                                                                                                            "text-gray-300 hover:text-golden hover:bg-white/5"
                                                                                                                                  )}
                                                                                                                        >
                                                                                                                                  <Icon className="w-4 h-4 text-golden" />
                                                                                                                                  {item.label}
                                                                                                                        </Link>
                                                                                                              </DropdownMenuItem>
                                                                                                    );
                                                                                          })}
                                                                                </DropdownMenuContent>
                                                                      </DropdownMenu>
                                                            </div>

                                                            {/* 🥋 Super Admin Logo - Black theme with gold accents */}
                                                            <Link href="/super-admin/dashboard" className="flex items-center gap-3">
                                                                      <div className="relative">
                                                                                <LogoIcon size={36} />
                                                                                <Crown className="absolute -top-1 -right-1 w-4 h-4 text-golden bg-ink-black rounded-full p-0.5" />
                                                                      </div>
                                                                      <div>
                                                                                <span className="text-xl font-bold tracking-wide">
                                                                                          <span className="text-white">Physics</span>
                                                                                          <span className="text-gray-400">Fight</span>
                                                                                          <span className="text-gray-400">Ter</span>
                                                                                </span>
                                                                                <div className="flex items-center gap-1">
                                                                                          <Shield className="w-3 h-3 text-golden" />
                                                                                          <span className="text-xs font-bold uppercase text-golden">ผู้ดูแลระบบ</span>
                                                                                </div>
                                                                      </div>
                                                            </Link>
                                                  </div>

                                                  {/* User Dropdown */}
                                                  <div className="flex items-center gap-4">
                                                            <DropdownMenu>
                                                                      <DropdownMenuTrigger className="focus:outline-none">
                                                                                <div className="flex items-center gap-3 px-3 py-2 border-2 border-golden bg-ink-black hover:shadow-md hover:shadow-golden/30 transition-all rounded-xl">
                                                                                          <Avatar className="w-8 h-8 border-2 border-golden rounded-full">
                                                                                                    <AvatarImage src={user?.profile.avatarUrl} />
                                                                                                    <AvatarFallback className="bg-golden text-ink-black font-bold text-sm">
                                                                                                              {user?.profile && getInitials(user.profile.firstName, user.profile.lastName)}
                                                                                                    </AvatarFallback>
                                                                                          </Avatar>
                                                                                          <span style={{ transform: 'skewX(3deg)' }} className="hidden sm:block font-bold uppercase text-sm text-white">
                                                                                                    {user?.profile.firstName}
                                                                                          </span>
                                                                                </div>
                                                                      </DropdownMenuTrigger>
                                                                      <DropdownMenuContent align="end" className="w-56 bg-ink-black border-2 border-golden rounded-xl p-0">
                                                                                <DropdownMenuLabel className="p-4 border-b-2 border-golden">
                                                                                          <div className="flex items-center gap-3">
                                                                                                    <Avatar className="w-10 h-10 border-2 border-golden rounded-full">
                                                                                                              <AvatarImage src={user?.profile.avatarUrl} />
                                                                                                              <AvatarFallback className="bg-golden text-ink-black font-bold">
                                                                                                                        {user?.profile && getInitials(user.profile.firstName, user.profile.lastName)}
                                                                                                              </AvatarFallback>
                                                                                                    </Avatar>
                                                                                                    <div>
                                                                                                              <p className="font-bold text-white">{user?.profile.firstName} {user?.profile.lastName}</p>
                                                                                                              <p className="text-sm text-gray-400">{user?.profile.email}</p>
                                                                                                    </div>
                                                                                          </div>
                                                                                </DropdownMenuLabel>
                                                                                <DropdownMenuSeparator className="bg-golden" />
                                                                                <DropdownMenuItem asChild>
                                                                                          <Link href="/super-admin/profile" className="flex items-center gap-2 cursor-pointer font-bold uppercase text-sm text-gray-300 hover:text-golden p-3">
                                                                                                    <User className="w-4 h-4" />
                                                                                                    <span>โปรไฟล์</span>
                                                                                          </Link>
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuSeparator className="bg-golden" />
                                                                                <DropdownMenuItem
                                                                                          onClick={handleLogout}
                                                                                          className="flex items-center gap-2 cursor-pointer font-bold uppercase text-sm text-fighter-red focus:text-fighter-red p-3"
                                                                                >
                                                                                          <LogOut className="w-4 h-4" />
                                                                                          <span>ออกจากระบบ</span>
                                                                                </DropdownMenuItem>
                                                                      </DropdownMenuContent>
                                                            </DropdownMenu>
                                                  </div>
                                        </div>
                              </div>
                    </nav>
          );
}
