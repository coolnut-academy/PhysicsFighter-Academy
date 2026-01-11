'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Zap, BookOpen, GraduationCap, LogOut, User } from 'lucide-react';
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
          { href: '/dashboard', label: 'Dashboard', icon: GraduationCap },
          { href: '/courses', label: 'Browse Courses', icon: BookOpen },
          { href: '/my-courses', label: 'My Courses', icon: BookOpen },
];

export function StudentNavbar() {
          const pathname = usePathname();
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
                              <div className="container mx-auto px-4">
                                        <div className="flex items-center justify-between h-16">
                                                  {/* Logo */}
                                                  <Link href="/dashboard" className="flex items-center gap-2">
                                                            <Zap className="w-6 h-6 text-neon-cyan" />
                                                            <span className="text-xl font-bold text-gradient">Physics Fighter</span>
                                                  </Link>

                                                  {/* Navigation Links */}
                                                  <div className="hidden md:flex items-center gap-6">
                                                            {navItems.map((item) => {
                                                                      const Icon = item.icon;
                                                                      const isActive = pathname === item.href;

                                                                      return (
                                                                                <Link
                                                                                          key={item.href}
                                                                                          href={item.href}
                                                                                          className={cn(
                                                                                                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                                                                                                    isActive
                                                                                                              ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                                                                                                              : 'text-dark-text-secondary hover:text-neon-cyan hover:bg-neon-cyan/10'
                                                                                          )}
                                                                                >
                                                                                          <Icon className="w-4 h-4" />
                                                                                          <span>{item.label}</span>
                                                                                </Link>
                                                                      );
                                                            })}
                                                  </div>

                                                  {/* User Menu */}
                                                  <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                      <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
                                                                                <Avatar className="w-8 h-8 border-2 border-neon-cyan/30">
                                                                                          <AvatarImage src={user?.profile.avatarUrl} />
                                                                                          <AvatarFallback className="bg-neon-cyan/20 text-neon-cyan text-xs">
                                                                                                    {user && getInitials(user.profile.firstName, user.profile.lastName)}
                                                                                          </AvatarFallback>
                                                                                </Avatar>
                                                                                <span className="hidden md:block text-sm">
                                                                                          {user?.profile.firstName}
                                                                                </span>
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
                                                                                <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
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
