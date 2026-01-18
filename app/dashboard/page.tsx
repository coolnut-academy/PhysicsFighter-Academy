'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUserRole } from '@/store/useAuthStore';
import { UserRole } from '@/types';

// This is a redirect page - sends users to their appropriate dashboard
export default function DashboardRedirectPage() {
          const router = useRouter();
          const { user, initializing } = useAuthStore();
          const userRole = useUserRole();

          useEffect(() => {
                    if (!initializing) {
                              if (!user) {
                                        router.push('/login');
                              } else if (userRole) {
                                        switch (userRole) {
                                                  case UserRole.SUPER_ADMIN:
                                                            router.push('/super-admin/dashboard');
                                                            break;
                                                  case UserRole.ADMIN:
                                                            router.push('/admin/dashboard');
                                                            break;
                                                  case UserRole.STUDENT:
                                                            router.push('/learn/dashboard');
                                                            break;
                                                  default:
                                                            router.push('/learn/dashboard');
                                        }
                              }
                    }
          }, [user, userRole, initializing, router]);

          return (
                    <div className="min-h-screen flex items-center justify-center bg-paper-white">
                              <div className="arcade-spinner" />
                    </div>
          );
}
