'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/useAuthStore';
import { Course, COLLECTIONS, CourseDifficulty, CourseModule } from '@/types';
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
import { compressImage } from '@/lib/utils';

interface LessonFormData {
    id: string;
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
    id: string;
    title: string;
    description: string;
    order: number;
    lessons: LessonFormData[];
}

export default function EditCoursePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [course, setCourse] = useState<Course | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');

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

    const [modules, setModules] = useState<ModuleFormData[]>([]);

    useEffect(() => {
        fetchCourse();
    }, [params.id]);

    const fetchCourse = async () => {
        try {
            const docRef = doc(db, COLLECTIONS.COURSES, params.id as string);
            const snapshot = await getDoc(docRef);

            if (!snapshot.exists()) {
                toast({
                    title: 'ไม่พบคอร์ส',
                    variant: 'destructive',
                });
                router.push('/admin/courses');
                return;
            }

            const courseData = { id: snapshot.id, ...snapshot.data() } as Course;
            setCourse(courseData);

            // Populate form data
            setFormData({
                title: courseData.title || '',
                description: courseData.description || '',
                category: courseData.category || '',
                difficulty: courseData.difficulty || CourseDifficulty.BEGINNER,
                language: courseData.language || 'th',
                pricing: courseData.pricing || { threeMonths: 0, sixMonths: 0, twelveMonths: 0 },
            });

            // Populate modules
            if (courseData.modules && courseData.modules.length > 0) {
                setModules(courseData.modules.map((m: CourseModule, i: number) => ({
                    id: m.id || `module_${i}`,
                    title: m.title || '',
                    description: m.description || '',
                    order: m.order || i,
                    lessons: m.lessons?.map((l, j) => ({
                        id: l.id || `lesson_${i}_${j}`,
                        title: l.title || '',
                        description: l.description || '',
                        youtubeUrl: l.videoUrl || '',
                        isFree: l.isPreview || false,
                        pdfName: l.resources?.[0]?.title || '',
                        pdfFile: null,
                        pdfUrl: l.resources?.[0]?.url || '',
                        order: l.order || j,
                    })) || [],
                })));
            } else {
                setModules([{
                    id: 'module_0',
                    title: '',
                    description: '',
                    order: 0,
                    lessons: [{ id: 'lesson_0_0', title: '', description: '', youtubeUrl: '', isFree: false, pdfName: '', pdfFile: null, pdfUrl: '', order: 0 }],
                }]);
            }

            // Set thumbnail preview
            if (courseData.thumbnailUrl) {
                setThumbnailPreview(courseData.thumbnailUrl);
            }
        } catch (error) {
            console.error('Error fetching course:', error);
            toast({
                title: 'ข้อผิดพลาด',
                description: 'ไม่สามารถโหลดข้อมูลคอร์สได้',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                toast({
                    title: 'กำลังปรับขนาดและบีบอัดรูปภาพ...',
                    description: 'กรุณารอสักครู่',
                });

                const compressedFile = await compressImage(file);
                setThumbnailFile(compressedFile);

                const reader = new FileReader();
                reader.onloadend = () => {
                    setThumbnailPreview(reader.result as string);
                };
                reader.readAsDataURL(compressedFile);

                toast({
                    title: 'เสร็จสิ้น',
                    description: 'รูปภาพถูกปรับขนาดให้เหมาะสมแล้ว',
                });
            } catch (error) {
                console.error('Compression error', error);
                toast({
                    title: 'ข้อผิดพลาด',
                    description: 'ไม่สามารถบีบอัดรูปภาพได้ ใช้ไฟล์ต้นฉบับแทน',
                    variant: 'destructive',
                });
                setThumbnailFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setThumbnailPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const addModule = () => {
        setModules([
            ...modules,
            {
                id: `module_${modules.length}`,
                title: '',
                description: '',
                order: modules.length,
                lessons: [{ id: `lesson_${modules.length}_0`, title: '', description: '', youtubeUrl: '', isFree: false, pdfName: '', pdfFile: null, pdfUrl: '', order: 0 }],
            },
        ]);
    };

    const removeModule = (index: number) => {
        setModules(modules.filter((_, i) => i !== index));
    };

    const updateModule = (index: number, field: string, value: string) => {
        const updated = [...modules];
        updated[index] = { ...updated[index], [field]: value };
        setModules(updated);
    };

    const addLesson = (moduleIndex: number) => {
        const updated = [...modules];
        updated[moduleIndex].lessons.push({
            id: `lesson_${moduleIndex}_${updated[moduleIndex].lessons.length}`,
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

    const updateLesson = (moduleIndex: number, lessonIndex: number, field: string, value: any) => {
        const updated = [...modules];
        updated[moduleIndex].lessons[lessonIndex] = {
            ...updated[moduleIndex].lessons[lessonIndex],
            [field]: value,
        };
        setModules(updated);
    };

    const handleSubmit = async (e: React.FormEvent, publishNow: boolean = false) => {
        e.preventDefault();

        if (!user || !course) return;

        if (!formData.title || !formData.description) {
            toast({
                title: 'กรุณากรอกให้ครบ',
                description: 'กรุณากรอกชื่อและรายละเอียดคอร์ส',
                variant: 'destructive',
            });
            return;
        }

        if (
            formData.pricing.threeMonths < 0 ||
            formData.pricing.sixMonths < 0 ||
            formData.pricing.twelveMonths < 0
        ) {
            toast({
                title: 'ราคาไม่ถูกต้อง',
                description: 'ราคาต้องไม่ติดลบ',
                variant: 'destructive',
            });
            return;
        }

        try {
            setSaving(true);

            // Upload new thumbnail if provided
            let thumbnailUrl = course.thumbnailUrl || '';
            if (thumbnailFile) {
                const storageRef = ref(storage, `courses/${user.id}/${Date.now()}_${thumbnailFile.name}`);
                await uploadBytes(storageRef, thumbnailFile);
                thumbnailUrl = await getDownloadURL(storageRef);
            }

            // Process modules and upload PDFs
            const processedModules: CourseModule[] = await Promise.all(
                modules
                    .filter((m) => m.title.trim())
                    .map(async (m, moduleIndex) => {
                        const processedLessons = await Promise.all(
                            m.lessons
                                .filter((l) => l.title.trim())
                                .map(async (l, lessonIndex) => {
                                    let pdfUrl = l.pdfUrl;

                                    // Upload PDF if new file selected
                                    if (l.pdfFile) {
                                        const pdfRef = ref(
                                            storage,
                                            `courses/${user.id}/pdfs/${Date.now()}_${l.pdfFile.name}`
                                        );
                                        await uploadBytes(pdfRef, l.pdfFile);
                                        pdfUrl = await getDownloadURL(pdfRef);
                                    }

                                    return {
                                        id: l.id || `lesson_${moduleIndex}_${lessonIndex}`,
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
                            id: m.id || `module_${moduleIndex}`,
                            title: m.title,
                            description: m.description,
                            order: moduleIndex,
                            durationMinutes: 0,
                            lessons: processedLessons,
                        };
                    })
            );

            // Update course document
            await updateDoc(doc(db, COLLECTIONS.COURSES, course.id), {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                difficulty: formData.difficulty,
                language: formData.language,
                thumbnailUrl,
                pricing: formData.pricing,
                modules: processedModules,
                totalLessons: processedModules.reduce((acc, m) => acc + m.lessons.length, 0),
                isPublished: publishNow ? true : course.isPublished,
                updatedAt: serverTimestamp(),
                lastModifiedBy: user.id,
            });

            toast({
                title: 'สำเร็จ!',
                description: publishNow ? 'บันทึกและเผยแพร่คอร์สเรียบร้อยแล้ว' : 'บันทึกข้อมูลเรียบร้อยแล้ว',
            });

            if (publishNow) {
                router.push('/admin/courses');
            }
        } catch (error: any) {
            console.error('Error updating course:', error);
            toast({
                title: 'ข้อผิดพลาด',
                description: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
                variant: 'destructive',
            });
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
        return null;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/courses">
                        <Button variant="outline" size="icon" className="border-ink-black text-ink-black hover:bg-gray-100">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="font-heading text-4xl uppercase text-ink-black">
                            แก้ไข<span className="text-fighter-red">คอร์ส</span>
                        </h1>
                        <p className="text-gray-500 mt-1">{course.title}</p>
                    </div>
                </div>
                <Link href={`/admin/courses/${course.id}/preview`}>
                    <Button variant="outline" className="border-2 border-ink-black text-ink-black hover:bg-gray-100">
                        <Eye className="w-4 h-4 mr-2" />
                        ดูตัวอย่าง
                    </Button>
                </Link>
            </div>

            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                {/* Basic Info */}
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
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="arcade-input"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">รายละเอียดคอร์ส *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="arcade-input"
                                />
                            </div>
                            <div>
                                <Label htmlFor="difficulty">ระดับความยาก</Label>
                                <Select
                                    value={formData.difficulty}
                                    onValueChange={(value) => setFormData({ ...formData, difficulty: value as CourseDifficulty })}
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

                        {/* Thumbnail */}
                        <div>
                            <Label>ภาพปกคอร์ส <span className="text-sm text-gray-500">(1280 x 720 px)</span></Label>
                            <div className="mt-2">
                                {thumbnailPreview ? (
                                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-ink-black">
                                        <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
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
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-ink-black rounded-lg cursor-pointer hover:border-fighter-red">
                                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                        <p className="text-sm font-bold text-gray-600">คลิกเพื่ออัพโหลดภาพปก</p>
                                        <Input type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pricing */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-golden">💰 ราคาคอร์ส (บาท)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <Label>แพ็คเกจ 3 เดือน *</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.pricing.threeMonths || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        pricing: { ...formData.pricing, threeMonths: parseInt(e.target.value) || 0 },
                                    })}
                                    className="arcade-input"
                                    required
                                />
                            </div>
                            <div>
                                <Label>แพ็คเกจ 6 เดือน *</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.pricing.sixMonths || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        pricing: { ...formData.pricing, sixMonths: parseInt(e.target.value) || 0 },
                                    })}
                                    className="arcade-input"
                                    required
                                />
                            </div>
                            <div>
                                <Label>แพ็คเกจ 12 เดือน *</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.pricing.twelveMonths || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        pricing: { ...formData.pricing, twelveMonths: parseInt(e.target.value) || 0 },
                                    })}
                                    className="arcade-input"
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Modules & Lessons */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-fighter-red">📚 บทเรียน</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addModule} className="border-2 border-ink-black text-ink-black hover:bg-gray-100">
                                <Plus className="w-4 h-4 mr-2" />
                                เพิ่มโมดูล
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {modules.map((module, moduleIndex) => (
                            <div key={module.id} className="p-4 rounded-lg border-2 border-ink-black bg-gray-50">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold uppercase text-fighter-red">โมดูล {moduleIndex + 1}</h3>
                                    {modules.length > 1 && (
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeModule(moduleIndex)} className="text-red-500">
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
                                        <div key={lesson.id} className="p-3 bg-white border-2 border-gray-200 rounded">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-sm font-bold text-gray-500">บทเรียน {lessonIndex + 1}</span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateLesson(moduleIndex, lessonIndex, 'isFree', !lesson.isFree)}
                                                        className={`flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase border-2 rounded ${lesson.isFree ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-600'
                                                            }`}
                                                    >
                                                        {lesson.isFree ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                                        {lesson.isFree ? 'ฟรี' : 'เสียเงิน'}
                                                    </button>
                                                    {module.lessons.length > 1 && (
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeLesson(moduleIndex, lessonIndex)} className="text-red-500 h-6 w-6 p-0">
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
                                                <div className="relative">
                                                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                                                    <Input
                                                        placeholder="URL วิดีโอ YouTube"
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
                                                                    {lesson.pdfFile ? lesson.pdfFile.name : (lesson.pdfUrl ? 'เปลี่ยนไฟล์ PDF' : 'อัพโหลด PDF')}
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
                                                            {(lesson.pdfUrl || lesson.pdfFile) && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        updateLesson(moduleIndex, lessonIndex, 'pdfFile', null);
                                                                        updateLesson(moduleIndex, lessonIndex, 'pdfUrl', '');
                                                                    }}
                                                                    className="text-red-500 h-9 w-9 p-0"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {lesson.pdfUrl && !lesson.pdfFile && (
                                                        <div className="text-xs text-green-600 flex items-center gap-1">
                                                            <Rocket className="w-3 h-3" />
                                                            มีไฟล์เดิมอยู่แล้ว
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => addLesson(moduleIndex)} className="w-full mt-2 border-2 border-ink-black text-ink-black hover:bg-gray-100">
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
                        <Button type="button" variant="outline" className="w-full border-2 border-ink-black text-ink-black hover:bg-gray-100">ยกเลิก</Button>
                    </Link>
                    <Button type="submit" variant="outline" disabled={saving} className="flex-1 border-2 border-ink-black text-ink-black hover:bg-gray-100">
                        <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            บันทึก
                        </span>
                    </Button>
                    {!course.isPublished && (
                        <Button type="button" onClick={(e) => handleSubmit(e, true)} disabled={saving} className="flex-1">
                            <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                                เผยแพร่
                            </span>
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
}
