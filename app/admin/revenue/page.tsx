'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/useAuthStore';
import { PaymentSlip, Course, User, COLLECTIONS, PaymentStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calendar, Download, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';

interface RevenueData {
          totalRevenue: number;
          thisMonth: number;
          lastMonth: number;
          growth: number;
          recentPayments: {
                    id: string;
                    studentName: string;
                    courseName: string;
                    amount: number;
                    date: string;
          }[];
}

export default function AdminRevenuePage() {
          const { user } = useAuthStore();
          const [loading, setLoading] = useState(true);
          const [data, setData] = useState<RevenueData | null>(null);

          useEffect(() => {
                    if (user) {
                              fetchRevenueData();
                    }
          }, [user]);

          const fetchRevenueData = async () => {
                    try {
                              setLoading(true);

                              // Get approved payments for this admin's courses
                              const paymentsQuery = query(
                                        collection(db, COLLECTIONS.PAYMENT_SLIPS),
                                        where('ownerId', '==', user?.id),
                                        where('status', '==', PaymentStatus.APPROVED),
                                        orderBy('createdAt', 'desc')
                              );
                              const paymentsSnapshot = await getDocs(paymentsQuery);
                              const payments = paymentsSnapshot.docs.map(doc => ({
                                        id: doc.id,
                                        ...doc.data()
                              })) as PaymentSlip[];

                              // Calculate total revenue
                              const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

                              // Calculate this month and last month revenue
                              const now = new Date();
                              const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                              const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                              const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

                              let thisMonth = 0;
                              let lastMonth = 0;

                              payments.forEach(payment => {
                                        const paymentDate = payment.createdAt?.toDate?.();
                                        if (paymentDate) {
                                                  if (paymentDate >= thisMonthStart) {
                                                            thisMonth += payment.amount || 0;
                                                  } else if (paymentDate >= lastMonthStart && paymentDate <= lastMonthEnd) {
                                                            lastMonth += payment.amount || 0;
                                                  }
                                        }
                              });

                              // Calculate growth
                              const growth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

                              // Get recent payments with details
                              const recentPayments = await Promise.all(
                                        payments.slice(0, 5).map(async (payment) => {
                                                  let studentName = 'Unknown';
                                                  let courseName = 'Unknown';

                                                  try {
                                                            const studentDoc = await getDoc(doc(db, COLLECTIONS.USERS, payment.studentId));
                                                            if (studentDoc.exists()) {
                                                                      const studentData = studentDoc.data() as User;
                                                                      studentName = `${studentData.profile?.firstName || ''} ${studentData.profile?.lastName || ''}`.trim() || 'Unknown';
                                                            }
                                                  } catch (e) {
                                                            console.error('Error fetching student:', e);
                                                  }

                                                  try {
                                                            const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, payment.courseId));
                                                            if (courseDoc.exists()) {
                                                                      const courseData = courseDoc.data() as Course;
                                                                      courseName = courseData.title;
                                                            }
                                                  } catch (e) {
                                                            console.error('Error fetching course:', e);
                                                  }

                                                  return {
                                                            id: payment.id,
                                                            studentName,
                                                            courseName,
                                                            amount: payment.amount,
                                                            date: payment.createdAt?.toDate?.().toLocaleDateString('th-TH') || '',
                                                  };
                                        })
                              );

                              setData({
                                        totalRevenue,
                                        thisMonth,
                                        lastMonth,
                                        growth,
                                        recentPayments,
                              });
                    } catch (error) {
                              console.error('Error fetching revenue data:', error);
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
                    <div className="p-6">
                              <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                                  <Link href="/admin/dashboard">
                                                            <Button variant="outline" size="sm" className="border-ink-black text-ink-black hover:bg-gray-100">
                                                                      <ArrowLeft className="w-4 h-4" />
                                                            </Button>
                                                  </Link>
                                                  <h1 className="font-heading text-4xl uppercase text-ink-black">
                                                            สถิติ <span className="text-golden">รายได้</span>
                                                  </h1>
                                        </div>
                                        <Button variant="outline" className="border-2 border-ink-black text-ink-black hover:bg-gray-100">
                                                  <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                                                            <Download className="w-4 h-4" />
                                                            ดาวน์โหลดรายงาน
                                                  </span>
                                        </Button>
                              </div>

                              {/* Stats Cards */}
                              <div className="grid md:grid-cols-3 gap-6 mb-8">
                                        <Card>
                                                  <CardContent className="p-6">
                                                            <div className="flex items-center justify-between">
                                                                      <div>
                                                                                <p className="text-sm font-bold uppercase text-gray-600">รายได้รวม</p>
                                                                                <p className="font-heading text-3xl text-golden">฿{data?.totalRevenue.toLocaleString()}</p>
                                                                      </div>
                                                                      <div className="p-3 bg-golden/20 rounded-lg border-2 border-ink-black">
                                                                                <DollarSign className="w-8 h-8 text-golden" />
                                                                      </div>
                                                            </div>
                                                  </CardContent>
                                        </Card>

                                        <Card>
                                                  <CardContent className="p-6">
                                                            <div className="flex items-center justify-between">
                                                                      <div>
                                                                                <p className="text-sm font-bold uppercase text-gray-600">เดือนนี้</p>
                                                                                <p className="font-heading text-3xl text-fighter-red">฿{data?.thisMonth.toLocaleString()}</p>
                                                                      </div>
                                                                      <div className="p-3 bg-fighter-red/20 rounded-lg border-2 border-ink-black">
                                                                                <Calendar className="w-8 h-8 text-fighter-red" />
                                                                      </div>
                                                            </div>
                                                  </CardContent>
                                        </Card>

                                        <Card>
                                                  <CardContent className="p-6">
                                                            <div className="flex items-center justify-between">
                                                                      <div>
                                                                                <p className="text-sm font-bold uppercase text-gray-600">เติบโต</p>
                                                                                <p className={`font-heading text-3xl ${(data?.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                          {(data?.growth || 0) >= 0 ? '+' : ''}{data?.growth}%
                                                                                </p>
                                                                      </div>
                                                                      <div className="p-3 bg-green-500/20 rounded-lg border-2 border-ink-black">
                                                                                <TrendingUp className="w-8 h-8 text-green-600" />
                                                                      </div>
                                                            </div>
                                                  </CardContent>
                                        </Card>
                              </div>

                              {/* Recent Payments */}
                              <Card>
                                        <CardHeader>
                                                  <CardTitle>การชำระเงินล่าสุด</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                                  <div className="overflow-x-auto">
                                                            <table className="w-full">
                                                                      <thead>
                                                                                <tr className="border-b-2 border-ink-black">
                                                                                          <th className="text-left p-3 font-bold uppercase text-sm">นักเรียน</th>
                                                                                          <th className="text-left p-3 font-bold uppercase text-sm">คอร์ส</th>
                                                                                          <th className="text-left p-3 font-bold uppercase text-sm">จำนวน</th>
                                                                                          <th className="text-left p-3 font-bold uppercase text-sm">วันที่</th>
                                                                                </tr>
                                                                      </thead>
                                                                      <tbody>
                                                                                {data?.recentPayments.length === 0 ? (
                                                                                          <tr>
                                                                                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                                                                                              ยังไม่มีข้อมูลการชำระเงิน
                                                                                                    </td>
                                                                                          </tr>
                                                                                ) : (
                                                                                          data?.recentPayments.map((payment) => (
                                                                                                    <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                                                                              <td className="p-3">{payment.studentName}</td>
                                                                                                              <td className="p-3">{payment.courseName}</td>
                                                                                                              <td className="p-3 font-bold text-golden">฿{payment.amount.toLocaleString()}</td>
                                                                                                              <td className="p-3 text-gray-600">{payment.date}</td>
                                                                                                    </tr>
                                                                                          ))
                                                                                )}
                                                                      </tbody>
                                                            </table>
                                                  </div>
                                        </CardContent>
                              </Card>
                    </div>
          );
}
