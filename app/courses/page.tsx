'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Course, COLLECTIONS } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
          Select,
          SelectContent,
          SelectItem,
          SelectTrigger,
          SelectValue,
} from '@/components/ui/select';
import { CourseCard } from '@/components/courses/CourseCard';
import { Loading } from '@/components/shared/Loading';
import { Search, Filter, BookOpen, ArrowLeft } from 'lucide-react';
import { LogoIcon } from '@/components/ui/Logo';
import Link from 'next/link';

export default function CoursesPage() {
          const [courses, setCourses] = useState<Course[]>([]);
          const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
          const [loading, setLoading] = useState(true);
          const [searchQuery, setSearchQuery] = useState('');
          const [categoryFilter, setCategoryFilter] = useState('all');
          const [difficultyFilter, setDifficultyFilter] = useState('all');

          useEffect(() => {
                    fetchCourses();
          }, []);

          useEffect(() => {
                    filterCourses();
          }, [searchQuery, categoryFilter, difficultyFilter, courses]);

          const fetchCourses = async () => {
                    try {
                              setLoading(true);
                              const q = query(
                                        collection(db, COLLECTIONS.COURSES),
                                        where('isPublished', '==', true)
                              );

                              const snapshot = await getDocs(q);
                              const coursesData = snapshot.docs.map((doc) => ({
                                        id: doc.id,
                                        ...doc.data(),
                              })) as Course[];

                              // Client-side sort to avoid index issues
                              const sortedCourses = coursesData.sort((a, b) => {
                                        const dateA = a.createdAt?.seconds || 0;
                                        const dateB = b.createdAt?.seconds || 0;
                                        return dateB - dateA;
                              });

                              setCourses(sortedCourses);
                              setFilteredCourses(sortedCourses);
                    } catch (error) {
                              console.error('Error fetching courses:', error);
                    } finally {
                              setLoading(false);
                    }
          };

          const filterCourses = () => {
                    let filtered = [...courses];

                    // Search filter
                    if (searchQuery) {
                              const query = searchQuery.toLowerCase();
                              filtered = filtered.filter(
                                        (course) =>
                                                  course.title.toLowerCase().includes(query) ||
                                                  course.description.toLowerCase().includes(query) ||
                                                  course.category.toLowerCase().includes(query)
                              );
                    }

                    // Category filter
                    if (categoryFilter !== 'all') {
                              filtered = filtered.filter((course) => course.category === categoryFilter);
                    }

                    // Difficulty filter
                    if (difficultyFilter !== 'all') {
                              filtered = filtered.filter((course) => course.difficulty === difficultyFilter);
                    }

                    setFilteredCourses(filtered);
          };

          const categories = Array.from(new Set(courses.map((c) => c.category).filter(Boolean)));

          if (loading) {
                    return (
                              <div className="flex items-center justify-center min-h-screen bg-white">
                                        <Loading text="LOADING STAGE..." />
                              </div>
                    );
          }

          return (
                    <div className="min-h-screen bg-white">
                              {/* Top Bar */}
                              <div className="bg-ink-black text-white p-4 sticky top-0 z-50">
                                        <div className="container mx-auto flex items-center justify-between">
                                                  <Link href="/">
                                                            <Button variant="outline" size="sm" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black uppercase font-bold skew-x-[-10deg]">
                                                                      <ArrowLeft className="w-4 h-4 mr-2" />
                                                                      Return to Title
                                                            </Button>
                                                  </Link>
                                                  <div className="font-heading text-xl text-golden tracking-wider">SELECT STAGE</div>
                                                  <div className="w-[100px]" /> {/* Spacer for centering */}
                                        </div>
                              </div>

                              {/* Hero Section */}
                              <div className="bg-fighter-red text-white py-16 relative overflow-hidden">

                                        <div className="container mx-auto px-4 relative z-10 text-center">
                                                  <h1 className="text-5xl md:text-7xl font-heading mb-4 text-white drop-shadow-[4px_4px_0_rgba(0,0,0,1)] uppercase">
                                                            Training Ground
                                                  </h1>
                                                  <p className="text-xl md:text-2xl font-bold uppercase tracking-widest text-yellow-300 drop-shadow-md">
                                                            Physics Fighter Academy
                                                  </p>
                                        </div>
                              </div>

                              {/* Filters Section */}
                              <div className="container mx-auto px-4 -mt-8 mb-12 relative z-20">
                                        <div className="bg-white border-2 border-black p-6 rounded-2xl shadow-xl">
                                                  <div className="flex flex-col md:flex-row gap-4">
                                                            {/* Search */}
                                                            <div className="flex-1 relative">
                                                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                                      <Input
                                                                                placeholder="SEARCH MISSION..."
                                                                                value={searchQuery}
                                                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                                                className="pl-10 h-12 bg-gray-50 border-2 border-black rounded-xl font-bold uppercase placeholder:text-gray-400 focus:ring-fighter-red focus:border-fighter-red"
                                                                      />
                                                            </div>

                                                            {/* Category Filter */}
                                                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                                                      <SelectTrigger className="w-full md:w-48 h-12 bg-white border-2 border-black rounded-xl font-bold uppercase">
                                                                                <div className="flex items-center gap-2">
                                                                                          <Filter className="w-4 h-4" />
                                                                                          <SelectValue placeholder="Category" />
                                                                                </div>
                                                                      </SelectTrigger>
                                                                      <SelectContent className="border-2 border-black rounded-xl">
                                                                                <SelectItem value="all" className="font-bold">ALL DISCIPLINES</SelectItem>
                                                                                {categories.map((cat) => (
                                                                                          <SelectItem key={cat} value={cat} className="font-bold uppercase">
                                                                                                    {cat}
                                                                                          </SelectItem>
                                                                                ))}
                                                                      </SelectContent>
                                                            </Select>

                                                            {/* Difficulty Filter */}
                                                            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                                                                      <SelectTrigger className="w-full md:w-48 h-12 bg-white border-2 border-black rounded-xl font-bold uppercase">
                                                                                <SelectValue placeholder="Difficulty" />
                                                                      </SelectTrigger>
                                                                      <SelectContent className="border-2 border-black rounded-xl">
                                                                                <SelectItem value="all" className="font-bold">ALL RANKS</SelectItem>
                                                                                <SelectItem value="beginner" className="font-bold">ปรับพื้นฐาน</SelectItem>
                                                                                <SelectItem value="intermediate" className="font-bold">ติวสอบเข้ามหาลัยฯ</SelectItem>
                                                                                <SelectItem value="advanced" className="font-bold">ติวเข้มข้น/ข้อสอบปราบเซียน</SelectItem>
                                                                      </SelectContent>
                                                            </Select>

                                                            {/* Clear Filters */}
                                                            {(searchQuery || categoryFilter !== 'all' || difficultyFilter !== 'all') && (
                                                                      <Button
                                                                                variant="outline"
                                                                                onClick={() => {
                                                                                          setSearchQuery('');
                                                                                          setCategoryFilter('all');
                                                                                          setDifficultyFilter('all');
                                                                                }}
                                                                                className="h-12 border-2 border-black hover:bg-red-50 text-fighter-red font-bold uppercase"
                                                                      >
                                                                                Clear
                                                                      </Button>
                                                            )}
                                                  </div>

                                                  {/* Results Count */}
                                                  <div className="mt-4 flex items-center gap-2 font-bold text-sm uppercase text-gray-500">
                                                            <LogoIcon size={16} />
                                                            Found {filteredCourses.length} Stages
                                                  </div>
                                        </div>
                              </div>

                              {/* Courses Grid */}
                              <div className="container mx-auto px-4 pb-20">
                                        {filteredCourses.length === 0 ? (
                                                  <div className="bg-white border-4 border-black p-12 text-center shadow-[8px_8px_0_rgba(0,0,0,0.2)]">
                                                            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                            <h3 className="text-2xl font-heading mb-2 uppercase">No Stages Found</h3>
                                                            <p className="text-gray-500 font-bold">
                                                                      Adjust your search parameters into the computer system.
                                                            </p>
                                                  </div>
                                        ) : (
                                                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                            {filteredCourses.map((course) => (
                                                                      <CourseCard key={course.id} course={course} />
                                                            ))}
                                                  </div>
                                        )}
                              </div>
                    </div>
          );
}
