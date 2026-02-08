"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  GraduationCap,
  User,
  Trophy,
  LayoutDashboard,
  Users as UsersIcon,
  BarChart3,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const studentNavItems: NavItem[] = [
  { href: '/', label: 'หน้าแรก', icon: Home },
  { href: '/courses', label: 'คอร์ส', icon: BookOpen },
  { href: '/my-enrollments', label: 'คอร์สของฉัน', icon: GraduationCap },
  { href: '/dashboard', label: 'โปรไฟล์', icon: User },
];

const adminNavItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/admin/courses', label: 'คอร์ส', icon: BookOpen },
  { href: '/admin/revenue', label: 'รายได้', icon: Trophy },
  { href: '/admin/settings', label: 'ตั้งค่า', icon: User },
];

const superAdminNavItems: NavItem[] = [
  { href: '/super-admin/dashboard', label: 'หน้าหลัก', icon: LayoutDashboard },
  { href: '/super-admin/users', label: 'ผู้ใช้', icon: UsersIcon },
  { href: '/super-admin/courses', label: 'คอร์ส', icon: BookOpen },
  { href: '/super-admin/analytics', label: 'สถิติ', icon: BarChart3 },
];

interface BottomNavProps {
  userRole?: 'student' | 'admin' | 'super-admin';
}

export function BottomNav({ userRole = 'student' }: BottomNavProps) {
  const pathname = usePathname();

  // Don't show bottom nav on certain pages
  const hiddenPaths = ['/login', '/register', '/checkout'];
  if (hiddenPaths.some(path => pathname.startsWith(path))) {
    return null;
  }

  // Choose nav items based on role
  // Logic: If role is admin/super-admin, show their nav GLOBALLY?
  // Or only on their pages?
  // User said "adjust PWA bottom bar... by role because each role has different bar".
  // Usually PWA Bottom Nav replaces browser nav, so it should be persistent based on ROLE.

  let navItems = studentNavItems;

  if (userRole === 'admin') {
    navItems = adminNavItems;
  } else if (userRole === 'super-admin') {
    navItems = superAdminNavItems;
  }

  // Existing logic checked `isAdminPage`. I prefer checking Role primarily.
  // Because if I am Admin on homepage, I might want Admin Nav?
  // But usually Admins also have "Student View".
  // Let's stick to: If on Admin Routes -> Admin Nav. If on Student Routes -> Student Nav.
  // But user said "adjust by role".

  const isAdminPage = pathname.startsWith('/admin');
  const isSuperAdminPage = pathname.startsWith('/super-admin');

  if (userRole === 'admin' && isAdminPage) {
    navItems = adminNavItems;
  } else if (userRole === 'super-admin' && isSuperAdminPage) {
    navItems = superAdminNavItems;
  } else if (userRole !== 'student' && !isAdminPage && !isSuperAdminPage) {
    // User is admin but viewing student pages?
    // Keep student nav items.
    navItems = studentNavItems;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-ink-black sm:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-colors duration-200",
                isActive
                  ? "text-fighter-red"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <div className={cn(
                "relative p-1.5 rounded-xl transition-all duration-200",
                isActive && "bg-fighter-red/10"
              )}>
                <Icon className={cn(
                  "w-6 h-6 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-fighter-red rounded-full" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium mt-0.5 truncate max-w-[64px]",
                isActive && "font-bold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Spacer component to add bottom padding when bottom nav is present
export function BottomNavSpacer() {
  return <div className="h-20 sm:hidden" />;
}

// Mobile header with back button
interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function MobileHeader({ title, showBack = true, rightAction }: MobileHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white border-b-2 border-ink-black sm:hidden safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => window.history.back()}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="กลับ"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="font-heading text-lg font-bold text-ink-black truncate">
            {title}
          </h1>
        </div>
        {rightAction && (
          <div className="flex items-center">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
}

// Pull to refresh wrapper (visual only)
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => void;
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  // This is a placeholder - actual pull-to-refresh implementation
  // would require more complex touch handling
  return (
    <div className="relative">
      {children}
    </div>
  );
}
