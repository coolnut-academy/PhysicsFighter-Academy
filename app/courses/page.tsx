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
import { Search, Filter, BookOpen } from 'lucide-react';

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
                                        where('isPublished', '==', true),
                                        orderBy('createdAt', 'desc')
                              );

                              const snapshot = await getDocs(q);
                              const coursesData = snapshot.docs.map((doc) => ({
                                        id: doc.id,
                                        ...doc.data(),
                              })) as Course[];

                              setCourses(coursesData);
                              setFilteredCourses(coursesData);
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
                              filtered = filtered.filter(
                                        (course) =>
                                                  course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                  course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                  course.category.toLowerCase().includes(searchQuery.toLowerCase())
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
                    return <Loading text="Loading courses..." />;
          }

          return (
                    <div className="min-h-screen">
                              {/* Hero Section */}
                              <div className="relative py-20 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-transparent to-neon-magenta/10" />
                                        <div className="container mx-auto px-4 relative z-10">
                                                  <div className="text-center max-w-3xl mx-auto">
                                                            <h1 className="text-5xl font-bold mb-4">
                                                                      <span className="text-gradient animate-neon-pulse">Explore Courses</span>
                                                            </h1>
                                                            <p className="text-xl text-dark-text-secondary">
                                                                      Master physics with expert instructors and interactive content
                                                            </p>
                                                  </div>
                                        </div>
                              </div>

                              {/* Filters Section */}
                              <div className="container mx-auto px-4 mb-8">
                                        <div className="glass-card p-6">
                                                  <div className="flex flex-col md:flex-row gap-4">
                                                            {/* Search */}
                                                            <div className="flex-1 relative">
                                                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neon-cyan" />
                                                                      <Input
                                                                                placeholder="Search courses..."
                                                                                value={searchQuery}
                                                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                                                className="pl-10 bg-dark-bg-secondary border-white/10"
                                                                      />
                                                            </div>

                                                            {/* Category Filter */}
                                                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                                                      <SelectTrigger className="w-full md:w-48 bg-dark-bg-secondary border-white/10">
                                                                                <div className="flex items-center gap-2">
                                                                                          <Filter className="w-4 h-4 text-neon-magenta" />
                                                                                          <SelectValue placeholder="Category" />
                                                                                </div>
                                                                      </SelectTrigger>
                                                                      <SelectContent>
                                                                                <SelectItem value="all">All Categories</SelectItem>
                                                                                {categories.map((cat) => (
                                                                                          <SelectItem key={cat} value={cat}>
                                                                                                    {cat}
                                                                                          </SelectItem>
                                                                                ))}
                                                                      </SelectContent>
                                                            </Select>

                                                            {/* Difficulty Filter */}
                                                            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                                                                      <SelectTrigger className="w-full md:w-48 bg-dark-bg-secondary border-white/10">
                                                                                <SelectValue placeholder="Difficulty" />
                                                                      </SelectTrigger>
                                                                      <SelectContent>
                                                                                <SelectItem value="all">All Levels</SelectItem>
                                                                                <SelectItem value="beginner">Beginner</SelectItem>
                                                                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                                                                <SelectItem value="advanced">Advanced</SelectItem>
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
                                                                                className="neon-border"
                                                                      >
                                                                                Clear
                                                                      </Button>
                                                            )}
                                                  </div>

                                                  {/* Results Count */}
                                                  <div className="mt-4 text-sm text-dark-text-secondary">
                                                            Showing {filteredCourses.length} of {courses.length} courses
                                                  </div>
                                        </div>
                              </div>

                              {/* Courses Grid */}
                              <div className="container mx-auto px-4 pb-20">
                                        {filteredCourses.length === 0 ? (
                                                  <div className="glass-card p-12 text-center">
                                                            <BookOpen className="w-16 h-16 text-neon-cyan/50 mx-auto mb-4" />
                                                            <h3 className="text-xl font-bold mb-2">No courses found</h3>
                                                            <p className="text-dark-text-secondary">
                                                                      Try adjusting your filters or check back later for new courses
                                                            </p>
                                                  </div>
                                        ) : (
                                                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                            {filteredCourses.map((course) => (
                                                                      <CourseCard key={course.id} course={course} />
                                                            ))}
                                                  </div>
                                        )}
                              </div>
                    </div>
          );
}
