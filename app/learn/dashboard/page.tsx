'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Enrollment, Course, COLLECTIONS } from '@/types';
import { MyLearningCard } from '@/components/learn/MyLearningCard';
import { Loading } from '@/components/shared/Loading';
import { Card } from '@/components/ui/card';
import { BookOpen, GraduationCap } from 'lucide-react';

interface EnrollmentWithCourse {
          enrollment: Enrollment;
          course: Course;
}

export default function MyLearningPage() {
          const { user } = useAuthStore();
          const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
          const [loading, setLoading] = useState(true);

          useEffect(() => {
                    if (user) {
                              fetchEnrollments();
                    }
          }, [user]);

          const fetchEnrollments = async () => {
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
                              const enrollmentsWithCourses = await Promise.all(
                                        enrollmentsData.map(async (enrollment) => {
                                                  const courseDoc = await getDoc(
                                                            doc(db, COLLECTIONS.COURSES, enrollment.courseId)
                                                  );
                                                  const course = {
                                                            id: courseDoc.id,
                                                            ...courseDoc.data(),
                                                  } as Course;

                                                  return { enrollment, course };
                                        })
                              );

                              setEnrollments(enrollmentsWithCourses);
                    } catch (error) {
                              console.error('Error fetching enrollments:', error);
                    } finally {
                              setLoading(false);
                    }
          };

          if (loading) {
                    return <Loading text="Loading your courses..." />;
          }

          return (
                    <div className="min-h-screen py-12">
                              <div className="container mx-auto px-4">
                                        {/* Header */}
                                        <div className="mb-12">
                                                  <h1 className="text-5xl font-bold mb-4">
                                                            <span className="text-gradient animate-neon-pulse">My Learning</span>
                                                  </h1>
                                                  <p className="text-xl text-dark-text-secondary">
                                                            Continue your physics journey
                                                  </p>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid md:grid-cols-3 gap-6 mb-12">
                                                  <Card className="glass-card p-6">
                                                            <div className="flex items-center gap-4">
                                                                      <div className="w-12 h-12 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
                                                                                <BookOpen className="w-6 h-6 text-neon-cyan" />
                                                                      </div>
                                                                      <div>
                                                                                <p className="text-sm text-dark-text-secondary">Active Courses</p>
                                                                                <p className="text-3xl font-bold text-neon-cyan">
                                                                                          {enrollments.filter((e) => e.enrollment.status === 'active').length}
                                                                                </p>
                                                                      </div>
                                                            </div>
                                                  </Card>

                                                  <Card className="glass-card p-6">
                                                            <div className="flex items-center gap-4">
                                                                      <div className="w-12 h-12 rounded-lg bg-neon-magenta/20 flex items-center justify-center">
                                                                                <GraduationCap className="w-6 h-6 text-neon-magenta" />
                                                                      </div>
                                                                      <div>
                                                                                <p className="text-sm text-dark-text-secondary">Completed</p>
                                                                                <p className="text-3xl font-bold text-neon-magenta">
                                                                                          {enrollments.filter((e) => e.enrollment.status === 'completed').length}
                                                                                </p>
                                                                      </div>
                                                            </div>
                                                  </Card>

                                                  <Card className="glass-card p-6">
                                                            <div className="flex items-center gap-4">
                                                                      <div className="w-12 h-12 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                                                                                <BookOpen className="w-6 h-6 text-neon-purple" />
                                                                      </div>
                                                                      <div>
                                                                                <p className="text-sm text-dark-text-secondary">Total Courses</p>
                                                                                <p className="text-3xl font-bold text-neon-purple">
                                                                                          {enrollments.length}
                                                                                </p>
                                                                      </div>
                                                            </div>
                                                  </Card>
                                        </div>

                                        {/* Courses Grid */}
                                        {enrollments.length === 0 ? (
                                                  <Card className="glass-card p-12 text-center">
                                                            <BookOpen className="w-16 h-16 text-neon-cyan/50 mx-auto mb-4" />
                                                            <h3 className="text-xl font-bold mb-2">No courses yet</h3>
                                                            <p className="text-dark-text-secondary mb-6">
                                                                      Start learning by enrolling in a course
                                                            </p>
                                                            <a
                                                                      href="/courses"
                                                                      className="inline-block px-6 py-3 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-lg hover:bg-neon-cyan/30 transition-all"
                                                            >
                                                                      Browse Courses
                                                            </a>
                                                  </Card>
                                        ) : (
                                                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                            {enrollments.map(({ enrollment, course }) => (
                                                                      <MyLearningCard
                                                                                key={enrollment.id}
                                                                                enrollment={enrollment}
                                                                                course={course}
                                                                      />
                                                            ))}
                                                  </div>
                                        )}
                              </div>
                    </div>
          );
}
