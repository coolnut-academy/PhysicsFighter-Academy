'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { Card } from '@/components/ui/card';
import { Users, BookOpen, DollarSign, TrendingUp } from 'lucide-react';

export default function SuperAdminDashboard() {
          const { user } = useAuthStore();

          const stats = [
                    {
                              title: 'Total Users',
                              value: '0',
                              icon: Users,
                              color: 'neon-cyan',
                              change: '+12%',
                    },
                    {
                              title: 'Total Courses',
                              value: '0',
                              icon: BookOpen,
                              color: 'neon-magenta',
                              change: '+8%',
                    },
                    {
                              title: 'Platform Revenue',
                              value: '฿0',
                              icon: DollarSign,
                              color: 'neon-purple',
                              change: '+24%',
                    },
                    {
                              title: 'Active Enrollments',
                              value: '0',
                              icon: TrendingUp,
                              color: 'neon-cyan',
                              change: '+16%',
                    },
          ];

          return (
                    <div className="space-y-8">
                              <div>
                                        <h1 className="text-4xl font-bold text-gradient">
                                                  Super Admin Dashboard
                                        </h1>
                                        <p className="text-dark-text-secondary mt-2">
                                                  Platform overview and management
                                        </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {stats.map((stat) => {
                                                  const Icon = stat.icon;
                                                  return (
                                                            <Card key={stat.title} className="glass-card p-6">
                                                                      <div className="flex items-center justify-between mb-4">
                                                                                <div className={`w-12 h-12 rounded-lg bg-${stat.color}/20 flex items-center justify-center`}>
                                                                                          <Icon className={`w-6 h-6 text-${stat.color}`} />
                                                                                </div>
                                                                                <span className="text-sm text-green-400">{stat.change}</span>
                                                                      </div>
                                                                      <div>
                                                                                <p className="text-sm text-dark-text-secondary">{stat.title}</p>
                                                                                <p className={`text-3xl font-bold mt-1 text-${stat.color}`}>
                                                                                          {stat.value}
                                                                                </p>
                                                                      </div>
                                                            </Card>
                                                  );
                                        })}
                              </div>
                    </div>
          );
}
