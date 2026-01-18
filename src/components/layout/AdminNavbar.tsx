'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Swords, LogOut, User, Flame } from 'lucide-react';
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

export function AdminNavbar() {
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
                              <div className="px-6">
                                        <div className="flex items-center justify-between h-16">
                                                  {/* 🥋 Arcade Logo */}
                                                  <Link href="/admin/dashboard" className="flex items-center gap-3">
                                                            <div className="bg-fighter-red p-2 border-2 border-ink-black -skew-x-6">
                                                                      <Swords className="w-6 h-6 text-white" style={{ transform: 'skewX(6deg)' }} />
                                                            </div>
                                                            <div className="-skew-x-3">
                                                                      <span className="text-xl font-heading uppercase text-ink-black tracking-wide">
                                                                                Physics Fighter
                                                                      </span>
                                                                      <div className="flex items-center gap-1">
                                                                                <Flame className="w-3 h-3 text-fighter-red" />
                                                                                <span className="text-xs font-bold uppercase text-fighter-red">ผู้สอน</span>
                                                                      </div>
                                                            </div>
                                                  </Link>

                                                  {/* User Dropdown */}
                                                  <div className="flex items-center gap-4">
                                                            <DropdownMenu>
                                                                      <DropdownMenuTrigger className="focus:outline-none">
                                                                                <div className="flex items-center gap-3 px-3 py-2 border-2 border-ink-black bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all -skew-x-3">
                                                                                          <Avatar className="w-8 h-8 border-2 border-ink-black">
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
                                                                      <DropdownMenuContent align="end" className="w-56 bg-white border-2 border-ink-black p-0">
                                                                                <DropdownMenuLabel className="p-4 border-b-2 border-ink-black">
                                                                                          <div className="flex items-center gap-3">
                                                                                                    <Avatar className="w-10 h-10 border-2 border-ink-black">
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
