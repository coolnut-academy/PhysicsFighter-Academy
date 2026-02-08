'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, query, collection, where, getDocs, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/useAuthStore';
import { Course, Enrollment, COLLECTIONS, CourseLesson } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
          ArrowLeft,
          Play,
          CheckCircle,
          Lock,
          BookOpen,
          Clock,
          Download,
          FileText,
          Shield,
          Trophy
} from 'lucide-react';
import { LogoIcon } from '@/components/ui/Logo';
import Link from 'next/link';
import { Loading } from '@/components/shared/Loading';
import { calculateTimeRemaining, getYouTubeEmbedUrl } from '@/lib/utils';
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

                              // 1. Check if user is Super Admin -> Auto Authorize
                              if (user?.role === 'super_admin') {
                                        setAuthorized(true);
                                        // Load course data
                                        const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, courseId));
                                        if (!courseDoc.exists()) {
                                                  router.push('/learn/dashboard');
                                                  return;
                                        }
                                        const courseData = { id: courseDoc.id, ...courseDoc.data() } as Course;
                                        setCourse(courseData);

                                        // Create fake enrollment for UI purposes
                                        setEnrollment({
                                                  id: 'admin_preview',
                                                  studentId: user.id,
                                                  courseId: courseId,
                                                  enrolledAt: Timestamp.now(),
                                                  expiresAt: null, // No expiry
                                                  progress: [],
                                                  status: 'active',
                                                  overallProgress: 0,
                                                  lastAccessedAt: Timestamp.now()
                                        } as unknown as Enrollment);

                                        if (courseData.modules.length > 0 && courseData.modules[0].lessons.length > 0) {
                                                  setCurrentLesson(courseData.modules[0].lessons[0]);
                                        }
                                        setLoading(false);
                                        return;
                              }

                              // 2. Regular Student Check
                              const enrollmentQuery = query(
                                        collection(db, COLLECTIONS.ENROLLMENTS),
                                        where('studentId', '==', user?.id),
                                        where('courseId', '==', courseId)
                              );

                              const enrollmentSnapshot = await getDocs(enrollmentQuery);

                              if (enrollmentSnapshot.empty) {
                                        toast({
                                                  title: 'ACCESS DENIED',
                                                  description: 'You are not validly enrolled in this mission.',
                                                  variant: 'destructive',
                                        });
                                        router.push('/courses');
                                        return;
                              }

                              const enrollmentData = {
                                        id: enrollmentSnapshot.docs[0].id,
                                        ...enrollmentSnapshot.docs[0].data(),
                              } as Enrollment;

                              // Check expiry
                              const timeRemaining = calculateTimeRemaining(enrollmentData);
                              if (timeRemaining.expired) {
                                        toast({
                                                  title: 'ACCESS EXPIRED',
                                                  description: 'Mission time limit exceeded.',
                                                  variant: 'destructive',
                                        });
                                        router.push('/learn/dashboard');
                                        return;
                              }

                              if (enrollmentData.status !== 'active') {
                                        toast({
                                                  title: 'ACCOUNT LOCKED',
                                                  description: 'Your enrollment is inactive.',
                                                  variant: 'destructive',
                                        });
                                        router.push('/learn/dashboard');
                                        return;
                              }

                              // Check if access is granted by admin
                              if (!enrollmentData.accessGranted) {
                                        toast({
                                                  title: 'รอการอนุมัติ',
                                                  description: 'การชำระเงินของคุณอยู่ระหว่างรอการตรวจสอบจากผู้สอน',
                                                  variant: 'destructive',
                                        });
                                        router.push('/my-enrollments');
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

                              // Set first lesson
                              if (courseData.modules.length > 0 && courseData.modules[0].lessons.length > 0) {
                                        setCurrentLesson(courseData.modules[0].lessons[0]);
                              }
                    } catch (error) {
                              console.error('Error checking enrollment:', error);
                              toast({
                                        title: 'SYSTEM ERROR',
                                        description: 'Failed to load mission data.',
                                        variant: 'destructive',
                              });
                    } finally {
                              setLoading(false);
                    }
          };

          const markLessonComplete = async (lessonId: string) => {
                    if (!enrollment || enrollment.id === 'admin_preview') return;

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
                                                  title: 'MISSION ACCOMPLISHED',
                                                  description: 'Lesson marked as complete.',
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
                    return (
                              <div className="flex items-center justify-center min-h-screen bg-white">
                                        <Loading text="LOADING BATTLE PLAN..." />
                              </div>
                    );
          }

          if (!authorized || !course || !enrollment) {
                    return null;
          }

          const timeRemaining = calculateTimeRemaining(enrollment);

          return (
                    <div className="min-h-screen flex flex-col bg-white">
                              {/* Header */}
                              <div className="bg-ink-black text-white p-4 sticky top-0 z-50 border-b-4 border-fighter-red shadow-md">
                                        <div className="container mx-auto flex items-center justify-between">
                                                  <div className="flex items-center gap-4">
                                                            <Link href="/learn/dashboard">
                                                                      <Button variant="outline" size="sm" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black uppercase font-bold skew-x-[-10deg]">
                                                                                <ArrowLeft className="w-4 h-4 mr-2" />
                                                                                Exit
                                                                      </Button>
                                                            </Link>
                                                            <div>
                                                                      <h1 className="text-xl font-heading text-white line-clamp-1">{course.title}</h1>
                                                                      <div className="flex items-center gap-2">
                                                                                <Progress value={enrollment.overallProgress || 0} className="w-32 h-2 bg-gray-700" indicatorClassName="bg-green-500" />
                                                                                <span className="text-xs font-bold text-gray-400">{Math.round(enrollment.overallProgress || 0)}%</span>
                                                                      </div>
                                                            </div>
                                                  </div>

                                                  {/* Time Remaining */}
                                                  {enrollment.id !== 'admin_preview' && (
                                                            <div className="flex items-center gap-4 text-xs font-bold uppercase text-gray-400">
                                                                      <div className="text-right">
                                                                                <p>Time Remaining</p>
                                                                                <p className={`text-lg leading-none ${timeRemaining.days < 7 ? 'text-fighter-red animate-pulse' : 'text-golden'}`}>
                                                                                          {timeRemaining.days}D {timeRemaining.hours}H
                                                                                </p>
                                                                      </div>
                                                            </div>
                                                  )}

                                                  {enrollment.id === 'admin_preview' && (
                                                            <div className="px-3 py-1 bg-golden text-ink-black border border-white font-bold text-xs uppercase animate-pulse">
                                                                      SUPER ADMIN PREVIEW
                                                            </div>
                                                  )}
                                        </div>
                              </div>

                              {/* Main Content */}
                              <div className="flex-1 flex overflow-hidden">
                                        {/* Sidebar - Lessons */}
                                        <aside className="w-80 bg-white border-r-4 border-black overflow-y-auto hidden md:block z-40">
                                                  <div className="p-4 bg-fighter-red text-white border-b-4 border-black mb-4">
                                                            <h2 className="font-heading uppercase text-lg flex items-center gap-2">
                                                                      <BookOpen className="w-5 h-5" />
                                                                      Mission Log
                                                            </h2>
                                                  </div>

                                                  <div className="px-2 pb-8 space-y-6">
                                                            {course.modules.map((module, moduleIndex) => (
                                                                      <div key={module.id} className="space-y-2">
                                                                                <h3 className="font-bold text-xs uppercase text-gray-500 px-2 flex items-center gap-2">
                                                                                          <span className="bg-black text-white w-5 h-5 flex items-center justify-center rounded-sm text-[10px]">{moduleIndex + 1}</span>
                                                                                          {module.title}
                                                                                </h3>
                                                                                <div className="space-y-1">
                                                                                          {module.lessons.map((lesson, lessonIndex) => {
                                                                                                    const completed = isLessonCompleted(lesson.id);
                                                                                                    const isCurrent = currentLesson?.id === lesson.id;

                                                                                                    return (
                                                                                                              <button
                                                                                                                        key={lesson.id}
                                                                                                                        onClick={() => setCurrentLesson(lesson)}
                                                                                                                        className={`w-full text-left p-2 rounded-lg border-2 transition-all flex items-start gap-3 group relative overflow-hidden ${isCurrent
                                                                                                                                  ? 'bg-yellow-50 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] -translate-y-1'
                                                                                                                                  : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'
                                                                                                                                  }`}
                                                                                                              >
                                                                                                                        <div className="flex-shrink-0 mt-0.5 relative z-10">
                                                                                                                                  {completed ? (
                                                                                                                                            <CheckCircle className="w-5 h-5 text-green-500 fill-green-100" />
                                                                                                                                  ) : isCurrent ? (
                                                                                                                                            <Play className="w-5 h-5 text-fighter-red fill-current" />
                                                                                                                                  ) : (
                                                                                                                                            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                                                                                                                  )}
                                                                                                                        </div>
                                                                                                                        <div className="flex-1 min-w-0 relative z-10">
                                                                                                                                  <p className={`text-sm font-bold line-clamp-2 ${isCurrent ? 'text-ink-black' : 'text-gray-600'}`}>
                                                                                                                                            {lessonIndex + 1}. {lesson.title}
                                                                                                                                  </p>
                                                                                                                                  <div className="flex items-center gap-2 mt-1">
                                                                                                                                            <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                                                                                                                                                      <Clock className="w-3 h-3" />
                                                                                                                                                      {lesson.durationMinutes} min
                                                                                                                                            </span>
                                                                                                                                  </div>
                                                                                                                        </div>
                                                                                                              </button>
                                                                                                    );
                                                                                          })}
                                                                                </div>
                                                                      </div>
                                                            ))}
                                                  </div>
                                        </aside>

                                        {/* Content Area */}
                                        <main className="flex-1 overflow-y-auto bg-white p-4 md:p-8">
                                                  <div className="max-w-4xl mx-auto space-y-8">
                                                            {currentLesson ? (
                                                                      <>
                                                                                {/* Lesson Header */}
                                                                                <div className="border-b-4 border-black pb-4">
                                                                                          <div className="flex items-center justify-between mb-2">
                                                                                                    <h2 className="text-3xl md:text-4xl font-heading text-ink-black uppercase">
                                                                                                              {currentLesson.title}
                                                                                                    </h2>
                                                                                                    {isLessonCompleted(currentLesson.id) && (
                                                                                                              <div className="px-3 py-1 bg-green-500 text-white font-bold text-xs uppercase -skew-x-12 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                                                                                                        Completed
                                                                                                              </div>
                                                                                                    )}
                                                                                          </div>
                                                                                          {currentLesson.description && (
                                                                                                    <p className="text-gray-600 font-medium">{currentLesson.description}</p>
                                                                                          )}
                                                                                </div>

                                                                                {/* Video Player */}
                                                                                {currentLesson.videoUrl && (
                                                                                          <div className="bg-black p-2 border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]">
                                                                                                    <div className="relative aspect-video w-full bg-black">
                                                                                                              {getYouTubeEmbedUrl(currentLesson.videoUrl) ? (
                                                                                                                        <iframe
                                                                                                                                  src={getYouTubeEmbedUrl(currentLesson.videoUrl)!}
                                                                                                                                  title={currentLesson.title}
                                                                                                                                  className="absolute inset-0 w-full h-full"
                                                                                                                                  allowFullScreen
                                                                                                                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                                                                        />
                                                                                                              ) : (
                                                                                                                        <div className="flex items-center justify-center w-full h-full text-white font-mono">
                                                                                                                                  INVALID VIDEO FEED
                                                                                                                        </div>
                                                                                                              )}
                                                                                                    </div>
                                                                                          </div>
                                                                                )}

                                                                                {/* Controls & Resources */}
                                                                                <div className="grid md:grid-cols-2 gap-8">
                                                                                          {/* Mark Complete */}
                                                                                          <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col items-center justify-center text-center space-y-4">
                                                                                                    <Trophy className="w-12 h-12 text-golden" />
                                                                                                    <div>
                                                                                                              <h3 className="font-heading text-lg uppercase">Mission Status</h3>
                                                                                                              <p className="text-sm text-gray-500">
                                                                                                                        {isLessonCompleted(currentLesson.id)
                                                                                                                                  ? 'Objective completed. Great work, fighter!'
                                                                                                                                  : 'Mark objective as complete to advance.'}
                                                                                                              </p>
                                                                                                    </div>
                                                                                                    {!isLessonCompleted(currentLesson.id) ? (
                                                                                                              <Button
                                                                                                                        onClick={() => markLessonComplete(currentLesson.id)}
                                                                                                                        className="bg-fighter-red text-white border-2 border-black uppercase font-bold hover:bg-red-700 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all w-full md:w-auto"
                                                                                                              >
                                                                                                                        Complete Mission
                                                                                                              </Button>
                                                                                                    ) : (
                                                                                                              <Button disabled className="bg-gray-100 text-gray-400 border-2 border-gray-200 uppercase font-bold cursor-not-allowed">
                                                                                                                        Already Completed
                                                                                                              </Button>
                                                                                                    )}
                                                                                          </div>

                                                                                          {/* Resources */}
                                                                                          <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                                                                                                    <h3 className="font-heading text-lg uppercase mb-4 flex items-center gap-2">
                                                                                                              <Download className="w-5 h-5" />
                                                                                                              Supply Drop (Resources)
                                                                                                    </h3>
                                                                                                    <div className="space-y-3">
                                                                                                              {currentLesson.resources && currentLesson.resources.length > 0 ? (
                                                                                                                        currentLesson.resources.map((resource, index) => (
                                                                                                                                  <div key={index} className="flex items-center justify-between p-3 border-2 border-gray-200 hover:border-black transition-colors bg-gray-50 group">
                                                                                                                                            <div className="flex items-center gap-3">
                                                                                                                                                      <FileText className="w-5 h-5 text-gray-400 group-hover:text-fighter-red" />
                                                                                                                                                      <div>
                                                                                                                                                                <p className="font-bold text-sm text-ink-black">{resource.title}</p>
                                                                                                                                                                <p className="text-xs text-gray-500">{resource.type || 'Link'}</p>
                                                                                                                                                      </div>
                                                                                                                                            </div>
                                                                                                                                            <a
                                                                                                                                                      href={resource.url}
                                                                                                                                                      target="_blank"
                                                                                                                                                      rel="noopener noreferrer"
                                                                                                                                            >
                                                                                                                                                      <Button size="sm" variant="ghost" className="text-fighter-red hover:bg-red-50 font-bold uppercase text-xs">
                                                                                                                                                                Download
                                                                                                                                                      </Button>
                                                                                                                                            </a>
                                                                                                                                  </div>
                                                                                                                        ))
                                                                                                              ) : (
                                                                                                                        <p className="text-gray-400 italic text-sm text-center py-4">No supplies available for this mission.</p>
                                                                                                              )}
                                                                                                    </div>
                                                                                          </div>
                                                                                </div>
                                                                      </>
                                                            ) : (
                                                                      <div className="flex flex-col items-center justify-center p-12 text-center border-4 border-dashed border-gray-300 rounded-lg">
                                                                                <LogoIcon size={64} className="opacity-30 mb-4" />
                                                                                <h3 className="text-2xl font-heading text-gray-400 uppercase">Select a Mission</h3>
                                                                                <p className="text-gray-500 font-bold">Choose a lesson from the mission log to begin.</p>
                                                                      </div>
                                                            )}
                                                  </div>
                                        </main>
                              </div>
                    </div>
          );
}
