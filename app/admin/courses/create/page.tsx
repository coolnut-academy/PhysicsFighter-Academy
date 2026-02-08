'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { COLLECTIONS, CourseDifficulty, CourseModule } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
          Select,
          SelectContent,
          SelectItem,
          SelectTrigger,
          SelectValue,
} from '@/components/ui/select';
import {
          ArrowLeft,
          Plus,
          Trash2,
          Upload,
          Loader2,
          Image as ImageIcon,
          Youtube,
          FileText,
          Eye,
          Save,
          Rocket,
          Lock,
          Unlock
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface LessonFormData {
          title: string;
          description: string;
          youtubeUrl: string;
          isFree: boolean;
          pdfName: string;
          pdfFile: File | null;
          pdfUrl: string;
          order: number;
}

interface ModuleFormData {
          title: string;
          description: string;
          order: number;
          lessons: LessonFormData[];
}

export default function CreateCoursePage() {
          const router = useRouter();
          const { user } = useAuthStore();
          const { toast } = useToast();
          const [loading, setLoading] = useState(false);
          const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
          const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
          const [saveAsDraft, setSaveAsDraft] = useState(true);

          const [formData, setFormData] = useState({
                    title: '',
                    description: '',
                    category: '',
                    difficulty: CourseDifficulty.BEGINNER,
                    language: 'th',
                    pricing: {
                              threeMonths: 0,
                              sixMonths: 0,
                              twelveMonths: 0,
                    },
          });

          const [modules, setModules] = useState<ModuleFormData[]>([
                    {
                              title: '',
                              description: '',
                              order: 0,
                              lessons: [
                                        { title: '', description: '', youtubeUrl: '', isFree: false, pdfName: '', pdfFile: null, pdfUrl: '', order: 0 }
                              ]
                    },
          ]);

          const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) {
                              setThumbnailFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                        setThumbnailPreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                    }
          };

          const addModule = () => {
                    setModules([
                              ...modules,
                              {
                                        title: '',
                                        description: '',
                                        order: modules.length,
                                        lessons: [
                                                  { title: '', description: '', youtubeUrl: '', isFree: false, pdfName: '', pdfFile: null, pdfUrl: '', order: 0 }
                                        ]
                              },
                    ]);
          };

          const removeModule = (index: number) => {
                    setModules(modules.filter((_, i) => i !== index));
          };

          const updateModule = (
                    index: number,
                    field: keyof Omit<ModuleFormData, 'lessons'>,
                    value: string
          ) => {
                    const updated = [...modules];
                    updated[index] = { ...updated[index], [field]: value };
                    setModules(updated);
          };

          const addLesson = (moduleIndex: number) => {
                    const updated = [...modules];
                    updated[moduleIndex].lessons.push({
                              title: '',
                              description: '',
                              youtubeUrl: '',
                              isFree: false,
                              pdfName: '',
                              pdfFile: null,
                              pdfUrl: '',
                              order: updated[moduleIndex].lessons.length,
                    });
                    setModules(updated);
          };

          const removeLesson = (moduleIndex: number, lessonIndex: number) => {
                    const updated = [...modules];
                    updated[moduleIndex].lessons = updated[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
                    setModules(updated);
          };

          const updateLesson = (
                    moduleIndex: number,
                    lessonIndex: number,
                    field: keyof LessonFormData,
                    value: any
          ) => {
                    const updated = [...modules];
                    updated[moduleIndex].lessons[lessonIndex] = {
                              ...updated[moduleIndex].lessons[lessonIndex],
                              [field]: value,
                    };
                    setModules(updated);
          };

          const handleSubmit = async (e: React.FormEvent, publishNow: boolean = false) => {
                    e.preventDefault();

                    if (!user) {
                              toast({
                                        title: 'ข้อผิดพลาด',
                                        description: 'กรุณาเข้าสู่ระบบก่อนสร้างคอร์ส',
                                        variant: 'destructive',
                              });
                              return;
                    }

                    if (!formData.title || !formData.description) {
                              toast({
                                        title: 'กรุณากรอกให้ครบ',
                                        description: 'กรุณากรอกชื่อและรายละเอียดคอร์ส',
                                        variant: 'destructive',
                              });
                              return;
                    }

                    if (
                              !formData.pricing.threeMonths ||
                              !formData.pricing.sixMonths ||
                              !formData.pricing.twelveMonths
                    ) {
                              toast({
                                        title: 'กรุณากรอกให้ครบ',
                                        description: 'กรุณากำหนดราคาทุกแพ็คเกจ',
                                        variant: 'destructive',
                              });
                              return;
                    }

                    try {
                              setLoading(true);

                              // Upload thumbnail if provided
                              let thumbnailUrl = '';
                              if (thumbnailFile) {
                                        const storageRef = ref(
                                                  storage,
                                                  `courses/${user.id}/${Date.now()}_${thumbnailFile.name}`
                                        );
                                        await uploadBytes(storageRef, thumbnailFile);
                                        thumbnailUrl = await getDownloadURL(storageRef);
                              }

                              // Upload PDFs for lessons
                              const processedModules: CourseModule[] = await Promise.all(
                                        modules
                                                  .filter((m) => m.title.trim())
                                                  .map(async (m, moduleIndex) => {
                                                            const processedLessons = await Promise.all(
                                                                      m.lessons
                                                                                .filter((l) => l.title.trim())
                                                                                .map(async (l, lessonIndex) => {
                                                                                          let pdfUrl = '';
                                                                                          if (l.pdfFile) {
                                                                                                    const pdfRef = ref(
                                                                                                              storage,
                                                                                                              `courses/${user.id}/pdfs/${Date.now()}_${l.pdfFile.name}`
                                                                                                    );
                                                                                                    await uploadBytes(pdfRef, l.pdfFile);
                                                                                                    pdfUrl = await getDownloadURL(pdfRef);
                                                                                          }

                                                                                          return {
                                                                                                    id: `lesson_${moduleIndex}_${lessonIndex}`,
                                                                                                    title: l.title,
                                                                                                    description: l.description,
                                                                                                    order: lessonIndex,
                                                                                                    videoUrl: l.youtubeUrl,
                                                                                                    videoDurationSeconds: 0,
                                                                                                    resources: pdfUrl ? [{
                                                                                                              id: `resource_${Date.now()}`,
                                                                                                              title: l.pdfName || l.pdfFile?.name || 'เอกสารประกอบ',
                                                                                                              type: 'pdf' as const,
                                                                                                              url: pdfUrl,
                                                                                                    }] : [],
                                                                                                    isPreview: l.isFree,
                                                                                          };
                                                                                })
                                                            );

                                                            return {
                                                                      id: `module_${moduleIndex}`,
                                                                      title: m.title,
                                                                      description: m.description,
                                                                      order: moduleIndex,
                                                                      lessons: processedLessons,
                                                                      durationMinutes: 0,
                                                            };
                                                  })
                              );

                              // Create course document
                              const courseData = {
                                        ownerId: user.id,
                                        title: formData.title,
                                        description: formData.description,
                                        category: formData.category,
                                        difficulty: formData.difficulty,
                                        language: formData.language,
                                        thumbnailUrl,
                                        pricing: formData.pricing,
                                        modules: processedModules,
                                        totalDurationMinutes: 0,
                                        totalLessons: processedModules.reduce((acc, m) => acc + m.lessons.length, 0),
                                        totalEnrollments: 0,
                                        activeEnrollments: 0,
                                        isPublished: publishNow,
                                        featured: false,
                                        tags: [],
                                        createdAt: serverTimestamp(),
                                        updatedAt: serverTimestamp(),
                                        lastModifiedBy: user.id,
                              };

                              const docRef = await addDoc(
                                        collection(db, COLLECTIONS.COURSES),
                                        courseData
                              );

                              toast({
                                        title: 'สำเร็จ!',
                                        description: publishNow ? 'สร้างและเผยแพร่คอร์สเรียบร้อยแล้ว' : 'บันทึกแบบร่างเรียบร้อยแล้ว',
                              });

                              if (publishNow) {
                                        router.push('/admin/courses');
                              } else {
                                        router.push(`/admin/courses/${docRef.id}/edit`);
                              }
                    } catch (error: any) {
                              console.error('Error creating course:', error);
                              toast({
                                        title: 'ข้อผิดพลาด',
                                        description: error.message || 'ไม่สามารถสร้างคอร์สได้',
                                        variant: 'destructive',
                              });
                    } finally {
                              setLoading(false);
                    }
          };

          return (
                    <div className="max-w-5xl mx-auto space-y-6 p-6">
                              {/* Header */}
                              <div className="flex items-center gap-4">
                                        <Link href="/admin/courses">
                                                  <Button variant="outline" size="icon">
                                                            <ArrowLeft className="w-4 h-4" />
                                                  </Button>
                                        </Link>
                                        <div>
                                                  <h1 className="font-heading text-4xl uppercase text-ink-black">
                                                            สร้าง<span className="text-fighter-red">คอร์สใหม่</span>
                                                  </h1>
                                                  <p className="text-gray-500 mt-1">กรอกข้อมูลเพื่อสร้างคอร์สของคุณ</p>
                                        </div>
                              </div>

                              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                                        {/* Basic Information */}
                                        <Card>
                                                  <CardHeader>
                                                            <CardTitle className="flex items-center gap-2">
                                                                      <FileText className="w-5 h-5 text-fighter-red" />
                                                                      ข้อมูลพื้นฐาน
                                                            </CardTitle>
                                                  </CardHeader>
                                                  <CardContent className="space-y-4">
                                                            <div>
                                                                      <Label htmlFor="title">ชื่อคอร์ส *</Label>
                                                                      <Input
                                                                                id="title"
                                                                                value={formData.title}
                                                                                onChange={(e) =>
                                                                                          setFormData({ ...formData, title: e.target.value })
                                                                                }
                                                                                placeholder="เช่น ฟิสิกส์ ม.ปลาย ตะลุยโจทย์"
                                                                                className="arcade-input"
                                                                                required
                                                                      />
                                                            </div>

                                                            <div>
                                                                      <Label htmlFor="description">รายละเอียดคอร์ส *</Label>
                                                                      <Textarea
                                                                                id="description"
                                                                                value={formData.description}
                                                                                onChange={(e) =>
                                                                                          setFormData({ ...formData, description: e.target.value })
                                                                                }
                                                                                placeholder="อธิบายว่านักเรียนจะได้เรียนรู้อะไรบ้าง..."
                                                                                rows={4}
                                                                                className="arcade-input"
                                                                                required
                                                                      />
                                                            </div>

                                                            <div className="grid md:grid-cols-2 gap-4">
                                                                      <div>
                                                                                <Label htmlFor="category">หมวดหมู่</Label>
                                                                                <Input
                                                                                          id="category"
                                                                                          value={formData.category}
                                                                                          onChange={(e) =>
                                                                                                    setFormData({ ...formData, category: e.target.value })
                                                                                          }
                                                                                          placeholder="เช่น ฟิสิกส์"
                                                                                          className="arcade-input"
                                                                                />
                                                                      </div>
                                                                      <div>
                                                                                <Label htmlFor="difficulty">ระดับความยาก</Label>
                                                                                <Select
                                                                                          value={formData.difficulty}
                                                                                          onValueChange={(value) =>
                                                                                                    setFormData({
                                                                                                              ...formData,
                                                                                                              difficulty: value as CourseDifficulty,
                                                                                                    })
                                                                                          }
                                                                                >
                                                                                          <SelectTrigger className="arcade-input">
                                                                                                    <SelectValue />
                                                                                          </SelectTrigger>
                                                                                          <SelectContent>
                                                                                                    <SelectItem value={CourseDifficulty.BEGINNER}>เริ่มต้น</SelectItem>
                                                                                                    <SelectItem value={CourseDifficulty.INTERMEDIATE}>ปานกลาง</SelectItem>
                                                                                                    <SelectItem value={CourseDifficulty.ADVANCED}>ขั้นสูง</SelectItem>
                                                                                          </SelectContent>
                                                                                </Select>
                                                                      </div>
                                                            </div>

                                                            {/* Thumbnail Upload with Size Info */}
                                                            <div>
                                                                      <Label htmlFor="thumbnail">
                                                                                ภาพปกคอร์ส
                                                                                <span className="text-sm text-gray-500 ml-2">
                                                                                          (แนะนำ: 1280 x 720 พิกเซล, อัตราส่วน 16:9)
                                                                                </span>
                                                                      </Label>
                                                                      <div className="mt-2">
                                                                                {thumbnailPreview ? (
                                                                                          <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-ink-black">
                                                                                                    <img
                                                                                                              src={thumbnailPreview}
                                                                                                              alt="Thumbnail preview"
                                                                                                              className="w-full h-full object-cover"
                                                                                                    />
                                                                                                    <Button
                                                                                                              type="button"
                                                                                                              variant="destructive"
                                                                                                              size="sm"
                                                                                                              className="absolute top-2 right-2"
                                                                                                              onClick={() => {
                                                                                                                        setThumbnailFile(null);
                                                                                                                        setThumbnailPreview('');
                                                                                                              }}
                                                                                                    >
                                                                                                              <Trash2 className="w-4 h-4" />
                                                                                                    </Button>
                                                                                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 text-xs rounded">
                                                                                                              1280 x 720 px
                                                                                                    </div>
                                                                                          </div>
                                                                                ) : (
                                                                                          <label
                                                                                                    htmlFor="thumbnail"
                                                                                                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-ink-black rounded-lg cursor-pointer hover:border-fighter-red transition-all bg-gray-50"
                                                                                          >
                                                                                                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                                                                                    <p className="text-sm font-bold text-gray-600">คลิกเพื่ออัพโหลดภาพปก</p>
                                                                                                    <p className="text-xs text-gray-400 mt-1">ขนาดแนะนำ: 1280 x 720 px (16:9)</p>
                                                                                                    <Input
                                                                                                              id="thumbnail"
                                                                                                              type="file"
                                                                                                              accept="image/*"
                                                                                                              className="hidden"
                                                                                                              onChange={handleThumbnailChange}
                                                                                                    />
                                                                                          </label>
                                                                                )}
                                                                      </div>
                                                            </div>
                                                  </CardContent>
                                        </Card>

                                        {/* Pricing */}
                                        <Card>
                                                  <CardHeader>
                                                            <CardTitle className="flex items-center gap-2 text-golden">
                                                                      💰 ราคาคอร์ส (บาท)
                                                            </CardTitle>
                                                  </CardHeader>
                                                  <CardContent>
                                                            <div className="grid md:grid-cols-3 gap-4">
                                                                      <div>
                                                                                <Label htmlFor="price3m">แพ็คเกจ 3 เดือน *</Label>
                                                                                <Input
                                                                                          id="price3m"
                                                                                          type="number"
                                                                                          min="0"
                                                                                          value={formData.pricing.threeMonths || ''}
                                                                                          onChange={(e) =>
                                                                                                    setFormData({
                                                                                                              ...formData,
                                                                                                              pricing: {
                                                                                                                        ...formData.pricing,
                                                                                                                        threeMonths: parseInt(e.target.value) || 0,
                                                                                                              },
                                                                                                    })
                                                                                          }
                                                                                          placeholder="฿ 0"
                                                                                          className="arcade-input"
                                                                                          required
                                                                                />
                                                                      </div>
                                                                      <div>
                                                                                <Label htmlFor="price6m">แพ็คเกจ 6 เดือน *</Label>
                                                                                <Input
                                                                                          id="price6m"
                                                                                          type="number"
                                                                                          min="0"
                                                                                          value={formData.pricing.sixMonths || ''}
                                                                                          onChange={(e) =>
                                                                                                    setFormData({
                                                                                                              ...formData,
                                                                                                              pricing: {
                                                                                                                        ...formData.pricing,
                                                                                                                        sixMonths: parseInt(e.target.value) || 0,
                                                                                                              },
                                                                                                    })
                                                                                          }
                                                                                          placeholder="฿ 0"
                                                                                          className="arcade-input"
                                                                                          required
                                                                                />
                                                                      </div>
                                                                      <div>
                                                                                <Label htmlFor="price12m">แพ็คเกจ 12 เดือน *</Label>
                                                                                <Input
                                                                                          id="price12m"
                                                                                          type="number"
                                                                                          min="0"
                                                                                          value={formData.pricing.twelveMonths || ''}
                                                                                          onChange={(e) =>
                                                                                                    setFormData({
                                                                                                              ...formData,
                                                                                                              pricing: {
                                                                                                                        ...formData.pricing,
                                                                                                                        twelveMonths: parseInt(e.target.value) || 0,
                                                                                                              },
                                                                                                    })
                                                                                          }
                                                                                          placeholder="฿ 0"
                                                                                          className="arcade-input"
                                                                                          required
                                                                                />
                                                                      </div>
                                                            </div>
                                                  </CardContent>
                                        </Card>

                                        {/* Course Modules & Lessons */}
                                        <Card>
                                                  <CardHeader>
                                                            <div className="flex justify-between items-center">
                                                                      <CardTitle className="flex items-center gap-2 text-fighter-red">
                                                                                📚 บทเรียน
                                                                      </CardTitle>
                                                                      <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={addModule}
                                                                                
                                                                      >
                                                                                <Plus className="w-4 h-4 mr-2" />
                                                                                เพิ่มโมดูล
                                                                      </Button>
                                                            </div>
                                                  </CardHeader>
                                                  <CardContent className="space-y-6">
                                                            {modules.map((module, moduleIndex) => (
                                                                      <div
                                                                                key={moduleIndex}
                                                                                className="p-4 rounded-lg border-2 border-ink-black bg-gray-50"
                                                                      >
                                                                                <div className="flex justify-between items-start mb-4">
                                                                                          <h3 className="text-lg font-bold uppercase text-fighter-red">
                                                                                                    โมดูล {moduleIndex + 1}
                                                                                          </h3>
                                                                                          {modules.length > 1 && (
                                                                                                    <Button
                                                                                                              type="button"
                                                                                                              variant="ghost"
                                                                                                              size="sm"
                                                                                                              onClick={() => removeModule(moduleIndex)}
                                                                                                              className="text-red-500 hover:text-red-700"
                                                                                                    >
                                                                                                              <Trash2 className="w-4 h-4" />
                                                                                                    </Button>
                                                                                          )}
                                                                                </div>

                                                                                <div className="space-y-3 mb-4">
                                                                                          <Input
                                                                                                    placeholder="ชื่อโมดูล"
                                                                                                    value={module.title}
                                                                                                    onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                                                                                                    className="arcade-input"
                                                                                          />
                                                                                          <Textarea
                                                                                                    placeholder="รายละเอียดโมดูล"
                                                                                                    value={module.description}
                                                                                                    onChange={(e) => updateModule(moduleIndex, 'description', e.target.value)}
                                                                                                    rows={2}
                                                                                                    className="arcade-input"
                                                                                          />
                                                                                </div>

                                                                                {/* Lessons */}
                                                                                <div className="space-y-3 ml-4 border-l-2 border-golden pl-4">
                                                                                          <h4 className="font-bold text-sm uppercase text-golden">บทเรียนในโมดูล</h4>
                                                                                          {module.lessons.map((lesson, lessonIndex) => (
                                                                                                    <div key={lessonIndex} className="p-3 bg-white border-2 border-gray-200 rounded">
                                                                                                              <div className="flex justify-between items-start mb-3">
                                                                                                                        <span className="text-sm font-bold text-gray-500">
                                                                                                                                  บทเรียน {lessonIndex + 1}
                                                                                                                        </span>
                                                                                                                        <div className="flex items-center gap-2">
                                                                                                                                  {/* Free/Paid Toggle */}
                                                                                                                                  <button
                                                                                                                                            type="button"
                                                                                                                                            onClick={() => updateLesson(moduleIndex, lessonIndex, 'isFree', !lesson.isFree)}
                                                                                                                                            className={`flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase border-2 rounded ${lesson.isFree
                                                                                                                                                      ? 'bg-green-100 border-green-500 text-green-700'
                                                                                                                                                      : 'bg-gray-100 border-gray-300 text-gray-600'
                                                                                                                                                      }`}
                                                                                                                                  >
                                                                                                                                            {lesson.isFree ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                                                                                                                            {lesson.isFree ? 'ฟรี' : 'เสียเงิน'}
                                                                                                                                  </button>
                                                                                                                                  {module.lessons.length > 1 && (
                                                                                                                                            <Button
                                                                                                                                                      type="button"
                                                                                                                                                      variant="ghost"
                                                                                                                                                      size="sm"
                                                                                                                                                      onClick={() => removeLesson(moduleIndex, lessonIndex)}
                                                                                                                                                      className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                                                                                                                                            >
                                                                                                                                                      <Trash2 className="w-3 h-3" />
                                                                                                                                            </Button>
                                                                                                                                  )}
                                                                                                                        </div>
                                                                                                              </div>

                                                                                                              <div className="space-y-2">
                                                                                                                        <Input
                                                                                                                                  placeholder="ชื่อบทเรียน"
                                                                                                                                  value={lesson.title}
                                                                                                                                  onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                                                                                                                                  className="arcade-input text-sm"
                                                                                                                        />

                                                                                                                        {/* YouTube URL */}
                                                                                                                        <div className="relative">
                                                                                                                                  <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                                                                                                                                  <Input
                                                                                                                                            placeholder="URL วิดีโอ YouTube (Unlisted ได้)"
                                                                                                                                            value={lesson.youtubeUrl}
                                                                                                                                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'youtubeUrl', e.target.value)}
                                                                                                                                            className="arcade-input text-sm pl-10"
                                                                                                                                  />
                                                                                                                        </div>

                                                                                                                        {/* PDF Upload */}
                                                                                                                        <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                                                                                                                  <div className="flex items-center gap-2">
                                                                                                                                            <FileText className="w-4 h-4 text-gray-500" />
                                                                                                                                            <span className="text-sm font-bold text-gray-600">เอกสารประกอบ</span>
                                                                                                                                  </div>
                                                                                                                                  <div className="grid grid-cols-2 gap-2">
                                                                                                                                            <Input
                                                                                                                                                      placeholder="ชื่อไฟล์ PDF (แสดงในเว็บ)"
                                                                                                                                                      value={lesson.pdfName}
                                                                                                                                                      onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'pdfName', e.target.value)}
                                                                                                                                                      className="arcade-input text-sm"
                                                                                                                                            />
                                                                                                                                            <div className="flex items-center gap-2">
                                                                                                                                                      <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded cursor-pointer hover:border-fighter-red text-sm flex-1 truncate">
                                                                                                                                                                <span className="text-gray-500 truncate">
                                                                                                                                                                          {lesson.pdfFile ? lesson.pdfFile.name : 'อัพโหลด PDF'}
                                                                                                                                                                </span>
                                                                                                                                                                <input
                                                                                                                                                                          type="file"
                                                                                                                                                                          accept=".pdf"
                                                                                                                                                                          className="hidden"
                                                                                                                                                                          onChange={(e) => {
                                                                                                                                                                                    const file = e.target.files?.[0];
                                                                                                                                                                                    if (file) {
                                                                                                                                                                                              updateLesson(moduleIndex, lessonIndex, 'pdfFile', file);
                                                                                                                                                                                              // Auto set name if empty
                                                                                                                                                                                              if (!lesson.pdfName) {
                                                                                                                                                                                                        updateLesson(moduleIndex, lessonIndex, 'pdfName', file.name.replace('.pdf', ''));
                                                                                                                                                                                              }
                                                                                                                                                                                    }
                                                                                                                                                                          }}
                                                                                                                                                                />
                                                                                                                                                      </label>
                                                                                                                                                      {lesson.pdfFile && (
                                                                                                                                                                <Button
                                                                                                                                                                          type="button"
                                                                                                                                                                          variant="ghost"
                                                                                                                                                                          size="sm"
                                                                                                                                                                          onClick={() => updateLesson(moduleIndex, lessonIndex, 'pdfFile', null)}
                                                                                                                                                                          className="text-red-500 h-9 w-9 p-0"
                                                                                                                                                                >
                                                                                                                                                                          <Trash2 className="w-4 h-4" />
                                                                                                                                                                </Button>
                                                                                                                                                      )}
                                                                                                                                            </div>
                                                                                                                                  </div>
                                                                                                                        </div>
                                                                                                              </div>
                                                                                                    </div>
                                                                                          ))}

                                                                                          <Button
                                                                                                    type="button"
                                                                                                    variant="outline"
                                                                                                    size="sm"
                                                                                                    onClick={() => addLesson(moduleIndex)}
                                                                                                    className="w-full mt-2 border-2 border-ink-black text-ink-black hover:bg-gray-100"
                                                                                          >
                                                                                                    <Plus className="w-4 h-4 mr-2" />
                                                                                                    เพิ่มบทเรียน
                                                                                          </Button>
                                                                                </div>
                                                                      </div>
                                                            ))}
                                                  </CardContent>
                                        </Card>

                                        {/* Submit Buttons */}
                                        <div className="flex gap-4">
                                                  <Link href="/admin/courses" className="flex-1">
                                                            <Button type="button" variant="outline" className="w-full">
                                                                      ยกเลิก
                                                            </Button>
                                                  </Link>
                                                  <Button
                                                            type="submit"
                                                            variant="outline"
                                                            disabled={loading}
                                                            className="flex-1 border-2 border-ink-black text-ink-black hover:bg-gray-100"
                                                  >
                                                            <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                                                                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                                      บันทึกแบบร่าง
                                                            </span>
                                                  </Button>
                                                  <Button
                                                            type="button"
                                                            onClick={(e) => handleSubmit(e, true)}
                                                            disabled={loading}
                                                            className="flex-1"
                                                  >
                                                            <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                                                                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                                                                      เผยแพร่เลย
                                                            </span>
                                                  </Button>
                                        </div>
                              </form>
                    </div>
          );
}
