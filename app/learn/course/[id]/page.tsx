'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, query, collection, where, getDocs, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/useAuthStore';
import { Course, Enrollment, COLLECTIONS, CourseLesson } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
          ArrowLeft,
          Play,
          CheckCircle,
          Lock,
          BookOpen,
          Clock,
          AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Loading } from '@/components/shared/Loading';
import { calculateTimeRemaining } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function CoursePlayerPage() {
          const params = useParams();
          const router = useRouter();
          const { user } = useAuthStore();
          const { toast } = useToast();
          const courseId = params.id as string;

          const [course, setCourse] = useState<Course | null>(null);
          const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
          const [currentLesson, setCurrentLesson] = useState<CourseLesson | null>(null);
          const [loading, setLoading] = useState(true);
          const [authorized, setAuthorized] = useState(false);

          useEffect(() => {
                    if (user) {
                              checkEnrollmentAndLoadCourse();
                    }
          }, [user, courseId]);

          const checkEnrollmentAndLoadCourse = async () => {
                    try {
                              setLoading(true);

                              // Check if student is enrolled
                              const enrollmentQuery = query(
                                        collection(db, COLLECTIONS.ENROLLMENTS),
                                        where('studentId', '==', user?.id),
                                        where('courseId', '==', courseId)
                              );

                              const enrollmentSnapshot = await getDocs(enrollmentQuery);

                              if (enrollmentSnapshot.empty) {
                                        toast({
                                                  title: 'Access Denied',
                                                  description: 'You are not enrolled in this course',
                                                  variant: 'destructive',
                                        });
                                        router.push('/courses');
                                        return;
                              }

                              const enrollmentData = {
                                        id: enrollmentSnapshot.docs[0].id,
                                        ...enrollmentSnapshot.docs[0].data(),
                              } as Enrollment;

                              // Check if enrollment is active and not expired
                              const timeRemaining = calculateTimeRemaining(enrollmentData);
                              if (timeRemaining.expired) {
                                        toast({
                                                  title: 'Access Expired',
                                                  description: 'Your access to this course has expired',
                                                  variant: 'destructive',
                                        });
                                        router.push('/learn/dashboard');
                                        return;
                              }

                              if (enrollmentData.status !== 'active') {
                                        toast({
                                                  title: 'Access Denied',
                                                  description: 'Your enrollment is not active',
                                                  variant: 'destructive',
                                        });
                                        router.push('/learn/dashboard');
                                        return;
                              }

                              setEnrollment(enrollmentData);
                              setAuthorized(true);

                              // Load course data
                              const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, courseId));
                              if (!courseDoc.exists()) {
                                        router.push('/learn/dashboard');
                                        return;
                              }

                              const courseData = { id: courseDoc.id, ...courseDoc.data() } as Course;
                              setCourse(courseData);

                              // Set first lesson as current if none selected
                              if (courseData.modules.length > 0 && courseData.modules[0].lessons.length > 0) {
                                        setCurrentLesson(courseData.modules[0].lessons[0]);
                              }
                    } catch (error) {
                              console.error('Error checking enrollment:', error);
                              toast({
                                        title: 'Error',
                                        description: 'Failed to load course',
                                        variant: 'destructive',
                              });
                    } finally {
                              setLoading(false);
                    }
          };

          const markLessonComplete = async (lessonId: string) => {
                    if (!enrollment) return;

                    try {
                              const isCompleted = enrollment.progress?.some(
                                        (p) => p.lessonId === lessonId && !!p.completedAt
                              );

                              if (!isCompleted) {
                                        await updateDoc(doc(db, COLLECTIONS.ENROLLMENTS, enrollment.id), {
                                                  progress: arrayUnion({
                                                            lessonId,
                                                            completedAt: Timestamp.now(),
                                                            watchedPercentage: 100,
                                                            quizAttempts: 0,
                                                  }),
                                        });

                                        // Refresh enrollment
                                        const updatedDoc = await getDoc(doc(db, COLLECTIONS.ENROLLMENTS, enrollment.id));
                                        setEnrollment({ id: updatedDoc.id, ...updatedDoc.data() } as Enrollment);

                                        toast({
                                                  title: 'Progress Saved',
                                                  description: 'Lesson marked as complete',
                                        });
                              }
                    } catch (error) {
                              console.error('Error marking lesson complete:', error);
                    }
          };

          const isLessonCompleted = (lessonId: string) => {
                    return enrollment?.progress?.some((p) => p.lessonId === lessonId && !!p.completedAt);
          };

          if (loading) {
                    return <Loading text="Loading course..." />;
          }

          if (!authorized || !course || !enrollment) {
                    return null;
          }

          const timeRemaining = calculateTimeRemaining(enrollment);

          return (
                    <div className="min-h-screen flex flex-col">
                              {/* Header */}
                              <div className="border-b border-white/10 bg-dark-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
                                        <div className="container mx-auto px-4 py-4">
                                                  <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                      <Link href="/learn/dashboard">
                                                                                <Button variant="outline" size="icon" className="neon-border">
                                                                                          <ArrowLeft className="w-4 h-4" />
                                                                                </Button>
                                                                      </Link>
                                                                      <div>
                                                                                <h1 className="text-xl font-bold line-clamp-1">{course.title}</h1>
                                                                                <p className="text-sm text-dark-text-secondary">
                                                                                          {Math.round(enrollment.overallProgress || 0)}% Complete
                                                                                </p>
                                                                      </div>
                                                            </div>

                                                            {/* Time Remaining */}
                                                            <div className="flex items-center gap-4">
                                                                      <div className="text-right">
                                                                                <p className="text-sm text-dark-text-secondary">Access expires in</p>
                                                                                <p className="font-bold text-neon-cyan">
                                                                                          {timeRemaining.days}d {timeRemaining.hours}h
                                                                                </p>
                                                                      </div>
                                                                      <Progress value={timeRemaining.percentage} className="w-32" />
                                                            </div>
                                                  </div>
                                        </div>
                              </div>

                              {/* Main Content */}
                              <div className="flex-1 flex">
                                        {/* Sidebar - Lessons */}
                                        <aside className="w-80 border-r border-white/10 bg-dark-bg-secondary/30 overflow-y-auto">
                                                  <div className="p-4">
                                                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                                                      <BookOpen className="w-5 h-5 text-neon-cyan" />
                                                                      Course Content
                                                            </h2>

                                                            <div className="space-y-4">
                                                                      {course.modules.map((module, moduleIndex) => (
                                                                                <div key={module.id}>
                                                                                          <h3 className="font-bold mb-2 text-sm text-neon-magenta">
                                                                                                    {moduleIndex + 1}. {module.title}
                                                                                          </h3>
                                                                                          <div className="space-y-1">
                                                                                                    {module.lessons.map((lesson, lessonIndex) => {
                                                                                                              const completed = isLessonCompleted(lesson.id);
                                                                                                              const isCurrent = currentLesson?.id === lesson.id;

                                                                                                              return (
                                                                                                                        <button
                                                                                                                                  key={lesson.id}
                                                                                                                                  onClick={() => {
                                                                                                                                            setCurrentLesson(lesson);
                                                                                                                                            if (completed) {
                                                                                                                                                      // Allow re-watching
                                                                                                                                            }
                                                                                                                                  }}
                                                                                                                                  className={`w-full text-left p-3 rounded-lg transition-all ${isCurrent
                                                                                                                                            ? 'bg-neon-cyan/20 border border-neon-cyan/30'
                                                                                                                                            : 'hover:bg-white/5'
                                                                                                                                            }`}
                                                                                                                        >
                                                                                                                                  <div className="flex items-start gap-3">
                                                                                                                                            <div className="flex-shrink-0 mt-0.5">
                                                                                                                                                      {completed ? (
                                                                                                                                                                <CheckCircle className="w-5 h-5 text-neon-cyan" />
                                                                                                                                                      ) : isCurrent ? (
                                                                                                                                                                <Play className="w-5 h-5 text-neon-magenta" />
                                                                                                                                                      ) : (
                                                                                                                                                                <div className="w-5 h-5 rounded-full border-2 border-white/20" />
                                                                                                                                                      )}
                                                                                                                                            </div>
                                                                                                                                            <div className="flex-1 min-w-0">
                                                                                                                                                      <p
                                                                                                                                                                className={`text-sm font-medium line-clamp-2 ${isCurrent ? 'text-neon-cyan' : ''
                                                                                                                                                                          }`}
                                                                                                                                                      >
                                                                                                                                                                {lessonIndex + 1}. {lesson.title}
                                                                                                                                                      </p>
                                                                                                                                                      <div className="flex items-center gap-2 mt-1">
                                                                                                                                                                <Clock className="w-3 h-3 text-dark-text-muted" />
                                                                                                                                                                <span className="text-xs text-dark-text-muted">
                                                                                                                                                                          {lesson.durationMinutes} min
                                                                                                                                                                </span>
                                                                                                                                                      </div>
                                                                                                                                            </div>
                                                                                                                                  </div>
                                                                                                                        </button>
                                                                                                              );
                                                                                                    })}
                                                                                          </div>
                                                                                </div>
                                                                      ))}
                                                            </div>
                                                  </div>
                                        </aside>

                                        {/* Content Area */}
                                        <main className="flex-1 overflow-y-auto">
                                                  <div className="container mx-auto px-6 py-8 max-w-5xl">
                                                            {currentLesson ? (
                                                                      <div className="space-y-6">
                                                                                {/* Lesson Header */}
                                                                                <div>
                                                                                          <div className="flex items-center justify-between mb-4">
                                                                                                    <h2 className="text-3xl font-bold text-gradient">
                                                                                                              {currentLesson.title}
                                                                                                    </h2>
                                                                                                    {isLessonCompleted(currentLesson.id) && (
                                                                                                              <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30">
                                                                                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                                                                                        Completed
                                                                                                              </Badge>
                                                                                                    )}
                                                                                          </div>
                                                                                          {currentLesson.description && (
                                                                                                    <p className="text-dark-text-secondary">{currentLesson.description}</p>
                                                                                          )}
                                                                                </div>

                                                                                {/* Video Player */}
                                                                                {currentLesson.videoUrl && (
                                                                                          <Card className="glass-card p-0 overflow-hidden">
                                                                                                    <div className="relative" style={{ paddingBottom: '56.25%' }}>
                                                                                                              <iframe
                                                                                                                        src={currentLesson.videoUrl.replace('watch?v=', 'embed/')}
                                                                                                                        title={currentLesson.title}
                                                                                                                        className="absolute inset-0 w-full h-full"
                                                                                                                        allowFullScreen
                                                                                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                                                              />
                                                                                                    </div>
                                                                                          </Card>
                                                                                )}

                                                                                {/* Lesson Resources */}
                                                                                {currentLesson.resources && currentLesson.resources.length > 0 && (
                                                                                          <Card className="glass-card p-6">
                                                                                                    <h3 className="text-xl font-bold text-neon-purple mb-4">
                                                                                                              Lesson Resources
                                                                                                    </h3>
                                                                                                    <div className="space-y-3">
                                                                                                              {currentLesson.resources.map((resource, index) => (
                                                                                                                        <a
                                                                                                                                  key={index}
                                                                                                                                  href={resource.url}
                                                                                                                                  target="_blank"
                                                                                                                                  rel="noopener noreferrer"
                                                                                                                                  className="block p-4 rounded-lg border border-white/10 hover:border-neon-purple/50 hover:bg-neon-purple/5 transition-all"
                                                                                                                        >
                                                                                                                                  <p className="font-medium">{resource.title}</p>
                                                                                                                                  {resource.description && (
                                                                                                                                            <p className="text-sm text-dark-text-secondary mt-1">
                                                                                                                                                      {resource.description}
                                                                                                                                            </p>
                                                                                                                                  )}
                                                                                                                        </a>
                                                                                                              ))}
                                                                                                    </div>
                                                                                          </Card>
                                                                                )}

                                                                                {/* Mark Complete Button */}
                                                                                {!isLessonCompleted(currentLesson.id) && (
                                                                                          <Button
                                                                                                    onClick={() => markLessonComplete(currentLesson.id)}
                                                                                                    className="w-full neon-button"
                                                                                          >
                                                                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                                                                    Mark as Complete
                                                                                          </Button>
                                                                                )}
                                                                      </div>
                                                            ) : (
                                                                      <Card className="glass-card p-12 text-center">
                                                                                <BookOpen className="w-16 h-16 text-neon-cyan/50 mx-auto mb-4" />
                                                                                <h3 className="text-xl font-bold mb-2">Select a lesson to start</h3>
                                                                                <p className="text-dark-text-secondary">
                                                                                          Choose a lesson from the sidebar to begin learning
                                                                                </p>
                                                                      </Card>
                                                            )}
                                                  </div>
                                        </main>
                              </div>
                    </div>
          );
}
