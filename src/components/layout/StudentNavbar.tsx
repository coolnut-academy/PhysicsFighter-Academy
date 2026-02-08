'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { BookOpen, GraduationCap, LogOut, User, Trophy, Menu } from 'lucide-react';
import { LogoIcon } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
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

const navItems = [
          { href: '/learn/dashboard', label: 'หน้าแรก', icon: GraduationCap },
          { href: '/courses', label: 'ค้นหาคอร์ส', icon: BookOpen },
          { href: '/my-enrollments', label: 'คอร์สของฉัน', icon: Trophy },
];

export function StudentNavbar() {
          const pathname = usePathname();
          const router = useRouter();
          const { user, logout } = useAuthStore();

          const handleLogout = async () => {
                    try {
                              await logout();
                              router.push('/');
                    } catch (error) {
                              console.error('Logout error:', error);
                    }
          };

          return (
                    <nav className="sticky top-0 z-50 bg-white border-b-4 border-ink-black h-16">
                              <div className="container mx-auto px-4 h-full">
                                        <div className="flex items-center justify-between h-full">
                                                  <div className="flex items-center gap-4">
                                                            {/* 🍔 Hamburger Menu (Mobile Only) */}
                                                            <div className="lg:hidden">
                                                                      <DropdownMenu>
                                                                                <DropdownMenuTrigger className="p-2 -ml-2 rounded-lg hover:bg-gray-100 focus:outline-none">
                                                                                          <Menu className="w-6 h-6 text-ink-black" />
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="start" className="w-56 bg-white border-2 border-ink-black rounded-xl p-2 mt-2 ml-2">
                                                                                          {navItems.map((item) => {
                                                                                                    const Icon = item.icon;
                                                                                                    const isActive = pathname === item.href;
                                                                                                    return (
                                                                                                              <DropdownMenuItem key={item.href} asChild>
                                                                                                                        <Link
                                                                                                                                  href={item.href}
                                                                                                                                  className={cn(
                                                                                                                                            "flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-sm uppercase mb-1",
                                                                                                                                            isActive ? "bg-fighter-red text-white" : "text-ink-black hover:bg-gray-100"
                                                                                                                                  )}
                                                                                                                        >
                                                                                                                                  <Icon className="w-4 h-4" />
                                                                                                                                  {item.label}
                                                                                                                        </Link>
                                                                                                              </DropdownMenuItem>
                                                                                                    );
                                                                                          })}
                                                                                          <DropdownMenuSeparator className="bg-gray-200" />
                                                                                          <DropdownMenuItem
                                                                                                    onClick={handleLogout}
                                                                                                    className="flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-sm uppercase text-red-600 hover:bg-red-50 cursor-pointer"
                                                                                          >
                                                                                                    <LogOut className="w-4 h-4" />
                                                                                                    ออกจากระบบ
                                                                                          </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                      </DropdownMenu>
                                                            </div>

                                                            {/* 🥋 Logo */}
                                                            <Link href="/dashboard" className="flex items-center gap-3">
                                                                      <LogoIcon size={32} />
                                                                      <span className="text-xl font-bold section-title text-ink-black hidden sm:inline-block">
                                                                                <span className="text-fighter-red">Physics</span>
                                                                                <span className="text-ink-black">Fighter</span>
                                                                      </span>
                                                            </Link>
                                                  </div>

                                                  {/* Desktop Nav Links - HIDDEN now as we use Sidebar */}
                                                  {/* <div className="hidden lg:flex items-center gap-2"> ... </div> */}

                                                  {/* User Dropdown */}
                                                  <div className="flex items-center gap-4">
                                                            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 border-2 border-ink-black bg-white rounded-xl shadow-sm">
                                                                      <span className="font-bold uppercase text-xs truncate max-w-[100px]">
                                                                                {user?.profile.firstName}
                                                                      </span>
                                                                      <div className="w-px h-6 bg-gray-200"></div>
                                                                      <span className="text-xs text-gray-500 font-medium">นักเรียน</span>
                                                            </div>

                                                            <Link href="/profile">
                                                                      <Avatar className="w-9 h-9 border-2 border-ink-black rounded-full cursor-pointer hover:scale-105 transition-transform">
                                                                                <AvatarImage src={user?.profile.avatarUrl} />
                                                                                <AvatarFallback className="bg-fighter-red text-white font-bold text-xs">
                                                                                          {user?.profile && getInitials(user.profile.firstName, user.profile.lastName)}
                                                                                </AvatarFallback>
                                                                      </Avatar>
                                                            </Link>
                                                  </div>
                                        </div>
                              </div>
                    </nav>
          );
}
