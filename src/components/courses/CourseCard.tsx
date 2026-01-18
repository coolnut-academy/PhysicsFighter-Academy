'use client';

import { Course } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Users, Flame, Star, Swords } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface CourseCardProps {
          course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
          // Difficulty color mapping
          const difficultyConfig = {
                    beginner: { bg: 'bg-green-500', text: 'text-white', label: 'ROOKIE' },
                    intermediate: { bg: 'bg-golden', text: 'text-ink-black', label: 'WARRIOR' },
                    advanced: { bg: 'bg-fighter-red', text: 'text-white', label: 'MASTER' },
          };

          const difficulty = difficultyConfig[course.difficulty] || difficultyConfig.beginner;

          return (
                    <Card className="overflow-hidden group hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-150">
                              {/* Thumbnail - Character Portrait Style */}
                              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden border-b-[3px] border-ink-black">
                                        {course.thumbnailUrl ? (
                                                  <img
                                                            src={course.thumbnailUrl}
                                                            alt={course.title}
                                                            className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105"
                                                  />
                                        ) : (
                                                  <div className="flex items-center justify-center h-full bg-gray-100">
                                                            <Swords className="w-16 h-16 text-gray-300" />
                                                  </div>
                                        )}

                                        {/* Overlay on hover - "SELECT" flash */}
                                        <div className="absolute inset-0 bg-fighter-red/0 group-hover:bg-fighter-red/20 transition-all duration-150 flex items-center justify-center">
                                                  <span className="opacity-0 group-hover:opacity-100 font-heading text-4xl text-white uppercase transition-all" style={{ textShadow: '2px 2px 0px #000' }}>
                                                            Select!
                                                  </span>
                                        </div>

                                        {/* Featured Badge */}
                                        {course.featured && (
                                                  <div className="absolute top-2 right-2">
                                                            <div className="bg-golden text-ink-black px-3 py-1 font-bold text-xs uppercase border-2 border-ink-black -skew-x-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                                      <span style={{ transform: 'skewX(6deg)', display: 'inline-block' }} className="flex items-center gap-1">
                                                                                <Flame className="w-3 h-3" /> Hot
                                                                      </span>
                                                            </div>
                                                  </div>
                                        )}

                                        {/* Difficulty Badge - Fighter Rank */}
                                        <div className="absolute bottom-2 left-2">
                                                  <div className={`${difficulty.bg} ${difficulty.text} px-3 py-1 font-bold text-xs uppercase border-2 border-ink-black -skew-x-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                                            <span style={{ transform: 'skewX(6deg)', display: 'inline-block' }}>
                                                                      {difficulty.label}
                                                            </span>
                                                  </div>
                                        </div>
                              </div>

                              {/* Content */}
                              <div className="p-5">
                                        {/* Category */}
                                        {course.category && (
                                                  <p className="text-xs text-fighter-red font-bold mb-1 uppercase tracking-wider">
                                                            {course.category}
                                                  </p>
                                        )}

                                        {/* Title */}
                                        <h3 className="font-heading text-xl uppercase text-ink-black mb-2 line-clamp-2 group-hover:text-fighter-red transition-colors">
                                                  {course.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                                  {course.description}
                                        </p>

                                        {/* Stats Bar - Like a health/power bar */}
                                        <div className="flex items-center gap-3 mb-4 text-xs font-bold uppercase">
                                                  <div className="flex items-center gap-1 text-gray-600">
                                                            <BookOpen className="w-4 h-4 text-fighter-red" />
                                                            <span>{course.totalLessons || 0}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1 text-gray-600">
                                                            <Clock className="w-4 h-4 text-golden" />
                                                            <span>{Math.floor((course.totalDurationMinutes || 0) / 60)}h</span>
                                                  </div>
                                                  <div className="flex items-center gap-1 text-gray-600">
                                                            <Users className="w-4 h-4 text-green-500" />
                                                            <span>{course.totalEnrollments || 0}</span>
                                                  </div>
                                        </div>

                                        {/* Rating - Stars */}
                                        {course.averageRating && (
                                                  <div className="flex items-center gap-2 mb-4">
                                                            <div className="flex">
                                                                      {[...Array(5)].map((_, i) => (
                                                                                <Star
                                                                                          key={i}
                                                                                          className={`w-4 h-4 ${i < Math.floor(course.averageRating || 0)
                                                                                                              ? 'text-golden fill-golden'
                                                                                                              : 'text-gray-300'
                                                                                                    }`}
                                                                                />
                                                                      ))}
                                                            </div>
                                                            <span className="text-xs text-gray-500 font-bold">
                                                                      ({course.totalReviews || 0})
                                                            </span>
                                                  </div>
                                        )}

                                        {/* Pricing */}
                                        <div className="mb-4 flex items-baseline gap-2">
                                                  <span className="font-heading text-3xl text-fighter-red">
                                                            {formatCurrency(course.pricing.threeMonths)}
                                                  </span>
                                                  <span className="text-xs text-gray-500 uppercase font-bold">/ 3 months</span>
                                        </div>

                                        {/* CTA Button */}
                                        <Link href={`/courses/${course.id}`} className="block">
                                                  <Button className="w-full" size="lg">
                                                            <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                                                                      <Swords className="w-4 h-4" />
                                                                      Enter Arena
                                                            </span>
                                                  </Button>
                                        </Link>
                              </div>
                    </Card>
          );
}
