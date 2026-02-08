'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Course, COLLECTIONS } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Eye, Trash2, Search, ArrowLeft, Plus, Edit3, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function SuperAdminCoursesPage() {
          const { toast } = useToast();
          const [loading, setLoading] = useState(true);
          const [courses, setCourses] = useState<Course[]>([]);
          const [searchQuery, setSearchQuery] = useState('');

          useEffect(() => {
                    fetchCourses();
          }, []);

          const fetchCourses = async () => {
                    try {
                              setLoading(true);
                              const q = query(
                                        collection(db, COLLECTIONS.COURSES)
                              );
                              const snapshot = await getDocs(q);
                              const coursesData = snapshot.docs.map((doc) => ({
                                        id: doc.id,
                                        ...doc.data(),
                              })) as Course[];

                              // Sort by created at desc
                              coursesData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

                              setCourses(coursesData);
                    } catch (error) {
                              console.error('Error fetching courses:', error);
                              toast({
                                        title: 'เกิดข้อผิดพลาด',
                                        description: 'ไม่สามารถโหลดข้อมูลคอร์สได้',
                                        variant: 'destructive',
                              });
                    } finally {
                              setLoading(false);
                    }
          };

          // ลบคอร์สทันที
          const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
                    if (!confirm(`คุณต้องการลบคอร์ส "${courseTitle}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้!`)) {
                              return;
                    }

                    try {
                              await deleteDoc(doc(db, COLLECTIONS.COURSES, courseId));
                              toast({
                                        title: 'สำเร็จ',
                                        description: `ลบคอร์ส "${courseTitle}" เรียบร้อยแล้ว`,
                              });
                              fetchCourses();
                    } catch (error: any) {
                              toast({
                                        title: 'เกิดข้อผิดพลาด',
                                        description: error.message || 'ไม่สามารถลบคอร์สได้',
                                        variant: 'destructive',
                              });
                    }
          };

          // เปลี่ยนสถานะ Publish/Draft ทันที
          const handleTogglePublish = async (course: Course) => {
                    const newStatus = !course.isPublished;
                    const actionText = newStatus ? 'เผยแพร่' : 'ยกเลิกการเผยแพร่';

                    try {
                              await updateDoc(doc(db, COLLECTIONS.COURSES, course.id), {
                                        isPublished: newStatus,
                                        updatedAt: serverTimestamp(),
                              });
                              toast({
                                        title: 'สำเร็จ',
                                        description: `${actionText}คอร์ส "${course.title}" เรียบร้อยแล้ว`,
                              });
                              fetchCourses();
                    } catch (error: any) {
                              toast({
                                        title: 'เกิดข้อผิดพลาด',
                                        description: error.message || 'ไม่สามารถอัพเดทสถานะได้',
                                        variant: 'destructive',
                              });
                    }
          };

          const filteredCourses = courses.filter(course =>
                    course.title.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (loading) {
                    return (
                              <div className="flex items-center justify-center h-96">
                                        <div className="arcade-spinner" />
                              </div>
                    );
          }

          return (
                    <div className="p-6 min-h-screen bg-ink-black">
                              <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                                  <Link href="/super-admin/dashboard">
                                                            <Button variant="outline" size="sm" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black">
                                                                      <ArrowLeft className="w-4 h-4" />
                                                            </Button>
                                                  </Link>
                                                  <h1 className="font-heading text-4xl uppercase text-white">
                                                            คอร์ส<span className="text-golden">ทั้งหมด</span>
                                                  </h1>
                                        </div>
                                        <div className="flex items-center gap-4">
                                                  <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                      fetchCourses();
                                                                      toast({
                                                                                title: 'รีเฟรชข้อมูล',
                                                                                description: 'โหลดข้อมูลคอร์สจาก Firestore เรียบร้อยแล้ว',
                                                                      });
                                                            }}
                                                            disabled={loading}
                                                            className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black"
                                                  >
                                                            <span className="flex items-center gap-2">
                                                                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                                                      Sync ข้อมูล
                                                            </span>
                                                  </Button>
                                                  <Link href="/admin/courses/create">
                                                            <Button className="bg-fighter-red hover:bg-red-600 border-2 border-white text-white">
                                                                      <Plus className="w-4 h-4 mr-2" />
                                                                      สร้างคอร์สใหม่
                                                            </Button>
                                                  </Link>
                                                  <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                            <input
                                                                      type="text"
                                                                      value={searchQuery}
                                                                      onChange={(e) => setSearchQuery(e.target.value)}
                                                                      className="arcade-input pl-10 w-64 bg-gray-800 border-golden text-white"
                                                                      placeholder="ค้นหาคอร์ส..."
                                                            />
                                                  </div>
                                        </div>
                              </div>

                              <Card className="bg-ink-black border-golden">
                                        <CardContent className="p-0">
                                                  <div className="overflow-x-auto">
                                                            <table className="w-full">
                                                                      <thead>
                                                                                <tr className="border-b-2 border-golden bg-gray-900">
                                                                                          <th className="text-left p-4 font-bold uppercase text-sm text-golden">คอร์ส</th>
                                                                                          <th className="text-left p-4 font-bold uppercase text-sm text-golden">สถานะ</th>
                                                                                          <th className="text-left p-4 font-bold uppercase text-sm text-golden">ราคา</th>
                                                                                          <th className="text-left p-4 font-bold uppercase text-sm text-golden">จัดการ</th>
                                                                                </tr>
                                                                      </thead>
                                                                      <tbody>
                                                                                {filteredCourses.map((course) => (
                                                                                          <tr key={course.id} className="border-b border-gray-700 hover:bg-gray-800">
                                                                                                    <td className="p-4">
                                                                                                              <div className="flex items-center gap-3">
                                                                                                                        <div className="w-10 h-10 bg-fighter-red flex items-center justify-center border-2 border-ink-black shrink-0">
                                                                                                                                  {course.thumbnailUrl ? (
                                                                                                                                            <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                                                                                                                  ) : (
                                                                                                                                            <BookOpen className="w-5 h-5 text-white" />
                                                                                                                                  )}
                                                                                                                        </div>
                                                                                                                        <div>
                                                                                                                                  <div className="font-bold text-white">{course.title}</div>
                                                                                                                                  <div className="text-xs text-gray-400">{course.totalLessons || 0} LEssons</div>
                                                                                                                        </div>
                                                                                                              </div>
                                                                                                    </td>
                                                                                                    <td className="p-4">
                                                                                                              <span className={`px-3 py-1 text-xs font-bold uppercase border-2 border-ink-black ${course.isPublished ? 'bg-green-100 text-green-700' : 'bg-golden text-ink-black'
                                                                                                                        }`}>
                                                                                                                        {course.isPublished ? 'เผยแพร่' : 'แบบร่าง'}
                                                                                                              </span>
                                                                                                    </td>
                                                                                                    <td className="p-4 text-golden font-mono">
                                                                                                              ฿{course.pricing?.threeMonths?.toLocaleString() || 0}
                                                                                                    </td>
                                                                                                    <td className="p-4">
                                                                                                              <div className="flex items-center gap-2">
                                                                                                                        {/* ดู/แก้ไขคอร์ส */}
                                                                                                                        <Link href={`/admin/courses/${course.id}/edit`}>
                                                                                                                                  <Button variant="outline" size="sm" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black" title="แก้ไขคอร์ส">
                                                                                                                                            <Edit3 className="w-4 h-4" />
                                                                                                                                  </Button>
                                                                                                                        </Link>
                                                                                                                        
                                                                                                                        {/* เปลี่ยนสถานะ Publish/Draft */}
                                                                                                                        <Button
                                                                                                                                  variant="outline"
                                                                                                                                  size="sm"
                                                                                                                                  onClick={() => handleTogglePublish(course)}
                                                                                                                                  className={`border-2 ${course.isPublished 
                                                                                                                                            ? 'bg-green-600 border-green-400 text-white hover:bg-green-700' 
                                                                                                                                            : 'bg-golden border-golden text-ink-black hover:bg-yellow-500'
                                                                                                                                  }`}
                                                                                                                                  title={course.isPublished ? 'ยกเลิกการเผยแพร่' : 'เผยแพร่คอร์ส'}
                                                                                                                        >
                                                                                                                                  {course.isPublished ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                                                                                        </Button>
                                                                                                                        
                                                                                                                        {/* ลบคอร์ส */}
                                                                                                                        <Button
                                                                                                                                  variant="destructive"
                                                                                                                                  size="sm"
                                                                                                                                  onClick={() => handleDeleteCourse(course.id, course.title)}
                                                                                                                                  className="bg-red-600 hover:bg-red-700 border-2 border-red-400"
                                                                                                                                  title="ลบคอร์ส"
                                                                                                                        >
                                                                                                                                  <Trash2 className="w-4 h-4" />
                                                                                                                        </Button>
                                                                                                              </div>
                                                                                                    </td>
                                                                                          </tr>
                                                                                ))}
                                                                                {filteredCourses.length === 0 && (
                                                                                          <tr>
                                                                                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                                                                                              ไม่พบข้อมูลคอร์ส
                                                                                                    </td>
                                                                                          </tr>
                                                                                )}
                                                                      </tbody>
                                                            </table>
                                                  </div>
                                        </CardContent>
                              </Card>
                    </div>
          );
}
