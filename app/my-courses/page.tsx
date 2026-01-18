'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/useAuthStore';
import { Enrollment, Course, COLLECTIONS } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Trophy, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EnrolledCourse {
          id: string;
          title: string;
          progress: number;
          totalLessons: number;
          completedLessons: number;
          expiresAt: string;
          thumbnailUrl: string;
}

export default function MyCoursesPage() {
          const { user } = useAuthStore();
          const [loading, setLoading] = useState(true);
          const [courses, setCourses] = useState<EnrolledCourse[]>([]);

          useEffect(() => {
                    if (user) {
                              fetchEnrolledCourses();
                    } else {
                              setLoading(false);
                    }
          }, [user]);

          const fetchEnrolledCourses = async () => {
                    try {
                              setLoading(true);

                              // Query enrollments for current student
                              const q = query(
                                        collection(db, COLLECTIONS.ENROLLMENTS),
                                        where('studentId', '==', user?.id)
                              );

                              const snapshot = await getDocs(q);
                              const enrollmentsData = snapshot.docs.map((doc) => ({
                                        id: doc.id,
                                        ...doc.data(),
                              })) as Enrollment[];

                              // Fetch course data for each enrollment
                              const enrolledCourses: EnrolledCourse[] = await Promise.all(
                                        enrollmentsData.map(async (enrollment) => {
                                                  const courseDoc = await getDoc(
                                                            doc(db, COLLECTIONS.COURSES, enrollment.courseId)
                                                  );
                                                  const course = courseDoc.data() as Course | undefined;

                                                  // Calculate completed lessons
                                                  const completedLessons = enrollment.progress?.filter(p => p.completedAt).length || 0;

                                                  return {
                                                            id: enrollment.courseId,
                                                            title: course?.title || 'Unknown Course',
                                                            progress: enrollment.overallProgress || 0,
                                                            totalLessons: course?.totalLessons || 0,
                                                            completedLessons,
                                                            expiresAt: enrollment.expiresAt?.toDate?.().toLocaleDateString('th-TH') || '',
                                                            thumbnailUrl: course?.thumbnailUrl || '',
                                                  };
                                        })
                              );

                              setCourses(enrolledCourses);
                    } catch (error) {
                              console.error('Error fetching enrolled courses:', error);
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
                    <div className="container mx-auto py-8 px-4">
                              <div className="flex items-center gap-4 mb-8">
                                        <Link href="/dashboard">
                                                  <Button variant="outline" size="sm" className="border-black text-black hover:bg-gray-100">
                                                            <ArrowLeft className="w-4 h-4" />
                                                  </Button>
                                        </Link>
                                        <h1 className="font-heading text-4xl uppercase text-ink-black">
                                                  <Trophy className="inline w-8 h-8 mr-2 text-golden" />
                                                  คอร์ส<span className="text-fighter-red">ของฉัน</span>
                                        </h1>
                              </div>

                              {courses.length === 0 ? (
                                        <Card className="text-center py-16">
                                                  <CardContent>
                                                            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                                            <h3 className="font-heading text-2xl uppercase text-gray-500 mb-4">ยังไม่มีคอร์ส</h3>
                                                            <p className="text-gray-400 mb-6">เริ่มต้นการฝึกฝนของคุณวันนี้!</p>
                                                            <Link href="/courses">
                                                                      <Button>
                                                                                <span style={{ transform: 'skewX(6deg)' }}>ค้นหาคอร์ส</span>
                                                                      </Button>
                                                            </Link>
                                                  </CardContent>
                                        </Card>
                              ) : (
                                        <div className="grid md:grid-cols-2 gap-6">
                                                  {courses.map((course) => (
                                                            <Card key={course.id}>
                                                                      <CardContent className="p-6">
                                                                                <div className="flex items-start gap-4">
                                                                                          {/* Thumbnail */}
                                                                                          <div className="w-24 h-24 bg-fighter-red/20 border-2 border-ink-black flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                                                                    {course.thumbnailUrl ? (
                                                                                                              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                                                                                                    ) : (
                                                                                                              <BookOpen className="w-8 h-8 text-fighter-red" />
                                                                                                    )}
                                                                                          </div>

                                                                                          <div className="flex-1">
                                                                                                    <h3 className="font-heading text-xl uppercase text-ink-black mb-2">
                                                                                                              {course.title}
                                                                                                    </h3>

                                                                                                    {/* Progress Bar - Health Bar Style */}
                                                                                                    <div className="mb-3">
                                                                                                              <div className="flex justify-between text-sm font-bold mb-1">
                                                                                                                        <span className="text-gray-600">ความคืบหน้า</span>
                                                                                                                        <span className="text-fighter-red">{Math.round(course.progress)}%</span>
                                                                                                              </div>
                                                                                                              <div className="h-4 border-2 border-ink-black bg-gray-200">
                                                                                                                        <div
                                                                                                                                  className="health-bar h-full transition-all"
                                                                                                                                  style={{ width: `${course.progress}%` }}
                                                                                                                        />
                                                                                                              </div>
                                                                                                    </div>

                                                                                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                                                                                              <span className="flex items-center gap-1">
                                                                                                                        <BookOpen className="w-4 h-4" />
                                                                                                                        {course.completedLessons}/{course.totalLessons} บทเรียน
                                                                                                              </span>
                                                                                                              {course.expiresAt && (
                                                                                                                        <span className="flex items-center gap-1">
                                                                                                                                  <Clock className="w-4 h-4" />
                                                                                                                                  หมดอายุ: {course.expiresAt}
                                                                                                                        </span>
                                                                                                              )}
                                                                                                    </div>

                                                                                                    <Link href={`/learn/course/${course.id}`}>
                                                                                                              <Button size="sm">
                                                                                                                        <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                                                                                                                                  ฝึกต่อ
                                                                                                                                  <ArrowRight className="w-4 h-4" />
                                                                                                                        </span>
                                                                                                              </Button>
                                                                                                    </Link>
                                                                                          </div>
                                                                                </div>
                                                                      </CardContent>
                                                            </Card>
                                                  ))}
                                        </div>
                              )}
                    </div>
          );
}
