'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import { useAuthStore } from '@/store/useAuthStore';
import {
          LogOut,
          User,
          Flame,
          Menu, // Added
          LayoutDashboard, // Added
          BookOpen, // Added
          Receipt, // Added
          DollarSign, // Added
          Settings // Added
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
import { cn } from '@/lib/utils'; // Import cn

const navItems = [
          { href: '/admin/dashboard', label: 'ห้องบัญชาการ', icon: LayoutDashboard },
          { href: '/admin/courses', label: 'คอร์สของฉัน', icon: BookOpen },
          { href: '/admin/payments', label: 'สลิปชำระเงิน', icon: Receipt },
          { href: '/admin/revenue', label: 'รายได้', icon: DollarSign },
          { href: '/admin/settings', label: 'ตั้งค่า', icon: Settings },
];

export function AdminNavbar() {
          const router = useRouter();
          const { user, logout } = useAuthStore();
          const pathname = usePathname(); // Use usePathname hook

          const handleLogout = async () => {
                    try {
                              await logout();
                              router.push('/');
                    } catch (error) {
                              console.error('Logout error:', error);
                    }
          };

          return (
                    <nav className="sticky top-0 z-50 bg-white border-b-4 border-ink-black">
                              <div className="px-6">
                                        <div className="flex items-center justify-between h-16">
                                                  <div className="flex items-center gap-4">
                                                            {/* 🍔 Hamburger Menu (Mobile Only) */}
                                                            <div className="lg:hidden">
                                                                      <DropdownMenu>
                                                                                <DropdownMenuTrigger className="p-2 -ml-2 rounded-lg hover:bg-gray-100 focus:outline-none">
                                                                                          <Menu className="w-6 h-6 text-ink-black" />
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="start" className="w-56 bg-white border-2 border-ink-black rounded-xl p-2 mt-2">
                                                                                          {navItems.map((item) => {
                                                                                                    const Icon = item.icon;
                                                                                                    return (
                                                                                                              <DropdownMenuItem key={item.href} asChild>
                                                                                                                        <Link
                                                                                                                                  href={item.href}
                                                                                                                                  className={cn(
                                                                                                                                            "flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-sm uppercase mb-1 text-ink-black hover:bg-gray-100 cursor-pointer",
                                                                                                                                            pathname === item.href && "bg-gray-100" // Active state
                                                                                                                                  )}
                                                                                                                        >
                                                                                                                                  <Icon className="w-4 h-4" />
                                                                                                                                  {item.label}
                                                                                                                        </Link>
                                                                                                              </DropdownMenuItem>
                                                                                                    );
                                                                                          })}
                                                                                </DropdownMenuContent>
                                                                      </DropdownMenu>
                                                            </div>

                                                            {/* 🥋 Arcade Logo */}
                                                            <Link href="/admin/dashboard" className="flex items-center gap-3">
                                                                      <LogoIcon size={36} />
                                                                      <div>
                                                                                <span className="text-xl font-bold tracking-wide">
                                                                                          <span className="text-cover-red">Physics</span>
                                                                                          <span className="text-cover-gray">Fight</span>
                                                                                          <span className="text-cover-gray">Ter</span>
                                                                                </span>
                                                                                <div className="flex items-center gap-1">
                                                                                          <Flame className="w-3 h-3 text-fighter-red" />
                                                                                          <span className="text-xs font-bold uppercase text-fighter-red">ผู้สอน</span>
                                                                                </div>
                                                                      </div>
                                                            </Link>
                                                  </div>

                                                  {/* User Dropdown */}
                                                  <div className="flex items-center gap-4">
                                                            <DropdownMenu>
                                                                      <DropdownMenuTrigger className="focus:outline-none">
                                                                                <div className="flex items-center gap-3 px-3 py-2 border-2 border-ink-black bg-white hover:shadow-md transition-all rounded-xl">
                                                                                          <Avatar className="w-8 h-8 border-2 border-ink-black rounded-full">
                                                                                                    <AvatarImage src={user?.profile.avatarUrl} />
                                                                                                    <AvatarFallback className="bg-fighter-red text-white font-bold text-sm">
                                                                                                              {user?.profile && getInitials(user.profile.firstName, user.profile.lastName)}
                                                                                                    </AvatarFallback>
                                                                                          </Avatar>
                                                                                          <span style={{ transform: 'skewX(3deg)' }} className="hidden sm:block font-bold uppercase text-sm">
                                                                                                    {user?.profile.firstName}
                                                                                          </span>
                                                                                </div>
                                                                      </DropdownMenuTrigger>
                                                                      <DropdownMenuContent align="end" className="w-56 bg-white border-2 border-ink-black rounded-xl p-0">
                                                                                <DropdownMenuLabel className="p-4 border-b-2 border-ink-black">
                                                                                          <div className="flex items-center gap-3">
                                                                                                    <Avatar className="w-10 h-10 border-2 border-ink-black rounded-full">
                                                                                                              <AvatarImage src={user?.profile.avatarUrl} />
                                                                                                              <AvatarFallback className="bg-fighter-red text-white font-bold">
                                                                                                                        {user?.profile && getInitials(user.profile.firstName, user.profile.lastName)}
                                                                                                              </AvatarFallback>
                                                                                                    </Avatar>
                                                                                                    <div>
                                                                                                              <p className="font-bold">{user?.profile.firstName} {user?.profile.lastName}</p>
                                                                                                              <p className="text-sm text-gray-500">{user?.profile.email}</p>
                                                                                                    </div>
                                                                                          </div>
                                                                                </DropdownMenuLabel>
                                                                                <DropdownMenuSeparator className="bg-ink-black" />
                                                                                <DropdownMenuItem asChild>
                                                                                          <Link href="/admin/settings" className="flex items-center gap-2 cursor-pointer font-bold uppercase text-sm p-3">
                                                                                                    <User className="w-4 h-4" />
                                                                                                    <span>ตั้งค่า</span>
                                                                                          </Link>
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuSeparator className="bg-ink-black" />
                                                                                <DropdownMenuItem
                                                                                          onClick={handleLogout}
                                                                                          className="flex items-center gap-2 cursor-pointer font-bold uppercase text-sm text-fighter-red focus:text-fighter-red focus:bg-red-50 p-3"
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
