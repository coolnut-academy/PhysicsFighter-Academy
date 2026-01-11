'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUserRole } from '@/store/useAuthStore';
import { UserRole } from '@/types';
import { Loader2, Zap, GraduationCap, Award } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
          const router = useRouter();
          const { user, initializing } = useAuthStore();
          const userRole = useUserRole();

          useEffect(() => {
                    // Redirect authenticated users to their dashboard
                    if (!initializing && user && userRole) {
                              switch (userRole) {
                                        case UserRole.SUPER_ADMIN:
                                                  router.push('/super-admin/dashboard');
                                                  break;
                                        case UserRole.ADMIN:
                                                  router.push('/admin/dashboard');
                                                  break;
                                        case UserRole.STUDENT:
                                                  router.push('/dashboard');
                                                  break;
                              }
                    }
          }, [user, userRole, initializing, router]);

          if (initializing) {
                    return (
                              <div className="min-h-screen flex items-center justify-center">
                                        <Loader2 className="w-12 h-12 animate-spin text-neon-cyan" />
                              </div>
                    );
          }

          return (
                    <div className="min-h-screen">
                              {/* Hero Section */}
                              <div className="relative overflow-hidden">
                                        {/* Background Effects */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-transparent to-neon-magenta/10" />

                                        <div className="container mx-auto px-4 py-20 relative z-10">
                                                  {/* Navigation */}
                                                  <nav className="flex justify-between items-center mb-20">
                                                            <div className="flex items-center gap-2">
                                                                      <Zap className="w-8 h-8 text-neon-cyan" />
                                                                      <h1 className="text-2xl font-bold text-gradient">Physics Fighter</h1>
                                                            </div>
                                                            <div className="flex gap-4">
                                                                      <Link
                                                                                href="/login"
                                                                                className="px-6 py-2 rounded-lg border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 transition-all"
                                                                      >
                                                                                Login
                                                                      </Link>
                                                                      <Link
                                                                                href="/register"
                                                                                className="neon-button"
                                                                      >
                                                                                <span>Get Started</span>
                                                                      </Link>
                                                            </div>
                                                  </nav>

                                                  {/* Hero Content */}
                                                  <div className="text-center max-w-4xl mx-auto space-y-8">
                                                            <h2 className="text-6xl font-bold">
                                                                      Master Physics with
                                                                      <br />
                                                                      <span className="text-gradient animate-neon-pulse">Expert Instructors</span>
                                                            </h2>

                                                            <p className="text-xl text-dark-text-secondary max-w-2xl mx-auto">
                                                                      Join the ultimate educational platform where students learn physics through
                                                                      interactive courses and instructors share their expertise.
                                                            </p>

                                                            <div className="flex gap-4 justify-center">
                                                                      <Link href="/register" className="neon-button">
                                                                                <span>Start Learning</span>
                                                                      </Link>
                                                                      <Link
                                                                                href="/courses"
                                                                                className="px-8 py-3 rounded-lg border border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10 transition-all font-bold"
                                                                      >
                                                                                Browse Courses
                                                                      </Link>
                                                            </div>
                                                  </div>

                                                  {/* Features Grid */}
                                                  <div className="grid md:grid-cols-3 gap-8 mt-20">
                                                            <div className="glass-card p-8 card-hover">
                                                                      <div className="w-12 h-12 rounded-lg bg-neon-cyan/20 flex items-center justify-center mb-4">
                                                                                <GraduationCap className="w-6 h-6 text-neon-cyan" />
                                                                      </div>
                                                                      <h3 className="text-xl font-bold mb-2 text-neon-cyan">Learn from Experts</h3>
                                                                      <p className="text-dark-text-secondary">
                                                                                Access high-quality courses created by experienced physics instructors.
                                                                      </p>
                                                            </div>

                                                            <div className="glass-card p-8 card-hover">
                                                                      <div className="w-12 h-12 rounded-lg bg-neon-magenta/20 flex items-center justify-center mb-4">
                                                                                <Zap className="w-6 h-6 text-neon-magenta" />
                                                                      </div>
                                                                      <h3 className="text-xl font-bold mb-2 text-neon-magenta">Flexible Access</h3>
                                                                      <p className="text-dark-text-secondary">
                                                                                Choose 3, 6, or 12-month access periods that fit your learning schedule.
                                                                      </p>
                                                            </div>

                                                            <div className="glass-card p-8 card-hover">
                                                                      <div className="w-12 h-12 rounded-lg bg-neon-purple/20 flex items-center justify-center mb-4">
                                                                                <Award className="w-6 h-6 text-neon-purple" />
                                                                      </div>
                                                                      <h3 className="text-xl font-bold mb-2 text-neon-purple">Earn Certificates</h3>
                                                                      <p className="text-dark-text-secondary">
                                                                                Complete courses and receive certificates to showcase your achievements.
                                                                      </p>
                                                            </div>
                                                  </div>
                                        </div>
                              </div>

                              {/* Footer */}
                              <footer className="border-t border-white/10 mt-20">
                                        <div className="container mx-auto px-4 py-8 text-center text-dark-text-secondary">
                                                  <p>&copy; 2026 Physics Fighter Academy. All rights reserved.</p>
                                        </div>
                              </footer>
                    </div>
          );
}
