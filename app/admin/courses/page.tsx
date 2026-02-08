'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/useAuthStore';
import { Course, COLLECTIONS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Edit, Eye, Trash2, Search, Archive, Rocket, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminCoursesPage() {
          const { user } = useAuthStore();
          const [courses, setCourses] = useState<Course[]>([]);
          const [loading, setLoading] = useState(true);
          const [searchQuery, setSearchQuery] = useState('');
          const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

          useEffect(() => {
                    fetchCourses();
          }, [user]);

          const fetchCourses = async () => {
                    if (!user) return;

                    try {
                              setLoading(true);
                              const q = query(
                                        collection(db, COLLECTIONS.COURSES),
                                        where('ownerId', '==', user.id)
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

          const filteredCourses = courses.filter((course) => {
                    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesFilter =
                              filter === 'all' ||
                              (filter === 'published' && course.isPublished) ||
                              (filter === 'draft' && !course.isPublished);
                    return matchesSearch && matchesFilter;
          });

          const publishedCount = courses.filter((c) => c.isPublished).length;
          const draftCount = courses.filter((c) => !c.isPublished).length;

          if (loading) {
                    return (
                              <div className="flex items-center justify-center h-96">
                                        <div className="arcade-spinner" />
                              </div>
                    );
          }

          return (
                    <div className="p-6">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                                  <Link href="/admin/dashboard">
                                                            <Button variant="outline" size="sm">
                                                                      <ArrowLeft className="w-4 h-4" />
                                                            </Button>
                                                  </Link>
                                                  <h1 className="font-heading text-4xl uppercase text-ink-black">
                                                            คอร์ส<span className="text-fighter-red">ของฉัน</span>
                                                  </h1>
                                        </div>
                                        <Link href="/admin/courses/create">
                                                  <Button>
                                                            <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                                                                      <Plus className="w-4 h-4" />
                                                                      สร้างคอร์สใหม่
                                                            </span>
                                                  </Button>
                                        </Link>
                              </div>

                              {/* Stats */}
                              <div className="grid grid-cols-3 gap-4 mb-6">
                                        <button
                                                  onClick={() => setFilter('all')}
                                                  className={`p-4 border-2 border-ink-black transition-all ${filter === 'all' ? 'bg-ink-black text-white shadow-none' : 'bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                                            }`}
                                        >
                                                  <p className="font-heading text-3xl">{courses.length}</p>
                                                  <p className="text-sm font-bold uppercase">ทั้งหมด</p>
                                        </button>
                                        <button
                                                  onClick={() => setFilter('published')}
                                                  className={`p-4 border-2 border-ink-black transition-all ${filter === 'published' ? 'bg-green-500 text-white shadow-none' : 'bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                                            }`}
                                        >
                                                  <p className="font-heading text-3xl text-green-600">{publishedCount}</p>
                                                  <p className="text-sm font-bold uppercase">เผยแพร่แล้ว</p>
                                        </button>
                                        <button
                                                  onClick={() => setFilter('draft')}
                                                  className={`p-4 border-2 border-ink-black transition-all ${filter === 'draft' ? 'bg-golden text-ink-black shadow-none' : 'bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                                            }`}
                                        >
                                                  <p className="font-heading text-3xl text-golden">{draftCount}</p>
                                                  <p className="text-sm font-bold uppercase">แบบร่าง</p>
                                        </button>
                              </div>

                              {/* Search */}
                              <div className="mb-6">
                                        <div className="relative max-w-md">
                                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                  <input
                                                            type="text"
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            className="arcade-input pl-10"
                                                            placeholder="ค้นหาคอร์ส..."
                                                  />
                                        </div>
                              </div>

                              {/* Courses List */}
                              {filteredCourses.length === 0 ? (
                                        <Card className="text-center py-16">
                                                  <CardContent>
                                                            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                                            <h3 className="font-heading text-2xl uppercase text-gray-500 mb-4">
                                                                      {filter === 'draft' ? 'ไม่มีแบบร่าง' : filter === 'published' ? 'ยังไม่เผยแพร่คอร์ส' : 'ยังไม่มีคอร์ส'}
                                                            </h3>
                                                            <p className="text-gray-400 mb-6">เริ่มสร้างคอร์สใหม่เลย!</p>
                                                            <Link href="/admin/courses/create">
                                                                      <Button>
                                                                                <span style={{ transform: 'skewX(6deg)' }}>สร้างคอร์สแรกของคุณ</span>
                                                                      </Button>
                                                            </Link>
                                                  </CardContent>
                                        </Card>
                              ) : (
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                  {filteredCourses.map((course) => (
                                                            <Card key={course.id} className="overflow-hidden">
                                                                      {/* Thumbnail */}
                                                                      <div className="relative h-40 bg-gray-200 border-b-2 border-ink-black">
                                                                                {course.thumbnailUrl ? (
                                                                                          <img
                                                                                                    src={course.thumbnailUrl}
                                                                                                    alt={course.title}
                                                                                                    className="w-full h-full object-cover"
                                                                                          />
                                                                                ) : (
                                                                                          <div className="w-full h-full flex items-center justify-center bg-fighter-red/10">
                                                                                                    <BookOpen className="w-12 h-12 text-fighter-red/50" />
                                                                                          </div>
                                                                                )}
                                                                                {/* Status Badge */}
                                                                                <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold uppercase border-2 border-ink-black ${course.isPublished ? 'bg-green-500 text-white' : 'bg-golden text-ink-black'
                                                                                          }`}>
                                                                                          {course.isPublished ? (
                                                                                                    <span className="flex items-center gap-1">
                                                                                                              <Rocket className="w-3 h-3" /> เผยแพร่
                                                                                                    </span>
                                                                                          ) : (
                                                                                                    <span className="flex items-center gap-1">
                                                                                                              <Archive className="w-3 h-3" /> แบบร่าง
                                                                                                    </span>
                                                                                          )}
                                                                                </div>
                                                                      </div>

                                                                      <CardContent className="p-4">
                                                                                <h3 className="font-heading text-lg uppercase text-ink-black mb-2 line-clamp-2">
                                                                                          {course.title}
                                                                                </h3>

                                                                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                                                                          <span>{course.modules?.length || 0} โมดูล</span>
                                                                                          <span>{course.totalLessons || 0} บทเรียน</span>
                                                                                          <span>{course.activeEnrollments || 0} นักเรียน</span>
                                                                                </div>

                                                                                <div className="flex gap-2">
                                                                                          <Link href={`/admin/courses/${course.id}/edit`} className="flex-1">
                                                                                                    <Button variant="outline" size="sm" className="w-full">
                                                                                                              <Edit className="w-4 h-4 mr-1" />
                                                                                                              แก้ไข
                                                                                                    </Button>
                                                                                          </Link>
                                                                                          <Link href={`/admin/courses/${course.id}/preview`} className="flex-1">
                                                                                                    <Button variant="outline" size="sm" className="w-full">
                                                                                                              <Eye className="w-4 h-4 mr-1" />
                                                                                                              ดูตัวอย่าง
                                                                                                    </Button>
                                                                                          </Link>
                                                                                </div>
                                                                      </CardContent>
                                                            </Card>
                                                  ))}
                                        </div>
                              )}
                    </div>
          );
}
