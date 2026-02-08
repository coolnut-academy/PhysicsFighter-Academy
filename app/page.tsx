'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUserRole } from '@/store/useAuthStore';
import { UserRole, Course, COLLECTIONS } from '@/types';
import { Loader2, BookOpen, Clock, Users, Star } from 'lucide-react';
import { LogoIcon } from '@/components/ui/Logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signInWithGoogle, handleGoogleRedirectResult } from '@/lib/firebase/googleAuth';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { formatCurrency } from '@/lib/utils';

export default function LandingPage() {
  const router = useRouter();
  const { user, initializing, isWaitingForUserData } = useAuthStore();
  const userRole = useUserRole();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (!initializing && user && userRole) {
      switch (userRole) {
        case UserRole.SUPER_ADMIN:
          router.push('/super-admin/dashboard');
          break;
        case UserRole.ADMIN:
          router.push('/admin/dashboard');
          break;
        case UserRole.STUDENT:
          router.push('/dashboard');
          break;
      }
    }
  }, [user, userRole, initializing, router]);

  // Handle Google redirect result on mount
  useEffect(() => {
    handleGoogleRedirectResult()
      .catch((err) => {
        setError(err.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
      });
  }, []);

  // Fetch recommended courses
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const q = query(
        collection(db, COLLECTIONS.COURSES),
        where('isPublished', '==', true),
        limit(1)
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
      setCoursesLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // Redirect is handled by the first useEffect when user state updates
    } catch (err: any) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
      setGoogleLoading(false);
    }
  };

  // Difficulty color mapping
  const difficultyConfig: Record<string, { bg: string; text: string; label: string }> = {
    beginner: { bg: 'bg-green-500', text: 'text-white', label: 'ปรับพื้นฐาน' },
    intermediate: { bg: 'bg-golden', text: 'text-ink-black', label: 'ติวสอบเข้ามหาลัยฯ' },
    advanced: { bg: 'bg-fighter-red', text: 'text-white', label: 'ติวเข้มข้น/ข้อสอบปราบเซียน' },
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-white">
        <div className="arcade-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-white">
      {/* 🎮 SPEED LINES BACKGROUND */}
      <div
        className="fixed inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 50px,
              #dc2626 50px,
              #dc2626 51px
            )
          `,
        }}
      />

      {/* ========================================
          🥋 HERO SECTION - Game Title Screen
          ======================================== */}
      <div className="relative overflow-hidden">
        {/* Halftone Pattern Background */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
            backgroundSize: '8px 8px',
          }}
        />

        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Navigation */}
          <nav className="flex justify-between items-center mb-0">
            <div className="flex items-center gap-3">
              <LogoIcon size={44} />
              <h1 className="text-3xl font-bold tracking-wide">
                <span className="text-cover-red">Physics</span>
                <span className="text-cover-gray">Fight</span>
                <span className="text-cover-red">T</span>
                <span className="text-cover-gray">er</span>
              </h1>
            </div>
            <div>
              {/* Google Sign-In Button (Standard Style) */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading || isWaitingForUserData}
                className="flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg border border-gray-300 shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {googleLoading || isWaitingForUserData ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>{googleLoading ? 'กำลังเข้าสู่ระบบ...' : isWaitingForUserData ? 'กำลังโหลด...' : 'เข้าสู่ระบบ'}</span>
              </button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-5xl mx-auto py-5">
            {/* Main Headline - Cover FB Style */}
            <h2 className="font-kanit font-bold text-7xl md:text-8xl lg:text-[9rem] uppercase mb-4 leading-none tracking-tight">
              <span className="text-cover-red">
                พุ่งทะยาน
              </span>
              <br />
              <span className="text-cover-gray">สู่ความ</span>
              <span className="text-cover-red">
                สำเร็จ
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-2xl md:text-2xl text-gray-700 max-w-2xl mx-auto mb-5 font-bold">
              เข้าใจหลัก ฟันทุกโจทย์
              <br />
              <span className="text-fighter-red">สร้างพื้นฐานแน่น ลุยทุกสนามสอบ!</span>
            </p>

            {/* Error message */}
            {error && (
              <div className="max-w-md mx-auto mb-6 bg-red-50 border-2 border-fighter-red text-fighter-red p-3 text-sm font-bold">
                {error}
              </div>
            )}

            {/* Recommended Courses Section */}
            <div className="mb-0">
              {coursesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-fighter-red" />
                </div>
              ) : courses.length === 0 ? (
                <p className="text-gray-500">ยังไม่มีคอร์สในขณะนี้</p>
              ) : (
                <div className="grid max-w-md mx-auto">
                  {courses.map((course) => {
                    const difficulty = difficultyConfig[course.difficulty] || difficultyConfig.beginner;
                    return (
                      <Link key={course.id} href={`/courses/${course.id}`}>
                        <Card className="overflow-hidden group text-left">
                          {/* Thumbnail */}
                          <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-t-2xl">
                            {course.thumbnailUrl ? (
                              <img
                                src={course.thumbnailUrl}
                                alt={course.title}
                                className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full bg-gray-100">
                                <LogoIcon size={48} className="opacity-30" />
                              </div>
                            )}
                            {/* Difficulty Badge */}
                            <div className="absolute bottom-2 left-2">
                              <div className={`${difficulty.bg} ${difficulty.text} px-3 py-1 font-bold text-xs uppercase rounded-lg shadow-md`}>
                                {difficulty.label}
                              </div>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="p-4">
                            {course.category && (
                              <p className="text-xs text-fighter-red font-bold mb-1 uppercase tracking-wider">
                                {course.category}
                              </p>
                            )}
                            <h4 className="font-heading text-lg uppercase text-ink-black mb-2 line-clamp-1 group-hover:text-fighter-red transition-colors">
                              {course.title}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {course.description}
                            </p>
                            
                            {/* Stats */}
                            <div className="flex items-center gap-3 text-xs font-bold uppercase text-gray-600">
                              <div className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4 text-fighter-red" />
                                <span>{course.totalLessons || 0} บท</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-golden" />
                                <span>{Math.floor((course.totalDurationMinutes || 0) / 60)} ชม.</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4 text-green-500" />
                                <span>{course.totalEnrollments || 0}</span>
                              </div>
                            </div>
                            
                            {/* Rating */}
                            {course.averageRating && (
                              <div className="flex items-center gap-1 mt-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${i < Math.floor(course.averageRating || 0)
                                      ? 'text-golden fill-golden'
                                      : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-xs text-gray-500 ml-1">
                                  ({course.totalReviews || 0})
                                </span>
                              </div>
                            )}
                            
                            {/* Price */}
                            <div className="mt-3 flex items-baseline gap-1">
                              <span className="font-heading text-xl text-fighter-red">
                                {formatCurrency(course.pricing?.threeMonths || 0)}
                              </span>
                              <span className="text-xs text-gray-500">/ 3 เดือน</span>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* CTA Button - Badge Style */}
              <div className="mt-4 flex justify-center">
                <Link href="/courses">
                  <div className="bg-fighter-red text-white px-8 py-3 font-heading text-xl uppercase tracking-widest rounded-xl shadow-lg cursor-pointer hover:bg-red-600 transition-colors">
                    <span className="flex items-center gap-2">
                      ดูคอร์สทั้งหมด
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          🏁 FOOTER
          ======================================== */}
      <footer className="border-t-4 border-ink-black bg-white py-4">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <LogoIcon size={28} />
            <span className="font-bold text-xl">
              <span className="text-cover-red">Physics</span>
              <span className="text-cover-gray">Fight</span>
              <span className="text-cover-red">T</span>
              <span className="text-cover-gray">er</span>
            </span>
          </div>
          <p className="text-gray-500 font-bold uppercase text-sm">
            © 2026 สงวนลิขสิทธิ์ทุกประการ สู้เพื่อความรู้!
          </p>
        </div>
      </footer>
    </div>
  );
}
