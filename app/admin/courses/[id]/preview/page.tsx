'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Course, COLLECTIONS } from '@/types';
import { Button } from '@/components/ui/button';
import {
          ArrowLeft,
          Clock,
          BookOpen,
          Award,
          Play,
          Lock,
          Unlock,
          Users,
          Star,
          CheckCircle,
          FileText,
          Youtube,
          Rocket
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, getYouTubeEmbedUrl } from '@/lib/utils'; // Import helper

export default function CoursePreviewPage() {
          const params = useParams();
          const router = useRouter();
          const { toast } = useToast();
          const [course, setCourse] = useState<Course | null>(null);
          const [loading, setLoading] = useState(true);
          const [publishing, setPublishing] = useState(false);
          const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));

          useEffect(() => {
                    fetchCourse();
          }, [params.id]);

          const fetchCourse = async () => {
                    try {
                              const docRef = doc(db, COLLECTIONS.COURSES, params.id as string);
                              const snapshot = await getDoc(docRef);

                              if (!snapshot.exists()) {
                                        router.push('/admin/courses');
                                        return;
                              }

                              setCourse({ id: snapshot.id, ...snapshot.data() } as Course);
                    } catch (error) {
                              console.error('Error fetching course:', error);
                    } finally {
                              setLoading(false);
                    }
          };

          const toggleModule = (index: number) => {
                    const newExpanded = new Set(expandedModules);
                    if (newExpanded.has(index)) {
                              newExpanded.delete(index);
                    } else {
                              newExpanded.add(index);
                    }
                    setExpandedModules(newExpanded);
          };

          const handlePublish = async () => {
                    if (!course) return;

                    try {
                              setPublishing(true);
                              await updateDoc(doc(db, COLLECTIONS.COURSES, course.id), {
                                        isPublished: true,
                                        updatedAt: serverTimestamp(),
                              });

                              setCourse({ ...course, isPublished: true });
                              toast({
                                        title: 'สำเร็จ',
                                        description: 'คอร์สถูกเผยแพร่แล้ว',
                              });
                    } catch (error) {
                              console.error('Error publishing course:', error);
                              toast({
                                        title: 'ข้อผิดพลาด',
                                        description: 'ไม่สามารถเผยแพร่คอร์สได้',
                                        variant: 'destructive',
                              });
                    } finally {
                              setPublishing(false);
                    }
          };

          if (loading) {
                    return (
                              <div className="flex items-center justify-center h-96">
                                        <div className="arcade-spinner" />
                              </div>
                    );
          }

          if (!course) return null;

          return (
                    <div className="min-h-screen bg-white">
                              {/* Top Bar for Admin */}
                              <div className="bg-ink-black text-white p-4 sticky top-0 z-50">
                                        <div className="max-w-7xl mx-auto flex justify-between items-center">
                                                  <div className="flex items-center gap-4">
                                                            <Link href={`/admin/courses/${course.id}/edit`}>
                                                                      <Button variant="outline" size="sm" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black">
                                                                                <ArrowLeft className="w-4 h-4 mr-2" />
                                                                                กลับไปแก้ไข
                                                                      </Button>
                                                            </Link>
                                                            <span className="font-heading text-xl">PREVIEW MODE</span>
                                                  </div>
                                                  {!course.isPublished ? (
                                                            <Button
                                                                      onClick={handlePublish}
                                                                      disabled={publishing}
                                                                      className="bg-fighter-red hover:bg-red-600 text-white border-white"
                                                            >
                                                                      <Rocket className="w-4 h-4 mr-2" />
                                                                      {publishing ? 'กำลังเผยแพร่...' : 'เผยแพร่คอร์สนี้'}
                                                            </Button>
                                                  ) : (
                                                            <div className="flex items-center gap-2 text-green-400 font-bold">
                                                                      <CheckCircle className="w-5 h-5" />
                                                                      เผยแพร่แล้ว
                                                            </div>
                                                  )}
                                        </div>
                              </div>

                              {/* Course Hero */}
                              <div className="bg-ink-black text-white py-12 relative overflow-hidden">


                                        <div className="max-w-7xl mx-auto px-4 relative z-10">
                                                  <div className="grid md:grid-cols-3 gap-8 items-start">
                                                            <div className="md:col-span-2 space-y-6">
                                                                      <div className="flex items-center gap-3">
                                                                                <span className="px-3 py-1 bg-fighter-red text-white text-xs font-bold uppercase tracking-wider skew-x-[-10deg]">
                                                                                          {course.category || 'COURSE'}
                                                                                </span>
                                                                                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider skew-x-[-10deg] ${course.difficulty === 'beginner' ? 'bg-green-500 text-white' :
                                                                                          course.difficulty === 'intermediate' ? 'bg-yellow-500 text-black' :
                                                                                                    'bg-red-600 text-white'
                                                                                          }`}>
                                                                                          {course.difficulty}
                                                                                </span>
                                                                      </div>

                                                                      <h1 className="font-heading text-4xl md:text-6xl text-golden uppercase drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                                                                                {course.title}
                                                                      </h1>

                                                                      <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
                                                                                {course.description}
                                                                      </p>

                                                                      <div className="flex flex-wrap gap-6 text-sm font-bold text-gray-400">
                                                                                <div className="flex items-center gap-2">
                                                                                          <Users className="w-5 h-5 text-fighter-red" />
                                                                                          <span>{course.totalEnrollments || 0} ผู้เรียน</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                          <BookOpen className="w-5 h-5 text-fighter-red" />
                                                                                          <span>{course.modules?.length || 0} บทเรียน</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                          <Clock className="w-5 h-5 text-fighter-red" />
                                                                                          <span>{Math.ceil((course.totalLessons || 0) * 15 / 60)} ชั่วโมง (โดยประมาณ)</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                          <Star className="w-5 h-5 text-yellow-500" />
                                                                                          <span>{course.averageRating || 5.0} (จาก {course.totalReviews || 0} รีวิว)</span>
                                                                                </div>
                                                                      </div>
                                                            </div>

                                                            {/* Course Card */}
                                                            <div className="bg-white text-ink-black border-4 border-black p-2 transform rotate-1 shadow-[8px_8px_0_rgba(0,0,0,1)]">
                                                                      <div className="relative aspect-video bg-gray-200 mb-4 border-2 border-black overflow-hidden group cursor-pointer">
                                                                                {course.thumbnailUrl ? (
                                                                                          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                                                ) : (
                                                                                          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                                                                                                    <span className="font-heading text-4xl">NO IMAGE</span>
                                                                                          </div>
                                                                                )}
                                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                          <Play className="w-16 h-16 text-white drop-shadow-lg" />
                                                                                </div>
                                                                      </div>

                                                                      <div className="p-4 space-y-4">
                                                                                <div className="text-3xl font-heading text-center text-fighter-red">
                                                                                          {course.pricing?.threeMonths ? formatCurrency(course.pricing.threeMonths) : 'FREE'}
                                                                                </div>
                                                                                <Button className="w-full text-lg h-12 skew-x-[-6deg] uppercase font-bold" disabled>
                                                                                          สมัครเรียนทันที
                                                                                </Button>
                                                                                <p className="text-center text-xs text-gray-500 mt-2">
                                                                                          *ราคานี้รวมเอกสารประกอบการเรียนแล้ว
                                                                                </p>
                                                                      </div>
                                                            </div>
                                                  </div>
                                        </div>
                              </div>

                              {/* Content */}
                              <div className="max-w-7xl mx-auto px-4 py-12">
                                        <div className="grid md:grid-cols-3 gap-12">
                                                  {/* Main Content */}
                                                  <div className="md:col-span-2 space-y-12">

                                                            {/* Curriculum */}
                                                            <div className="space-y-6">
                                                                      <h2 className="font-heading text-3xl uppercase flex items-center gap-3">
                                                                                <div className="w-2 h-8 bg-fighter-red" />
                                                                                เนื้อหาบทเรียน
                                                                      </h2>

                                                                      <div className="space-y-4">
                                                                                {course.modules?.map((module, moduleIndex) => (
                                                                                          <div key={moduleIndex} className="border-2 border-black bg-white shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
                                                                                                    <button
                                                                                                              onClick={() => toggleModule(moduleIndex)}
                                                                                                              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b-2 border-black"
                                                                                                    >
                                                                                                              <div className="flex items-center gap-4">
                                                                                                                        <span className="font-heading text-xl text-gray-400">
                                                                                                                                  {String(moduleIndex + 1).padStart(2, '0')}
                                                                                                                        </span>
                                                                                                                        <div className="text-left">
                                                                                                                                  <h3 className="font-bold text-lg">{module.title}</h3>
                                                                                                                                  <p className="text-sm text-gray-500">{module.lessons?.length || 0} บทเรียน</p>
                                                                                                                        </div>
                                                                                                              </div>
                                                                                                              <div className={`transform transition-transform ${expandedModules.has(moduleIndex) ? 'rotate-180' : ''}`}>
                                                                                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                                                                        </svg>
                                                                                                              </div>
                                                                                                    </button>

                                                                                                    {expandedModules.has(moduleIndex) && (
                                                                                                              <div className="divide-y divide-gray-200">
                                                                                                                        {module.lessons?.map((lesson, lessonIndex) => (
                                                                                                                                  <div key={lessonIndex} className="p-4 hover:bg-gray-50">
                                                                                                                                            <div className="flex items-center justify-between mb-2">
                                                                                                                                                      <div className="flex items-center gap-3">
                                                                                                                                                                {lesson.isPreview ? (
                                                                                                                                                                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                                                                                                                                                    <Play className="w-4 h-4 text-green-600" />
                                                                                                                                                                          </div>
                                                                                                                                                                ) : (
                                                                                                                                                                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                                                                                                                                                    <Lock className="w-4 h-4 text-gray-400" />
                                                                                                                                                                          </div>
                                                                                                                                                                )}
                                                                                                                                                                <div>
                                                                                                                                                                          <p className="font-bold group-hover:text-fighter-red transition-colors">{lesson.title}</p>
                                                                                                                                                                          <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                                                                                                                                    {lesson.videoUrl && (
                                                                                                                                                                                              <span className="flex items-center gap-1">
                                                                                                                                                                                                        <Youtube className="w-3 h-3" /> วิดีโอ
                                                                                                                                                                                              </span>
                                                                                                                                                                                    )}
                                                                                                                                                                                    {lesson.resources && lesson.resources.length > 0 && (
                                                                                                                                                                                              <span className="flex items-center gap-1">
                                                                                                                                                                                                        <FileText className="w-3 h-3" /> PDF
                                                                                                                                                                                              </span>
                                                                                                                                                                                    )}
                                                                                                                                                                          </div>
                                                                                                                                                                </div>
                                                                                                                                                      </div>
                                                                                                                                                      <div className="flex items-center gap-2">
                                                                                                                                                                {lesson.isPreview ? (
                                                                                                                                                                          <span className="px-2 py-1 text-xs font-bold uppercase bg-green-100 text-green-700 border border-green-300">
                                                                                                                                                                                    <Unlock className="w-3 h-3 inline mr-1" />
                                                                                                                                                                                    ดูฟรี
                                                                                                                                                                          </span>
                                                                                                                                                                ) : (
                                                                                                                                                                          <span className="px-2 py-1 text-xs font-bold uppercase bg-gray-100 text-gray-500 border border-gray-300">
                                                                                                                                                                                    <Lock className="w-3 h-3 inline mr-1" />
                                                                                                                                                                                    ล็อค
                                                                                                                                                                          </span>
                                                                                                                                                                )}
                                                                                                                                                      </div>
                                                                                                                                            </div>

                                                                                                                                            {/* VIDEO PLAYER */}
                                                                                                                                            {lesson.videoUrl && (
                                                                                                                                                      <div className="mt-4 aspect-video bg-black rounded-lg overflow-hidden border-2 border-ink-black shadow-md">
                                                                                                                                                                {(() => {
                                                                                                                                                                          const embedUrl = getYouTubeEmbedUrl(lesson.videoUrl);
                                                                                                                                                                          if (embedUrl) {
                                                                                                                                                                                    return (
                                                                                                                                                                                              <iframe
                                                                                                                                                                                                        src={embedUrl}
                                                                                                                                                                                                        className="w-full h-full"
                                                                                                                                                                                                        title={lesson.title}
                                                                                                                                                                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                                                                                                                                                        allowFullScreen
                                                                                                                                                                                              />
                                                                                                                                                                                    );
                                                                                                                                                                          } else {
                                                                                                                                                                                    return (
                                                                                                                                                                                              <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gray-900 p-4 text-center">
                                                                                                                                                                                                        <Youtube className="w-12 h-12 text-gray-600 mb-2" />
                                                                                                                                                                                                        <p className="font-bold text-red-400">วิดีโอไม่สามารถเล่นได้</p>
                                                                                                                                                                                                        <p className="text-sm text-gray-400 mt-1">
                                                                                                                                                                                                                  ลิงก์ YouTube อาจไม่ถูกต้องหรือวิดีโอเป็นแบบ Private
                                                                                                                                                                                                        </p>
                                                                                                                                                                                                        <p className="text-xs text-gray-500 mt-2 font-mono break-all px-4">
                                                                                                                                                                                                                  {lesson.videoUrl}
                                                                                                                                                                                                        </p>
                                                                                                                                                                                              </div>
                                                                                                                                                                                    );
                                                                                                                                                                          }
                                                                                                                                                                })()}
                                                                                                                                                      </div>
                                                                                                                                            )}
                                                                                                                                  </div>
                                                                                                                        ))}
                                                                                                              </div>
                                                                                                    )}
                                                                                          </div>
                                                                                ))}
                                                                      </div>
                                                            </div>

                                                            {/* Instructor */}
                                                            <div className="p-8 border-2 border-black bg-white relative">
                                                                      <div className="absolute -top-3 left-8 px-4 bg-ink-black text-white font-heading text-lg skew-x-[-10deg]">
                                                                                INSTRUCTOR
                                                                      </div>
                                                                      <div className="flex items-start gap-6 mt-4">
                                                                                <div className="w-20 h-20 bg-gray-200 border-2 border-black overflow-hidden flex-shrink-0">
                                                                                          <img src="/api/placeholder/80/80" alt="Instructor" className="w-full h-full object-cover" />
                                                                                </div>
                                                                                <div>
                                                                                          <h3 className="font-bold text-xl mb-2">Physics Fighter Team</h3>
                                                                                          <p className="text-gray-600 leading-relaxed">
                                                                                                    ทีมงานผู้เชี่ยวชาญด้านฟิสิกส์ที่มีประสบการณ์การสอนมากกว่า 10 ปี มุ่งเน้นการสอนที่สนุก เข้าใจง่าย และนำไปใช้ได้จริงในการสอบและการเรียนระดับสูง
                                                                                          </p>
                                                                                </div>
                                                                      </div>
                                                            </div>

                                                  </div>

                                                  {/* Sidebar */}
                                                  <div className="space-y-8">
                                                            <div className="bg-gray-50 p-6 border-2 border-black">
                                                                      <h3 className="font-heading text-xl uppercase mb-4 text-fighter-red">สิ่งที่ได้รับ</h3>
                                                                      <ul className="space-y-3">
                                                                                <li className="flex items-start gap-3">
                                                                                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                                                          <span className="text-sm">เข้าเรียนได้ตลอดชีพ ไม่มีการหมดอายุ</span>
                                                                                </li>
                                                                                <li className="flex items-start gap-3">
                                                                                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                                                          <span className="text-sm">เอกสารประกอบการเรียน PDF ครบทุกบท</span>
                                                                                </li>
                                                                                <li className="flex items-start gap-3">
                                                                                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                                                          <span className="text-sm">เนื้อหาอัพเดทใหม่ล่าสุดตามหลักสูตร</span>
                                                                                </li>
                                                                                <li className="flex items-start gap-3">
                                                                                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                                                          <span className="text-sm">รองรับการเรียนทุกอุปกรณ์ (Mobile/Tablet/PC)</span>
                                                                                </li>
                                                                                <li className="flex items-start gap-3">
                                                                                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                                                          <span className="text-sm">ปรึกษาและสอบถามผู้สอนได้โดยตรง</span>
                                                                                </li>
                                                                      </ul>
                                                            </div>
                                                  </div>
                                        </div>
                              </div>
                    </div>
          );
}
