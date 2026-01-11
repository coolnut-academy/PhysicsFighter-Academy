'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { Card } from '@/components/ui/card';
import { BookOpen, Receipt, DollarSign, Users } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
          const { user } = useAuthStore();

          const stats = [
                    {
                              title: 'My Courses',
                              value: user?.totalCoursesCreated || 0,
                              icon: BookOpen,
                              href: '/admin/courses',
                              color: 'neon-cyan',
                    },
                    {
                              title: 'Pending Payments',
                              value: '0', // Will be dynamic
                              icon: Receipt,
                              href: '/admin/payments',
                              color: 'neon-magenta',
                    },
                    {
                              title: 'Total Revenue',
                              value: `฿${user?.totalRevenue?.toLocaleString() || 0}`,
                              icon: DollarSign,
                              href: '/admin/revenue',
                              color: 'neon-purple',
                    },
                    {
                              title: 'Active Students',
                              value: '0', // Will be dynamic
                              icon: Users,
                              href: '/admin/courses',
                              color: 'neon-cyan',
                    },
          ];

          return (
                    <div className="space-y-8">
                              {/* Header */}
                              <div>
                                        <h1 className="text-4xl font-bold text-gradient">
                                                  Welcome back, {user?.profile.firstName}!
                                        </h1>
                                        <p className="text-dark-text-secondary mt-2">
                                                  Manage your courses and track your revenue.
                                        </p>
                              </div>

                              {/* Stats Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {stats.map((stat) => {
                                                  const Icon = stat.icon;
                                                  return (
                                                            <Link key={stat.title} href={stat.href}>
                                                                      <Card className="glass-card p-6 card-hover cursor-pointer">
                                                                                <div className="flex items-center justify-between">
                                                                                          <div>
                                                                                                    <p className="text-sm text-dark-text-secondary">
                                                                                                              {stat.title}
                                                                                                    </p>
                                                                                                    <p className={`text-3xl font-bold mt-2 text-${stat.color}`}>
                                                                                                              {stat.value}
                                                                                                    </p>
                                                                                          </div>
                                                                                          <div
                                                                                                    className={`w-12 h-12 rounded-lg bg-${stat.color}/20 flex items-center justify-center`}
                                                                                          >
                                                                                                    <Icon className={`w-6 h-6 text-${stat.color}`} />
                                                                                          </div>
                                                                                </div>
                                                                      </Card>
                                                            </Link>
                                                  );
                                        })}
                              </div>

                              {/* Quick Actions */}
                              <div className="grid md:grid-cols-2 gap-6">
                                        <Card className="glass-card p-6">
                                                  <h3 className="text-xl font-bold text-neon-cyan mb-4">
                                                            Quick Actions
                                                  </h3>
                                                  <div className="space-y-3">
                                                            <Link
                                                                      href="/admin/courses/create"
                                                                      className="block p-4 rounded-lg border border-neon-cyan/30 hover:bg-neon-cyan/10 transition-all"
                                                            >
                                                                      <div className="flex items-center gap-3">
                                                                                <BookOpen className="w-5 h-5 text-neon-cyan" />
                                                                                <div>
                                                                                          <p className="font-medium">Create New Course</p>
                                                                                          <p className="text-sm text-dark-text-secondary">
                                                                                                    Start building your next course
                                                                                          </p>
                                                                                </div>
                                                                      </div>
                                                            </Link>
                                                            <Link
                                                                      href="/admin/payments"
                                                                      className="block p-4 rounded-lg border border-neon-magenta/30 hover:bg-neon-magenta/10 transition-all"
                                                            >
                                                                      <div className="flex items-center gap-3">
                                                                                <Receipt className="w-5 h-5 text-neon-magenta" />
                                                                                <div>
                                                                                          <p className="font-medium">Review Payments</p>
                                                                                          <p className="text-sm text-dark-text-secondary">
                                                                                                    Check pending payment slips
                                                                                          </p>
                                                                                </div>
                                                                      </div>
                                                            </Link>
                                                            <Link
                                                                      href="/admin/settings"
                                                                      className="block p-4 rounded-lg border border-neon-purple/30 hover:bg-neon-purple/10 transition-all"
                                                            >
                                                                      <div className="flex items-center gap-3">
                                                                                <DollarSign className="w-5 h-5 text-neon-purple" />
                                                                                <div>
                                                                                          <p className="font-medium">Update Bank Details</p>
                                                                                          <p className="text-sm text-dark-text-secondary">
                                                                                                    Manage your payment QR code
                                                                                          </p>
                                                                                </div>
                                                                      </div>
                                                            </Link>
                                                  </div>
                                        </Card>

                                        <Card className="glass-card p-6">
                                                  <h3 className="text-xl font-bold text-neon-magenta mb-4">
                                                            Recent Activity
                                                  </h3>
                                                  <div className="space-y-4">
                                                            <p className="text-sm text-dark-text-secondary">
                                                                      No recent activity yet
                                                            </p>
                                                  </div>
                                        </Card>
                              </div>
                    </div>
          );
}
