'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { Zap, LogOut, User, Shield } from 'lucide-react';
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
          const { user, logout } = useAuthStore();

          const handleLogout = async () => {
                    try {
                              await logout();
                    } catch (error) {
                              console.error('Logout error:', error);
                    }
          };

          return (
                    <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-lg bg-dark-bg-primary/80">
                              <div className="px-6">
                                        <div className="flex items-center justify-between h-16">
                                                  {/* Logo */}
                                                  <Link href="/super-admin/dashboard" className="flex items-center gap-2">
                                                            <div className="relative">
                                                                      <Zap className="w-6 h-6 text-neon-purple" />
                                                                      <Shield className="w-3 h-3 text-neon-cyan absolute -top-1 -right-1" />
                                                            </div>
                                                            <div>
                                                                      <span className="text-xl font-bold text-gradient">Physics Fighter</span>
                                                                      <span className="ml-2 text-xs text-neon-purple">Super Admin</span>
                                                            </div>
                                                  </Link>

                                                  {/* User Menu */}
                                                  <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                      <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
                                                                                <div className="text-right hidden md:block">
                                                                                          <p className="text-sm font-medium">
                                                                                                    {user?.profile.firstName} {user?.profile.lastName}
                                                                                          </p>
                                                                                          <p className="text-xs text-neon-purple">Super Admin</p>
                                                                                </div>
                                                                                <Avatar className="w-9 h-9 border-2 border-neon-purple/30 ring-2 ring-neon-purple/20">
                                                                                          <AvatarImage src={user?.profile.avatarUrl} />
                                                                                          <AvatarFallback className="bg-neon-purple/20 text-neon-purple text-xs">
                                                                                                    {user && getInitials(user.profile.firstName, user.profile.lastName)}
                                                                                          </AvatarFallback>
                                                                                </Avatar>
                                                                      </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-56 glass-card border-white/10">
                                                                      <DropdownMenuLabel>
                                                                                <div className="flex flex-col space-y-1">
                                                                                          <p className="text-sm font-medium">
                                                                                                    {user?.profile.firstName} {user?.profile.lastName}
                                                                                          </p>
                                                                                          <p className="text-xs text-dark-text-muted">
                                                                                                    {user?.profile.email}
                                                                                          </p>
                                                                                </div>
                                                                      </DropdownMenuLabel>
                                                                      <DropdownMenuSeparator className="bg-white/10" />
                                                                      <DropdownMenuItem asChild>
                                                                                <Link href="/super-admin/profile" className="flex items-center gap-2 cursor-pointer">
                                                                                          <User className="w-4 h-4" />
                                                                                          <span>Profile</span>
                                                                                </Link>
                                                                      </DropdownMenuItem>
                                                                      <DropdownMenuSeparator className="bg-white/10" />
                                                                      <DropdownMenuItem
                                                                                onClick={handleLogout}
                                                                                className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400"
                                                                      >
                                                                                <LogOut className="w-4 h-4" />
                                                                                <span>Logout</span>
                                                                      </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                  </DropdownMenu>
                                        </div>
                              </div>
                    </nav>
          );
}
