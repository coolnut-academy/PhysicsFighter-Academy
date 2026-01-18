'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Course, COLLECTIONS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, BookOpen, DollarSign, Image } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface CourseForm {
          title: string;
          description: string;
          category: string;
          difficulty: string;
          pricing: {
                    threeMonths: number;
                    sixMonths: number;
                    twelveMonths: number;
          };
          isPublished: boolean;
}

export default function EditCoursePage() {
          const params = useParams();
          const router = useRouter();
          const { toast } = useToast();
          const [loading, setLoading] = useState(true);
          const [saving, setSaving] = useState(false);
          const [course, setCourse] = useState<CourseForm | null>(null);

          useEffect(() => {
                    if (params.id) {
                              fetchCourse();
                    }
          }, [params.id]);

          const fetchCourse = async () => {
                    try {
                              setLoading(true);
                              const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, params.id as string));

                              if (courseDoc.exists()) {
                                        const courseData = courseDoc.data() as Course;
                                        setCourse({
                                                  title: courseData.title || '',
                                                  description: courseData.description || '',
                                                  category: courseData.category || '',
                                                  difficulty: courseData.difficulty || 'beginner',
                                                  pricing: {
                                                            threeMonths: courseData.pricing?.threeMonths || 0,
                                                            sixMonths: courseData.pricing?.sixMonths || 0,
                                                            twelveMonths: courseData.pricing?.twelveMonths || 0,
                                                  },
                                                  isPublished: courseData.isPublished || false,
                                        });
                              } else {
                                        toast({ title: 'ไม่พบคอร์ส', variant: 'destructive' });
                                        router.push('/admin/courses');
                              }
                    } catch (error) {
                              console.error('Error fetching course:', error);
                              toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถโหลดข้อมูลคอร์สได้', variant: 'destructive' });
                    } finally {
                              setLoading(false);
                    }
          };

          const handleSubmit = async (e: React.FormEvent) => {
                    e.preventDefault();
                    if (!course) return;

                    setSaving(true);
                    try {
                              await updateDoc(doc(db, COLLECTIONS.COURSES, params.id as string), {
                                        title: course.title,
                                        description: course.description,
                                        category: course.category,
                                        difficulty: course.difficulty,
                                        pricing: course.pricing,
                                        isPublished: course.isPublished,
                                        updatedAt: Timestamp.now(),
                              });
                              toast({ title: 'บันทึกสำเร็จ', description: 'อัพเดทคอร์สเรียบร้อยแล้ว' });
                              router.push('/admin/courses');
                    } catch (error) {
                              console.error('Error updating course:', error);
                              toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกได้', variant: 'destructive' });
                    } finally {
                              setSaving(false);
                    }
          };

          if (loading) {
                    return (
                              <div className="flex items-center justify-center h-96">
                                        <div className="arcade-spinner" />
                              </div>
                    );
          }

          if (!course) {
                    return (
                              <div className="flex items-center justify-center h-96">
                                        <p className="text-gray-500">ไม่พบข้อมูลคอร์ส</p>
                              </div>
                    );
          }

          return (
                    <div className="p-6">
                              <div className="flex items-center gap-4 mb-8">
                                        <Link href="/admin/courses">
                                                  <Button variant="outline" size="sm" className="border-ink-black text-ink-black hover:bg-gray-100">
                                                            <ArrowLeft className="w-4 h-4" />
                                                  </Button>
                                        </Link>
                                        <h1 className="font-heading text-4xl uppercase text-ink-black">
                                                  Edit <span className="text-fighter-red">Course</span>
                                        </h1>
                              </div>

                              <form onSubmit={handleSubmit}>
                                        <div className="grid lg:grid-cols-3 gap-6">
                                                  {/* Main Info */}
                                                  <div className="lg:col-span-2 space-y-6">
                                                            <Card>
                                                                      <CardHeader>
                                                                                <CardTitle className="flex items-center gap-2">
                                                                                          <BookOpen className="w-5 h-5 text-fighter-red" />
                                                                                          Course Information
                                                                                </CardTitle>
                                                                      </CardHeader>
                                                                      <CardContent className="space-y-4">
                                                                                <div>
                                                                                          <label className="block text-sm font-bold uppercase mb-2">Course Title</label>
                                                                                          <input
                                                                                                    type="text"
                                                                                                    value={course.title}
                                                                                                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                                                                                                    className="arcade-input"
                                                                                          />
                                                                                </div>

                                                                                <div>
                                                                                          <label className="block text-sm font-bold uppercase mb-2">Description</label>
                                                                                          <textarea
                                                                                                    value={course.description}
                                                                                                    onChange={(e) => setCourse({ ...course, description: e.target.value })}
                                                                                                    className="arcade-input min-h-[150px]"
                                                                                          />
                                                                                </div>

                                                                                <div className="grid grid-cols-2 gap-4">
                                                                                          <div>
                                                                                                    <label className="block text-sm font-bold uppercase mb-2">Category</label>
                                                                                                    <input
                                                                                                              type="text"
                                                                                                              value={course.category}
                                                                                                              onChange={(e) => setCourse({ ...course, category: e.target.value })}
                                                                                                              className="arcade-input"
                                                                                                    />
                                                                                          </div>
                                                                                          <div>
                                                                                                    <label className="block text-sm font-bold uppercase mb-2">Difficulty</label>
                                                                                                    <select
                                                                                                              value={course.difficulty}
                                                                                                              onChange={(e) => setCourse({ ...course, difficulty: e.target.value })}
                                                                                                              className="arcade-input"
                                                                                                    >
                                                                                                              <option value="beginner">Beginner</option>
                                                                                                              <option value="intermediate">Intermediate</option>
                                                                                                              <option value="advanced">Advanced</option>
                                                                                                    </select>
                                                                                          </div>
                                                                                </div>
                                                                      </CardContent>
                                                            </Card>

                                                            <Card>
                                                                      <CardHeader>
                                                                                <CardTitle className="flex items-center gap-2">
                                                                                          <Image className="w-5 h-5 text-golden" />
                                                                                          Course Thumbnail
                                                                                </CardTitle>
                                                                      </CardHeader>
                                                                      <CardContent>
                                                                                <div className="border-2 border-dashed border-ink-black p-8 text-center">
                                                                                          <p className="text-gray-600 mb-4">Drag & drop an image or click to upload</p>
                                                                                          <Button variant="outline" type="button" className="border-2 border-ink-black text-ink-black hover:bg-gray-100">
                                                                                                    <span style={{ transform: 'skewX(6deg)' }}>Choose File</span>
                                                                                          </Button>
                                                                                </div>
                                                                      </CardContent>
                                                            </Card>
                                                  </div>

                                                  {/* Sidebar */}
                                                  <div className="space-y-6">
                                                            <Card>
                                                                      <CardHeader>
                                                                                <CardTitle className="flex items-center gap-2">
                                                                                          <DollarSign className="w-5 h-5 text-golden" />
                                                                                          Pricing
                                                                                </CardTitle>
                                                                      </CardHeader>
                                                                      <CardContent className="space-y-4">
                                                                                <div>
                                                                                          <label className="block text-sm font-bold uppercase mb-2">3 Months (THB)</label>
                                                                                          <input
                                                                                                    type="number"
                                                                                                    value={course.pricing.threeMonths}
                                                                                                    onChange={(e) => setCourse({
                                                                                                              ...course,
                                                                                                              pricing: { ...course.pricing, threeMonths: parseInt(e.target.value) || 0 }
                                                                                                    })}
                                                                                                    className="arcade-input"
                                                                                          />
                                                                                </div>
                                                                                <div>
                                                                                          <label className="block text-sm font-bold uppercase mb-2">6 Months (THB)</label>
                                                                                          <input
                                                                                                    type="number"
                                                                                                    value={course.pricing.sixMonths}
                                                                                                    onChange={(e) => setCourse({
                                                                                                              ...course,
                                                                                                              pricing: { ...course.pricing, sixMonths: parseInt(e.target.value) || 0 }
                                                                                                    })}
                                                                                                    className="arcade-input"
                                                                                          />
                                                                                </div>
                                                                                <div>
                                                                                          <label className="block text-sm font-bold uppercase mb-2">12 Months (THB)</label>
                                                                                          <input
                                                                                                    type="number"
                                                                                                    value={course.pricing.twelveMonths}
                                                                                                    onChange={(e) => setCourse({
                                                                                                              ...course,
                                                                                                              pricing: { ...course.pricing, twelveMonths: parseInt(e.target.value) || 0 }
                                                                                                    })}
                                                                                                    className="arcade-input"
                                                                                          />
                                                                                </div>
                                                                      </CardContent>
                                                            </Card>

                                                            <Card>
                                                                      <CardContent className="p-4">
                                                                                <div className="flex items-center gap-3 mb-4">
                                                                                          <input
                                                                                                    type="checkbox"
                                                                                                    checked={course.isPublished}
                                                                                                    onChange={(e) => setCourse({ ...course, isPublished: e.target.checked })}
                                                                                                    className="w-5 h-5 accent-green-500"
                                                                                          />
                                                                                          <span className="font-bold uppercase">Published</span>
                                                                                </div>

                                                                                <Button type="submit" className="w-full" disabled={saving}>
                                                                                          <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                                                                                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                                                                                    {saving ? 'Saving...' : 'Save Changes'}
                                                                                          </span>
                                                                                </Button>
                                                                      </CardContent>
                                                            </Card>
                                                  </div>
                                        </div>
                              </form>
                    </div>
          );
}
