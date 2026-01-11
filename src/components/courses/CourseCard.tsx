'use client';

import { Course } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface CourseCardProps {
          course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
          return (
                    <Card className="glass-card overflow-hidden card-hover group">
                              {/* Thumbnail */}
                              <div className="relative h-48 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 overflow-hidden">
                                        {course.thumbnailUrl ? (
                                                  <img
                                                            src={course.thumbnailUrl}
                                                            alt={course.title}
                                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                  />
                                        ) : (
                                                  <div className="flex items-center justify-center h-full">
                                                            <BookOpen className="w-16 h-16 text-neon-cyan/30" />
                                                  </div>
                                        )}

                                        {/* Overlay gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg-primary/80 to-transparent" />

                                        {/* Featured Badge */}
                                        {course.featured && (
                                                  <div className="absolute top-3 right-3">
                                                            <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30 animate-neon-pulse">
                                                                      <Zap className="w-3 h-3 mr-1" />
                                                                      Featured
                                                            </Badge>
                                                  </div>
                                        )}

                                        {/* Difficulty Badge */}
                                        <div className="absolute bottom-3 left-3">
                                                  <Badge
                                                            variant="outline"
                                                            className={
                                                                      course.difficulty === 'beginner'
                                                                                ? 'border-green-500/30 text-green-500 bg-green-500/10'
                                                                                : course.difficulty === 'intermediate'
                                                                                          ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10'
                                                                                          : 'border-red-500/30 text-red-500 bg-red-500/10'
                                                            }
                                                  >
                                                            {course.difficulty.toUpperCase()}
                                                  </Badge>
                                        </div>
                              </div>

                              {/* Content */}
                              <div className="p-6">
                                        {/* Category */}
                                        {course.category && (
                                                  <p className="text-xs text-neon-magenta font-semibold mb-2 uppercase tracking-wider">
                                                            {course.category}
                                                  </p>
                                        )}

                                        {/* Title */}
                                        <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-neon-cyan transition-colors">
                                                  {course.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-sm text-dark-text-secondary line-clamp-3 mb-4">
                                                  {course.description}
                                        </p>

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 mb-4 text-sm">
                                                  <div className="flex items-center gap-1 text-dark-text-secondary">
                                                            <BookOpen className="w-4 h-4 text-neon-cyan" />
                                                            <span>{course.totalLessons || 0} Lessons</span>
                                                  </div>
                                                  <div className="flex items-center gap-1 text-dark-text-secondary">
                                                            <Clock className="w-4 h-4 text-neon-magenta" />
                                                            <span>{Math.floor((course.totalDurationMinutes || 0) / 60)}h</span>
                                                  </div>
                                                  <div className="flex items-center gap-1 text-dark-text-secondary">
                                                            <Users className="w-4 h-4 text-neon-purple" />
                                                            <span>{course.totalEnrollments || 0}</span>
                                                  </div>
                                        </div>

                                        {/* Rating */}
                                        {course.averageRating && (
                                                  <div className="flex items-center gap-2 mb-4">
                                                            <div className="flex">
                                                                      {[...Array(5)].map((_, i) => (
                                                                                <span
                                                                                          key={i}
                                                                                          className={
                                                                                                    i < Math.floor(course.averageRating || 0)
                                                                                                              ? 'text-yellow-500'
                                                                                                              : 'text-gray-600'
                                                                                          }
                                                                                >
                                                                                          ★
                                                                                </span>
                                                                      ))}
                                                            </div>
                                                            <span className="text-sm text-dark-text-secondary">
                                                                      {course.averageRating.toFixed(1)} ({course.totalReviews || 0} reviews)
                                                            </span>
                                                  </div>
                                        )}

                                        {/* Pricing */}
                                        <div className="mb-4">
                                                  <div className="flex items-baseline gap-2">
                                                            <span className="text-sm text-dark-text-secondary">Starting from</span>
                                                            <span className="text-2xl font-bold text-neon-cyan">
                                                                      {formatCurrency(course.pricing.threeMonths)}
                                                            </span>
                                                  </div>
                                                  <p className="text-xs text-dark-text-muted mt-1">
                                                            3-12 months access available
                                                  </p>
                                        </div>

                                        {/* CTA Button */}
                                        <Link href={`/courses/${course.id}`} className="block">
                                                  <Button className="w-full neon-button">
                                                            <span>View Course</span>
                                                  </Button>
                                        </Link>
                              </div>
                    </Card>
          );
}
