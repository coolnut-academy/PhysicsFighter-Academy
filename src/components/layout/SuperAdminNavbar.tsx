'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Swords, LogOut, User, Shield, Crown } from 'lucide-react';
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

export function SuperAdminNavbar() {
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
                    <nav className="sticky top-0 z-50 bg-ink-black border-b-4 border-golden">
                              <div className="px-6">
                                        <div className="flex items-center justify-between h-16">
                                                  {/* 🥋 Super Admin Logo - Black theme with gold accents */}
                                                  <Link href="/super-admin/dashboard" className="flex items-center gap-3">
                                                            <div className="relative bg-golden p-2 border-2 border-white -skew-x-6">
                                                                      <Swords className="w-6 h-6 text-ink-black" style={{ transform: 'skewX(6deg)' }} />
                                                                      <Crown className="absolute -top-2 -right-2 w-4 h-4 text-golden bg-ink-black rounded-full p-0.5" />
                                                            </div>
                                                            <div className="-skew-x-3">
                                                                      <span className="text-xl font-heading uppercase text-white tracking-wide">
                                                                                Physics Fighter
                                                                      </span>
                                                                      <div className="flex items-center gap-1">
                                                                                <Shield className="w-3 h-3 text-golden" />
                                                                                <span className="text-xs font-bold uppercase text-golden">ผู้ดูแลระบบ</span>
                                                                      </div>
                                                            </div>
                                                  </Link>

                                                  {/* User Dropdown */}
                                                  <div className="flex items-center gap-4">
                                                            <DropdownMenu>
                                                                      <DropdownMenuTrigger className="focus:outline-none">
                                                                                <div className="flex items-center gap-3 px-3 py-2 border-2 border-golden bg-ink-black hover:shadow-[3px_3px_0px_0px_rgba(245,158,11,0.5)] transition-all -skew-x-3">
                                                                                          <Avatar className="w-8 h-8 border-2 border-golden">
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
                                                                      <DropdownMenuContent align="end" className="w-56 bg-ink-black border-2 border-golden p-0">
                                                                                <DropdownMenuLabel className="p-4 border-b-2 border-golden">
                                                                                          <div className="flex items-center gap-3">
                                                                                                    <Avatar className="w-10 h-10 border-2 border-golden">
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
