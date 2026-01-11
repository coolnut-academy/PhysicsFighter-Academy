'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Course, COLLECTIONS } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
          BookOpen,
          Clock,
          Users,
          ArrowLeft,
          Play,
          CheckCircle,
          Zap,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Loading } from '@/components/shared/Loading';

export default function CourseDetailPage() {
          const params = useParams();
          const router = useRouter();
          const courseId = params.courseId as string;

          const [course, setCourse] = useState<Course | null>(null);
          const [loading, setLoading] = useState(true);

          useEffect(() => {
                    fetchCourse();
          }, [courseId]);

          const fetchCourse = async () => {
                    try {
                              setLoading(true);
                              const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, courseId));

                              if (!courseDoc.exists()) {
                                        router.push('/courses');
                                        return;
                              }

                              setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);
                    } catch (error) {
                              console.error('Error fetching course:', error);
                    } finally {
                              setLoading(false);
                    }
          };

          if (loading) {
                    return <Loading text="Loading course..." />;
          }

          if (!course) {
                    return null;
          }

          return (
                    <div className="min-h-screen">
                              {/* Hero Section */}
                              <div className="relative h-96 bg-gradient-to-br from-neon-cyan/20 via-dark-bg-primary to-neon-magenta/20 overflow-hidden">
                                        {course.thumbnailUrl && (
                                                  <img
                                                            src={course.thumbnailUrl}
                                                            alt={course.title}
                                                            className="absolute inset-0 w-full h-full object-cover opacity-30"
                                                  />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg-primary to-transparent" />

                                        <div className="container mx-auto px-4 h-full relative z-10 flex flex-col justify-end pb-12">
                                                  <Link href="/courses">
                                                            <Button variant="outline" size="sm" className="neon-border mb-4 w-fit">
                                                                      <ArrowLeft className="w-4 h-4 mr-2" />
                                                                      Back to Courses
                                                            </Button>
                                                  </Link>

                                                  {course.category && (
                                                            <p className="text-neon-magenta font-semibold mb-2 uppercase tracking-wider">
                                                                      {course.category}
                                                            </p>
                                                  )}

                                                  <h1 className="text-5xl font-bold mb-4 text-gradient animate-neon-pulse">
                                                            {course.title}
                                                  </h1>

                                                  <p className="text-xl text-dark-text-secondary max-w-3xl mb-6">
                                                            {course.description}
                                                  </p>

                                                  <div className="flex items-center gap-6">
                                                            <Badge
                                                                      variant="outline"
                                                                      className={
                                                                                course.difficulty === 'beginner'
                                                                                          ? 'border-green-500/30 text-green-500 bg-green-500/10'
                                                                                          : course.difficulty === 'intermediate'
                                                                                                    ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10'
                                                                                                    : 'border-red-500/30 text-red-500 bg-red-500/10'
                                                                      }
                                                            >
                                                                      {course.difficulty.toUpperCase()}
                                                            </Badge>

                                                            <div className="flex items-center gap-2 text-dark-text-secondary">
                                                                      <BookOpen className="w-5 h-5 text-neon-cyan" />
                                                                      <span>{course.totalLessons || 0} Lessons</span>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-dark-text-secondary">
                                                                      <Clock className="w-5 h-5 text-neon-magenta" />
                                                                      <span>{Math.floor((course.totalDurationMinutes || 0) / 60)} hours</span>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-dark-text-secondary">
                                                                      <Users className="w-5 h-5 text-neon-purple" />
                                                                      <span>{course.totalEnrollments || 0} students</span>
                                                            </div>
                                                  </div>
                                        </div>
                              </div>

                              {/* Main Content */}
                              <div className="container mx-auto px-4 py-12">
                                        <div className="grid lg:grid-cols-3 gap-8">
                                                  {/* Left Column - Course Content */}
                                                  <div className="lg:col-span-2 space-y-8">
                                                            {/* What You'll Learn */}
                                                            <Card className="glass-card p-6">
                                                                      <h2 className="text-2xl font-bold text-neon-cyan mb-4">
                                                                                What You'll Learn
                                                                      </h2>
                                                                      <div className="grid md:grid-cols-2 gap-3">
                                                                                {course.learningOutcomes?.map((outcome, index) => (
                                                                                          <div key={index} className="flex items-start gap-3">
                                                                                                    <CheckCircle className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                                                                                                    <p className="text-sm">{outcome}</p>
                                                                                          </div>
                                                                                )) || (
                                                                                                    <p className="text-dark-text-secondary">
                                                                                                              Learning outcomes will be added soon
                                                                                                    </p>
                                                                                          )}
                                                                      </div>
                                                            </Card>

                                                            {/* Course Modules */}
                                                            <Card className="glass-card p-6">
                                                                      <h2 className="text-2xl font-bold text-neon-magenta mb-6">
                                                                                Course Content
                                                                      </h2>

                                                                      {course.modules && course.modules.length > 0 ? (
                                                                                <div className="space-y-4">
                                                                                          {course.modules.map((module, index) => (
                                                                                                    <div
                                                                                                              key={module.id}
                                                                                                              className="p-4 rounded-lg border border-white/10 bg-dark-bg-secondary/50"
                                                                                                    >
                                                                                                              <div className="flex justify-between items-start mb-2">
                                                                                                                        <h3 className="font-bold text-lg">
                                                                                                                                  {index + 1}. {module.title}
                                                                                                                        </h3>
                                                                                                                        <Badge variant="outline" className="neon-border">
                                                                                                                                  {module.lessons.length} lessons
                                                                                                                        </Badge>
                                                                                                              </div>
                                                                                                              <p className="text-sm text-dark-text-secondary mb-3">
                                                                                                                        {module.description}
                                                                                                              </p>

                                                                                                              {module.lessons.length > 0 && (
                                                                                                                        <div className="space-y-2">
                                                                                                                                  {module.lessons.map((lesson) => (
                                                                                                                                            <div
                                                                                                                                                      key={lesson.id}
                                                                                                                                                      className="flex items-center gap-3 text-sm p-2 rounded hover:bg-white/5 transition-colors"
                                                                                                                                            >
                                                                                                                                                      <Play className="w-4 h-4 text-neon-cyan" />
                                                                                                                                                      <span>{lesson.title}</span>
                                                                                                                                                      <span className="ml-auto text-dark-text-muted">
                                                                                                                                                                {lesson.durationMinutes}min
                                                                                                                                                      </span>
                                                                                                                                            </div>
                                                                                                                                  ))}
                                                                                                                        </div>
                                                                                                              )}
                                                                                                    </div>
                                                                                          ))}
                                                                                </div>
                                                                      ) : (
                                                                                <p className="text-dark-text-secondary">
                                                                                          Course content will be added soon
                                                                                </p>
                                                                      )}
                                                            </Card>
                                                  </div>

                                                  {/* Right Column - Pricing Card */}
                                                  <div className="lg:col-span-1">
                                                            <Card className="glass-card p-6 sticky top-6">
                                                                      <div className="mb-6">
                                                                                <p className="text-sm text-dark-text-secondary mb-2">
                                                                                          Starting from
                                                                                </p>
                                                                                <p className="text-4xl font-bold text-neon-cyan mb-1">
                                                                                          {formatCurrency(course.pricing.threeMonths)}
                                                                                </p>
                                                                                <p className="text-sm text-dark-text-muted">
                                                                                          for 3 months access
                                                                                </p>
                                                                      </div>

                                                                      {/* Pricing Tiers */}
                                                                      <div className="space-y-3 mb-6">
                                                                                <div className="p-3 rounded-lg border border-white/10 bg-dark-bg-secondary/50">
                                                                                          <div className="flex justify-between items-center">
                                                                                                    <span className="text-sm">3 Months</span>
                                                                                                    <span className="font-bold text-neon-cyan">
                                                                                                              {formatCurrency(course.pricing.threeMonths)}
                                                                                                    </span>
                                                                                          </div>
                                                                                </div>
                                                                                <div className="p-3 rounded-lg border border-neon-magenta/30 bg-neon-magenta/5">
                                                                                          <div className="flex justify-between items-center mb-1">
                                                                                                    <span className="text-sm">6 Months</span>
                                                                                                    <span className="font-bold text-neon-magenta">
                                                                                                              {formatCurrency(course.pricing.sixMonths)}
                                                                                                    </span>
                                                                                          </div>
                                                                                          <Badge className="text-xs bg-neon-magenta/20 text-neon-magenta border-neon-magenta/30">
                                                                                                    Popular Choice
                                                                                          </Badge>
                                                                                </div>
                                                                                <div className="p-3 rounded-lg border border-neon-purple/30 bg-neon-purple/5">
                                                                                          <div className="flex justify-between items-center mb-1">
                                                                                                    <span className="text-sm">12 Months</span>
                                                                                                    <span className="font-bold text-neon-purple">
                                                                                                              {formatCurrency(course.pricing.twelveMonths)}
                                                                                                    </span>
                                                                                          </div>
                                                                                          <Badge className="text-xs bg-neon-purple/20 text-neon-purple border-neon-purple/30">
                                                                                                    Best Value
                                                                                          </Badge>
                                                                                </div>
                                                                      </div>

                                                                      {/* Enroll Button */}
                                                                      <Link href={`/checkout/${course.id}`}>
                                                                                <Button className="w-full neon-button mb-4">
                                                                                          <Zap className="w-4 h-4 mr-2" />
                                                                                          Enroll Now
                                                                                </Button>
                                                                      </Link>

                                                                      {/* Course Includes */}
                                                                      <div className="pt-4 border-t border-white/10">
                                                                                <p className="text-sm font-bold mb-3">This course includes:</p>
                                                                                <div className="space-y-2 text-sm text-dark-text-secondary">
                                                                                          <div className="flex items-center gap-2">
                                                                                                    <CheckCircle className="w-4 h-4 text-neon-cyan" />
                                                                                                    <span>Full lifetime access</span>
                                                                                          </div>
                                                                                          <div className="flex items-center gap-2">
                                                                                                    <CheckCircle className="w-4 h-4 text-neon-cyan" />
                                                                                                    <span>All course materials</span>
                                                                                          </div>
                                                                                          <div className="flex items-center gap-2">
                                                                                                    <CheckCircle className="w-4 h-4 text-neon-cyan" />
                                                                                                    <span>Instructor support</span>
                                                                                          </div>
                                                                                          <div className="flex items-center gap-2">
                                                                                                    <CheckCircle className="w-4 h-4 text-neon-cyan" />
                                                                                                    <span>Certificate of completion</span>
                                                                                          </div>
                                                                                </div>
                                                                      </div>
                                                            </Card>
                                                  </div>
                                        </div>
                              </div>
                    </div>
          );
}
