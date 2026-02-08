'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { BookOpen, GraduationCap, LogOut, User, Trophy } from 'lucide-react';
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
          { href: '/dashboard', label: 'หน้าหลัก', icon: GraduationCap },
          { href: '/courses', label: 'ค้นหาคอร์ส', icon: BookOpen },
          { href: '/my-courses', label: 'คอร์สของฉัน', icon: Trophy },
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
                    <nav className="sticky top-0 z-50 bg-white border-b-4 border-ink-black">
                              <div className="container mx-auto px-4">
                                        <div className="flex items-center justify-between h-16">
                                                  {/* 🥋 Logo */}
                                                  <Link href="/dashboard" className="flex items-center gap-3">
                                                            <LogoIcon size={36} />
                                                            <span className="text-xl font-bold">
                                                                      <span className="text-cover-red">Physics</span>
                                                                      <span className="text-cover-gray">Fight</span>
                                                                      <span className="text-cover-gray">Ter</span>
                                                            </span>
                                                  </Link>

                                                  {/* Navigation Links */}
                                                  <div className="hidden md:flex items-center gap-2">
                                                            {navItems.map((item) => {
                                                                      const Icon = item.icon;
                                                                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                                                                      return (
                                                                                <Link
                                                                                          key={item.href}
                                                                                          href={item.href}
                                                                                          className={cn(
                                                                                                    'px-4 py-2 font-bold uppercase text-sm transition-all rounded-xl border-2',
                                                                                                    isActive
                                                                                                              ? 'bg-fighter-red text-white border-ink-black shadow-md'
                                                                                                              : 'bg-white text-ink-black border-transparent hover:border-ink-black hover:shadow-sm'
                                                                                          )}
                                                                                >
                                                                                          <span className="flex items-center gap-2">
                                                                                                    <Icon className="w-4 h-4" />
                                                                                                    {item.label}
                                                                                          </span>
                                                                                </Link>
                                                                      );
                                                            })}
                                                  </div>

                                                  {/* User Dropdown */}
                                                  <div className="flex items-center gap-4">
                                                            <DropdownMenu>
                                                                      <DropdownMenuTrigger className="focus:outline-none">
                                                                                <div className="flex items-center gap-2 px-3 py-2 border-2 border-ink-black bg-white hover:shadow-md transition-all rounded-xl">
                                                                                          <Avatar className="w-8 h-8 border-2 border-ink-black rounded-full">
                                                                                                    <AvatarImage src={user?.profile.avatarUrl} />
                                                                                                    <AvatarFallback className="bg-fighter-red text-white font-bold">
                                                                                                              {user?.profile && getInitials(user.profile.firstName, user.profile.lastName)}
                                                                                                    </AvatarFallback>
                                                                                          </Avatar>
                                                                                          <span style={{ transform: 'skewX(3deg)' }} className="font-bold uppercase text-sm hidden sm:block">
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
                                                                                <DropdownMenuItem asChild>
                                                                                          <Link href="/profile" className="flex items-center gap-2 cursor-pointer font-bold uppercase text-sm p-3">
                                                                                                    <User className="w-4 h-4" />
                                                                                                    <span>โปรไฟล์</span>
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
