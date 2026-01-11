'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { COLLECTIONS, CourseDifficulty, CourseModule } from '@/types';
import { Card } from '@/components/ui/card';
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
import { ArrowLeft, Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface ModuleFormData {
          title: string;
          description: string;
          order: number;
}

export default function CreateCoursePage() {
          const router = useRouter();
          const { user } = useAuthStore();
          const { toast } = useToast();
          const [loading, setLoading] = useState(false);
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

          const [modules, setModules] = useState<ModuleFormData[]>([
                    { title: '', description: '', order: 0 },
          ]);

          const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                              { title: '', description: '', order: modules.length },
                    ]);
          };

          const removeModule = (index: number) => {
                    setModules(modules.filter((_, i) => i !== index));
          };

          const updateModule = (
                    index: number,
                    field: keyof ModuleFormData,
                    value: string
          ) => {
                    const updated = [...modules];
                    updated[index] = { ...updated[index], [field]: value };
                    setModules(updated);
          };

          const handleSubmit = async (e: React.FormEvent) => {
                    e.preventDefault();

                    if (!user) {
                              toast({
                                        title: 'Error',
                                        description: 'You must be logged in to create a course',
                                        variant: 'destructive',
                              });
                              return;
                    }

                    // Validation
                    if (!formData.title || !formData.description) {
                              toast({
                                        title: 'Validation Error',
                                        description: 'Please fill in all required fields',
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
                                        title: 'Validation Error',
                                        description: 'Please set all pricing tiers',
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

                              // Prepare course modules
                              const courseModules: CourseModule[] = modules
                                        .filter((m) => m.title.trim())
                                        .map((m, index) => ({
                                                  id: `module_${index}`,
                                                  title: m.title,
                                                  description: m.description,
                                                  order: index,
                                                  lessons: [],
                                                  durationMinutes: 0,
                                        }));

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
                                        modules: courseModules,
                                        totalDurationMinutes: 0,
                                        totalLessons: 0,
                                        totalEnrollments: 0,
                                        activeEnrollments: 0,
                                        isPublished: false,
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
                                        title: 'Success!',
                                        description: 'Course created successfully',
                              });

                              router.push(`/admin/courses/${docRef.id}/edit`);
                    } catch (error: any) {
                              console.error('Error creating course:', error);
                              toast({
                                        title: 'Error',
                                        description: error.message || 'Failed to create course',
                                        variant: 'destructive',
                              });
                    } finally {
                              setLoading(false);
                    }
          };

          return (
                    <div className="max-w-4xl mx-auto space-y-6">
                              {/* Header */}
                              <div className="flex items-center gap-4">
                                        <Link href="/admin/courses">
                                                  <Button variant="outline" size="icon" className="neon-border">
                                                            <ArrowLeft className="w-4 h-4" />
                                                  </Button>
                                        </Link>
                                        <div>
                                                  <h1 className="text-4xl font-bold text-gradient">Create New Course</h1>
                                                  <p className="text-dark-text-secondary mt-2">
                                                            Fill in the details to create your course
                                                  </p>
                                        </div>
                              </div>

                              <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Basic Information */}
                                        <Card className="glass-card p-6">
                                                  <h2 className="text-2xl font-bold text-neon-cyan mb-6">
                                                            Basic Information
                                                  </h2>

                                                  <div className="space-y-4">
                                                            {/* Course Title */}
                                                            <div>
                                                                      <Label htmlFor="title">Course Title *</Label>
                                                                      <Input
                                                                                id="title"
                                                                                value={formData.title}
                                                                                onChange={(e) =>
                                                                                          setFormData({ ...formData, title: e.target.value })
                                                                                }
                                                                                placeholder="e.g., Advanced Physics for High School"
                                                                                className="bg-dark-bg-secondary border-white/10"
                                                                                required
                                                                      />
                                                            </div>

                                                            {/* Description */}
                                                            <div>
                                                                      <Label htmlFor="description">Description *</Label>
                                                                      <Textarea
                                                                                id="description"
                                                                                value={formData.description}
                                                                                onChange={(e) =>
                                                                                          setFormData({ ...formData, description: e.target.value })
                                                                                }
                                                                                placeholder="Describe what students will learn..."
                                                                                rows={4}
                                                                                className="bg-dark-bg-secondary border-white/10"
                                                                                required
                                                                      />
                                                            </div>

                                                            {/* Category & Difficulty */}
                                                            <div className="grid md:grid-cols-2 gap-4">
                                                                      <div>
                                                                                <Label htmlFor="category">Category</Label>
                                                                                <Input
                                                                                          id="category"
                                                                                          value={formData.category}
                                                                                          onChange={(e) =>
                                                                                                    setFormData({ ...formData, category: e.target.value })
                                                                                          }
                                                                                          placeholder="e.g., Physics"
                                                                                          className="bg-dark-bg-secondary border-white/10"
                                                                                />
                                                                      </div>
                                                                      <div>
                                                                                <Label htmlFor="difficulty">Difficulty</Label>
                                                                                <Select
                                                                                          value={formData.difficulty}
                                                                                          onValueChange={(value) =>
                                                                                                    setFormData({
                                                                                                              ...formData,
                                                                                                              difficulty: value as CourseDifficulty,
                                                                                                    })
                                                                                          }
                                                                                >
                                                                                          <SelectTrigger className="bg-dark-bg-secondary border-white/10">
                                                                                                    <SelectValue />
                                                                                          </SelectTrigger>
                                                                                          <SelectContent>
                                                                                                    <SelectItem value={CourseDifficulty.BEGINNER}>
                                                                                                              Beginner
                                                                                                    </SelectItem>
                                                                                                    <SelectItem value={CourseDifficulty.INTERMEDIATE}>
                                                                                                              Intermediate
                                                                                                    </SelectItem>
                                                                                                    <SelectItem value={CourseDifficulty.ADVANCED}>
                                                                                                              Advanced
                                                                                                    </SelectItem>
                                                                                          </SelectContent>
                                                                                </Select>
                                                                      </div>
                                                            </div>

                                                            {/* Thumbnail Upload */}
                                                            <div>
                                                                      <Label htmlFor="thumbnail">Course Thumbnail</Label>
                                                                      <div className="mt-2">
                                                                                {thumbnailPreview ? (
                                                                                          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-white/10">
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
                                                                                          </div>
                                                                                ) : (
                                                                                          <label
                                                                                                    htmlFor="thumbnail"
                                                                                                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-neon-cyan/50 transition-all"
                                                                                          >
                                                                                                    <Upload className="w-8 h-8 text-neon-cyan/50 mb-2" />
                                                                                                    <p className="text-sm text-dark-text-secondary">
                                                                                                              Click to upload thumbnail
                                                                                                    </p>
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
                                                  </div>
                                        </Card>

                                        {/* Pricing */}
                                        <Card className="glass-card p-6">
                                                  <h2 className="text-2xl font-bold text-neon-magenta mb-6">
                                                            Pricing (THB)
                                                  </h2>

                                                  <div className="grid md:grid-cols-3 gap-4">
                                                            <div>
                                                                      <Label htmlFor="price3m">3 Months Access *</Label>
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
                                                                                className="bg-dark-bg-secondary border-white/10"
                                                                                required
                                                                      />
                                                            </div>
                                                            <div>
                                                                      <Label htmlFor="price6m">6 Months Access *</Label>
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
                                                                                className="bg-dark-bg-secondary border-white/10"
                                                                                required
                                                                      />
                                                            </div>
                                                            <div>
                                                                      <Label htmlFor="price12m">12 Months Access *</Label>
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
                                                                                className="bg-dark-bg-secondary border-white/10"
                                                                                required
                                                                      />
                                                            </div>
                                                  </div>
                                        </Card>

                                        {/* Course Modules */}
                                        <Card className="glass-card p-6">
                                                  <div className="flex justify-between items-center mb-6">
                                                            <h2 className="text-2xl font-bold text-neon-purple">
                                                                      Course Modules
                                                            </h2>
                                                            <Button
                                                                      type="button"
                                                                      variant="outline"
                                                                      size="sm"
                                                                      onClick={addModule}
                                                                      className="neon-border"
                                                            >
                                                                      <Plus className="w-4 h-4 mr-2" />
                                                                      Add Module
                                                            </Button>
                                                  </div>

                                                  <div className="space-y-4">
                                                            {modules.map((module, index) => (
                                                                      <div
                                                                                key={index}
                                                                                className="p-4 rounded-lg border border-white/10 bg-dark-bg-secondary/50"
                                                                      >
                                                                                <div className="flex justify-between items-start mb-3">
                                                                                          <h3 className="text-sm font-medium text-neon-purple">
                                                                                                    Module {index + 1}
                                                                                          </h3>
                                                                                          {modules.length > 1 && (
                                                                                                    <Button
                                                                                                              type="button"
                                                                                                              variant="ghost"
                                                                                                              size="sm"
                                                                                                              onClick={() => removeModule(index)}
                                                                                                              className="text-red-400 hover:text-red-300"
                                                                                                    >
                                                                                                              <Trash2 className="w-4 h-4" />
                                                                                                    </Button>
                                                                                          )}
                                                                                </div>
                                                                                <div className="space-y-3">
                                                                                          <Input
                                                                                                    placeholder="Module title"
                                                                                                    value={module.title}
                                                                                                    onChange={(e) => updateModule(index, 'title', e.target.value)}
                                                                                                    className="bg-dark-bg-primary border-white/10"
                                                                                          />
                                                                                          <Textarea
                                                                                                    placeholder="Module description"
                                                                                                    value={module.description}
                                                                                                    onChange={(e) =>
                                                                                                              updateModule(index, 'description', e.target.value)
                                                                                                    }
                                                                                                    rows={2}
                                                                                                    className="bg-dark-bg-primary border-white/10"
                                                                                          />
                                                                                </div>
                                                                      </div>
                                                            ))}
                                                  </div>
                                        </Card>

                                        {/* Submit Button */}
                                        <div className="flex gap-4">
                                                  <Link href="/admin/courses" className="flex-1">
                                                            <Button type="button" variant="outline" className="w-full neon-border">
                                                                      Cancel
                                                            </Button>
                                                  </Link>
                                                  <Button
                                                            type="submit"
                                                            disabled={loading}
                                                            className="flex-1 neon-button"
                                                  >
                                                            {loading ? (
                                                                      <>
                                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                                Creating...
                                                                      </>
                                                            ) : (
                                                                      <span>Create Course</span>
                                                            )}
                                                  </Button>
                                        </div>
                              </form>
                    </div>
          );
}
