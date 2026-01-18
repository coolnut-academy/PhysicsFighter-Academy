'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User, Course, Enrollment, PaymentSlip, COLLECTIONS, UserRole, PaymentStatus, EnrollmentStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, DollarSign, TrendingUp, BarChart3, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PlatformStats {
          totalUsers: number;
          totalAdmins: number;
          totalStudents: number;
          totalCourses: number;
          totalRevenue: number;
          activeEnrollments: number;
          monthlyGrowth: number;
}

export default function SuperAdminAnalyticsPage() {
          const [loading, setLoading] = useState(true);
          const [stats, setStats] = useState<PlatformStats | null>(null);

          useEffect(() => {
                    fetchStats();
          }, []);

          const fetchStats = async () => {
                    try {
                              setLoading(true);

                              // Fetch all users
                              const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
                              const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];

                              // Fetch all courses
                              const coursesSnapshot = await getDocs(collection(db, COLLECTIONS.COURSES));
                              const totalCourses = coursesSnapshot.size;

                              // Fetch approved payments for revenue
                              const paymentsQuery = query(
                                        collection(db, COLLECTIONS.PAYMENT_SLIPS),
                                        where('status', '==', PaymentStatus.APPROVED)
                              );
                              const paymentsSnapshot = await getDocs(paymentsQuery);
                              const payments = paymentsSnapshot.docs.map(doc => doc.data()) as PaymentSlip[];
                              const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

                              // Fetch active enrollments
                              const enrollmentsQuery = query(
                                        collection(db, COLLECTIONS.ENROLLMENTS),
                                        where('status', '==', EnrollmentStatus.ACTIVE)
                              );
                              const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
                              const activeEnrollments = enrollmentsSnapshot.size;

                              // Calculate user counts
                              const totalUsers = users.length;
                              const totalAdmins = users.filter(u => u.role === UserRole.ADMIN).length;
                              const totalStudents = users.filter(u => u.role === UserRole.STUDENT).length;

                              setStats({
                                        totalUsers,
                                        totalAdmins,
                                        totalStudents,
                                        totalCourses,
                                        totalRevenue,
                                        activeEnrollments,
                                        monthlyGrowth: 0, // Would need time-based queries to calculate
                              });
                    } catch (error) {
                              console.error('Error fetching stats:', error);
                    } finally {
                              setLoading(false);
                    }
          };

          if (loading) {
                    return (
                              <div className="flex items-center justify-center h-96">
                                        <div className="arcade-spinner" />
                              </div>
                    );
          }

          return (
                    <div className="p-6 min-h-screen bg-ink-black">
                              <div className="flex items-center gap-4 mb-8">
                                        <Link href="/super-admin/dashboard">
                                                  <Button variant="outline" size="sm" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black">
                                                            <ArrowLeft className="w-4 h-4" />
                                                  </Button>
                                        </Link>
                                        <h1 className="font-heading text-4xl uppercase text-white">
                                                  <BarChart3 className="inline w-8 h-8 mr-2" />
                                                  สถิติ<span className="text-golden">แพลตฟอร์ม</span>
                                        </h1>
                              </div>

                              {/* Overview Stats */}
                              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                        <Card className="bg-ink-black border-golden">
                                                  <CardContent className="p-6">
                                                            <div className="flex items-center justify-between">
                                                                      <div>
                                                                                <p className="text-sm font-bold uppercase text-gray-400">ผู้ใช้ทั้งหมด</p>
                                                                                <p className="font-heading text-4xl text-fighter-red">{stats?.totalUsers.toLocaleString()}</p>
                                                                      </div>
                                                                      <div className="p-3 bg-fighter-red/20 rounded-lg border-2 border-golden">
                                                                                <Users className="w-8 h-8 text-fighter-red" />
                                                                      </div>
                                                            </div>
                                                  </CardContent>
                                        </Card>

                                        <Card className="bg-ink-black border-golden">
                                                  <CardContent className="p-6">
                                                            <div className="flex items-center justify-between">
                                                                      <div>
                                                                                <p className="text-sm font-bold uppercase text-gray-400">คอร์สทั้งหมด</p>
                                                                                <p className="font-heading text-4xl text-golden">{stats?.totalCourses}</p>
                                                                      </div>
                                                                      <div className="p-3 bg-golden/20 rounded-lg border-2 border-golden">
                                                                                <BookOpen className="w-8 h-8 text-golden" />
                                                                      </div>
                                                            </div>
                                                  </CardContent>
                                        </Card>

                                        <Card className="bg-ink-black border-golden">
                                                  <CardContent className="p-6">
                                                            <div className="flex items-center justify-between">
                                                                      <div>
                                                                                <p className="text-sm font-bold uppercase text-gray-400">รายได้รวม</p>
                                                                                <p className="font-heading text-4xl text-green-500">฿{((stats?.totalRevenue || 0) / 1000000).toFixed(1)}M</p>
                                                                      </div>
                                                                      <div className="p-3 bg-green-500/20 rounded-lg border-2 border-golden">
                                                                                <DollarSign className="w-8 h-8 text-green-500" />
                                                                      </div>
                                                            </div>
                                                  </CardContent>
                                        </Card>

                                        <Card className="bg-ink-black border-golden">
                                                  <CardContent className="p-6">
                                                            <div className="flex items-center justify-between">
                                                                      <div>
                                                                                <p className="text-sm font-bold uppercase text-gray-400">การลงทะเบียน</p>
                                                                                <p className="font-heading text-4xl text-blue-500">{stats?.activeEnrollments}</p>
                                                                      </div>
                                                                      <div className="p-3 bg-blue-500/20 rounded-lg border-2 border-golden">
                                                                                <TrendingUp className="w-8 h-8 text-blue-500" />
                                                                      </div>
                                                            </div>
                                                  </CardContent>
                                        </Card>
                              </div>

                              {/* User Breakdown */}
                              <div className="grid lg:grid-cols-2 gap-6">
                                        <Card className="bg-ink-black border-golden">
                                                  <CardHeader>
                                                            <CardTitle className="text-white">สรุปผู้ใช้งาน</CardTitle>
                                                  </CardHeader>
                                                  <CardContent>
                                                            <div className="space-y-4">
                                                                      <div className="flex items-center justify-between p-4 bg-gray-900 border-2 border-golden">
                                                                                <span className="font-bold uppercase text-gray-300">นักเรียน</span>
                                                                                <span className="font-heading text-2xl text-fighter-red">{stats?.totalStudents.toLocaleString()}</span>
                                                                      </div>
                                                                      <div className="flex items-center justify-between p-4 bg-gray-900 border-2 border-golden">
                                                                                <span className="font-bold uppercase text-gray-300">ผู้สอน</span>
                                                                                <span className="font-heading text-2xl text-golden">{stats?.totalAdmins}</span>
                                                                      </div>
                                                                      <div className="flex items-center justify-between p-4 bg-gray-900 border-2 border-golden">
                                                                                <span className="font-bold uppercase text-gray-300">การลงทะเบียนที่ใช้งานอยู่</span>
                                                                                <span className="font-heading text-2xl text-green-500">{stats?.activeEnrollments}</span>
                                                                      </div>
                                                            </div>
                                                  </CardContent>
                                        </Card>

                                        <Card className="bg-ink-black border-golden">
                                                  <CardHeader>
                                                            <CardTitle className="text-white">ลัดไปยัง</CardTitle>
                                                  </CardHeader>
                                                  <CardContent>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                      <Link href="/super-admin/users">
                                                                                <div className="p-6 bg-fighter-red/10 border-2 border-golden text-center hover:bg-fighter-red/20 cursor-pointer transition-colors">
                                                                                          <Users className="w-8 h-8 mx-auto mb-2 text-fighter-red" />
                                                                                          <p className="font-bold uppercase text-sm text-gray-300">จัดการผู้ใช้</p>
                                                                                </div>
                                                                      </Link>
                                                                      <Link href="/super-admin/courses">
                                                                                <div className="p-6 bg-golden/10 border-2 border-golden text-center hover:bg-golden/20 cursor-pointer transition-colors">
                                                                                          <BookOpen className="w-8 h-8 mx-auto mb-2 text-golden" />
                                                                                          <p className="font-bold uppercase text-sm text-gray-300">ดูคอร์ส</p>
                                                                                </div>
                                                                      </Link>
                                                                      <Link href="/super-admin/payments">
                                                                                <div className="p-6 bg-green-500/10 border-2 border-golden text-center hover:bg-green-500/20 cursor-pointer transition-colors">
                                                                                          <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                                                                          <p className="font-bold uppercase text-sm text-gray-300">การชำระเงิน</p>
                                                                                </div>
                                                                      </Link>
                                                                      <div className="p-6 bg-blue-500/10 border-2 border-golden text-center hover:bg-blue-500/20 cursor-pointer transition-colors">
                                                                                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                                                                                <p className="font-bold uppercase text-sm text-gray-300">รายงาน</p>
                                                                      </div>
                                                            </div>
                                                  </CardContent>
                                        </Card>
                              </div>
                    </div>
          );
}
