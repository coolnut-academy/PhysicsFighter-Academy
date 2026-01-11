'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Course, COLLECTIONS } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Eye, Edit } from 'lucide-react';
import Link from 'next/link';
import { Loading } from '@/components/shared/Loading';

export default function MyCoursesPage() {
          const { user } = useAuthStore();
          const [courses, setCourses] = useState<Course[]>([]);
          const [loading, setLoading] = useState(true);

          useEffect(() => {
                    if (user) {
                              fetchCourses();
                    }
          }, [user]);

          const fetchCourses = async () => {
                    try {
                              setLoading(true);
                              const q = query(
                                        collection(db, COLLECTIONS.COURSES),
                                        where('ownerId', '==', user?.id),
                                        orderBy('createdAt', 'desc')
                              );

                              const snapshot = await getDocs(q);
                              const coursesData = snapshot.docs.map((doc) => ({
                                        id: doc.id,
                                        ...doc.data(),
                              })) as Course[];

                              setCourses(coursesData);
                    } catch (error) {
                              console.error('Error fetching courses:', error);
                    } finally {
                              setLoading(false);
                    }
          };

          if (loading) {
                    return <Loading text="Loading your courses..." />;
          }

          return (
                    <div className="space-y-6">
                              {/* Header */}
                              <div className="flex justify-between items-center">
                                        <div>
                                                  <h1 className="text-4xl font-bold text-gradient">My Courses</h1>
                                                  <p className="text-dark-text-secondary mt-2">
                                                            Manage and create your course content
                                                  </p>
                                        </div>
                                        <Link href="/admin/courses/create">
                                                  <Button className="neon-button">
                                                            <span className="flex items-center gap-2">
                                                                      <Plus className="w-4 h-4" />
                                                                      Create Course
                                                            </span>
                                                  </Button>
                                        </Link>
                              </div>

                              {/* Courses Grid */}
                              {courses.length === 0 ? (
                                        <Card className="glass-card p-12 text-center">
                                                  <BookOpen className="w-16 h-16 text-neon-cyan/50 mx-auto mb-4" />
                                                  <h3 className="text-xl font-bold mb-2">No courses yet</h3>
                                                  <p className="text-dark-text-secondary mb-6">
                                                            Start by creating your first course
                                                  </p>
                                                  <Link href="/admin/courses/create">
                                                            <Button className="neon-button">
                                                                      <span className="flex items-center gap-2">
                                                                                <Plus className="w-4 h-4" />
                                                                                Create Your First Course
                                                                      </span>
                                                            </Button>
                                                  </Link>
                                        </Card>
                              ) : (
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                  {courses.map((course) => (
                                                            <Card key={course.id} className="glass-card overflow-hidden card-hover">
                                                                      {/* Course Thumbnail */}
                                                                      <div className="h-48 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 relative">
                                                                                {course.thumbnailUrl ? (
                                                                                          <img
                                                                                                    src={course.thumbnailUrl}
                                                                                                    alt={course.title}
                                                                                                    className="w-full h-full object-cover"
                                                                                          />
                                                                                ) : (
                                                                                          <div className="flex items-center justify-center h-full">
                                                                                                    <BookOpen className="w-16 h-16 text-neon-cyan/30" />
                                                                                          </div>
                                                                                )}
                                                                                {!course.isPublished && (
                                                                                          <div className="absolute top-2 right-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 text-xs font-bold">
                                                                                                    Draft
                                                                                          </div>
                                                                                )}
                                                                      </div>

                                                                      {/* Course Info */}
                                                                      <div className="p-6">
                                                                                <h3 className="text-xl font-bold mb-2 line-clamp-1">
                                                                                          {course.title}
                                                                                </h3>
                                                                                <p className="text-sm text-dark-text-secondary line-clamp-2 mb-4">
                                                                                          {course.description}
                                                                                </p>

                                                                                {/* Stats */}
                                                                                <div className="flex gap-4 mb-4 text-sm">
                                                                                          <div>
                                                                                                    <p className="text-dark-text-secondary">Modules</p>
                                                                                                    <p className="font-bold text-neon-cyan">
                                                                                                              {course.modules?.length || 0}
                                                                                                    </p>
                                                                                          </div>
                                                                                          <div>
                                                                                                    <p className="text-dark-text-secondary">Lessons</p>
                                                                                                    <p className="font-bold text-neon-magenta">
                                                                                                              {course.totalLessons || 0}
                                                                                                    </p>
                                                                                          </div>
                                                                                          <div>
                                                                                                    <p className="text-dark-text-secondary">Students</p>
                                                                                                    <p className="font-bold text-neon-purple">
                                                                                                              {course.activeEnrollments || 0}
                                                                                                    </p>
                                                                                          </div>
                                                                                </div>

                                                                                {/* Pricing */}
                                                                                <div className="mb-4">
                                                                                          <p className="text-xs text-dark-text-secondary mb-1">Pricing</p>
                                                                                          <div className="flex gap-2 text-xs">
                                                                                                    <span className="px-2 py-1 rounded bg-neon-cyan/10 text-neon-cyan">
                                                                                                              3M: ฿{course.pricing?.threeMonths}
                                                                                                    </span>
                                                                                                    <span className="px-2 py-1 rounded bg-neon-magenta/10 text-neon-magenta">
                                                                                                              6M: ฿{course.pricing?.sixMonths}
                                                                                                    </span>
                                                                                                    <span className="px-2 py-1 rounded bg-neon-purple/10 text-neon-purple">
                                                                                                              12M: ฿{course.pricing?.twelveMonths}
                                                                                                    </span>
                                                                                          </div>
                                                                                </div>

                                                                                {/* Actions */}
                                                                                <div className="flex gap-2">
                                                                                          <Link href={`/admin/courses/${course.id}/edit`} className="flex-1">
                                                                                                    <Button variant="outline" className="w-full neon-border">
                                                                                                              <Edit className="w-4 h-4 mr-2" />
                                                                                                              Edit
                                                                                                    </Button>
                                                                                          </Link>
                                                                                          <Link href={`/courses/${course.id}`} className="flex-1">
                                                                                                    <Button variant="outline" className="w-full neon-border">
                                                                                                              <Eye className="w-4 h-4 mr-2" />
                                                                                                              View
                                                                                                    </Button>
                                                                                          </Link>
                                                                                </div>
                                                                      </div>
                                                            </Card>
                                                  ))}
                                        </div>
                              )}
                    </div>
          );
}
