'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PaymentSlip, Course, User, COLLECTIONS, PaymentStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, CheckCircle, XCircle, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/hooks/use-toast';

interface PaymentWithDetails {
          id: string;
          student: string;
          course: string;
          amount: number;
          status: string;
          date: string;
          slipImageUrl?: string;
}

const statusLabels: Record<string, string> = {
          all: 'ทั้งหมด',
          pending: 'รอตรวจสอบ',
          approved: 'อนุมัติ',
          rejected: 'ปฏิเสธ',
};

export default function SuperAdminPaymentsPage() {
          const { user } = useAuthStore();
          const { toast } = useToast();
          const [loading, setLoading] = useState(true);
          const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
          const [filter, setFilter] = useState('all');

          useEffect(() => {
                    fetchPayments();
          }, []);

          const fetchPayments = async () => {
                    try {
                              setLoading(true);

                              const q = query(
                                        collection(db, COLLECTIONS.PAYMENT_SLIPS),
                                        orderBy('createdAt', 'desc')
                              );
                              const snapshot = await getDocs(q);
                              const paymentSlips = snapshot.docs.map(doc => ({
                                        id: doc.id,
                                        ...doc.data()
                              })) as PaymentSlip[];

                              // Fetch related data
                              const paymentsWithDetails: PaymentWithDetails[] = await Promise.all(
                                        paymentSlips.map(async (payment) => {
                                                  // Get student name
                                                  let studentName = 'Unknown';
                                                  try {
                                                            const studentDoc = await getDoc(doc(db, COLLECTIONS.USERS, payment.studentId));
                                                            if (studentDoc.exists()) {
                                                                      const studentData = studentDoc.data() as User;
                                                                      studentName = `${studentData.profile?.firstName || ''} ${studentData.profile?.lastName || ''}`.trim() || studentData.profile?.email || 'Unknown';
                                                            }
                                                  } catch (e) {
                                                            console.error('Error fetching student:', e);
                                                  }

                                                  // Get course name
                                                  let courseName = 'Unknown';
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
                                                            student: studentName,
                                                            course: courseName,
                                                            amount: payment.amount,
                                                            status: payment.status,
                                                            date: payment.createdAt?.toDate?.().toLocaleDateString('th-TH') || '',
                                                            slipImageUrl: payment.slipImageUrl,
                                                  };
                                        })
                              );

                              setPayments(paymentsWithDetails);
                    } catch (error) {
                              console.error('Error fetching payments:', error);
                    } finally {
                              setLoading(false);
                    }
          };

          const handleApprove = async (paymentId: string) => {
                    try {
                              await updateDoc(doc(db, COLLECTIONS.PAYMENT_SLIPS, paymentId), {
                                        status: PaymentStatus.APPROVED,
                                        reviewedBy: user?.id,
                                        reviewedAt: Timestamp.now(),
                                        updatedAt: Timestamp.now(),
                              });
                              toast({ title: 'อนุมัติสำเร็จ', description: 'การชำระเงินได้รับการอนุมัติแล้ว' });
                              fetchPayments();
                    } catch (error) {
                              console.error('Error approving payment:', error);
                              toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถอนุมัติได้', variant: 'destructive' });
                    }
          };

          const handleReject = async (paymentId: string) => {
                    try {
                              await updateDoc(doc(db, COLLECTIONS.PAYMENT_SLIPS, paymentId), {
                                        status: PaymentStatus.REJECTED,
                                        reviewedBy: user?.id,
                                        reviewedAt: Timestamp.now(),
                                        updatedAt: Timestamp.now(),
                              });
                              toast({ title: 'ปฏิเสธสำเร็จ', description: 'การชำระเงินถูกปฏิเสธแล้ว' });
                              fetchPayments();
                    } catch (error) {
                              console.error('Error rejecting payment:', error);
                              toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถปฏิเสธได้', variant: 'destructive' });
                    }
          };

          const filteredPayments = filter === 'all'
                    ? payments
                    : payments.filter(p => p.status === filter);

          if (loading) {
                    return (
                              <div className="flex items-center justify-center h-96">
                                        <div className="arcade-spinner" />
                              </div>
                    );
          }

          return (
                    <div className="p-6 min-h-screen bg-ink-black">
                              <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                                  <Link href="/super-admin/dashboard">
                                                            <Button variant="outline" size="sm" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black">
                                                                      <ArrowLeft className="w-4 h-4" />
                                                            </Button>
                                                  </Link>
                                                  <h1 className="font-heading text-4xl uppercase text-white">
                                                            การชำระเงิน<span className="text-golden">ทั้งหมด</span>
                                                  </h1>
                                        </div>
                                        <div className="flex items-center gap-2">
                                                  {Object.entries(statusLabels).map(([key, label]) => (
                                                            <Button
                                                                      key={key}
                                                                      variant={filter === key ? 'default' : 'outline'}
                                                                      size="sm"
                                                                      onClick={() => setFilter(key)}
                                                                      className={filter !== key ? 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-black' : ''}
                                                            >
                                                                      <span style={{ transform: 'skewX(6deg)' }}>{label}</span>
                                                            </Button>
                                                  ))}
                                        </div>
                              </div>

                              <Card className="bg-ink-black border-golden">
                                        <CardContent className="p-0">
                                                  <div className="overflow-x-auto">
                                                            <table className="w-full">
                                                                      <thead>
                                                                                <tr className="border-b-2 border-golden bg-gray-900">
                                                                                          <th className="text-left p-4 font-bold uppercase text-sm text-golden">นักเรียน</th>
                                                                                          <th className="text-left p-4 font-bold uppercase text-sm text-golden">คอร์ส</th>
                                                                                          <th className="text-left p-4 font-bold uppercase text-sm text-golden">จำนวน</th>
                                                                                          <th className="text-left p-4 font-bold uppercase text-sm text-golden">วันที่</th>
                                                                                          <th className="text-left p-4 font-bold uppercase text-sm text-golden">สถานะ</th>
                                                                                          <th className="text-left p-4 font-bold uppercase text-sm text-golden">จัดการ</th>
                                                                                </tr>
                                                                      </thead>
                                                                      <tbody>
                                                                                {filteredPayments.length === 0 ? (
                                                                                          <tr>
                                                                                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                                                                                              ไม่พบข้อมูลการชำระเงิน
                                                                                                    </td>
                                                                                          </tr>
                                                                                ) : (
                                                                                          filteredPayments.map((payment) => (
                                                                                                    <tr key={payment.id} className="border-b border-gray-700 hover:bg-gray-800">
                                                                                                              <td className="p-4 font-bold text-white">{payment.student}</td>
                                                                                                              <td className="p-4 text-gray-400">{payment.course}</td>
                                                                                                              <td className="p-4 font-bold text-golden">฿{payment.amount.toLocaleString()}</td>
                                                                                                              <td className="p-4 text-gray-400">{payment.date}</td>
                                                                                                              <td className="p-4">
                                                                                                                        <span className={`px-3 py-1 text-xs font-bold uppercase border-2 border-ink-black ${payment.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                                                                                                  payment.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                                                                                            'bg-yellow-100 text-yellow-700'
                                                                                                                                  }`}>
                                                                                                                                  {statusLabels[payment.status] || payment.status}
                                                                                                                        </span>
                                                                                                              </td>
                                                                                                              <td className="p-4">
                                                                                                                        <div className="flex items-center gap-2">
                                                                                                                                  {payment.slipImageUrl && (
                                                                                                                                            <a href={payment.slipImageUrl} target="_blank" rel="noopener noreferrer">
                                                                                                                                                      <Button variant="outline" size="sm" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black">
                                                                                                                                                                <Eye className="w-4 h-4" />
                                                                                                                                                      </Button>
                                                                                                                                            </a>
                                                                                                                                  )}
                                                                                                                                  {payment.status === 'pending' && (
                                                                                                                                            <>
                                                                                                                                                      <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(payment.id)}>
                                                                                                                                                                <CheckCircle className="w-4 h-4" />
                                                                                                                                                      </Button>
                                                                                                                                                      <Button variant="destructive" size="sm" onClick={() => handleReject(payment.id)}>
                                                                                                                                                                <XCircle className="w-4 h-4" />
                                                                                                                                                      </Button>
                                                                                                                                            </>
                                                                                                                                  )}
                                                                                                                        </div>
                                                                                                              </td>
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
