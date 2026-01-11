'use client';

import { Enrollment, Course } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, AlertCircle, Play, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { calculateTimeRemaining } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface MyLearningCardProps {
          enrollment: Enrollment;
          course: Course;
}

export function MyLearningCard({ enrollment, course }: MyLearningCardProps) {
          const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(enrollment));

          // Update countdown every minute
          useEffect(() => {
                    const interval = setInterval(() => {
                              setTimeRemaining(calculateTimeRemaining(enrollment));
                    }, 60000); // Update every minute

                    return () => clearInterval(interval);
          }, [enrollment]);

          const getExpirationColor = () => {
                    if (timeRemaining.expired) return 'red';
                    if (timeRemaining.days < 7) return 'yellow';
                    return 'neon-cyan';
          };

          const getProgressBarColor = () => {
                    if (timeRemaining.expired) return 'bg-red-500';
                    if (timeRemaining.percentage < 20) return 'bg-red-500';
                    if (timeRemaining.percentage < 50) return 'bg-yellow-500';
                    return 'bg-neon-cyan';
          };

          return (
                    <Card className="glass-card overflow-hidden card-hover">
                              {/* Thumbnail */}
                              <div className="relative h-48 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20">
                                        {course.thumbnailUrl ? (
                                                  <img
                                                            src={course.thumbnailUrl}
                                                            alt={course.title}
                                                            className="w-full h-full object-cover"
                                                  />
                                        ) : (
                                                  <div className="flex items-center justify-center h-full">
                                                            <BookOpen className="w-16 h-16 text-neon-cyan/30" />
                                                  </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg-primary/90 to-transparent" />

                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3">
                                                  {timeRemaining.expired ? (
                                                            <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                                                                      <AlertCircle className="w-3 h-3 mr-1" />
                                                                      Expired
                                                            </Badge>
                                                  ) : enrollment.status === 'active' ? (
                                                            <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30">
                                                                      Active
                                                            </Badge>
                                                  ) : (
                                                            <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                                                                      {enrollment.status}
                                                            </Badge>
                                                  )}
                                        </div>

                                        {/* Progress Badge */}
                                        <div className="absolute bottom-3 left-3">
                                                  <Badge variant="outline" className="neon-border bg-dark-bg-primary/80">
                                                            <CheckCircle className="w-3 h-3 mr-1 text-neon-cyan" />
                                                            {Math.round(enrollment.overallProgress || 0)}% Complete
                                                  </Badge>
                                        </div>
                              </div>

                              {/* Content */}
                              <div className="p-6">
                                        {/* Course Title */}
                                        <h3 className="text-xl font-bold mb-2 line-clamp-2">{course.title}</h3>

                                        {/* Course Stats */}
                                        <div className="flex items-center gap-4 mb-4 text-sm text-dark-text-secondary">
                                                  <div className="flex items-center gap-1">
                                                            <BookOpen className="w-4 h-4 text-neon-cyan" />
                                                            <span>{course.totalLessons || 0} lessons</span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                            <CheckCircle className="w-4 h-4 text-neon-magenta" />
                                                            <span>
                                                                      {enrollment.progress?.filter((p) => !!p.completedAt).length || 0}/
                                                                      {course.totalLessons || 0}
                                                            </span>
                                                  </div>
                                        </div>

                                        {/* Expiration Countdown */}
                                        <div className="mb-4">
                                                  <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm font-medium flex items-center gap-2">
                                                                      <Clock className={`w-4 h-4 text-${getExpirationColor()}`} />
                                                                      <span className={`text-${getExpirationColor()}`}>
                                                                                {timeRemaining.expired
                                                                                          ? 'Access Expired'
                                                                                          : `${timeRemaining.days}d ${timeRemaining.hours}h remaining`}
                                                                      </span>
                                                            </span>
                                                            <span className="text-xs text-dark-text-muted">
                                                                      {timeRemaining.expired ? '0%' : `${Math.round(timeRemaining.percentage)}%`}
                                                            </span>
                                                  </div>

                                                  {/* Progress Bar */}
                                                  <div className="relative h-2 bg-dark-bg-secondary rounded-full overflow-hidden">
                                                            <div
                                                                      className={`absolute inset-y-0 left-0 ${getProgressBarColor()} transition-all duration-500 rounded-full`}
                                                                      style={{ width: `${timeRemaining.percentage}%` }}
                                                            />
                                                            {!timeRemaining.expired && timeRemaining.percentage < 30 && (
                                                                      <div
                                                                                className={`absolute inset-y-0 left-0 ${getProgressBarColor()} animate-pulse`}
                                                                                style={{ width: `${timeRemaining.percentage}%` }}
                                                                      />
                                                            )}
                                                  </div>
                                        </div>

                                        {/* Warning Message */}
                                        {!timeRemaining.expired && timeRemaining.days < 7 && (
                                                  <div className="mb-4 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                                                            <div className="flex gap-2">
                                                                      <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                                                      <p className="text-xs text-yellow-500">
                                                                                Your access expires soon! Complete the course before it expires.
                                                                      </p>
                                                            </div>
                                                  </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                                  {timeRemaining.expired ? (
                                                            <Button disabled className="flex-1 opacity-50 cursor-not-allowed">
                                                                      <AlertCircle className="w-4 h-4 mr-2" />
                                                                      Access Expired
                                                            </Button>
                                                  ) : (
                                                            <Link href={`/learn/course/${enrollment.courseId}`} className="flex-1">
                                                                      <Button className="w-full neon-button">
                                                                                <Play className="w-4 h-4 mr-2" />
                                                                                {enrollment.overallProgress > 0 ? 'Continue Learning' : 'Start Course'}
                                                                      </Button>
                                                            </Link>
                                                  )}
                                        </div>

                                        {/* Enrollment Info */}
                                        <div className="mt-4 pt-4 border-t border-white/10 text-xs text-dark-text-secondary">
                                                  <div className="flex justify-between">
                                                            <span>Enrolled: {enrollment.startDate && new Date(enrollment.startDate.toDate()).toLocaleDateString()}</span>
                                                            <span>Duration: {enrollment.selectedDuration} months</span>
                                                  </div>
                                        </div>
                              </div>
                    </Card>
          );
}
