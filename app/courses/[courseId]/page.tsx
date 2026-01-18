'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Course, COLLECTIONS, CourseLesson } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import {
          BookOpen,
          Clock,
          Users,
          ArrowLeft,
          Play,
          CheckCircle,
          Zap,
          Lock,
          Swords,
          Shield,
          Star
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, getYouTubeEmbedUrl } from '@/lib/utils';
import { Loading } from '@/components/shared/Loading';
import {
          Dialog,
          DialogContent,
          DialogHeader,
          DialogTitle,
          DialogTrigger,
} from "@/components/ui/dialog";

export default function CourseDetailPage() {
          const params = useParams();
          const router = useRouter();
          const { user } = useAuthStore();
          const courseId = params.courseId as string;

          const [course, setCourse] = useState<Course | null>(null);
          const [loading, setLoading] = useState(true);
          const [activePreviewLesson, setActivePreviewLesson] = useState<CourseLesson | null>(null);

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
                    return (
                              <div className="flex items-center justify-center min-h-screen bg-paper-pattern">
                                        <Loading text="LOADING MISSION DATA..." />
                              </div>
                    );
          }

          if (!course) {
                    return null;
          }

          // Difficulty color mapping (reused from CourseCard for consistency)
          const difficultyConfig = {
                    beginner: { bg: 'bg-green-500', text: 'text-white', label: 'ROOKIE' },
                    intermediate: { bg: 'bg-golden', text: 'text-ink-black', label: 'WARRIOR' },
                    advanced: { bg: 'bg-fighter-red', text: 'text-white', label: 'MASTER' },
          };
          const difficulty = difficultyConfig[course.difficulty] || difficultyConfig.beginner;

          return (
                    <div className="min-h-screen bg-paper-pattern">
                              {/* Top Bar */}
                              <div className="bg-ink-black text-white p-4 sticky top-0 z-50 border-b-4 border-fighter-red">
                                        <div className="container mx-auto flex items-center justify-between">
                                                  <Link href="/courses">
                                                            <Button variant="outline" size="sm" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black uppercase font-bold skew-x-[-10deg]">
                                                                      <ArrowLeft className="w-4 h-4 mr-2" />
                                                                      Back to Stages
                                                            </Button>
                                                  </Link>
                                                  <div className="font-heading text-xl text-golden tracking-wider">MISSION BRIEFING</div>
                                                  <div className="w-[100px]" /> {/* Spacer */}
                                        </div>
                              </div>

                              {/* Hero Section */}
                              <div className="bg-white border-b-4 border-black relative overflow-hidden">
                                        <div className="container mx-auto px-4 py-12">
                                                  <div className="grid md:grid-cols-2 gap-8 items-center">
                                                            {/* Left: Info */}
                                                            <div className="space-y-6 relative z-10">
                                                                      {course.category && (
                                                                                <div className="inline-block bg-fighter-red text-white px-3 py-1 font-bold text-sm uppercase -skew-x-12 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                                                                                          {course.category}
                                                                                </div>
                                                                      )}

                                                                      <h1 className="text-4xl md:text-6xl font-heading uppercase text-ink-black drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
                                                                                {course.title}
                                                                      </h1>

                                                                      <p className="text-lg text-gray-600 font-medium max-w-xl">
                                                                                {course.description}
                                                                      </p>

                                                                      <div className="flex flex-wrap gap-4">
                                                                                {/* Difficulty Badge */}
                                                                                <div className={`${difficulty.bg} ${difficulty.text} px-4 py-2 font-bold uppercase border-2 border-black -skew-x-6 shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center gap-2`}>
                                                                                          <Shield className="w-4 h-4" />
                                                                                          {difficulty.label}
                                                                                </div>

                                                                                {/* Stats */}
                                                                                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 border-2 border-black -skew-x-6 font-bold uppercase text-sm">
                                                                                          <BookOpen className="w-4 h-4 text-fighter-red" />
                                                                                          {course.totalLessons || 0} Lessons
                                                                                </div>
                                                                                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 border-2 border-black -skew-x-6 font-bold uppercase text-sm">
                                                                                          <Clock className="w-4 h-4 text-golden" />
                                                                                          {Math.floor((course.totalDurationMinutes || 0) / 60)}h {((course.totalDurationMinutes || 0) % 60)}m
                                                                                </div>
                                                                      </div>
                                                            </div>

                                                            {/* Right: Thumbnail */}
                                                            <div className="relative">
                                                                      <div className="bg-black p-2 transform rotate-1 shadow-[12px_12px_0_rgba(0,0,0,1)]">
                                                                                <div className="relative aspect-video bg-gray-200 border-2 border-white overflow-hidden">
                                                                                          {course.thumbnailUrl ? (
                                                                                                    <img
                                                                                                              src={course.thumbnailUrl}
                                                                                                              alt={course.title}
                                                                                                              className="w-full h-full object-cover"
                                                                                                    />
                                                                                          ) : (
                                                                                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                                                                              <Swords className="w-16 h-16 text-gray-300" />
                                                                                                    </div>
                                                                                          )}
                                                                                </div>
                                                                      </div>
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
                                                            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] relative">
                                                                      <div className="absolute -top-4 left-4 bg-golden text-ink-black border-2 border-black px-4 py-1 font-heading uppercase text-lg transform -skew-x-12 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                                                                Mission Objectives
                                                                      </div>
                                                                      <div className="mt-4 grid md:grid-cols-2 gap-4">
                                                                                {course.learningOutcomes?.map((outcome, index) => (
                                                                                          <div key={index} className="flex items-start gap-3">
                                                                                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                                                                    <p className="font-bold text-gray-700">{outcome}</p>
                                                                                          </div>
                                                                                )) || (
                                                                                                    <p className="text-gray-500 italic">Objectives classified.</p>
                                                                                          )}
                                                                      </div>
                                                            </div>

                                                            {/* Course Modules */}
                                                            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] relative">
                                                                      <div className="absolute -top-4 left-4 bg-fighter-red text-white border-2 border-black px-4 py-1 font-heading uppercase text-lg transform -skew-x-12 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                                                                Battle Plan (Curriculum)
                                                                      </div>

                                                                      <div className="mt-6 space-y-6">
                                                                                {course.modules && course.modules.length > 0 ? (
                                                                                          course.modules.map((module, index) => (
                                                                                                    <div key={module.id} className="border-2 border-black bg-gray-50 rounded-none">
                                                                                                              <div className="p-4 border-b-2 border-black bg-gray-100 flex justify-between items-center">
                                                                                                                        <h3 className="font-heading text-lg text-ink-black uppercase">
                                                                                                                                  Stage {index + 1}: {module.title}
                                                                                                                        </h3>
                                                                                                                        <span className="text-xs font-bold uppercase bg-white border border-black px-2 py-1">
                                                                                                                                  {module.lessons.length} Missions
                                                                                                                        </span>
                                                                                                              </div>
                                                                                                              <div className="p-4 space-y-2">
                                                                                                                        <p className="text-sm text-gray-600 mb-4 font-medium">{module.description}</p>

                                                                                                                        {module.lessons.map((lesson) => (
                                                                                                                                  <div key={lesson.id} className="flex items-center justify-between p-3 bg-white border border-black hover:bg-red-50 transition-colors group">
                                                                                                                                            <div className="flex items-center gap-3">
                                                                                                                                                      {lesson.isPreview ? (
                                                                                                                                                                <div className="w-8 h-8 rounded-full bg-fighter-red text-white flex items-center justify-center border-2 border-black">
                                                                                                                                                                          <Play className="w-4 h-4 ml-0.5" />
                                                                                                                                                                </div>
                                                                                                                                                      ) : (
                                                                                                                                                                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center border-2 border-black">
                                                                                                                                                                          <Lock className="w-4 h-4" />
                                                                                                                                                                </div>
                                                                                                                                                      )}
                                                                                                                                                      <div>
                                                                                                                                                                <p className="font-bold text-ink-black">{lesson.title}</p>
                                                                                                                                                                <p className="text-xs text-gray-500 font-mono">{lesson.durationMinutes} MIN</p>
                                                                                                                                                      </div>
                                                                                                                                            </div>

                                                                                                                                            {lesson.isPreview ? (
                                                                                                                                                      <Dialog>
                                                                                                                                                                <DialogTrigger asChild>
                                                                                                                                                                          <Button size="sm" variant="outline" className="border-2 border-black text-fighter-red hover:bg-fighter-red hover:text-white uppercase font-bold text-xs"
                                                                                                                                                                                    onClick={() => setActivePreviewLesson(lesson)}>
                                                                                                                                                                                    Preview
                                                                                                                                                                          </Button>
                                                                                                                                                                </DialogTrigger>
                                                                                                                                                                <DialogContent className="bg-black border-4 border-fighter-red text-white p-0 overflow-hidden max-w-4xl">
                                                                                                                                                                          <DialogHeader className="p-4 bg-ink-black border-b-2 border-fighter-red">
                                                                                                                                                                                    <DialogTitle className="font-heading text-fighter-red uppercase tracking-wider">
                                                                                                                                                                                              Preview: {lesson.title}
                                                                                                                                                                                    </DialogTitle>
                                                                                                                                                                          </DialogHeader>
                                                                                                                                                                          <div className="aspect-video bg-black">
                                                                                                                                                                                    {lesson.videoUrl && getYouTubeEmbedUrl(lesson.videoUrl) ? (
                                                                                                                                                                                              <iframe
                                                                                                                                                                                                        src={getYouTubeEmbedUrl(lesson.videoUrl)!}
                                                                                                                                                                                                        title={lesson.title}
                                                                                                                                                                                                        className="w-full h-full"
                                                                                                                                                                                                        allowFullScreen
                                                                                                                                                                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                                                                                                                                              />
                                                                                                                                                                                    ) : (
                                                                                                                                                                                              <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono">
                                                                                                                                                                                                        VIDEO SIGNAL LOST
                                                                                                                                                                                              </div>
                                                                                                                                                                                    )}
                                                                                                                                                                          </div>
                                                                                                                                                                </DialogContent>
                                                                                                                                                      </Dialog>
                                                                                                                                            ) : (
                                                                                                                                                      <span className="text-xs font-bold uppercase text-gray-400 bg-gray-100 px-2 py-1 border border-gray-300">
                                                                                                                                                                Locked
                                                                                                                                                      </span>
                                                                                                                                            )}
                                                                                                                                  </div>
                                                                                                                        ))}
                                                                                                              </div>
                                                                                                    </div>
                                                                                          ))
                                                                                ) : (
                                                                                          <p className="text-gray-500 font-bold text-center py-8">No missions available yet.</p>
                                                                                )}
                                                                      </div>
                                                            </div>
                                                  </div>

                                                  {/* Right Column - Pricing Card */}
                                                  <div className="lg:col-span-1">
                                                            <div className="sticky top-24">
                                                                      <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0_rgba(0,0,0,1)] relative">
                                                                                <div className="text-center mb-6">
                                                                                          <p className="text-sm font-bold uppercase text-gray-500 mb-2">ACCESS PASS</p>
                                                                                          <div className="text-4xl font-heading text-fighter-red">
                                                                                                    {formatCurrency(course.pricing.threeMonths)}
                                                                                          </div>
                                                                                          <p className="text-xs font-bold uppercase text-gray-400">/ 3 MONTHS</p>
                                                                                </div>

                                                                                <div className="space-y-4 mb-8">
                                                                                          <Link href={`/checkout/${course.id}`} className="block">
                                                                                                    <Button className="w-full h-14 bg-fighter-red hover:bg-red-700 text-white border-2 border-black uppercase font-heading text-xl shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                                                                                                              <Zap className="w-5 h-5 mr-2" />
                                                                                                              Enroll Now
                                                                                                    </Button>
                                                                                          </Link>

                                                                                          {/* Super Admin Bypass */}
                                                                                          {user?.role === 'super_admin' && (
                                                                                                    <Link href={`/learn/course/${course.id}`} className="block">
                                                                                                              <Button variant="outline" className="w-full h-12 border-2 border-golden bg-black text-golden hover:bg-gray-900 uppercase font-bold text-sm tracking-wider">
                                                                                                                        <Shield className="w-4 h-4 mr-2" />
                                                                                                                        SUPER ADMIN ENTRY
                                                                                                              </Button>
                                                                                                    </Link>
                                                                                          )}
                                                                                </div>

                                                                                <div className="border-t-2 border-dashed border-gray-300 pt-6">
                                                                                          <p className="font-bold uppercase text-sm mb-4">Pass Includes:</p>
                                                                                          <ul className="space-y-3">
                                                                                                    <li className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                                                                                              <CheckCircle className="w-4 h-4 text-green-500" />
                                                                                                              Full Access
                                                                                                    </li>
                                                                                                    <li className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                                                                                              <CheckCircle className="w-4 h-4 text-green-500" />
                                                                                                              All Resources
                                                                                                    </li>
                                                                                                    <li className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                                                                                              <CheckCircle className="w-4 h-4 text-green-500" />
                                                                                                              Instructor Support
                                                                                                    </li>
                                                                                          </ul>
                                                                                </div>
                                                                      </div>
                                                            </div>
                                                  </div>
                                        </div>
                              </div>
                    </div>
          );
}
