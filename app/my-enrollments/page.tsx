'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Enrollment, Course, COLLECTIONS, PaymentSlip, EnrollmentStatus, PaymentStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/shared/Loading';
import { BookOpen, Clock, ArrowLeft, PlayCircle, Lock, CheckCircle, Hourglass, AlertCircle, RotateCcw, Sparkles, Award, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { CountdownTimer, formatDuration } from '@/components/enrollment/CountdownTimer';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

interface EnrollmentWithCourse {
  enrollment: Enrollment;
  course: Course;
}

type TabType = 'all' | 'pending' | 'approved' | 'expired';

export default function MyEnrollmentsPage() {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);

      // 1. Query real enrollments
      const enrollmentsQuery = query(
        collection(db, COLLECTIONS.ENROLLMENTS),
        where('studentId', '==', user?.id)
      );
      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      const existingEnrollments = enrollmentsSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        console.log('[DEBUG] Enrollment data:', docSnap.id, {
          accessGranted: data.accessGranted,
          status: data.status,
          courseId: data.courseId,
        });
        return {
          id: docSnap.id,
          ...data,
          // Ensure accessGranted is explicitly boolean (handle undefined/null)
          accessGranted: data.accessGranted === true,
        };
      }) as Enrollment[];

      // Create a set of course IDs that already have enrollments
      const enrolledCourseIds = new Set(existingEnrollments.map(e => e.courseId));

      // 2. Query payment slips (to catch any pending ones without enrollments)
      const slipsQuery = query(
        collection(db, COLLECTIONS.PAYMENT_SLIPS),
        where('studentId', '==', user?.id)
      );
      const slipsSnap = await getDocs(slipsQuery);
      const paymentSlips = slipsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PaymentSlip[];

      // 3. Create virtual enrollments from pending/approved slips that don't have an enrollment entry
      const virtualEnrollments: Enrollment[] = paymentSlips
        .filter(slip => !enrolledCourseIds.has(slip.courseId) && slip.status !== PaymentStatus.REJECTED)
        .map(slip => {
          // Calculate potential expiration
          const startDate = slip.createdAt || Timestamp.now(); // fallback
          // We can't easily do date math on Timestamp without converting, 
          // but for display purposes we just need a valid object.
          // In a real app we might want to be more precise, but for "Pending" it doesn't matter much yet.

          return {
            id: `virtual-${slip.id}`,
            courseId: slip.courseId,
            studentId: slip.studentId,
            ownerId: slip.ownerId,
            startDate: startDate,
            expiresAt: startDate, // Placeholder, won't be used until approved
            selectedDuration: slip.selectedDuration,
            status: EnrollmentStatus.ACTIVE, // Treat as active process
            accessGranted: false, // Not granted yet
            paymentSlipId: slip.id,
            pricePaid: slip.amount,
            progress: [],
            overallProgress: 0,
            createdAt: slip.createdAt,
            updatedAt: slip.updatedAt,
          } as Enrollment;
        });

      // 4. Combine lists
      const allEnrollments = [...existingEnrollments, ...virtualEnrollments];

      // 5. Fetch course data for all
      const enrollmentsWithCourses = await Promise.all(
        allEnrollments.map(async (enrollment) => {
          try {
            const courseDoc = await getDoc(
              doc(db, COLLECTIONS.COURSES, enrollment.courseId)
            );
            if (!courseDoc.exists()) return null;

            const course = {
              id: courseDoc.id,
              ...courseDoc.data(),
            } as Course;

            return { enrollment, course };
          } catch (e) {
            console.error(`Failed to load course for enrollment ${enrollment.id}`, e);
            return null;
          }
        })
      );

      // Filter out nulls (failed course loads)
      setEnrollments(enrollmentsWithCourses.filter(Boolean) as EnrollmentWithCourse[]);

    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter enrollments based on tab
  const filteredEnrollments = enrollments.filter(({ enrollment }) => {
    const now = new Date();
    let expiresAt: Date;

    if (enrollment.expiresAt && typeof enrollment.expiresAt === 'object' && 'toDate' in enrollment.expiresAt) {
      expiresAt = enrollment.expiresAt.toDate();
    } else if (enrollment.expiresAt) {
      expiresAt = new Date(enrollment.expiresAt as any);
    } else {
      expiresAt = new Date();
    }

    const isExpired = expiresAt < now;

    switch (activeTab) {
      case 'pending':
        return !enrollment.accessGranted;
      case 'approved':
        return enrollment.accessGranted && !isExpired;
      case 'expired':
        return isExpired;
      default:
        return true;
    }
  });

  // Count by status
  const counts = {
    all: enrollments.length,
    pending: enrollments.filter(e => !e.enrollment.accessGranted).length,
    approved: enrollments.filter(e => e.enrollment.accessGranted).length,
    expired: enrollments.filter(e => {
      let expiresAt: Date;
      if (e.enrollment.expiresAt && typeof e.enrollment.expiresAt === 'object' && 'toDate' in e.enrollment.expiresAt) {
        expiresAt = e.enrollment.expiresAt.toDate();
      } else if (e.enrollment.expiresAt) {
        expiresAt = new Date(e.enrollment.expiresAt as any);
      } else {
        expiresAt = new Date();
      }
      return expiresAt < new Date();
    }).length,
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'all', label: 'ทั้งหมด', icon: <BookOpen className="w-4 h-4" />, count: counts.all },
    { key: 'pending', label: 'รออนุมัติ', icon: <Hourglass className="w-4 h-4" />, count: counts.pending },
    { key: 'approved', label: 'กำลังเรียน', icon: <PlayCircle className="w-4 h-4" />, count: counts.approved },
    { key: 'expired', label: 'หมดอายุ', icon: <AlertCircle className="w-4 h-4" />, count: counts.expired },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="Loading your enrollments..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับหน้าแรก
            </Button>
          </Link>
          <h1 className="text-4xl font-heading uppercase mb-2">
            <span className="text-fighter-red">คอร์ส</span>ที่ลงทะเบียนไว้
          </h1>
          <p className="text-gray-600">
            จัดการคอร์สที่คุณลงทะเบียนไว้ทั้งหมด
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-fighter-red text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={cn(
                "px-2 py-0.5 text-xs rounded-full",
                activeTab === tab.key ? "bg-white text-fighter-red" : "bg-gray-300 text-gray-700"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={fetchEnrollments} disabled={loading}>
            <RotateCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            รีเฟรชข้อมูล
          </Button>
        </div>

        {/* Enrollments List */}
        {filteredEnrollments.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold mb-2">
                {activeTab === 'pending' ? 'ไม่มีคอร์สที่รออนุมัติ' :
                  activeTab === 'approved' ? 'ไม่มีคอร์สที่กำลังเรียน' :
                    activeTab === 'expired' ? 'ไม่มีคอร์สที่หมดอายุ' :
                      'ยังไม่มีคอร์ส'}
              </h3>
              <p className="text-gray-600 mb-6">
                {activeTab === 'pending' ? 'คุณยังไม่ได้ลงทะเบียนคอร์ส หรือทุกคอร์สได้รับการอนุมัติแล้ว' :
                  activeTab === 'approved' ? 'คุณยังไม่มีคอร์สที่ได้รับการอนุมัติ' :
                    activeTab === 'expired' ? 'คุณยังไม่มีคอร์สที่หมดอายุ' :
                      'คุณยังไม่ได้ลงทะเบียนคอร์สใดๆ'}
              </p>
              <Link href="/courses">
                <Button className="bg-fighter-red">
                  ดูคอร์สทั้งหมด
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredEnrollments.map(({ enrollment, course }) => {
              const now = new Date();
              let expiresAt: Date;
              if (enrollment.expiresAt && typeof enrollment.expiresAt === 'object' && 'toDate' in enrollment.expiresAt) {
                expiresAt = enrollment.expiresAt.toDate();
              } else if (enrollment.expiresAt) {
                expiresAt = new Date(enrollment.expiresAt as any);
              } else {
                expiresAt = new Date();
              }
              const isExpired = expiresAt < now;
              const isApproved = enrollment.accessGranted === true;
              const isPending = !isApproved && !isExpired;

              return (
                <Card
                  key={enrollment.id}
                  className={cn(
                    "overflow-hidden transition-all duration-300 hover:shadow-xl group",
                    isApproved && !isExpired
                      ? "border-2 border-green-500 bg-gradient-to-r from-green-50 to-white shadow-green-100"
                      : isPending
                        ? "border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-white animate-pulse-subtle"
                        : "border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-white opacity-75"
                  )}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      {/* Course Thumbnail with Overlay */}
                      <div className="w-full lg:w-64 h-48 lg:h-auto bg-gray-100 relative shrink-0 overflow-hidden">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                            <GraduationCap className="w-16 h-16 text-gray-400" />
                          </div>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Status Badge - Premium Design */}
                        <div className="absolute top-3 left-3">
                          {isApproved && !isExpired ? (
                            <div className="relative">
                              <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                                <CheckCircle className="w-4 h-4" />
                                พร้อมเรียน
                                <Sparkles className="w-3 h-3 animate-pulse" />
                              </span>
                            </div>
                          ) : isPending ? (
                            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg animate-bounce">
                              <Hourglass className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                              รออนุมัติ
                            </span>
                          ) : (
                            <span className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                              <Lock className="w-4 h-4" />
                              หมดอายุ
                            </span>
                          )}
                        </div>

                        {/* Progress Circle - Bottom Right */}
                        {isApproved && !isExpired && (
                          <div className="absolute bottom-3 right-3">
                            <div className="relative w-14 h-14">
                              <svg className="w-14 h-14 transform -rotate-90">
                                <circle
                                  cx="28"
                                  cy="28"
                                  r="24"
                                  stroke="white"
                                  strokeOpacity="0.3"
                                  strokeWidth="4"
                                  fill="transparent"
                                />
                                <circle
                                  cx="28"
                                  cy="28"
                                  r="24"
                                  stroke="white"
                                  strokeWidth="4"
                                  fill="transparent"
                                  strokeDasharray={`${(enrollment.overallProgress || 0) * 1.5} 150`}
                                  className="transition-all duration-500"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white font-bold text-xs drop-shadow-lg">
                                  {enrollment.overallProgress || 0}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Course Info - Enhanced */}
                      <div className="flex-1 p-6">
                        <div className="flex flex-col h-full">
                          {/* Title & Description */}
                          <div className="mb-4">
                            <h3 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-fighter-red transition-colors">
                              {course.title}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {course.description}
                            </p>
                          </div>

                          {/* Stats Row */}
                          <div className="flex flex-wrap gap-4 mb-4">
                            {/* Duration Badge */}
                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">
                                {formatDuration(enrollment.selectedDuration || 3)}
                              </span>
                            </div>

                            {/* Modules Count */}
                            {course.modules && (
                              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                                <BookOpen className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">
                                  {course.modules.length} บท
                                </span>
                              </div>
                            )}

                            {/* Time Remaining (if approved) */}
                            {isApproved && !isExpired && enrollment.expiresAt && (
                              <div className="flex items-center gap-2">
                                <CountdownTimer expiresAt={enrollment.expiresAt} />
                              </div>
                            )}
                          </div>

                          {/* Status-specific Content */}
                          <div className="flex-1 flex items-end">
                            <div className="w-full">
                              {/* Approved: Show Progress & CTA */}
                              {isApproved && !isExpired && (
                                <div className="space-y-4">
                                  {/* Enhanced Progress Bar */}
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className="font-medium text-gray-600">ความคืบหน้า</span>
                                      <span className="font-bold text-fighter-red">{enrollment.overallProgress || 0}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-fighter-red to-red-600 transition-all duration-500 rounded-full relative"
                                        style={{ width: `${enrollment.overallProgress || 0}%` }}
                                      >
                                        {(enrollment.overallProgress || 0) > 10 && (
                                          <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* CTA Button */}
                                  <Link href={`/learn/course/${course.id}`} className="block">
                                    <Button className="w-full bg-gradient-to-r from-fighter-red to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                                      <PlayCircle className="w-5 h-5 mr-2" />
                                      {enrollment.overallProgress && enrollment.overallProgress > 0
                                        ? 'เรียนต่อ'
                                        : 'เริ่มเรียนเลย!'}
                                      <Sparkles className="w-4 h-4 ml-2" />
                                    </Button>
                                  </Link>
                                </div>
                              )}

                              {/* Pending: Show waiting message */}
                              {isPending && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                      <Hourglass className="w-5 h-5 text-amber-600 animate-pulse" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-bold text-amber-800 mb-1">กำลังรอการอนุมัติ</h4>
                                      <p className="text-sm text-amber-700">
                                        การชำระเงินของคุณอยู่ระหว่างการตรวจสอบ โดยทั่วไปจะใช้เวลาไม่เกิน 24 ชั่วโมง
                                      </p>
                                      <p className="text-xs text-amber-600 mt-2">
                                        📧 หากมีข้อสงสัย กรุณาติดต่อผู้สอนโดยตรง
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Expired: Show renewal option */}
                              {isExpired && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                      <AlertCircle className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-bold text-gray-700 mb-1">คอร์สหมดอายุแล้ว</h4>
                                      <p className="text-sm text-gray-600 mb-3">
                                        หมดอายุเมื่อ: {expiresAt.toLocaleDateString('th-TH', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </p>
                                      <Link href={`/checkout/${course.id}`}>
                                        <Button variant="outline" className="border-fighter-red text-fighter-red hover:bg-fighter-red hover:text-white">
                                          <RotateCcw className="w-4 h-4 mr-2" />
                                          ต่ออายุคอร์ส
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
